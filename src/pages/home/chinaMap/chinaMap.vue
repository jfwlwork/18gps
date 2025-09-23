<script setup lang="ts">
// import Map from '~/pages/home/chinaMap/map/Map.vue'
import DevicesMap from './map/devicesMap.vue';
import { getMapListApi } from '@/api/home';
import { ref, onMounted } from 'vue'

defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
})

const mapRef = ref()

// 提供给子组件的假数据（从外层传入）
// const mockPoints = ref([
//   { lnglat: [116.397428, 39.90923], name: '设备A', status: '在线', deviceCode: 'DEV-A', address: '北京市东城区', terminalNo: 'T-A-001' },
//   { lnglat: [121.473701, 31.230416], name: '设备B', status: '离线', deviceCode: 'DEV-B', address: '上海市黄浦区', terminalNo: 'T-B-002' },
//   { lnglat: [113.264385, 23.129112], name: '设备C', status: '在线', deviceCode: 'DEV-C', address: '广东省广州市', terminalNo: 'T-C-003' },
//   { lnglat: [114.057868, 22.543099], name: '设备D', status: '报警', deviceCode: 'DEV-D', address: '广东省深圳市', terminalNo: 'T-D-004' },
//   { lnglat: [104.066541, 30.572269], name: '设备E', status: '在线', deviceCode: 'DEV-E', address: '四川省成都市', terminalNo: 'T-E-005' },
// ])

const setMapData = async () => {
  const { code, data } = await getMapListApi()
  const mapData = data
  if (code === 0 && data?.length) {
    mapData.forEach((item: any) => {
      item.lnglat = item.gcj02.split(',').map(Number)
    })
    mapRef.value?.updatePoints?.(mapData)
  }
}

onMounted(() => {
  setMapData()
  // 手动调用，按你的使用方式进行
  // mapRef.value?.updatePoints?.(mockPoints.value)
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
