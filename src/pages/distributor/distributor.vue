<script setup lang="ts">
import columnStacked from '~/pages/distributor/columnStacked.vue'

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
    title="出库入库分布图"
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
    <div :style="{ width: '100%', height: '100%', minHeight: '60vh', position: 'relative' }">
      <columnStacked />
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
