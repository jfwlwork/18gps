<script setup lang="ts">
import distributor from '~/pages/distributor/distributor.vue'

defineOptions({
  name: 'Analysis',
})
</script>

<template>
  <page-container>
    <a-row
      :gutter="24"
      :style="{ marginTop: '0px', minHeight: '80vh' }"
    >
      <a-col :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
        <Suspense :fallback="null">
          <distributor />
        </Suspense>
      </a-col>
    </a-row>
  </page-container>
</template>
