<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useScriptTag } from '@vueuse/core'

declare global {
  interface Window { AMap: any }
}

const containerRef = ref<HTMLDivElement | null>(null)
const clusterType = ref(2)
const gridSize = 60

let map: any = null
let cluster: any = null
let points = ref<any[]>([])
let infoWindow: any = null
let lastInfoPosition: any = null

const AMAP_SDK_URL = 'https://webapi.amap.com/maps?v=2.0&key=e05dc91d8da05a328f59551e15016812'
const { load } = useScriptTag(AMAP_SDK_URL)

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

// keep default marker appearance

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

function addCluster(type: number) {
  if (!map) return
  if (cluster) cluster.setMap(null)

  if (type === 2) {
    cluster = new window.AMap.MarkerClusterer(map, points.value, { gridSize, renderClusterMarker, renderMarker: (context: any) => {
      // default single marker appearance, but attach click to show info
      const marker = context.marker
      marker.off && marker.off('click')
      marker.on('click', () => {
        const data = context.data || (marker.getExtData && marker.getExtData()) || {}
        console.log('data', data)
        showInfoWindow(data[0], marker.getPosition())
      })
    } })
  } else if (type === 1) {
    cluster = new window.AMap.MarkerClusterer(map, points.value, { styles, gridSize })
  } else {
    cluster = new window.AMap.MarkerClusterer(map, points.value, { gridSize })
  }
}

function updatePoints(newPoints: any[]) {
  points.value = Array.isArray(newPoints) ? newPoints : []
  addCluster(clusterType.value)
}

onMounted(async () => {
  await load(true)
  if (!containerRef.value) return

  map = new window.AMap.Map(containerRef.value, {
    center: [105.602725, 37.076636],
    zoom: 5,
    viewMode: '3D',
  })

  // click elsewhere closes popup
  map.on('click', () => {
    if (infoWindow) infoWindow.close()
  })

  // 地图完成一次渲染/交互后，重新设置 InfoWindow 位置，避免箭头轻微偏移
  const reanchorInfoWindow = () => {
    if (infoWindow && lastInfoPosition) {
      infoWindow.setPosition(lastInfoPosition)
    }
  }
  map.on('complete', reanchorInfoWindow)
  map.on('moveend', reanchorInfoWindow)
  map.on('zoomend', reanchorInfoWindow)

  window.AMap.plugin('AMap.MarkerClusterer', () => {
    initStyles()
    addCluster(2)
  })
})

function showInfoWindow(data: any, position: any) {
  if (!map) return
  if (infoWindow) infoWindow.close()
  const address = data?.address ?? '-'
  const terminalNo = data?.terminalNo ?? '-'
  // 固定宽度容器，避免缩放或滚动导致内容换行引起宽度变化
  const container = document.createElement('div')
  container.style.width = '320px'
  container.style.maxWidth = '320px'
  container.style.boxSizing = 'border-box'
  container.style.lineHeight = '1.6'
  container.innerHTML = `
    <div>
      <div><b>地址:</b> ${address}</div>
      <div><b>设备号:</b> ${terminalNo}</div>
    </div>
  `

  infoWindow = new window.AMap.InfoWindow({
    content: container,
    offset: new window.AMap.Pixel(0, -32),
    // autoMove: false, // 如不希望自动平移可以开启
  })
  lastInfoPosition = position
  infoWindow.open(map, position)
  // 等待一次渲染完成后再强制锚定，修复偶发偏差
  requestAnimationFrame(() => {
    infoWindow && infoWindow.setPosition(lastInfoPosition)
  })
}

defineExpose({ updatePoints })
</script>

<template>
  <div ref="containerRef" :style="{ width: '100%', height: '100%' }" />
</template>

<style scoped lang="less"></style>