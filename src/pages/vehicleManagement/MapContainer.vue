<script setup>
import { onMounted, onUnmounted } from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'
import { PauseCircleOutlined, PlayCircleOutlined, PlaySquareOutlined, PoweroffOutlined, RollbackOutlined } from '@ant-design/icons-vue'
import { getGcj02Api, getGcj02listApi } from '~@/api/notice'

const props = defineProps({
  id: {
    type: Number,
  },
})

let aMap = null
let map = null
let geocoder = null
let marker = null
let infoWindow = null

let polyline = null
let passedPolyline = null

const gcj02 = ref(undefined)
const gcj02Arr = ref([])
async function getData() {
  try {
    const res = await getGcj02Api({
      id: props.id,
    })
    if (res.code === 0) {
      if (res.data) {
        gcj02.value = res.data.split(',')
        toSetMap(gcj02.value[0], gcj02.value[1])
      }
      else {
        gcj02.value = []
      }
    }
  }
  catch (e) {
    console.log(e)
  }
  try {
    const res = await getGcj02listApi({
      id: props.id,
    })
    if (res.code === 0 && res.data?.length) {
      gcj02Arr.value = res.data.map((v) => {
        let r = v.split(',')
        r = r.map(str => Number(str))
        return r
      })
    }
  }
  catch (e) {
    console.log(e)
  }
}
getData()

function toSetMap(longitude, latitude) {
  AMapLoader.load({
    key: '8b03a6e837e1aab2e48a2f88c254db46', // 申请好的Web端开发者Key，首次调用 load 时必填
    version: '2.0', // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
    plugins: ['AMap.PlaceSearch', 'AMap.Geocoder', 'AMap.MoveAnimation'], // 需要使用的的插件列表，如比例尺'AMap.Scale'等
  })
    .then((AMap) => {
      aMap = AMap
      geocoder = new AMap.Geocoder({
        radius: 1000, // 以已知坐标为中心点，radius为半径，返回范围内兴趣点和道路信息
        extensions: 'all', // 返回地址描述以及附近兴趣点和道路信息，默认“base”
      })
      infoWindow = new AMap.InfoWindow({
        autoMove: true,
        offset: { x: 0, y: -35 },
      })

      // 查询POI
      const searchPOI = (longitude, latitude) => {
        map = new AMap.Map('container', {
          // 设置地图容器id
          viewMode: '2D', // 是否为3D地图模式
          zoom: 18, // 初始化地图级别
          resizeEnable: true,
          center: [longitude, latitude], // 初始化地图中心点位置
        })
        geocoder.getAddress(
          [longitude, latitude],
          // new AMap.LngLat(longitude, latitude),
          (status, result) => {
            // console.log(result)
            if (status === 'complete' && result.info === 'OK') {
              const placeSearch = new AMap.PlaceSearch({
                extensions: 'all', // 返回基本地址信息
                map,
                pageSize: 1, // 返回结果数量
                pageIndex: 1,
                radius: 500, // 搜索半径
                location: `${longitude},${latitude}`, // 设置查询位置
              })
              placeSearch.getDetails(result.regeocode.aois[0]?.id || result.regeocode.pois[0].id, (s, r) => {
                if (s === 'complete' && r.info === 'OK') {
                  placeSearch_CallBack(r, longitude, latitude, result)
                }
                // console.log('poi', r)
              }) // 根据关键字查询POI
            }
            else {
              console.error('查询失败:', result)
            }
          },
        )
      }

      // 替换为实际的经纬度
      searchPOI(longitude, latitude)
      // searchPOI(114.403735, 30.46506)
    })
    .catch((e) => {
      console.log(e)
    })
}

// 回调函数
function placeSearch_CallBack(data, longitude, latitude, result) {
  const poiArr = data.poiList.pois
  // 添加marker
  marker = new AMap.Marker({
    map,
    offset: new AMap.Pixel(-13, -30),
    icon: './car3.png',
    position: new AMap.LngLat(longitude, latitude),
  })
  map.setCenter(marker.getPosition())
  // 添加信息窗体
  infoWindow.setContent(createContent(poiArr[0], result))
  infoWindow.open(map, marker.getPosition())
  marker.on('click', () => {
    infoWindow.open()
  })
  Promise.resolve().then(() => {
    document.getElementById('xxx_d').onclick = drivingTrackInfo
    document.getElementById('xxx_p').onclick = setVisible
  })
}
// 图片预览
const pic_src = ref('')
const visible = ref(false)
function setVisible(value) {
  visible.value = !!value
}
function createContent(poi, result) {
  // 信息窗体内容
  const s = []
  if (poi?.photos && poi.photos[0]?.url) {
    pic_src.value = poi.photos[0]?.url
    s.push(
        `<div style="height: 80px;text-align: center;cursor: pointer;" id="xxx_p"><img src='${poi.photos[0].url}' width='auto' height='80px'></div>`,
    )
  }
  s.push(`<div style="max-width: 150px;">${result.regeocode.formattedAddress}</div>`)
  s.push(
      `<div style="padding: 4px 0;" id="xxx_d"><a>查看行车轨迹</a></div>`,
  )
  return s.join('')
}

const showBtns = ref(false)
function drivingTrackInfo() {
  infoWindow.close()
  showBtns.value = true
  toShowLine()
}

function toShowLine() {
  // 绘制轨迹
  polyline = new aMap.Polyline({
    map,
    path: gcj02Arr.value,
    showDir: true,
    strokeColor: '#28F', // 线颜色
    // strokeOpacity: 1,     //线透明度
    strokeWeight: 6, // 线宽
    // strokeStyle: "solid"  //线样式
  })
  console.log(polyline)

  passedPolyline = new aMap.Polyline({
    map,
    strokeColor: '#AF5', // 线颜色
    strokeWeight: 6, // 线宽
  })

  // 行驶后的轨迹颜色
  marker.on('moving', (e) => {
    passedPolyline.setPath(e.passedPath)
    // map.setCenter(e.target.getPosition(), true) // 行驶时设置地图中心点
  })

  map.setFitView()
}

function goBack() {
  marker.stopMove()
  showBtns.value = false
  toSetMap(gcj02.value[0], gcj02.value[1])
}

const playAnimation = function () {
  marker.moveAlong(gcj02Arr.value, {
    // 每一段的时长
    duration: 100, // 可根据实际采集时间间隔设置
    // JSAPI2.0 是否延道路自动设置角度在 moveAlong 里设置
    autoRotation: true,
  })
}

const pauseAnimation = function () {
  marker.pauseMove()
}

const stopAnimation = function () {
  marker.stopMove()
}

// startMove  resumeMove
// const startAnimation = function () {
//   marker.startMove()
// }

onUnmounted(() => {
  map?.destroy()
})
</script>

<template>
  <a-result v-if="gcj02 && !gcj02.length" sub-title="暂无数据">
    <template #icon>
      <img src="../../assets/images/null.png" alt="">
    </template>
  </a-result>
  <div v-show="gcj02?.length" id="container" />
  <a-float-button-group v-if="showBtns" type="primary" shape="square" :style="{ right: '48px', top: '50%', height: '163px', transform: 'translateY(-50%)' }">
    <a-float-button type="primary" @click="playAnimation()">
      <template #icon>
        <PlaySquareOutlined />
      </template>
    </a-float-button>
    <a-float-button type="primary" @click="pauseAnimation()">
      <template #icon>
        <PauseCircleOutlined />
      </template>
    </a-float-button>
    <a-float-button type="primary" @click="stopAnimation()">
      <template #icon>
        <PoweroffOutlined />
      </template>
    </a-float-button>
    <a-back-top type="primary" :visibility-height="0" @click="goBack()">
      <template #icon>
        <RollbackOutlined />
      </template>
    </a-back-top>
  </a-float-button-group>
  <a-image
    :style="{ display: 'none' }"
    :preview="{
      visible,
      onVisibleChange: setVisible,
    }"
    :src="pic_src"
  />
</template>

<style scoped>
  #container {
    width: 100%;
    height: 100%;
    padding: 12 0;
  }
</style>
