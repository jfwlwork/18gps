<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const { locale, t } = useI18nLocale()

declare global {
  interface Window { AMap: any }
}

const containerRef = ref<HTMLDivElement | null>(null)
const clusterType = ref(2)
const gridSize = 60
const AMAP_KEY = 'e05dc91d8da05a328f59551e15016812'
const AMAP_SCRIPT_ID = 'devices-map-amap-sdk'
const AMAP_CENTER = [105.602725, 37.076636] as [number, number]

let map: any = null
let cluster: any = null
const points = ref<any[]>([])
let infoWindow: any = null
let lastInfoPosition: any = null
let sdkLoadPromise: Promise<any> | null = null
let loadedLang = ''
let initTaskId = 0

const amapLang = computed(() => locale.value === 'en-US' ? 'en' : 'zh_cn')

function getSdkUrl(lang: string) {
  return `https://webapi.amap.com/maps?v=1.4.15&key=${AMAP_KEY}&lang=${lang}`
}

function cleanupSdk() {
  document.getElementById(AMAP_SCRIPT_ID)?.remove()
  delete window.AMap
  sdkLoadPromise = null
  loadedLang = ''
}

function loadAmapSdk(lang: string) {
  if (window.AMap && loadedLang === lang)
    return Promise.resolve(window.AMap)

  if (sdkLoadPromise && loadedLang === lang)
    return sdkLoadPromise

  cleanupSdk()
  loadedLang = lang
  sdkLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = AMAP_SCRIPT_ID
    script.async = true
    script.src = getSdkUrl(lang)
    script.onload = () => resolve(window.AMap)
    script.onerror = () => {
      cleanupSdk()
      reject(new Error('Failed to load AMap SDK'))
    }
    document.head.appendChild(script)
  })

  return sdkLoadPromise
}

function renderClusterMarker(context: any) {
  const total = Math.max(points.value.length, 1)
  const div = document.createElement('div')
  const bgColor = `rgba(17, 96, 241, 0.60)`
  const borderColor = `#1160F1`
  const shadowColor = `rgba(17,96,241,0.3)`
  const size = Math.round(30 + (context.count / total) ** (1 / 5) * 20)
  div.style.backgroundColor = bgColor
  div.style.width = div.style.height = `${size}px`
  div.style.border = `solid 1px ${borderColor}`
  div.style.borderRadius = `${size / 2}px`
  div.style.boxShadow = `0 0 5px ${shadowColor}`
  div.innerHTML = String(context.count)
  div.style.lineHeight = `${size}px`
  div.style.color = '#FFFFFF'
  div.style.fontSize = '14px'
  div.style.textAlign = 'center'
  context.marker.setOffset(new window.AMap.Pixel(-size / 2, -size / 2))
  context.marker.setContent(div)
}

let styles: any[] = []
function initStyles() {
  styles = [
    { url: '//a.amap.com/jsapi_demos/static/images/blue.png', size: new window.AMap.Size(32, 32), offset: new window.AMap.Pixel(-16, -16) },
    { url: '//a.amap.com/jsapi_demos/static/images/green.png', size: new window.AMap.Size(32, 32), offset: new window.AMap.Pixel(-16, -16) },
    { url: '//a.amap.com/jsapi_demos/static/images/orange.png', size: new window.AMap.Size(36, 36), offset: new window.AMap.Pixel(-18, -18) },
    { url: '//a.amap.com/jsapi_demos/static/images/red.png', size: new window.AMap.Size(48, 48), offset: new window.AMap.Pixel(-24, -24) },
    { url: '//a.amap.com/jsapi_demos/static/images/darkRed.png', size: new window.AMap.Size(48, 48), offset: new window.AMap.Pixel(-24, -24) },
  ]
}

function extractValidPosition(pointData: any): [number, number] | null {
  if (pointData.lnglat && Array.isArray(pointData.lnglat) && pointData.lnglat.length === 2) {
    const [lng, lat] = pointData.lnglat
    if (isFinite(lng) && isFinite(lat)) return [lng, lat]
  }
  if (pointData.position && Array.isArray(pointData.position) && pointData.position.length === 2) {
    const [lng, lat] = pointData.position
    if (isFinite(lng) && isFinite(lat)) return [lng, lat]
  }
  if (pointData.lng !== undefined && pointData.lat !== undefined) {
    const lng = Number(pointData.lng)
    const lat = Number(pointData.lat)
    if (isFinite(lng) && isFinite(lat)) return [lng, lat]
  }
  return null
}

function createMarkers() {
  if (!window.AMap) return []
  const markers: any[] = []
  
  points.value.forEach((pointData, idx) => {
    const position = extractValidPosition(pointData)
    if (!position) {
      console.warn(`[MapComponent] Invalid coordinates for point ${idx}:`, pointData)
      return
    }
    
    const marker = new window.AMap.Marker({
      position,
      offset: new window.AMap.Pixel(-16, -16),
      extData: pointData
    })
    marker.on('click', () => {
      showInfoWindow(pointData, marker.getPosition())
    })
    markers.push(marker)
  })
  
  return markers
}

function addCluster(type: number) {
  if (!map || !window.AMap.MarkerClusterer) return
  if (cluster) {
    cluster.setMap(null)
    cluster = null
  }

  const markers = createMarkers()
  if (markers.length === 0) return

  const options: any = { gridSize }

  if (type === 2) {
    options.renderClusterMarker = renderClusterMarker
  } else if (type === 1) {
    options.styles = styles
  }

  cluster = new window.AMap.MarkerClusterer(map, markers, options)
}

function updatePoints(newPoints: any[]) {
  if (!Array.isArray(newPoints)) {
    console.warn('[MapComponent] updatePoints expects an array, received:', newPoints)
    points.value = []
  } else {
    points.value = newPoints
  }
  if (map && window.AMap.MarkerClusterer) {
    addCluster(clusterType.value)
  }
}

function destroyMap() {
  if (infoWindow) {
    infoWindow.close()
    infoWindow = null
  }
  if (cluster) {
    cluster.setMap(null)
    cluster = null
  }
  if (map) {
    map.destroy()
    map = null
  }
  lastInfoPosition = null
}

async function initMap() {
  const currentTaskId = ++initTaskId
  destroyMap()
  await loadAmapSdk(amapLang.value)

  if (currentTaskId !== initTaskId || !containerRef.value) return

  if (containerRef.value) containerRef.value.innerHTML = ''

  // ✅ 关键修复：创建地图时传入 lang 参数
  map = new window.AMap.Map(containerRef.value, {
    center: AMAP_CENTER,
    zoom: 5,
    viewMode: '3D',
    lang: amapLang.value    // ← 这里必须设置
  })

  map.on('click', () => {
    if (infoWindow) infoWindow.close()
  })

  const reanchorInfoWindow = () => {
    if (infoWindow && lastInfoPosition) {
      infoWindow.setPosition(lastInfoPosition)
    }
  }
  map.on('complete', reanchorInfoWindow)
  map.on('moveend', reanchorInfoWindow)
  map.on('zoomend', reanchorInfoWindow)

  map.plugin(['AMap.MarkerClusterer'], () => {
    initStyles()
    addCluster(clusterType.value)
  })
}

function showInfoWindow(data: any, position: any) {
  if (!map) return
  if (infoWindow) infoWindow.close()

  const address = data?.address ?? '-'
  const terminalNo = data?.terminalNo ?? '-'

  const container = document.createElement('div')
  container.style.width = '320px'
  container.style.maxWidth = '320px'
  container.style.boxSizing = 'border-box'
  container.style.lineHeight = '1.6'
  container.innerHTML = `
    <div>
      <div><b>${t('pages.home.map.address')}:</b> ${address}</div>
      <div><b>${t('pages.home.map.terminalNo')}:</b> ${terminalNo}</div>
    </div>
  `

  infoWindow = new window.AMap.InfoWindow({
    content: container,
    offset: new window.AMap.Pixel(0, -32)
  })
  lastInfoPosition = position
  infoWindow.open(map, position)

  requestAnimationFrame(() => {
    if (infoWindow && lastInfoPosition) {
      infoWindow.setPosition(lastInfoPosition)
    }
  })
}

// ✅ 语言切换优化：不用完全销毁重建，直接调用 map.setLang
function switchMapLanguage(lang: string) {
  if (map && map.setLang) {
    map.setLang(lang)
  }
}

watch(amapLang, async (newLang, oldLang) => {
  if (newLang === oldLang) return
  
  // 优先使用动态切换方法
  if (map && map.setLang) {
    switchMapLanguage(newLang)
  } else {
    // 降级方案：重新初始化地图
    await nextTick()
    await initMap()
  }
})

onMounted(async () => {
  await initMap()
})

onBeforeUnmount(() => {
  initTaskId += 1
  destroyMap()
  cleanupSdk()
})

defineExpose({ updatePoints })
</script>

<template>
  <div ref="containerRef" :style="{ width: '100%', height: '100%' }" />
</template>

<style scoped lang="less"></style>