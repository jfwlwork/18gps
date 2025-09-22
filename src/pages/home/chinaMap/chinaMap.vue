<script setup lang="ts">
// import Map from '~/pages/home/chinaMap/map/Map.vue'
import DevicesMap from './map/devicesMap.vue';
import { ref, onMounted } from 'vue'

defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
})

const mapRef = ref()

// 提供给子组件的假数据（从外层传入）
const mockPoints = ref([
  { lnglat: [116.397428, 39.90923], name: '设备A', status: '在线', deviceCode: 'DEV-A' },
  { lnglat: [121.473701, 31.230416], name: '设备B', status: '离线', deviceCode: 'DEV-B' },
  { lnglat: [113.264385, 23.129112], name: '设备C', status: '在线', deviceCode: 'DEV-C' },
  { lnglat: [114.057868, 22.543099], name: '设备D', status: '报警', deviceCode: 'DEV-D' },
  { lnglat: [104.066541, 30.572269], name: '设备E', status: '在线', deviceCode: 'DEV-E' },
  { lnglat: [117.200983, 39.084158], name: '设备F', status: '在线', deviceCode: 'DEV-F' },
  { lnglat: [106.551556, 29.563009], name: '设备G', status: '离线', deviceCode: 'DEV-G' },
  { lnglat: [118.796877, 32.060255], name: '设备H', status: '在线', deviceCode: 'DEV-H' },
  { lnglat: [120.15507, 30.274084], name: '设备I', status: '在线', deviceCode: 'DEV-I' },
  { lnglat: [108.940175, 34.341568], name: '设备J', status: '离线', deviceCode: 'DEV-J' },
])

onMounted(() => {
  // 手动调用，按你的使用方式进行
  mapRef.value?.updatePoints?.(mockPoints.value)
})
</script>

<template>
  <a-card :loading="loading" class="salesCard" :bordered="false" :style="{
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '16px',
  }" :body-style="{
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0',
  }">
    <template #title>
      <div class="header">
        <div class="title">
          设备分布图
        </div>
        <div class="divide" />
      </div>
    </template>
    <div class="mapBox">
      <!-- <Map /> -->
      <DevicesMap ref="mapRef" />
    </div>
  </a-card>
</template>

<style scoped lang="less">
.salesCardExtra {
  height: inherit;
}

.salesTypeRadio {
  position: absolute;
  right: 54px;
  bottom: 12px;
}

.salesCard {
  :deep(.ant-card-head) {
    position: relative;
  }
}

.salesCard {
  :deep(.ant-card-head) {
    width: 100%;
    background: linear-gradient(180deg, #F5F4FF 0%, #FFFFFF 100%);
    border: none;
    height: 9vh !important;
    border-radius: 16px;
    padding-top: 3vh;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;

    .ant-card-head-title {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;

      .header {
        width: 106px;
        font-size: 24px;
        text-align: center;

        .title {
          font-family: PingFang SC, PingFang SC;
          font-weight: 500;
          font-size: 20px;
          text-align: center;
        }

        .divide {
          height: 8px;
          background: linear-gradient(315deg, #6455F5 0%, #8478FF 100%);
          border-radius: 4px 4px 4px 4px;
          width: 100%;
          margin-top: -10px;
        }
      }
    }
  }
}

.mapBox {
  width: 100%;
  height: calc(100% - 9vh);
  position: relative;
  padding: 16px 16px 0 16px;
}
</style>
