<script setup lang="ts">
interface SecurityRecord {
  id: string | number
  sysCreated: string
  lng: string | number
  lat: string | number
  speed: string | number
}

interface Props {
  dataSource: SecurityRecord[]
  itemHeight?: number
  containerHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  itemHeight: 80,
  containerHeight: 400,
})

const emit = defineEmits<{
  copyCoordinate: []
}>()

const transformY = ref<number>(0)
const transformStyle = computed<string>(() => {
  return `transform: translateY(${transformY.value}px)`
})

const scrollerContainerRef = ref<HTMLDivElement>()
const scrollerContainerRefHeight = computed(() => {
  return props.containerHeight
})

// 渲染视口的item数量
const itemCount = computed<number>(() => {
  return Math.ceil(scrollerContainerRefHeight.value / props.itemHeight) + 2
})

// 最顶端和低端元素在数组中的索引
const start = ref<number>(0)
const end = computed<number>(() => {
  return start.value + itemCount.value
})

const Data = ref<SecurityRecord[]>([])

// 用来撑开容器高度
const pillarHeight = computed(() => {
  if (Data.value?.length) {
    return props.itemHeight * Data.value.length
  }
  return 0
})

const renderData = computed(() => {
  const _start = Math.max(0, start.value)
  const _end = Math.min(end.value, Data.value.length)
  return Data.value?.slice(_start, _end) || []
})

function handleScroll(e: Event) {
  const scrollTop = (e.target as HTMLDivElement).scrollTop
  start.value = Math.floor(scrollTop / props.itemHeight)
  transformY.value = start.value * props.itemHeight
}

function copyCoordinate() {
  emit('copyCoordinate')
}

// 监听数据源变化
watch(() => props.dataSource, (newData) => {
  if (newData && newData.length > 0) {
    Data.value = newData
    // 重置滚动位置
    start.value = 0
    transformY.value = 0
    if (scrollerContainerRef.value) {
      scrollerContainerRef.value.scrollTop = 0
    }
  }
}, { immediate: true })

onMounted(() => {
  if (props.dataSource && props.dataSource.length > 0) {
    Data.value = props.dataSource
  }
})
</script>

<template>
  <div class="security-record-list" :style="{ height: `${containerHeight}px` }">
    <div ref="scrollerContainerRef" class="scroller-container scrollbar" @scroll="handleScroll">
      <div class="pillar" :style="{ height: `${pillarHeight}px` }" />
      <div class="list" :style="transformStyle">
        <div v-for="item in renderData" :key="item.id" class="recordItem" :style="{ height: `${itemHeight}px` }">
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
    </div>
  </div>
</template>

<style scoped lang="less">
.security-record-list {
  width: 100%;
  background-color: var(--bg-color);

  .scroller-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: auto;
    // 处理ios滚动卡顿
    -webkit-overflow-scrolling: touch;

    .pillar {
      position: absolute;
      left: 0;
      top: 0;
      right: 0;
      z-index: -1;
    }

    .list {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;

      .recordItem {
        box-sizing: border-box;
        display: flex;
        align-items: center;
        width: 100%;
        padding: clamp(16px, 2vh, 20px) 0;
        border-bottom: 1px solid #DDDDDD;
        font-weight: 500;
        font-size: clamp(12px, 0.9vw, 14px);
        color: #1A1A1A;

        .time {
          flex: 1;
          font-size: clamp(12px, 0.9vw, 14px);
          color: #1A1A1A;
        }

        .latitudeAndLongitude {
          display: flex;
          align-items: center;
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
            width: 160px;
          }
        }

        .action {
          cursor: pointer;
          color: #168AFF;
          font-size: clamp(12px, 0.9vw, 14px);
          margin: 0 24px 0 8px;

          &:hover {
            opacity: 0.8;
          }
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
            margin-right: 8px;
          }

          span {
            font-size: clamp(12px, 0.9vw, 14px);
            color: #1A1A1A;
          }
        }
      }
    }
  }
}

.scrollbar {
  &::-webkit-scrollbar {
    width: 5px;
    height: 10px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 5px;
    -webkit-box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
    background: rgba(190, 190, 190, 0.2);
  }

  &::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 5px rgba(227, 227, 227, 0.2);
    border-radius: 0;
    background: rgba(0, 0, 0, 0.1);
  }
}
</style>
