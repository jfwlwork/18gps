<script setup>
import { computed } from 'vue'

const props = defineProps({
  iconClass: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: '',
  },
})

const iconName = computed(() => `#icon-${props.iconClass || props.name}`)
const svgClass = computed(() => {
  if (props.iconClass || props.name) {
    return `svg-icon icon-${props.iconClass || props.name}`
  }
  return 'svg-icon'
})
</script>

<template>
  <svg :class="svgClass" v-bind="$attrs" :style="{ color }">
    <use :xlink:href="iconName" />
  </svg>
</template>

<style lang="scss">
.svg-icon {
  width: 1em;
  height: 1em;
  fill: currentColor;
  vertical-align: middle;
}
</style>
