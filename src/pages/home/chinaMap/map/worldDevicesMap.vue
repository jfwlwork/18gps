<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import maplibregl, { LngLatBounds, type GeoJSONSource, type Map as MapLibreMap, type MapLayerMouseEvent } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const props = defineProps<{
  points?: any[]
  visible?: boolean
}>()

const { t } = useI18nLocale()

const containerRef = ref<HTMLDivElement | null>(null)
const points = ref<any[]>([])

const DEFAULT_CENTER: [number, number] = [0, 20]
const SOURCE_ID = 'devices-source'
const CLUSTER_LAYER_ID = 'clusters'
const POINT_LAYER_ID = 'unclustered-point'

let map: MapLibreMap | null = null
let popup: maplibregl.Popup | null = null
let refreshTimer: ReturnType<typeof setTimeout> | null = null

function debugLog(step: string, payload?: Record<string, unknown>) {
  console.log(`[WorldMap] ${step}`, payload ?? {})
}

function outOfChina(lng: number, lat: number) {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271
}

function transformLat(x: number, y: number) {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y
  ret += 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
  ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0
  ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320.0 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0
  return ret
}

function transformLng(x: number, y: number) {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x
  ret += 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
  ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0
  ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0
  return ret
}

function gcj02ToWgs84(lng: number, lat: number): [number, number] {
  if (outOfChina(lng, lat))
    return [lng, lat]

  const a = 6378245.0
  const ee = 0.00669342162296594323
  let dLat = transformLat(lng - 105.0, lat - 35.0)
  let dLng = transformLng(lng - 105.0, lat - 35.0)
  const radLat = lat / 180.0 * Math.PI
  let magic = Math.sin(radLat)
  magic = 1 - ee * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI)
  dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * Math.PI)
  const mgLat = lat + dLat
  const mgLng = lng + dLng
  return [lng * 2 - mgLng, lat * 2 - mgLat]
}

function parseCoordinatePair(value: unknown): [number, number] | null {
  if (Array.isArray(value) && value.length >= 2) {
    const lng = Number(value[0])
    const lat = Number(value[1])
    if (Number.isFinite(lng) && Number.isFinite(lat))
      return [lng, lat]
  }

  if (typeof value === 'string') {
    const parts = value.split(',').map(item => Number(item.trim()))
    if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1]))
      return [parts[0], parts[1]]
  }

  return null
}

function extractValidPosition(pointData: any): [number, number] | null {
  const gcj02Pair = parseCoordinatePair(pointData.gcj02)
  if (gcj02Pair)
    return gcj02ToWgs84(gcj02Pair[0], gcj02Pair[1])

  const lnglatPair = parseCoordinatePair(pointData.lnglat)
  if (lnglatPair)
    return gcj02ToWgs84(lnglatPair[0], lnglatPair[1])

  const positionPair = parseCoordinatePair(pointData.position)
  if (positionPair)
    return positionPair

  if (pointData.lng !== undefined && pointData.lat !== undefined) {
    const lng = Number(pointData.lng)
    const lat = Number(pointData.lat)
    if (Number.isFinite(lng) && Number.isFinite(lat))
      return [lng, lat]
  }

  return null
}

function buildFeatureCollection() {
  return {
    type: 'FeatureCollection' as const,
    features: points.value.reduce<any[]>((result, pointData, index) => {
      const position = extractValidPosition(pointData)
      if (!position) {
        return result
      }

      result.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: position,
        },
        properties: {
          index,
          address: pointData?.address ?? '-',
          terminalNo: pointData?.terminalNo ?? '-',
        },
      })
      return result
    }, []),
  }
}

function renderPopup(feature: any, lngLat: maplibregl.LngLatLike) {
  if (!map)
    return

  const address = feature?.properties?.address ?? '-'
  const terminalNo = feature?.properties?.terminalNo ?? '-'
  const content = `
    <div class="world-map-popup">
      <div><b>${t('pages.home.map.address')}:</b> ${address}</div>
      <div><b>${t('pages.home.map.terminalNo')}:</b> ${terminalNo}</div>
    </div>
  `

  popup?.remove()
  popup = new maplibregl.Popup({
    closeButton: true,
    closeOnClick: false,
    offset: 16,
    maxWidth: '320px',
  })
    .setLngLat(lngLat)
    .setHTML(content)
    .addTo(map)
}

function fitToPoints(features: any[]) {
  if (!map || features.length === 0)
    return

  if (features.length === 1) {
    map.easeTo({
      center: features[0].geometry.coordinates as [number, number],
      zoom: 4,
      duration: 600,
    })
    return
  }

  const bounds = new LngLatBounds(
    features[0].geometry.coordinates as [number, number],
    features[0].geometry.coordinates as [number, number],
  )

  features.forEach((feature) => {
    bounds.extend(feature.geometry.coordinates as [number, number])
  })

  map.fitBounds(bounds, {
    padding: 60,
    duration: 600,
    maxZoom: 4,
  })
}

function updateSource() {
  if (!map)
    return

  const featureCollection = buildFeatureCollection()
  const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined
  debugLog('updateSource', {
    pointsLength: points.value.length,
    featuresLength: featureCollection.features.length,
    hasSource: !!source,
    styleLoaded: map.isStyleLoaded(),
    zoom: map.getZoom(),
  })
  if (source)
    source.setData(featureCollection)

  fitToPoints(featureCollection.features)
}

function bindMapEvents() {
  if (!map)
    return

  map.on('click', CLUSTER_LAYER_ID, async (event: MapLayerMouseEvent) => {
    if (!map || !event.features?.length)
      return

    const clusterFeature = event.features[0]
    const clusterId = clusterFeature.properties?.cluster_id
    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined
    if (!source || clusterId === undefined)
      return

    const zoom = await source.getClusterExpansionZoom(clusterId)
    map.easeTo({
      center: (clusterFeature.geometry as any).coordinates,
      zoom,
      duration: 500,
    })
  })

  map.on('click', POINT_LAYER_ID, (event: MapLayerMouseEvent) => {
    const feature = event.features?.[0]
    if (!feature || !event.lngLat)
      return
    renderPopup(feature, event.lngLat)
  })

  map.on('mouseenter', CLUSTER_LAYER_ID, () => {
    if (map)
      map.getCanvas().style.cursor = 'pointer'
  })

  map.on('mouseleave', CLUSTER_LAYER_ID, () => {
    if (map)
      map.getCanvas().style.cursor = ''
  })

  map.on('mouseenter', POINT_LAYER_ID, () => {
    if (map)
      map.getCanvas().style.cursor = 'pointer'
  })

  map.on('mouseleave', POINT_LAYER_ID, () => {
    if (map)
      map.getCanvas().style.cursor = ''
  })

  map.on('click', (event) => {
    if (!map)
      return

    const features = map.queryRenderedFeatures(event.point, {
      layers: [CLUSTER_LAYER_ID, POINT_LAYER_ID],
    })
    if (features.length > 0)
      return

    popup?.remove()
    popup = null
  })
}

function initSourceAndLayers() {
  if (!map || map.getSource(SOURCE_ID))
    return

  debugLog('initSourceAndLayers:start', {
    pointsLength: points.value.length,
    styleLoaded: map.isStyleLoaded(),
  })

  map.addSource(SOURCE_ID, {
    type: 'geojson',
    data: buildFeatureCollection(),
    cluster: true,
    clusterMaxZoom: 12,
    clusterRadius: 80,
  })

  map.addLayer({
    id: CLUSTER_LAYER_ID,
    type: 'circle',
    source: SOURCE_ID,
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': '#1160F1',
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        20,
        20,
        24,
        80,
        30,
      ],
      'circle-opacity': 0.75,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#FFFFFF',
    },
  })

  map.addLayer({
    id: POINT_LAYER_ID,
    type: 'circle',
    source: SOURCE_ID,
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': '#1160F1',
      'circle-radius': 7,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#FFFFFF',
    },
  })

  bindMapEvents()
  updateSource()
  debugLog('initSourceAndLayers:done', {
    hasSource: !!map.getSource(SOURCE_ID),
    zoom: map.getZoom(),
  })
}

function destroyMap() {
  popup?.remove()
  popup = null
  map?.remove()
  map = null
}

function updatePoints(newPoints: any[]) {
  points.value = Array.isArray(newPoints) ? newPoints : []
  debugLog('updatePoints', {
    pointsLength: points.value.length,
    styleLoaded: map?.isStyleLoaded?.() ?? false,
  })
  if (map && map.isStyleLoaded())
    updateSource()
}

function refreshMapView(delay = 0) {
  if (!map)
    return

  if (refreshTimer)
    clearTimeout(refreshTimer)

  refreshTimer = setTimeout(() => {
    if (!map)
      return
    debugLog('refreshMapView', {
      delay,
      pointsLength: points.value.length,
      styleLoaded: map.isStyleLoaded(),
      zoom: map.getZoom(),
    })
    map.resize()
    if (map.isStyleLoaded())
      updateSource()
  }, delay)
}

watch(() => props.points, (newPoints) => {
  debugLog('watch:points', {
    pointsLength: Array.isArray(newPoints) ? newPoints.length : 0,
  })
  updatePoints(Array.isArray(newPoints) ? newPoints : [])
}, {
  immediate: true,
  deep: true,
})

watch(() => props.visible, async (visible) => {
  debugLog('watch:visible', {
    visible,
    pointsLength: points.value.length,
  })
  if (!visible)
    return

  await nextTick()
  requestAnimationFrame(() => {
    refreshMapView()
    refreshMapView(120)
  })
}, {
  immediate: true,
})

onMounted(async () => {
  await nextTick()
  debugLog('onMounted:start', {
    hasContainer: !!containerRef.value,
    pointsLength: points.value.length,
    visible: props.visible,
  })
  if (!containerRef.value)
    return

  map = new maplibregl.Map({
    container: containerRef.value,
    center: DEFAULT_CENTER,
    zoom: 1.4,
    maxZoom: 18,
    minZoom: 1,
    style: {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap Contributors',
        },
      },
      layers: [
        {
          id: 'osm-raster',
          type: 'raster',
          source: 'osm',
        },
      ],
    },
  })

  map.addControl(new maplibregl.NavigationControl(), 'top-right')
  map.on('load', () => {
    debugLog('map:load', {
      pointsLength: points.value.length,
      styleLoaded: map?.isStyleLoaded?.() ?? false,
    })
    initSourceAndLayers()
    refreshMapView()
    refreshMapView(120)
  })
})

onBeforeUnmount(() => {
  if (refreshTimer)
    clearTimeout(refreshTimer)
  destroyMap()
})

defineExpose({ updatePoints })
</script>

<template>
  <div ref="containerRef" class="world-map-container" />
</template>

<style scoped lang="less">
.world-map-container {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
}

:deep(.maplibregl-popup-content) {
  padding: 12px 14px;
  line-height: 1.6;
}

:deep(.maplibregl-ctrl-group) {
  border-radius: 8px;
}
</style>
