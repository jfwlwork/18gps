<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'
import maplibregl, { type Map as MapLibreMap } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const props = defineProps<{
  point?: Record<string, any> | null
}>()

const { locale } = useI18nLocale()

const containerRef = ref<HTMLDivElement | null>(null)

const AMAP_KEY = '8b03a6e837e1aab2e48a2f88c254db46'
const DEFAULT_CHINA_CENTER: [number, number] = [116.397428, 39.90923]
const DEFAULT_WORLD_CENTER: [number, number] = [0, 20]

const isWorldMap = computed(() => locale.value === 'en-US')

let amapMap: any = null
let amapMarker: any = null
let worldMap: MapLibreMap | null = null
let worldMarker: maplibregl.Marker | null = null
let initTaskId = 0

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

function getChinaPosition(point: Record<string, any> | null | undefined): [number, number] | null {
  if (!point)
    return null

  const gcj02Pair = parseCoordinatePair(point.gcj02)
  if (gcj02Pair)
    return gcj02Pair

  const lnglatPair = parseCoordinatePair(point.lnglat)
  if (lnglatPair)
    return lnglatPair

  if (point.lng !== undefined && point.lat !== undefined) {
    const lng = Number(point.lng)
    const lat = Number(point.lat)
    if (Number.isFinite(lng) && Number.isFinite(lat))
      return [lng, lat]
  }

  return null
}

function getWorldPosition(point: Record<string, any> | null | undefined): [number, number] | null {
  const chinaPosition = getChinaPosition(point)
  if (chinaPosition)
    return gcj02ToWgs84(chinaPosition[0], chinaPosition[1])

  const positionPair = parseCoordinatePair(point?.position)
  if (positionPair)
    return positionPair

  return null
}

function destroyMap() {
  amapMarker = null
  if (amapMap) {
    amapMap.destroy()
    amapMap = null
  }

  worldMarker?.remove()
  worldMarker = null
  worldMap?.remove()
  worldMap = null

  if (containerRef.value)
    containerRef.value.innerHTML = ''
}

function updateAmapMarker(position: [number, number] | null) {
  if (!amapMap || !window.AMap)
    return

  const target = position ?? DEFAULT_CHINA_CENTER
  amapMap.setCenter(target)

  if (!position) {
    if (amapMarker) {
      amapMap.remove(amapMarker)
      amapMarker = null
    }
    return
  }

  if (!amapMarker) {
    amapMarker = new window.AMap.Marker({
      position: target,
    })
    amapMap.add(amapMarker)
  } else {
    amapMarker.setPosition(target)
  }
}

function updateWorldMarker(position: [number, number] | null) {
  if (!worldMap)
    return

  const target = position ?? DEFAULT_WORLD_CENTER
  worldMap.easeTo({
    center: target,
    zoom: position ? 14 : 2,
    duration: 400,
  })

  if (!position) {
    worldMarker?.remove()
    worldMarker = null
    return
  }

  if (!worldMarker) {
    worldMarker = new maplibregl.Marker({
      color: '#1160F1',
    })
      .setLngLat(target)
      .addTo(worldMap)
  } else {
    worldMarker.setLngLat(target)
  }
}

async function initAmap() {
  const currentTaskId = ++initTaskId
  destroyMap()
  await nextTick()
  if (!containerRef.value)
    return

  const AMap = await AMapLoader.load({
    key: AMAP_KEY,
    version: '2.0',
  })

  if (currentTaskId !== initTaskId || !containerRef.value)
    return

  amapMap = new AMap.Map(containerRef.value, {
    viewMode: '2D',
    zoom: 14,
    center: getChinaPosition(props.point) ?? DEFAULT_CHINA_CENTER,
  })

  updateAmapMarker(getChinaPosition(props.point))
}

async function initWorldMap() {
  const currentTaskId = ++initTaskId
  destroyMap()
  await nextTick()
  if (!containerRef.value)
    return

  worldMap = new maplibregl.Map({
    container: containerRef.value,
    center: getWorldPosition(props.point) ?? DEFAULT_WORLD_CENTER,
    zoom: getWorldPosition(props.point) ? 14 : 2,
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

  if (currentTaskId !== initTaskId)
    return

  worldMap.addControl(new maplibregl.NavigationControl(), 'top-right')
  worldMap.on('load', () => {
    if (currentTaskId !== initTaskId)
      return
    updateWorldMarker(getWorldPosition(props.point))
  })
}

async function syncMapByLocale() {
  if (isWorldMap.value)
    await initWorldMap()
  else
    await initAmap()
}

watch(isWorldMap, async () => {
  await syncMapByLocale()
})

watch(() => props.point, async (point) => {
  if (!containerRef.value)
    return

  if (isWorldMap.value) {
    if (!worldMap) {
      await initWorldMap()
      return
    }
    updateWorldMarker(getWorldPosition(point))
    return
  }

  if (!amapMap) {
    await initAmap()
    return
  }
  updateAmapMarker(getChinaPosition(point))
}, {
  immediate: true,
  deep: true,
})

onMounted(async () => {
  await syncMapByLocale()
})

onBeforeUnmount(() => {
  initTaskId += 1
  destroyMap()
})
</script>

<template>
  <div ref="containerRef" class="location-map-container" />
</template>

<style scoped lang="less">
.location-map-container {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
}

:deep(.maplibregl-ctrl-group) {
  border-radius: 8px;
}
</style>
