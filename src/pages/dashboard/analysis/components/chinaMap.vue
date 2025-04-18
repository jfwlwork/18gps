<script setup lang="ts">
// import { Map } from './map/Map.vue'
import Map from '~/pages/dashboard/analysis/components/map/Map.vue'

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
    title="省市分布图"
    :style="{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }"
    :body-style="{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    }"
  >
    <div :style="{ width: '100%', height: '100%', minHeight: '40vh', position: 'relative' }">
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
</style>
