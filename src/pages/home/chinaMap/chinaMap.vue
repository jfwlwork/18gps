<script setup lang="ts">
import Map from '~/pages/home/chinaMap/map/Map.vue'

defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
})

onMounted(() => {
})
</script>

<template>
  <a-card
    :loading="loading"
    class="salesCard"
    :bordered="false"
    :style="{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '16px',
    }"
    :body-style="{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '0',
    }"
  >
    <template #title>
      <div class="header">
        <div class="title">
          省市分布图
        </div>
        <div class="divide" />
      </div>
    </template>
    <div :style="{ width: '100%', height: '100%', position: 'relative' }">
      <Map />
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
    background: linear-gradient( 180deg, #F5F4FF 0%, #FFFFFF 100%);
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
          background: linear-gradient( 315deg, #6455F5 0%, #8478FF 100%);
          border-radius: 4px 4px 4px 4px;
          width: 100%;
          margin-top: -10px;
        }
      }
    }
  }
}
</style>
