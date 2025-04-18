<script setup lang="ts">
import chinaMap from '~/pages/home/chinaMap/chinaMap.vue'
import ProportionSales from '~/pages/home/chinaMap/proportion-sales.vue'
import rank1 from '~/pages/home/chinaMap/rank1.vue'
import rank2 from '~/pages/home/chinaMap/rank2.vue'
import rank3 from '~/pages/home/chinaMap/rank3.vue'

defineOptions({
  name: 'Analysis',
})
</script>

<template>
  <page-container>
    <a-row
      :gutter="16"
      :style="{ marginTop: '0px', minHeight: 'calc(100vh - 138px)' }"
    >
      <a-col class="col1" :xl="6" :lg="6" :md="6" :sm="6" :xs="6">
        <rank1 class="rank" :span="12" style="border-radius: 16px;" />
        <rank2 class="rank" :span="12" style="border-radius: 16px; margin-top: 16px " />
      </a-col>
      <a-col :xl="12" :lg="12" :md="12" :sm="12" :xs="12" style="border-radius: 16px;">
        <Suspense :fallback="null">
          <chinaMap />
        </Suspense>
      </a-col>
      <a-col class="col1" :xl="6" :lg="6" :md="6" :sm="6" :xs="6">
        <rank3 class="rank3" :span="12" style="border-radius: 16px;" />
        <ProportionSales class="rank4" :span="12" style="border-radius: 16px; margin-top: 16px " />
      </a-col>
    </a-row>
  </page-container>
</template>

<style scoped lang="less">
.col1 {
  display: flex;
  flex-direction: column;
}
.rank {
  overflow: hidden;
  flex-basis: 0;
  flex-grow: 1;
}
.rank3 {
  overflow: hidden;
  flex-grow: 0;
  max-height: 34vh;
}
.rank4 {
  flex-grow: 1;
}
</style>
