<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Ref } from 'vue'
import { useClipboard } from '@v-c/utils'
import { debounce } from 'lodash-es'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useRoute } from 'vue-router'
import { getAlarmsApi, getBatteryApi, getBatteryRecordApi, getLocationInfoApi, getMileagesApi, getRecordList } from '~/api/securityCheck.ts'
import { useECharts } from '~/hooks/useECharts'
import ScrollPagination from '~/components/scroll-pagination/index.vue'
import LocationMap from './components/LocationMap.vue'

const { t } = useI18nLocale()

interface LocationInfo {
  lng: number
  lat: number
  address: string
  sysCreated: string
  ts: string
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

interface LocationListResponse {
  code: number
  data: {
    list: LocationInfo[]
    total: number
  }
}

const route = useRoute()
const chartRef = ref<HTMLDivElement | null>(null)
const { setOptions } = useECharts(chartRef as Ref<HTMLDivElement>)
const { message } = useGlobalConfig()
const terminalNo = route.params.id as string
const deviceName = route.query.name as string
const localeList = ref<LocationInfo[]>([])
const recoderList = ref<RecoderItem[]>([])
const battery = ref({
  totalVoltage: 0,
  maxProbeTemperature: 0,
  totalCurrent: 0,
  singleCellVoltage: [],
  soc: 0,
})
const trajectoryTime = ref()

// 初始化ECharts
function initChart(soc: number = 0) {
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
        value: soc,
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
  }, false)
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
async function getRecoderList(force = false) {
  try {
    if (!force && (spinning2.value || recoderFinished.value))
      return
    spinning2.value = true
    const result = await getRecordList({
      terminalNo,
      selectTime: trajectoryTime.value,
      pageNum: recoderPage.value,
      pageSize: 10,
    })
    if (result.code === 0) {
      // 计算平均速度
      result.data.list.forEach((item: any) => {
        const durationMs = item.endTimestamp - item.startTimestamp
        const durationHours = durationMs > 0 ? durationMs / (1000 * 60 * 60) : 0
        item.speed = durationHours > 0 ? Number((item.distance / 1000 / durationHours).toFixed(2)) : 0
      })

      recoderList.value.push(...result.data.list)
      if (recoderList.value.length >= result.data.total) {
        recoderFinished.value = true
      }
      else {
        recoderPage.value += 1
      }
    }
  }
  catch (e) {
    console.error(e)
  }
  finally {
    spinning2.value = false
  }
}

async function trajectoryTimeChange(date: Dayjs | string, dateString: string) {
  trajectoryTime.value = dateString
  recoderPage.value = 1
  recoderFinished.value = false
  recoderList.value = []
  await getRecoderList(true)
}

const currentPoint = ref<LocationInfo>({ lng: 0, lat: 0, address: '', sysCreated: '', id: 0, speed: '', status: '' })
const spinning = ref(false)
const finished = ref(false)
const locationPage = ref(1)

function hasLocationPoint(point?: Partial<LocationInfo> | null) {
  if (!point)
    return false
  if (typeof point.gcj02 === 'string' && point.gcj02.trim())
    return true
  return Number.isFinite(Number(point.lng)) && Number.isFinite(Number(point.lat))
}

function parseJsonArray(value: unknown) {
  if (Array.isArray(value))
    return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    }
    catch {
      return []
    }
  }
  return []
}

function applyVoltageRecordResult(data: any) {
  const list = Array.isArray(data?.list) ? data.list : []
  list.forEach((item: any) => {
    item.singleCellVoltage = parseJsonArray(item.singleCellVoltage)
  })
  voltageRecordList.value.push(...list)
  const total = Number(data?.total || 0)
  if (voltageRecordList.value.length >= total)
    voltageRecordFinished.value = true
  else
    voltageRecordPage.value += 1
}

function applyLocationResult(result: LocationListResponse) {
  result.data.list.forEach((item: any) => {
    if (item.gcj02) {
      const arr = item.gcj02.split(',')
      item.lng = Number(arr[0])
      item.lat = Number(arr[1])
    }
    else {
      item.lng = ''
      item.lat = ''
    }
  })
  localeList.value.push(...result.data.list)
  if (locationPage.value === 1 && result.data.list.length) {
    currentPoint.value = result.data.list[0]
  }
  if (localeList.value.length >= result.data.total) {
    finished.value = true
  }
  else {
    locationPage.value += 1
  }
}

async function getLocation(force = false) {
  if (!force && (spinning.value || finished.value))
    return

  try {
    spinning.value = true
    const result = await getLocationInfoApi({
      terminalNo,
      pageNum: locationPage.value,
      pageSize: 10,
    })
    if (result.code === 0 && result.data)
      applyLocationResult(result)
  }
  catch (e) {
    console.error(e)
  }
  finally {
    spinning.value = false
  }
}

const voltageRecordList = ref<any[]>([])
const voltageRecordPage = ref(1)
const voltageRecordFinished = ref(false)
const voltageRecordLoading = ref(false)
async function getVoltageRecords(force = false) {
  try {
    if (!force && (voltageRecordLoading.value || voltageRecordFinished.value))
      return
    voltageRecordLoading.value = true
    const result = await getBatteryRecordApi({
      terminalNo,
      pageNum: voltageRecordPage.value,
      pageSize: 10,
    })
    if (result.code === 0 && result.data)
      applyVoltageRecordResult(result.data)
  }
  catch (e) {
    console.error(e)
  }
  finally {
    voltageRecordLoading.value = false
  }
}

async function getBattery() {
  try {
    const result = await getBatteryApi({
      terminalNo,
    })
    if (result.code === 0 && result.data) {
      battery.value = {
        ...result.data,
        singleCellVoltage: parseJsonArray(result.data.singleCellVoltage),
        soc: result.data.soc || 0,
      }
      initChart(battery.value.soc)
    }
  }
  catch (e) {
    console.error(e)
  }
}
const totalMileage = ref<number>(0)
async function getMileages() {
  try {
    const result = await getMileagesApi({
      terminalNo,
    })
    if (result.code === 0) {
      totalMileage.value = result.data
    }
  }
  catch (e) {
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
async function getAlarms(force = false) {
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
      // result.data.list.forEach((item: any) => {
      //   item.timeZh = formatDateTimeStr(item.time)
      // })
      alarmList.value.push(...result.data.list)
      const total = result.data.total
      if (alarmList.value.length >= total)
        alarmFinished.value = true
      else
        alarmPage.value += 1
    }
  }
  catch (e) {
    console.error(e)
  }
  finally {
    alarmLoading.value = false
  }
}

const refreshMap = debounce(() => {
  if (!spinning.value) {
    finished.value = false
    localeList.value = []
    locationPage.value = 1
    getLocation(true)
  }

  if (!spinning2.value) {
    recoderFinished.value = false
    recoderList.value = []
    recoderPage.value = 1
    getRecoderList(true)
  }

  if (!alarmLoading.value) {
    alarmFinished.value = false
    alarmList.value = []
    alarmPage.value = 1
    getAlarms(true)
  }

  if (!voltageRecordLoading.value) {
    voltageRecordFinished.value = false
    voltageRecordList.value = []
    voltageRecordPage.value = 1
    getVoltageRecords(true)
  }
  // toSetMap(118.16, 24.52)
}, 500)

getBattery()
getLocation()
getRecoderList()
getMileages()
getAlarms(true)
getVoltageRecords(true)

onMounted(() => {
  initChart(battery.value.soc || 0)
})

// 时间格式化函数
function formatDateTime(ts: number) {
  return dayjs(ts).format('YYYY-MM-DD HH:mm')
}

// function formatDateTimeStr(ts: string) {
//   const timeStr = `20${ts}`
//   const year = timeStr.substring(0, 4)
//   const month = timeStr.substring(4, 6)
//   const day = timeStr.substring(6, 8)
//   const hour = timeStr.substring(8, 10)
//   const minute = timeStr.substring(10, 12)
//   const second = timeStr.substring(12, 14)
//   return `${year}-${month}-${day} ${hour}:${minute}:${second}`
// }

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
  if (min > 0)
    return `${min}min`
  return t('pages.securityCheck.detail.lessThanOneMinute')
}

function formatDistance(distance: number): string {
  const kilometers = distance / 1000
  return kilometers.toFixed(2)
}
</script>

<template>
  <page-container occupied linkable>
    <div class="page-container">
      <div class="page-container">
        <div class="top-section">
          <div class="leftContainer">
            <div class="basicInformation">
              <div class="chartsBox">
                <div ref="chartRef" class="chart" />
                <div class="deviceInfo">
                  <!-- 这里可以添加设备信息 -->
                  <span class="deviceTitle">{{ t('pages.securityCheck.detail.imei') }}：{{ terminalNo }}</span>
                  <span>{{ t('pages.securityCheck.detail.name') }}：{{ deviceName || '--' }}</span>
                </div>
              </div>
              <div class="batteryInformation">
                <div>
                  <span>{{ battery?.totalVoltage || 0 }}V</span>
                  <div class="tipBox">
                    <svg-icon icon-class="voltage" class="svg" />
                    <span>{{ t('pages.securityCheck.detail.totalVoltage') }}</span>
                  </div>
                </div>
                <div>
                  <span>{{ battery?.maxProbeTemperature || 0 }}°C</span>
                  <div class="tipBox">
                    <svg-icon icon-class="temperature" class="svg" />
                    <span>{{ t('pages.securityCheck.detail.temperature') }}</span>
                  </div>
                </div>
                <div>
                  <span>{{ battery?.totalCurrent || 0 }}A</span>
                  <div class="tipBox">
                    <svg-icon icon-class="current" class="svg" />
                    <span>{{ t('pages.securityCheck.detail.current') }}</span>
                  </div>
                </div>
              </div>
              <div class="listOfVoltages">
                <p class="title">
                  {{ t('pages.securityCheck.detail.singleVoltage') }}
                </p>
                <div
                  v-if="!battery.singleCellVoltage.length"
                  class="m-t-[30px] w-full flex justify-center items-center"
                >
                  <a-empty />
                </div>
                <div v-else class="list">
                  <div v-for="(item, index) in battery?.singleCellVoltage" :key="index">
                    <div class="item">
                      <div class="battery">
                        {{ index + 1 }}
                      </div>
                    </div>
                    <div>{{ item }}V</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="warningMessages">
              <div class="warningTitle">
                <svg-icon icon-class="warning" style="margin-right: 8px" />
                <span>{{ t('pages.securityCheck.detail.realtimeAlarm') }}</span>
              </div>
              <div v-if="!alarmList.length && alarmLoading" class="warningList h-[100%]">
                <a-spin class="w-full h-full flex items-center justify-center m-t-[30px]" />
              </div>
              <div v-else-if="alarmList.length > 0" class="warningList">
                <ScrollPagination
                  height="100%" :immediate="false" :loading="alarmLoading" :finished="alarmFinished"
                  @load="() => getAlarms()"
                >
                  <div v-for="item in alarmList" :key="item.id" class="warningItem">
                    <div class="h-full flex items-center">
                      <div class="iconSerious" />
                      <div>{{ item.title }}</div>
                    </div>
                    <div class="h-full flex items-center">
                      {{ item.sysCreated }}
                    </div>
                  </div>
                  <template #loading>
                    <a-spin />
                  </template>
                  <template #finished>
                    {{ t('pages.common.noMore') }}
                  </template>
                </ScrollPagination>
              </div>
              <div v-else class="warningList">
                <a-empty class="m-t-[30px]" />
              </div>
            </div>
          </div>
          <div class="centerContainer">
            <div class="mapTime">
              <svg-icon icon-class="positioning" style="margin-right:8px;font-size: 24px" />
              <span>{{ t('pages.securityCheck.detail.latestLocation') }}：{{ currentPoint?.sysCreated || currentPoint.ts }}</span>
              <svg-icon
                icon-class="refresh" style="margin-left: 8px;font-size: 20px;cursor: pointer;"
                @click="refreshMap"
              />
            </div>
            <!-- <a-spin :spinning="spinning"> -->
            <div class="map">
              <a-empty v-if="!currentPoint?.gcj02" />
              <LocationMap v-else :point="currentPoint" />
            </div>
            <!-- </a-spin> -->
            <div v-if="spinning && !localeList.length" class="record">
              <a-spin class="w-full h-full flex items-center justify-center" />
            </div>
            <div v-else-if="localeList.length > 0" class="record">
              <ScrollPagination
                height="100%" :immediate="false" :loading="spinning" :finished="finished"
                @load="getLocation"
              >
                <div v-for="item in localeList" :key="item.id" class="recordItem flex items-center justify-between">
                  <div class="h-full flex items-center">
                    <div class="time">
                      {{ item.sysCreated || item.ts }}
                    </div>
                    <div class="latitudeAndLongitude">
                      <div class="icon">
                        <svg-icon icon-class="coordinate" />
                      </div>
                      <div v-if="item.status === '2'" class="number">
                        -
                      </div>
                      <div v-else class="number" style="width: 160px;">
                        {{ item.lng }}-{{ item.lat }}
                      </div>
                    </div>
                    <div class="action" @click="copyCoordinate(item.lng, item.lat)">
                      {{ t('pages.common.copy') }}
                    </div>
                    <div class="mileage">
                      <div>
                        <svg-icon icon-class="appearance" class="icon" />
                        <span>{{ item.speed }}km/h</span>
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="item.status === '2'"
                    class="font-medium text-[14px] text-[#D62D25] text-left font-not-italic normal-case m-r-[16px]"
                  >
                    {{
                      t('pages.securityCheck.detail.gnssError') }}
                  </div>
                </div>
                <template #loading>
                  <a-spin />
                </template>
              </ScrollPagination>
            </div>
            <div v-else class="record">
              <a-empty />
            </div>
          </div>
          <div class="rightContainer">
            <!-- <div class="drivingData">
              <div class="time">
                <span>{{ t('pages.securityCheck.detail.drivingData') }}</span>
                <span>{{ t('pages.securityCheck.detail.date') }}：--</span>
              </div>
              <div class="listBox">
                <a-empty class="m-t-[30px]" />
              </div>
            </div> -->
            <div class="trajectoryRecord">
              <div class="top">
                <span>{{ t('pages.securityCheck.detail.trackingRecord') }}</span>
                <a-date-picker @change="trajectoryTimeChange" />
              </div>
              <div v-if="totalMileage >= 450" class="errorTip">
                <span v-if="totalMileage < 500">{{ t('pages.securityCheck.detail.mileageWarnSoon') }}</span>
                <span v-else>{{ t('pages.securityCheck.detail.mileageWarnExceeded') }}</span>
              </div>
              <div v-if="spinning2 && !recoderList.length" class="list">
                <a-spin class="w-full h-full flex items-center justify-center" />
              </div>
              <div v-else-if="recoderList.length > 0" class="list">
                <ScrollPagination
                  height="100%" :immediate="false" :loading="spinning2" :finished="recoderFinished"
                  @load="getRecoderList"
                >
                  <div v-for="(item, index) in recoderList" :key="index" class="listItem">
                    <div class="top">
                      <span>{{ formatDateTime(item.startTimestamp) }} {{ formatWeekday(item.startTimestamp) }}</span>
                      <span>{{ formatTime(item.startTimestamp) }}-{{ formatTime(item.endTimestamp) }}</span>
                    </div>
                    <div class="m-b-[14px] m-t-[12px] h-auto w-full flex">
                      <div class="h-auto flex flex-col justify-around relative p-l-[4px] m-r-[8px]">
                        <div class="flex items-center">
                          <div class="z-1 h-[6px] w-[6px] rounded-[100%] bg-[#168AFF] inline-block m-r-[8px]" />
                          <span class="color-[#6B7F94]" style="white-space:nowrap;">{{
                            t('pages.securityCheck.detail.start')
                          }}：</span>
                        </div>
                        <div class="flex items-center">
                          <div class="z-1 h-[6px] w-[6px] rounded-[100%] bg-[#FF8400] inline-block m-r-[8px]" />
                          <span class="color-[#6B7F94]" style="white-space:nowrap;">{{
                            t('pages.securityCheck.detail.end')
                          }}：</span>
                        </div>
                      </div>
                      <div
                        class="font-medium text-[12px] text-[#4A5A6D] text-left font-not-italic normal-case  z-1 flex flex-col"
                      >
                        <span class="m-b-[8px]">{{ item.startAddress }}</span>
                        <span>{{ item.endAddress }}</span>
                      </div>
                    </div>
                    <div
                      class="w-[100%] flex items-center font-medium text-[14px] text-[#2F3A4A] text-left font-not-italic normal-case"
                    >
                      <div class=" whitespace-nowrap">
                        {{ t('pages.securityCheck.detail.duration') }}：{{
                          formatDuration(item.startTimestamp, item.endTimestamp) }}
                      </div>
                      <a-divider type="vertical" class="h-[14px]! bg-[#D9D9D9]! m-x-[10px]" />
                      <div class=" flex justify-center whitespace-nowrap">
                        {{ t('pages.securityCheck.detail.totalMileage')
                        }}：{{ formatDistance(item.distance) }}km
                      </div>
                      <a-divider type="vertical" class="h-[14px]! bg-[#D9D9D9]! m-x-[10px]" />
                      <div class=" flex justify-center">
                        {{ t('pages.securityCheck.detail.avgSpeed') }}：{{ item.speed }}km/h
                      </div>
                    </div>
                  </div>
                  <template #loading>
                    <a-spin />
                  </template>
                </ScrollPagination>
              </div>
              <div v-else class="list">
                <a-empty />
              </div>
            </div>
          </div>
        </div>
        <div class="bottom-section">
          <div class="section-title">
            <svg-icon icon-class="appearance" style="margin-right: 8px" />
            <span>设备电压记录列表</span>
          </div>
          <div v-if="voltageRecordList.length > 0 || voltageRecordLoading" class="list-container">
            <ScrollPagination
              height="100%" :immediate="true" :loading="voltageRecordLoading"
              :finished="voltageRecordFinished" @load="getVoltageRecords"
            >
              <div v-for="(item, index) in voltageRecordList" :key="index" class="voltage-record-item">
                <div class="item-header">
                  <span>时间：{{ item.ts || '--' }}</span>
                </div>
                <div class="item-body">
                  <div class="stats-row">
                    <div class="stat-box">
                      <span class="val">{{ item.soc || 0 }}%</span>
                      <div class="lbl">
                        <span>{{ t('pages.securityCheck.detail.soc') }}</span>
                      </div>
                    </div>
                    <div class="stat-box">
                      <span class="val">{{ Number(item.totalVoltage || 0).toFixed(2) }}V</span>
                      <div class="lbl">
                        <svg-icon icon-class="voltage" class="svg" />
                        <span>{{ t('pages.securityCheck.detail.totalVoltage') }}</span>
                      </div>
                    </div>
                    <div class="stat-box">
                      <span class="val">{{ item.maxProbeTemperature || 0 }}°C</span>
                      <div class="lbl">
                        <svg-icon icon-class="temperature" class="svg" />
                        <span>{{ t('pages.securityCheck.detail.temperature') }}</span>
                      </div>
                    </div>
                    <div class="stat-box">
                      <span class="val">{{ item.totalCurrent || 0 }}A</span>
                      <div class="lbl">
                        <svg-icon icon-class="current" class="svg" />
                        <span>{{ t('pages.securityCheck.detail.current') }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="cells-row">
                    <div class="cells-title">
                      {{ t('pages.securityCheck.detail.singleVoltage') }}
                    </div>
                    <div v-if="item.singleCellVoltage && item.singleCellVoltage.length" class="cells-list">
                      <div v-for="(v, i) in item.singleCellVoltage" :key="i" class="cell-box">
                        <div class="battery-icon">
                          <div class="battery">
                            {{ i + 1 }}
                          </div>
                        </div>
                        <div class="v">
                          {{ v }}V
                        </div>
                      </div>
                    </div>
                    <div v-else class="cells-empty">
                      暂无单体电芯电压数据
                    </div>
                  </div>
                </div>
              </div>
              <template #loading>
                <a-spin />
              </template>
              <template #finished>
                {{ t('pages.common.noMore') }}
              </template>
            </ScrollPagination>
          </div>
          <div v-else class="list-container">
            <a-empty class="m-t-[50px]" />
          </div>
        </div>
      </div>
    </div>
  </page-container>
</template>

<style scoped>
:deep(.ant-timeline-item) {
  padding-bottom: 8px !important;
}

.system-crud-wrapper :deep(.ant-form-item) {
  margin: 0;
}

.page-container {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.page-container .top-section {
  display: flex;
  width: 100%;
  height: calc(100vh - 126px);
  margin-bottom: 16px;
}

.page-container .top-section .leftContainer {
  width: 28%;
  min-width: 340px;
  margin: 0 10px 16px 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-container .top-section .leftContainer .basicInformation {
  width: 100%;
  height: 62%;
  background: white;
  border-radius: 8px;
  margin-bottom: 16px;
  padding: clamp(16px, 2vw, 24px) clamp(16px, 2vw, 20px);
  display: flex;
  flex-direction: column;
}

.page-container .top-section .leftContainer .basicInformation .chartsBox {
  height: clamp(80px, 10vh, 90px);
  width: 100%;
  display: flex;
  margin-bottom: clamp(16px, 2vh, 22px);
}

.page-container .top-section .leftContainer .basicInformation .chartsBox .chart {
  width: clamp(80px, 10vh, 90px);
  height: 100%;
  margin-right: 16px;
}

.page-container .top-section .leftContainer .basicInformation .chartsBox .deviceInfo {
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
}

.page-container .top-section .leftContainer .basicInformation .chartsBox .deviceInfo .deviceTitle {
  font-weight: 600;
  font-size: clamp(16px, 1vw, 22px);
  color: #1A1A1A;
  text-align: left;
  font-style: normal;
  text-transform: none;
}

.page-container .top-section .leftContainer .basicInformation .batteryInformation {
  width: 100%;
  height: clamp(80px, 10vh, 98px);
  border-radius: 8px;
  background: #F8F9FD;
  display: flex;
  justify-content: space-between;
  margin-bottom: clamp(24px, 3vh, 32px);
}

.page-container .top-section .leftContainer .basicInformation .batteryInformation>div {
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

.page-container .top-section .leftContainer .basicInformation .batteryInformation .tipBox {
  font-size: clamp(14px, 1vw, 16px);
  font-weight: normal;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-container .top-section .leftContainer .basicInformation .batteryInformation .tipBox .svg {
  margin-right: 6px;
}

.page-container .top-section .leftContainer .basicInformation .listOfVoltages {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.page-container .top-section .leftContainer .basicInformation .listOfVoltages .title {
  font-weight: 600;
  font-size: clamp(14px, 1vw, 16px);
  color: #1A1A1A;
  line-height: 19px;
  text-align: left;
  margin-bottom: clamp(16px, 2vh, 20px);
}

.page-container .top-section .leftContainer .basicInformation .listOfVoltages .list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(42px, 1fr));
  grid-gap: clamp(16px, 2vw, 24px);
  flex: 1;
  overflow-y: auto;
}

.page-container .top-section .leftContainer .basicInformation .listOfVoltages .list .item {
  width: clamp(36px, 3vw, 42px);
  height: clamp(36px, 3vw, 42px);
  margin-bottom: clamp(6px, 0.8vh, 8px);
  text-align: center;
  line-height: clamp(36px, 3vw, 42px);
  background-image: url("~/assets/images/battery.png");
  background-size: 100%;
  background-repeat: no-repeat;
}

.page-container .top-section .leftContainer .basicInformation .listOfVoltages .list .item .battery {
  font-size: 12px;
  color: #168AFF;
}

.page-container .top-section .leftContainer .warningMessages {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  min-height: 0;
}

.page-container .top-section .leftContainer .warningMessages .warningTitle {
  flex: none;
  font-size: clamp(14px, 1vw, 16px);
  padding: clamp(8px, 1vh, 10px) clamp(10px, 1vw, 12px);
  background: #FFF8F8;
  font-weight: 600;
  color: #1A1A1A;
  display: flex;
  align-items: center;
}

.page-container .top-section .leftContainer .warningMessages .warningList {
  overflow-y: auto;
  padding: 0 12px;
}

.page-container .top-section .leftContainer .warningMessages .warningList .warningItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 16px;
  font-size: clamp(12px, 0.9vw, 14px);
  height: clamp(40px, 5vh, 44px);
  color: #1A1A1A;
  border-bottom: 1px solid #DDDDDD;
}

.page-container .top-section .leftContainer .warningMessages .warningList .warningItem .iconSerious {
  width: clamp(10px, 0.9vw, 12px);
  height: clamp(10px, 0.9vw, 12px);
  background: linear-gradient(180deg, #FFD2D1 0%, #F32726 38%, #A40100 100%);
  border-radius: 100px;
  margin-right: 8px;
}

.page-container .top-section .leftContainer .warningMessages .warningList .warningItem .iconWarning {
  width: clamp(10px, 0.9vw, 12px);
  height: clamp(10px, 0.9vw, 12px);
  background: linear-gradient(180deg, #FFF8C0 0%, #FFC800 38%, #FFAF01 100%);
  border-radius: 100px;
  margin-right: 8px;
}

.page-container .top-section .leftContainer .warningMessages .warningList .warningItem:last-child {
  border-bottom: none;
}

.page-container .top-section .centerContainer {
  flex: 1;
  background: #fff;
  height: 100%;
  border-radius: 8px;
  padding: clamp(12px, 1.5vw, 16px) clamp(16px, 2vw, 20px);
  display: flex;
  flex-direction: column;
}

.page-container .top-section .centerContainer .mapTime {
  display: flex;
  align-items: center;
  font-weight: 500;
  font-size: clamp(11px, 0.8vw, 12px);
  color: #1A1A1A;
  margin-bottom: clamp(10px, 1vh, 12px);
}

.page-container .top-section .centerContainer .map {
  width: 100%;
  border-radius: 4px;
  height: clamp(350px, 48vh, 520px);
  margin-bottom: clamp(12px, 1.5vh, 16px);
}

.page-container .top-section .centerContainer .record {
  flex: 1;
  min-height: 0;
  width: 100%;
}

.page-container .top-section .centerContainer .record .recordItem {
  width: 100%;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #DDDDDD;
  padding: clamp(16px, 2vh, 20px) 0;
  font-weight: 500;
  font-size: clamp(12px, 0.9vw, 14px);
  color: #1A1A1A;
}

.page-container .top-section .centerContainer .record .recordItem .latitudeAndLongitude {
  display: flex;
  margin-left: clamp(20px, 2vw, 28px);
}

.page-container .top-section .centerContainer .record .recordItem .latitudeAndLongitude .icon {
  font-size: 18px;
  border-radius: 4px 0 0 4px;
  background: #575757;
  display: flex;
  padding: 4px;
}

.page-container .top-section .centerContainer .record .recordItem .latitudeAndLongitude .number {
  border-radius: 0 4px 4px 0;
  padding: 0 8px;
  color: white;
  background: #168AFF;
  line-height: 28px;
}

.page-container .top-section .centerContainer .record .recordItem .action {
  margin: 0 24px 0 8px;
  color: #168AFF;
  cursor: pointer;
}

.page-container .top-section .centerContainer .record .recordItem .mileage {
  display: flex;
  align-items: center;
  font-size: clamp(12px, 0.9vw, 14px);
  color: #1A1A1A;
}

.page-container .top-section .centerContainer .record .recordItem .mileage>div {
  margin-right: 16px;
  display: flex;
  align-items: center;
}

.page-container .top-section .centerContainer .record .recordItem .mileage .icon {
  font-size: 20px;
}

.page-container .top-section .rightContainer {
  width: 28%;
  min-width: 340px;
  margin-left: 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-container .top-section .rightContainer .drivingData {
  width: 100%;
  height: 62%;
  background: white;
  border-radius: 8px;
  margin-bottom: 16px;
  padding: clamp(12px, 1.5vw, 16px) clamp(16px, 2vw, 20px);
  display: flex;
  flex-direction: column;
}

.page-container .top-section .rightContainer .drivingData .time {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 500;
  font-size: 14px;
  color: #000000;
  margin-bottom: 16px;
}

.page-container .top-section .rightContainer .drivingData .listBox {
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow-y: scroll;
  overflow-x: hidden;
  font-size: 14px;
  color: #2F3A4A;
}

.page-container .top-section .rightContainer .drivingData .listBox .listItem {
  width: 100%;
  height: auto;
  margin-bottom: 15px;
  display: flex;
}

.page-container .top-section .rightContainer .drivingData .listBox .listItem .date {
  margin-right: 19px;
}

.page-container .top-section .rightContainer .drivingData .listBox .listItem .data>div {
  margin-bottom: 7px;
}

.page-container .top-section .rightContainer .trajectoryRecord {
  flex: 1;
  min-height: 0;
  width: 100%;
  background: white;
  border-radius: 8px;
  padding: clamp(12px, 1.5vw, 16px) clamp(16px, 2vw, 20px);
  display: flex;
  flex-direction: column;
}

.page-container .top-section .rightContainer .trajectoryRecord .top {
  font-weight: 600;
  font-size: 14px;
  color: #000000;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-container .top-section .rightContainer .trajectoryRecord .errorTip {
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

.page-container .top-section .rightContainer .trajectoryRecord .list {
  margin-top: 8px;
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.page-container .top-section .rightContainer .trajectoryRecord .list .listItem {
  width: 100%;
  background: #F8F9FD;
  border-radius: 8px 8px 8px 8px;
  box-sizing: border-box;
  padding: 12px 16px;
  margin-bottom: 8px;
}

.page-container .top-section .rightContainer .trajectoryRecord .list .listItem .top {
  width: 100%;
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  font-size: 14px;
  color: #2F3A4A;
}

.page-container .top-section .rightContainer .trajectoryRecord .list .listItem .centerBox {
  margin-top: 12px;
}

.page-container .top-section .rightContainer .trajectoryRecord .list .listItem .centerBox .text {
  font-weight: 500;
  font-size: 12px;
  color: #4A5A6D;
}

.page-container .top-section .rightContainer .trajectoryRecord .list .listItem .centerBox .startingPoint {
  width: 6px;
  height: 6px;
  background: #168AFF;
  border-radius: 100%;
}

.page-container .top-section .rightContainer .trajectoryRecord .list .listItem .centerBox .finishLine {
  width: 6px;
  height: 6px;
  background: #FF8400;
  border-radius: 100%;
}

.page-container .bottom-section {
  width: 100%;
  background: #fff;
  border-radius: 8px;
  padding: clamp(16px, 2vw, 24px);
  display: flex;
  flex-direction: column;
  height: 600px;
}

.page-container .bottom-section .section-title {
  font-size: clamp(14px, 1vw, 16px);
  font-weight: 600;
  color: #1A1A1A;
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.page-container .bottom-section .list-container {
  flex: 1;
  min-height: 0;
}

.page-container .bottom-section .list-container .voltage-record-item {
  background: #F8F9FD;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
}

.page-container .bottom-section .list-container .voltage-record-item .item-header {
  font-weight: 500;
  font-size: 14px;
  color: #1A1A1A;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.page-container .bottom-section .list-container .voltage-record-item .item-body {
  display: flex;
  align-items: flex-start;
}

.page-container .bottom-section .list-container .voltage-record-item .item-body .stats-row {
  display: flex;
  width: 40%;
  flex-wrap: wrap;
  gap: 16px;
  border-right: 1px solid #E5E6EB;
  padding-right: 24px;
  margin-right: 24px;
}

.page-container .bottom-section .list-container .voltage-record-item .item-body .stats-row .stat-box {
  width: calc(50% - 8px);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.page-container .bottom-section .list-container .voltage-record-item .item-body .stats-row .stat-box .val {
  font-weight: 600;
  font-size: 20px;
  color: #1A1A1A;
  margin-bottom: 4px;
}

.page-container .bottom-section .list-container .voltage-record-item .item-body .stats-row .stat-box .lbl {
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
}

.page-container .bottom-section .list-container .voltage-record-item .item-body .stats-row .stat-box .lbl .svg {
  margin-right: 4px;
}

.page-container .bottom-section .list-container .voltage-record-item .item-body .cells-row {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.page-container .bottom-section .list-container .voltage-record-item .item-body .cells-row .cells-title {
  font-weight: 500;
  font-size: 14px;
  color: #1A1A1A;
  margin-bottom: 12px;
}

.page-container .bottom-section .list-container .voltage-record-item .item-body .cells-row .cells-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.page-container .bottom-section .list-container .voltage-record-item .item-body .cells-row .cells-list .cell-box {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-container .bottom-section .list-container .voltage-record-item .item-body .cells-row .cells-list .cell-box .battery-icon {
  width: 36px;
  height: 36px;
  margin-bottom: 6px;
  text-align: center;
  line-height: 36px;
  background-image: url("~/assets/images/battery.png");
  background-size: 100%;
  background-repeat: no-repeat;
}

.page-container .bottom-section .list-container .voltage-record-item .item-body .cells-row .cells-list .cell-box .battery-icon .battery {
  font-size: 12px;
  color: #168AFF;
}

.page-container .bottom-section .list-container .voltage-record-item .item-body .cells-row .cells-list .cell-box .v {
  font-size: 14px;
  color: #1A1A1A;
}

.page-container .bottom-section .list-container .voltage-record-item .item-body .cells-row .cells-empty {
  font-size: 14px;
  color: #999;
  margin-top: 10px;
}

.chart {
  width: 300px;
  height: 300px;
}
</style>
