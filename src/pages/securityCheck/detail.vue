<script setup lang="ts">
import { onBeforeUnmount, reactive, ref, onMounted } from 'vue'
import type { Ref } from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'
import { useClipboard } from '@v-c/utils'
import { debounce } from 'lodash-es'
import { useECharts } from '~/hooks/useECharts'
import { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { getBatteryApi, getLocationInfoApi, getMileagesApi, getRecordList, getAlarmsApi } from "~/api/securityCheck.ts";
import { useRoute } from 'vue-router'
import ScrollPagination from '~/components/scroll-pagination/index.vue'
const { t } = useI18nLocale()

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
  gcj02?: string
  status: string
}

interface RecoderItem {
  startTime: number
  endTime: number
  startAddress: string
  endAddress: string
  distance: number
  speed: number
  startTimestamp: number
  endTimestamp: number
  // 其他属性如有可补充
}

const route = useRoute()
const chartRef = ref<HTMLDivElement | null>(null)
const { setOptions } = useECharts(chartRef as Ref<HTMLDivElement>)
const { message } = useGlobalConfig()
const terminalNo = route.params.id as string
const deviceName = route.query.name as string
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
        value: 0,
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
  AMapLoader.reset()
  AMapLoader.load(AMAP_CONFIG)
    .then((AMap) => {
      geocoderInstance = new AMap.Geocoder({ radius: 1000, extensions: 'all' })

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
  message?.error(t('pages.securityCheck.detail.mapLoadFail'))
  console.error('AMap error:', error)
}

// 坐标copy
const copyCoordinate = debounce((lng: number, lat: number) => {
  const { copy } = useClipboard()
  copy(`${lng},${lat}`)
  message?.success('复制成功')
}, 500)




const spinning2 = ref(false)
const recoderPage = ref(1)
const recoderFinished = ref(false)
const getRecoderList = async (force = false) => {
  try {
    if (!force && (spinning2.value || recoderFinished.value))
      return
    spinning2.value = true
    const result = await getRecordList({
      terminalNo: terminalNo,
      selectTime: trajectoryTime.value,
      pageNum: recoderPage.value,
      pageSize: 10
    })
    if (result.code === 0) {
      // 计算平均速度
      result.data.list.forEach((item: any) => {
        const durationMs = item.endTimestamp - item.startTimestamp
        const durationHours = durationMs > 0 ? durationMs / (1000 * 60 * 60) : 0
        item.speed = durationHours > 0 ? Number((item.distance / durationHours).toFixed(2)) : 0
      })

      recoderList.value.push(...result.data.list)
      if (recoderList.value.length >= result.data.total) {
        recoderFinished.value = true
      } else {
        recoderPage.value += 1
      }
    }
  } catch (e) {
    console.error(e)
  } finally {
    spinning2.value = false
  }
}

const trajectoryTimeChange = async (date: Dayjs | string, dateString: string) => {
  trajectoryTime.value = dateString;
  recoderPage.value = 1
  recoderFinished.value = false
  recoderList.value = []
  await getRecoderList(true)
}

const currentPoint = ref<LocationInfo>({ lng: 0, lat: 0, address: '', sysCreated: '', id: 0, speed: '', status: '' })
const spinning = ref(false)
const finished = ref(false)
const locationPage = ref(1)

const getLocation = async (force = false) => {
  if (!force && (spinning.value || finished.value))
    return

  try {
    spinning.value = true
    const result = await getLocationInfoApi({
      terminalNo: terminalNo,
      pageNum: locationPage.value,
      pageSize: 10
    })
    if (result.code === 0) {
      result.data.list.forEach((item: any) => {
        if (item.gcj02) {
          const arr = item.gcj02.split(',')
          item.lng = Number(arr[0])
          item.lat = Number(arr[1])
        } else {
          item.lng = ''
          item.lat = ''
        }
      })
      localeList.value.push(...result.data.list)
      if (locationPage.value === 1 && result.data.list.length) {
        currentPoint.value = result.data.list[0]
        toSetMap(currentPoint.value.lng, currentPoint.value.lat)
      }
      if (localeList.value.length >= result.data.total) {
        finished.value = true
      } else {
        locationPage.value += 1
      }
      // 删除第一个
    }
  } catch (e) {
    console.error(e)
  } finally {
    spinning.value = false
  }
}

const refreshMap = debounce(() => {
  if (!spinning.value) {
    finished.value = false
    localeList.value = []
    locationPage.value = 1
    getLocation(true)
  };

  if (!spinning2.value) {
    recoderFinished.value = false
    recoderList.value = []
    recoderPage.value = 1
    getRecoderList(true)
  };
  if (!alarmLoading.value) {
    alarmFinished.value = false
    alarmList.value = []
    alarmPage.value = 1
    getAlarms(true)
  }
  // toSetMap(118.16, 24.52)
})

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

const alarmList = ref<{
  title: string
  id: number
  time: number
  timeZh: string
  sysCreated: string
}[]>([])
const alarmPage = ref(1)
const alarmFinished = ref(false)
const alarmLoading = ref(false)
const getAlarms = async (force = false) => {
  try {
    if (!force && (alarmLoading.value || alarmFinished.value))
      return
    alarmLoading.value = true
    const result = await getAlarmsApi({
      terminalNo,
      pageNum: alarmPage.value,
      pageSize: 10,
    })
    if (result.code === 0) {
      result.data.list.forEach((item: any) => {
        item.timeZh = formatDateTimeStr(item.time)
      })
      alarmList.value.push(...result.data.list)
      const total = result.data.total
      if (alarmList.value.length >= total)
        alarmFinished.value = true
      else
        alarmPage.value += 1
    }
  } catch (e) {
    console.error(e)
  } finally {
    alarmLoading.value = false
  }
}

getBattery()
getLocation()
getRecoderList()
getMileages()
getAlarms(true)

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

function formatDateTimeStr(ts: string) {
  const timeStr = `20${ts}`
  const year = timeStr.substring(0, 4);
  const month = timeStr.substring(4, 6);
  const day = timeStr.substring(6, 8);
  const hour = timeStr.substring(8, 10);
  const minute = timeStr.substring(10, 12);
  const second = timeStr.substring(12, 14);
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function formatTime(ts: number) {
  return dayjs(ts).format('HH:mm')
}

function formatWeekday(ts: number) {
  const weekMap = [
    t('pages.securityCheck.detail.week0'),
    t('pages.securityCheck.detail.week1'),
    t('pages.securityCheck.detail.week2'),
    t('pages.securityCheck.detail.week3'),
    t('pages.securityCheck.detail.week4'),
    t('pages.securityCheck.detail.week5'),
    t('pages.securityCheck.detail.week6'),
  ]
  return weekMap[dayjs(ts).day()]
}

function formatDuration(start: number, end: number) {
  const diff = Math.floor((end - start) / 1000)
  const min = Math.floor(diff / 60)
  if (min > 0) return `${min}min`
  return t('pages.securityCheck.detail.lessThanOneMinute')
}
</script>

<template>
  <page-container occupied linkable>
    <div class="page-container">
      <div class="leftContainer">
        <div class="basicInformation">
          <div class="chartsBox">
            <div ref="chartRef" class="chart" />
            <div class="deviceInfo">
              <!-- 这里可以添加设备信息 -->
              <span class="deviceTitle">{{ t('pages.securityCheck.detail.imei') }}：{{ terminalNo }}</span>
              <span>{{ t('pages.securityCheck.detail.name') }}：{{deviceName || '--'}}</span>
            </div>
          </div>
          <div class="batteryInformation">
            <div>
              <span>--</span>
              <div class="tipBox">
                <svg-icon icon-class="voltage" class="svg" />
                <span>{{ t('pages.securityCheck.detail.totalVoltage') }}</span>
              </div>
            </div>
            <div>
              <span>--</span>
              <div class="tipBox">
                <svg-icon icon-class="temperature" class="svg" />
                <span>{{ t('pages.securityCheck.detail.temperature') }}</span>
              </div>
            </div>
            <div>
              <span>--</span>
              <div class="tipBox">
                <svg-icon icon-class="current" class="svg" />
                <span>{{ t('pages.securityCheck.detail.current') }}</span>
              </div>
            </div>
          </div>
          <div class="listOfVoltages">
            <p class="title">{{ t('pages.securityCheck.detail.singleVoltage') }}</p>
            <div class="m-t-[30px] w-full flex justify-center items-center">
              <a-empty />
            </div>
            <!-- <div class="list"> -->
            <!--              <div v-for="(item, index) in 13" :key="item">-->
            <!--                <div class="item">-->
            <!--                  <div class="battery">-->
            <!--                    {{ index + 1 }}-->
            <!--                  </div>-->
            <!--                  &lt;!&ndash;                <svg-icon icon-class="battery" class="svg"></svg-icon> &ndash;&gt;-->
            <!--                </div>-->
            <!--                <div>3.673V</div>-->
            <!--              </div>-->
            <!-- </div> -->
          </div>
        </div>
        <div class="warningMessages">
          <div class="warningTitle">
            <svg-icon icon-class="warning" style="margin-right: 8px" />
            <span>{{ t('pages.securityCheck.detail.realtimeAlarm') }}</span>
          </div>
          <div class="warningList h-[100%]" v-if="!alarmList.length && alarmLoading">
            <a-spin class="w-full h-full flex items-center justify-center m-t-[30px]" />
          </div>
          <div class="warningList" v-else-if="alarmList.length > 0">
            <ScrollPagination height="100%" :immediate="false" :loading="alarmLoading" :finished="alarmFinished"
              @load="() => getAlarms()">
              <div v-for="item in alarmList" :key="item.id" class="warningItem">
                <div class="h-full flex items-center">
                  <div class="iconSerious" />
                  <div>{{ item.title }}</div>
                </div>
                <div class="h-full flex items-center">
                  {{ item.timeZh }}
                </div>
              </div>
              <template #loading><a-spin /></template>
              <template #finished>{{ t('pages.common.noMore') }}</template>
            </ScrollPagination>
          </div>
          <div class="warningList" v-else>
            <a-empty class="m-t-[30px]" />
          </div>
        </div>
      </div>
      <div class="centerContainer">
        <div class="mapTime">
          <svg-icon icon-class="positioning" style="margin-right:8px;font-size: 24px" />
          <span>{{ t('pages.securityCheck.detail.latestLocation') }}：{{ currentPoint?.sysCreated || '--' }}</span>
          <svg-icon icon-class="refresh" style="margin-left: 8px;font-size: 20px;cursor: pointer;"
            @click="refreshMap" />
        </div>
        <!-- <a-spin :spinning="spinning"> -->
        <div id="mapContainer" class="map p-[100px]">
          <a-empty v-if="!currentPoint?.gcj02" />
        </div>
        <!-- </a-spin> -->
        <div class="record" v-if="spinning && !localeList.length">
          <a-spin class="w-full h-full flex items-center justify-center" />
        </div>
        <div class="record" v-else-if="localeList.length > 0">
          <ScrollPagination height="100%" :immediate="false" :loading="spinning" :finished="finished"
            @load="getLocation">
            <div v-for="item in localeList" :key="item.id" class="recordItem flex items-center justify-between">
              <div class="h-full flex items-center">
                <div class="time">
                  {{ item.sysCreated }}
                </div>
                <div class="latitudeAndLongitude">
                  <div class="icon">
                    <svg-icon icon-class="coordinate" />
                  </div>
                  <div v-if="item.status === '2'" class="number">
                    -
                  </div>
                  <div v-else class="number" style="width: 160px">
                    {{ item.lng }}-{{ item.lat }}
                  </div>
                </div>
                <div class="action" @click="copyCoordinate(item.lng, item.lat)">{{ t('pages.common.copy') }}</div>
                <div class="mileage">
                  <div>
                    <svg-icon icon-class="appearance" class="icon" />
                    <span>{{ item.speed }}km/h</span>
                  </div>
                </div>
              </div>
              <div v-if="item.status === '2'"
                class="font-medium text-[14px] text-[#D62D25] text-left font-not-italic normal-case m-r-[16px]">{{ t('pages.securityCheck.detail.gnssError') }}
              </div>
            </div>
            <template #loading><a-spin /></template>
          </ScrollPagination>
        </div>
        <div class="record" v-else><a-empty /></div>

        <!-- <a-spin :spinning="spinning"> -->
        <!-- <div class="record" v-if="localeList.length">
            <div v-for="item in localeList" :key="item.id" class="recordItem">
              <div class="time">
                {{ item.sysCreated }}
              </div>
              <div class="latitudeAndLongitude">
                <div class="icon">
                  <svg-icon icon-class="coordinate" />
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
                  <svg-icon icon-class="appearance" class="icon" />
                  <span>{{ item.speed }}km/h</span>
                </div>
              </div>
            </div>
          </div>
          <div class="record" v-else>
            <a-empty />
          </div> -->
        <!-- </a-spin> -->
      </div>
      <div class="rightContainer">
        <div class="drivingData">
          <div class="time">
            <span>{{ t('pages.securityCheck.detail.drivingData') }}</span>
            <!--            <span>日期：2025-04-01</span>-->
            <span>{{ t('pages.securityCheck.detail.date') }}：--</span>
          </div>
          <div class="listBox">
            <a-empty class="m-t-[30px]" />
            <!-- <a-empty /> -->

            <!--            <div class="listItem" v-for="item in 15">-->
            <!--              <div class="date">13:22:05</div>-->
            <!--              <div class="data">-->
            <!--                <div>位置：福建省厦门市集美区软件园三期F16栋</div>-->
            <!--                <div>速度：25km/h</div>-->
            <!--              </div>-->
            <!--            </div>-->
          </div>
        </div>
        <div class="trajectoryRecord">
          <div class="top">
            <span>{{ t('pages.securityCheck.detail.trackingRecord') }}</span>
            <a-date-picker @change="trajectoryTimeChange" />
          </div>
          <div class="errorTip" v-if="totalMileage >= 450">
            <span v-if="totalMileage < 500">{{ t('pages.securityCheck.detail.mileageWarnSoon') }}</span>
            <span v-else>{{ t('pages.securityCheck.detail.mileageWarnExceeded') }}</span>
          </div>
          <div class="list" v-if="spinning2 && !recoderList.length">
            <a-spin class="w-full h-full flex items-center justify-center" />
          </div>
          <div class="list" v-else-if="recoderList.length > 0">
            <ScrollPagination height="100%" :immediate="false" :loading="spinning2" :finished="recoderFinished"
              @load="getRecoderList">
              <div v-for="(item, index) in recoderList" :key="index" class="listItem">
                <div class="top">
                  <span>{{ formatDateTime(item.startTimestamp) }} {{ formatWeekday(item.startTimestamp) }}</span>
                  <span>{{ formatTime(item.startTimestamp) }}-{{ formatTime(item.endTimestamp) }}</span>
                </div>
                <div class="m-b-[14px] m-t-[12px] h-auto w-full flex">
                  <div class="h-auto flex flex-col justify-around relative p-l-[4px] m-r-[8px]">
                    <div class="flex items-center">
                      <div class="z-1 h-[6px] w-[6px] rounded-[100%] bg-[#168AFF] inline-block m-r-[8px]"></div>
                  <span class="color-[#6B7F94]" style="white-space:nowrap;">{{ t('pages.securityCheck.detail.start') }}：</span>
                    </div>
                    <div class="flex items-center">
                      <div class="z-1 h-[6px] w-[6px] rounded-[100%] bg-[#FF8400] inline-block m-r-[8px]"></div>
                  <span class="color-[#6B7F94]" style="white-space:nowrap;">{{ t('pages.securityCheck.detail.end') }}：</span>
                    </div>
                  </div>
                  <div
                    class="font-medium text-[12px] text-[#4A5A6D] text-left font-not-italic normal-case  z-1 flex flex-col">
                    <span class="m-b-[8px]">{{ item.startAddress }}</span>
                    <span>{{ item.endAddress }}</span>
                  </div>
                </div>
                <div
                  class="w-[100%] flex items-center font-medium text-[14px] text-[#2F3A4A] text-left font-not-italic normal-case">
                  <div class=" whitespace-nowrap">{{ t('pages.securityCheck.detail.duration') }}：{{ formatDuration(item.startTimestamp, item.endTimestamp) }}</div>
                  <a-divider type="vertical" class="h-[14px]! bg-[#D9D9D9]! m-x-[10px]" />
                  <div class=" flex justify-center whitespace-nowrap">{{ t('pages.securityCheck.detail.totalMileage') }}：{{ item.distance }}km</div>
                  <a-divider type="vertical" class="h-[14px]! bg-[#D9D9D9]! m-x-[10px]" />
                  <div class=" flex justify-center">{{ t('pages.securityCheck.detail.avgSpeed') }}：{{ item.speed }}km/h</div>
                </div>
              </div>
              <template #loading><a-spin /></template>
            </ScrollPagination>
          </div>
          <div class="list" v-else><a-empty /></div>
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

        &>div {
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
          justify-content: space-between;
          padding-right: 16px;
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
      min-height: 0; // 关键：允许子元素基于父容器高度滚动
      width: 100%;

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

          &>div {
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

    // .record--fixed {
    //   flex: none;
    //   height: 289px;
    //   min-height: 0;
    // }
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

            &>div {
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
//}</style>
