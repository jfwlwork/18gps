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

function renderMarker() {
  // keep default marker appearance
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

function addCluster(type: number) {
  if (!map) return
  if (cluster) cluster.setMap(null)

  if (type === 2) {
    cluster = new window.AMap.MarkerClusterer(map, points.value, { gridSize, renderClusterMarker, renderMarker })
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

  window.AMap.plugin('AMap.MarkerClusterer', () => {
    initStyles()
    addCluster(2)
  })
})

defineExpose({ updatePoints })
</script>

<template>
  <div ref="containerRef" :style="{ width: '100%', height: '100%' }" />
</template>

<style scoped lang="less"></style>