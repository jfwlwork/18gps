<script setup lang="ts">
import * as icons from '@ant-design/icons-vue'
import { isFunction } from '@v-c/utils'
import type { VNodeChild } from 'vue'

const props = defineProps<{
  icon: string | ((...args: any[]) => VNodeChild)
}>()
const Comp = computed(() => {
  if (isFunction(props.icon)) {
    const node = props.icon()
    if (node)
      return node
  }
  else {
    if (typeof props.icon === 'string' && props.icon.includes('svg-')) {
      return props.icon.split('svg-')[1]
    }
    else {
      return (icons as any)[props.icon]
    }
  }
  return undefined
})
</script>

<template>
  <svg-icon v-if="typeof Comp === 'string'" :icon-class="Comp" />
  <component :is="Comp" v-else-if="icon" />
</template>
