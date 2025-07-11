<script setup lang="ts">
import {onBeforeUnmount, reactive, ref, onMounted} from 'vue'
import type {Ref} from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'
import {useClipboard} from '@v-c/utils'
import {debounce} from 'lodash-es'
import {useECharts} from '~/hooks/useECharts'
import {Dayjs} from 'dayjs'
import dayjs from 'dayjs'
import {getBatteryApi, getLocationInfoApi, getMileagesApi, getRecordList} from "~/api/securityCheck.ts";
import {useRoute} from 'vue-router'

const AMAP_KEY: string = '8b03a6e837e1aab2e48a2f88c254db46'
// 环境变量配置
const AMAP_CONFIG = {
  key: AMAP_KEY,
  version: '2.0',
  plugins: ['AMap.PlaceSearch', 'AMap.Geocoder', 'AMap.MoveAnimation'],
}

interface LocationInfo {
  lng: number
  lat: number
  address: string
  sysCreated: string
  id: number
  speed: string
}

interface RecoderItem {
  startTime: number;
  endTime: number;
  startAddress: string;
  endAddress: string;
  distance: number;
  speed: number;
  // 其他属性如有可补充
}

const route = useRoute()
const chartRef = ref<HTMLDivElement | null>(null)
const {setOptions} = useECharts(chartRef as Ref<HTMLDivElement>)
const {message} = useGlobalConfig()
const terminalNo = route.params.id as string
let localeList = ref<LocationInfo[]>([])
let recoderList = ref<RecoderItem[]>([])
let battery = reactive({})
// 地图实例缓存
let mapInstance: any = null
let geocoderInstance: any = null

type Coordinate = number

let trajectoryTime = ref()

// 初始化ECharts
function initChart() {
  setOptions({
        series: [{
          type: 'gauge',
          startAngle: 270,
          endAngle: -270,
          radius: '100%',
          center: ['50%', '50%'],
          pointer: {
            show: false,
          },

          progress: {
            show: true,
            overlap: false,
            roundCap: true,
            clip: false,
            itemStyle: {
              color: '#0CB52B',
            },
          },
          axisLine: {
            lineStyle: {
              width: 8,
              color: [[1, '#EDEDEF']],
            },
          },
          splitLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
          axisLabel: {
            show: false,
          },
          data: [{
            value: 69,
            name: '',
            title: {
              offsetCenter: ['0%', '-15%'],
              fontSize: 12,
              color: '#666',
            },
            detail: {
              valueAnimation: true,
              offsetCenter: ['0%', '0%'],
              fontSize: 22,
            },
          }],
          detail: {
            width: 50,
            height: 14,
            fontSize: 18,
            color: '#000000',
            formatter: '{value}%',
          },
        }],
      },
  )
}

// 地图
function toSetMap(longitude: Coordinate, latitude: Coordinate) {
  AMapLoader.load(AMAP_CONFIG)
      .then((AMap) => {
        geocoderInstance = new AMap.Geocoder({radius: 1000, extensions: 'all'})

        // 清理旧实例
        if (mapInstance)
          mapInstance.destroy()

        mapInstance = new AMap.Map('mapContainer', {
          viewMode: '2D',
          zoom: 18,
          center: [longitude, latitude],
        })

        geocoderInstance.getAddress([longitude, latitude], (status: string, result: any) => {
          if (status === 'complete') {
            const placeSearch = new AMap.PlaceSearch({
              map: mapInstance!,
              radius: 500,
              location: `${longitude},${latitude}`,
            })
            console.log(placeSearch)
            const marker = new AMap.Marker({
              position: [longitude, latitude],
            })
            mapInstance.add(marker)
          } else {
            handleMapError(result)
          }
        })
      })
      .catch(handleMapError)
}

// 地图错误处理
function handleMapError(error: unknown) {
  message?.error('地图加载失败')
  console.error('AMap error:', error)
}

// 坐标copy
const copyCoordinate = debounce(() => {
  const {copy} = useClipboard()
  copy('123456')
  message?.success('复制成功')
}, 500)

const refreshMap = debounce(() => {
  getLocation()
  // toSetMap(118.16, 24.52)
})

const trajectoryTimeChange = async (date: Dayjs | string, dateString: string) => {
  trajectoryTime.value = dateString;
  await getRecoderList()
}

const getRecoderList = async () => {
  try {
    const result = await getRecordList({
      terminalNo: terminalNo,
      selectTime: trajectoryTime.value,
      pageNum: 1,
      pageSize: 10
    })
    if (result.code === 0) {
      recoderList.value = result.data.list
    }
  } catch (e) {
    console.error(e)
  }
}

const currentPoint = ref<LocationInfo>({})
const getLocation = async () => {
  try {
    const result = await getLocationInfoApi({
      terminalNo: terminalNo,
      pageNum: 1,
      pageSize: 10
    })
    if (result.code === 0) {
      localeList.value = result.data.list
      currentPoint.value = result.data.list[0]
      toSetMap(currentPoint.value.lng, currentPoint.value.lat)
      // 删除第一个
      localeList.value.shift()
    }
  } catch (e) {
    console.error(e)
  }
}

const getBattery = async () => {
  try {
    const result = await getBatteryApi({
      terminalNo: terminalNo,
    })
    if (result.code === 0) {
      battery = result.data.list
    }
  } catch (e) {
    console.error(e)
  }
}
let totalMileage = ref<number>(0)
const getMileages = async () => {
  try {
    const result = await getMileagesApi({
      terminalNo: terminalNo,
    })
    if (result.code === 0) {
      totalMileage.value = result.data
    }
  } catch (e) {
    console.error(e)
  }
}

getBattery()
getLocation()
getRecoderList()
getMileages()

onMounted(() => {
  initChart()
})

onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.destroy()
    mapInstance = null
  }
})

// 时间格式化函数
function formatDateTime(ts: number) {
  return dayjs(ts).format('YYYY-MM-DD HH:mm')
}
function formatTime(ts: number) {
  return dayjs(ts).format('HH:mm')
}
function formatWeekday(ts: number) {
  const weekMap = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六']
  return weekMap[dayjs(ts).day()]
}
function formatDuration(start: number, end: number) {
  const diff = Math.floor((end - start) / 1000) // 秒
  const min = Math.floor(diff / 60)
  if (min > 0) return `${min}min`
  return '<1min'
}
</script>

<template>
  <page-container occupied linkable>
    <div class="page-container">
      <div class="leftContainer">
        <div class="basicInformation">
          <div class="chartsBox">
            <div ref="chartRef" class="chart"/>
            <div class="deviceInfo">
              <!-- 这里可以添加设备信息 -->
              <span class="deviceTitle">设备号(IMEI)：172849504</span>
              <span>名称：-</span>
            </div>
          </div>
          <div class="batteryInformation">
            <div>
              <span>48V</span>
              <div class="tipBox">
                <svg-icon icon-class="voltage" class="svg"/>
                <span>总电压</span>
              </div>
            </div>
            <div>
              <span>52°C</span>
              <div class="tipBox">
                <svg-icon icon-class="temperature" class="svg"/>
                <span>温度</span>
              </div>
            </div>
            <div>
              <span>20A</span>
              <div class="tipBox">
                <svg-icon icon-class="current" class="svg"/>
                <span>电流</span>
              </div>
            </div>
          </div>
          <div class="listOfVoltages">
            <p class="title">
              单体电压
            </p>
            <div class="list">
              <div v-for="(item, index) in 13" :key="item">
                <div class="item">
                  <div class="battery">
                    {{ index + 1 }}
                  </div>
                  <!--                <svg-icon icon-class="battery" class="svg"></svg-icon> -->
                </div>
                <div>3.673V</div>
              </div>
            </div>
          </div>
        </div>
        <div class="warningMessages">
          <div class="warningTitle">
            <svg-icon icon-class="warning" style="margin-right: 8px"/>
            <span>实时告警</span>
          </div>
          <div class="warningList">
            <div v-for="item in 15" :key="item" class="warningItem">
              <div class="iconWarning"/>
              <div>严重：电池组温度异常</div>
            </div>
          </div>
        </div>
      </div>
      <div class="centerContainer">
        <div class="mapTime">
          <svg-icon icon-class="positioning" style="margin-right:8px;font-size: 24px"/>
          <span>最新定位时间：{{ currentPoint.sysCreated }}</span>
          <svg-icon icon-class="refresh" style="margin-left: 8px;font-size: 20px;cursor: pointer;" @click="refreshMap"/>
        </div>
        <div id="mapContainer" class="map p-100px">
          <a-empty v-if="!currentPoint.lng"/>
        </div>
        <div class="record" v-if="localeList.length">
          <div v-for="item in localeList" :key="item.id" class="recordItem">
            <div class="time">
              {{ item.sysCreated }}
            </div>
            <div class="latitudeAndLongitude">
              <div class="icon">
                <svg-icon icon-class="coordinate"/>
              </div>
              <div class="number" style="width: 160px">
                {{ item.lng }}-{{ item.lat }}
              </div>
            </div>
            <div class="action" @click="copyCoordinate">
              复制
            </div>
            <div class="mileage">
              <div>
                <svg-icon icon-class="appearance" class="icon"/>
                <span>{{ item.speed }}km/h</span>
              </div>
            </div>
          </div>
        </div>
        <div class="record" v-else>
          <a-empty />
        </div>
      </div>
      <div class="rightContainer">
        <div class="drivingData">
          <div class="time">
            <span>行驶数据</span>
            <span>日期：2025-04-01</span>
          </div>
          <div class="listBox">
            <div class="listItem" v-for="item in 15">
              <div class="date">13:22:05</div>
              <div class="data">
                <div>位置：福建省厦门市集美区软件园三期F16栋</div>
                <div>速度：25km/h</div>
              </div>
            </div>
          </div>
        </div>
        <div class="trajectoryRecord">
          <div class="top">
            <span>轨迹记录</span>
            <a-date-picker  @change="trajectoryTimeChange" />
          </div>
          <div class="errorTip" v-if="totalMileage >= 450">
            <span v-if="totalMileage < 500">行驶里程即将超500km，请注意维护</span>
            <span v-else>行驶里程已超500km，请注意维护</span>
          </div>
          <div class="list" v-if="recoderList.length">
            <div class="listItem" v-for="(item,index) in recoderList" :key="index">
              <div class="top">
                <span>{{ formatDateTime(item.startTime) }} {{ formatWeekday(item.startTime) }}</span>
                <span>{{ formatTime(item.startTime) }}-{{ formatTime(item.endTime) }}</span>
              </div>
              <div class="relative m-b-[14px] m-t-[12px] h-[42px] w-full flex flex-col p-l-[4px]">
                <a-divider type="vertical" class="absolute top-[10px] h-auto! bg-[#D9D9D9]! p-0 m-0 left-[7px] bottom-[3px]"/>
                <div class="font-medium text-[12px] text-[#4A5A6D] text-left font-not-italic normal-case m-b-[8px] z-1 ">
                  <div class="z-1 h-[6px] w-[6px] rounded-[100%] bg-[#168AFF] inline-block m-r-[8px]"></div>
                  <span class="color-[#6B7F94]">起点：</span>
                  <span>{{ item.startAddress }}</span>
                </div>
                <div class="font-medium text-[12px] text-[#4A5A6D] text-left font-not-italic normal-case m-b-[8px] ">
                  <div class="z-1 h-[6px] w-[6px] rounded-[100%] bg-[#FF8400] inline-block m-r-[8px]"></div>
                  <span class="color-[#6B7F94]">终点：</span>
                  <span>{{ item.endAddress }}</span>
                </div>
              </div>
              <div class="w-[100%] flex items-center font-medium text-[14px] text-[#2F3A4A] text-left font-not-italic normal-case">
                <div class=" whitespace-nowrap">耗时：{{ formatDuration(item.startTime, item.endTime) }}</div>
                <a-divider type="vertical" class="h-[14px]! bg-[#D9D9D9]! m-x-[10px]"/>
                <div class=" flex justify-center whitespace-nowrap">总里程：{{item.distance}}km</div>
                <a-divider type="vertical" class="h-[14px]! bg-[#D9D9D9]! m-x-[10px]"/>
                <div class=" flex justify-center whitespace-nowrap">平均速度：{{item.speed}}km/h</div>
              </div>
            </div>
          </div>
          <div class="list p-t-50px" v-else>
            <a-empty />
          </div>
        </div>
      </div>
    </div>
  </page-container>
</template>

<style lang="less">

::deep(.ant-timeline-item) {
  padding-bottom: 8px !important;
}

.system-crud-wrapper {
  .ant-form-item {
    margin: 0;
  }
}

.page-container {
  width: 100%;
  height: calc(100vh - 126px);
  display: flex;

  .leftContainer {
    width: 28%;
    min-width: 340px; // 设置最小宽度
    margin: 0 10px 16px 0;
    height: 100%;
    display: flex;
    flex-direction: column;

    .basicInformation {
      width: 100%;
      height: 62%;
      background: white;
      border-radius: 8px;
      margin-bottom: 16px;
      padding: clamp(16px, 2vw, 24px) clamp(16px, 2vw, 20px); // 使用clamp设置响应式padding
      display: flex;
      flex-direction: column;

      .chartsBox {
        height: clamp(80px, 10vh, 90px); // 使用clamp设置响应式高度
        width: 100%;
        display: flex;
        margin-bottom: clamp(16px, 2vh, 22px);

        .chart {
          width: clamp(80px, 10vh, 90px);
          height: 100%;
          margin-right: 16px;
        }

        .deviceInfo {
          flex: 1;
          font-size: clamp(14px, 1vw, 16px);
          color: #1A1A1A;
          text-align: left;
          font-style: normal;
          text-transform: none;
          padding: clamp(12px, 1.5vh, 16px) 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;

          .deviceTitle {
            font-weight: 600;
            font-size: clamp(16px, 1vw, 22px);
            color: #1A1A1A;
            text-align: left;
            font-style: normal;
            text-transform: none;
          }
        }
      }

      .batteryInformation {
        width: 100%;
        height: clamp(80px, 10vh, 98px);
        border-radius: 8px;
        background: #F8F9FD;
        display: flex;
        justify-content: space-between;
        margin-bottom: clamp(24px, 3vh, 32px);

        & > div {
          width: 32%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: clamp(12px, 1.5vh, 16px) 0;
          text-align: center;

          font-weight: 600;
          font-size: clamp(18px, 2vw, 24px);
          color: #1A1A1A;
          line-height: 28px;
          font-style: normal;
          text-transform: none;
        }

        .tipBox {
          font-size: clamp(14px, 1vw, 16px);
          font-weight: normal;
          display: flex;
          align-items: center;
          justify-content: center;

          .svg {
            margin-right: 6px;
          }
        }
      }

      .listOfVoltages {
        flex: 1;
        overflow: auto;
        display: flex;
        flex-direction: column;

        .title {
          font-weight: 600;
          font-size: clamp(14px, 1vw, 16px);
          color: #1A1A1A;
          line-height: 19px;
          text-align: left;
          margin-bottom: clamp(16px, 2vh, 20px);
        }

        .list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(42px, 1fr));
          grid-gap: clamp(16px, 2vw, 24px);
          flex: 1;
          overflow-y: auto;

          .item {
            width: clamp(36px, 3vw, 42px);
            height: clamp(36px, 3vw, 42px);
            margin-bottom: clamp(6px, 0.8vh, 8px);
            text-align: center;
            line-height: clamp(36px, 3vw, 42px);
            background-image: url("~/assets/images/battery.png");
            background-size: 100%;
            background-repeat: no-repeat;

            .battery {
              font-size: 12px;
              color: #168AFF;
            }
          }
        }
      }
    }

    .warningMessages {
      flex: 1;
      background: #fff;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      min-height: 0;

      .warningTitle {
        flex: none;
        font-size: clamp(14px, 1vw, 16px);
        padding: clamp(8px, 1vh, 10px) clamp(10px, 1vw, 12px);
        background: #FFF8F8;
        font-weight: 600;
        color: #1A1A1A;
        display: flex;
        align-items: center;
      }

      .warningList {
        overflow-y: auto;
        padding: 0 12px;

        .warningItem {
          display: flex;
          align-items: center;
          font-size: clamp(12px, 0.9vw, 14px);
          height: clamp(40px, 5vh, 44px);
          color: #1A1A1A;
          border-bottom: 1px solid #DDDDDD;

          .iconSerious {
            width: clamp(10px, 0.9vw, 12px);
            height: clamp(10px, 0.9vw, 12px);

            background: linear-gradient(180deg, #FFD2D1 0%, #F32726 38%, #A40100 100%);
            border-radius: 100px;
            margin-right: 8px;
          }

          .iconWarning {
            width: clamp(10px, 0.9vw, 12px);
            height: clamp(10px, 0.9vw, 12px);
            background: linear-gradient(180deg, #FFF8C0 0%, #FFC800 38%, #FFAF01 100%);
            border-radius: 100px;
            margin-right: 8px;
          }

          &:last-child {
            border-bottom: none;
          }
        }
      }
    }
  }

  .centerContainer {
    flex: 1;
    background: #fff;
    height: 100%;
    border-radius: 8px;
    padding: clamp(12px, 1.5vw, 16px) clamp(16px, 2vw, 20px);
    display: flex;
    flex-direction: column;

    .mapTime {
      display: flex;
      align-items: center;
      font-weight: 500;
      font-size: clamp(11px, 0.8vw, 12px);
      color: #1A1A1A;
      margin-bottom: clamp(10px, 1vh, 12px);
    }

    .map {
      width: 100%;
      border-radius: 4px;
      height: clamp(350px, 48vh, 520px);
      margin-bottom: clamp(12px, 1.5vh, 16px);
    }

    .record {
      flex: 1;
      width: 100%;
      overflow-y: auto;

      .recordItem {
        width: 100%;
        display: flex;
        align-items: center;
        border-bottom: 1px solid #DDDDDD;
        padding: clamp(16px, 2vh, 20px) 0;
        font-weight: 500;
        font-size: clamp(12px, 0.9vw, 14px);
        color: #1A1A1A;

        .latitudeAndLongitude {
          //background: black;
          //border: 1px solid black;
          display: flex;
          margin-left: clamp(20px, 2vw, 28px);

          .icon {
            font-size: 18px;
            border-radius: 4px 0 0 4px;
            background: #575757;
            display: flex;
            padding: 4px;
          }

          .number {
            border-radius: 0 4px 4px 0;
            padding: 0 8px;
            color: white;
            background: #168AFF;
            line-height: 28px;
          }
        }

        .action {
          margin: 0 24px 0 8px;
          color: #168AFF;
          cursor: pointer;
        }

        .mileage {
          display: flex;
          align-items: center;
          font-size: clamp(12px, 0.9vw, 14px);
          color: #1A1A1A;

          & > div {
            margin-right: 16px;
            display: flex;
            align-items: center;
          }

          .icon {
            font-size: 20px;
          }
        }
      }
    }
  }

  .rightContainer {
    width: 28%;
    min-width: 340px;
    margin-left: 10px;
    height: 100%;
    display: flex;
    flex-direction: column;

    .drivingData {
      width: 100%;
      height: 62%;
      background: white;
      border-radius: 8px;
      margin-bottom: 16px;
      padding: clamp(12px, 1.5vw, 16px) clamp(16px, 2vw, 20px);
      display: flex;
      flex-direction: column;

      .time {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-weight: 500;
        font-size: 14px;
        color: #000000;
        margin-bottom: 16px;
      }

      .listBox {
        flex: 1;
        min-height: 0;
        width: 100%;
        overflow-y: scroll;
        overflow-x: hidden;
        font-size: 14px;
        color: #2F3A4A;

        .listItem {
          width: 100%;
          height: auto;
          margin-bottom: 15px;
          display: flex;

          .date {
            margin-right: 19px;
          }

          .data {

            & > div {
              margin-bottom: 7px;
            }
          }
        }
      }
    }

    .trajectoryRecord {
      flex: 1;
      min-height: 0;
      width: 100%;
      background: white;
      border-radius: 8px;
      padding: clamp(12px, 1.5vw, 16px) clamp(16px, 2vw, 20px);
      display: flex;
      flex-direction: column;

      .top {
        font-weight: 600;
        font-size: 14px;
        color: #000000;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .errorTip {
        height: 38px;
        background: rgba(214, 45, 37, 0.1);
        border-radius: 8px 8px 8px 8px;
        display: flex;
        align-items: center;
        font-weight: 600;
        font-size: 12px;
        color: #D62D25;
        padding-left: 12px;
        box-sizing: border-box;
        margin-top: 8px;
      }

      .list {
        margin-top: 8px;
        flex: 1;
        min-height: 0;
        width: 100%;
        overflow-y: auto;
        overflow-x: hidden;

        .listItem {
          width: 100%;
          background: #F8F9FD;
          border-radius: 8px 8px 8px 8px;
          box-sizing: border-box;
          padding: 12px 16px;
          margin-bottom: 8px;

          .top {
            width: 100%;
            display: flex;
            justify-content: space-between;
            font-weight: 600;
            font-size: 14px;
            color: #2F3A4A;
          }

          .centerBox {
            margin-top: 12px;

            .text {
              font-weight: 500;
              font-size: 12px;
              color: #4A5A6D;
            }

            .startingPoint {
              width: 6px;
              height: 6px;
              background: #168AFF;
              border-radius: 100%;
            }

            .finishLine {
              width: 6px;
              height: 6px;
              background: #FF8400;
              border-radius: 100%;
            }
          }
        }
      }
    }
  }
}

.chart {
  width: 300px;
  height: 300px;
}

//// 媒体查询，处理不同屏幕尺寸
//@media screen and (max-width: 1440px) {
//  .page-container {
//    .leftContainer {
//      width: 30%;
//    }
//  }
//}
//
//@media screen and (max-width: 1280px) {
//  .page-container {
//    .leftContainer {
//      width: 35%;
//    }
//  }
//}
</style>
