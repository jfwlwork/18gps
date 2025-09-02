<script setup lang="ts">
interface Props {
  /**
   * Container height. Number in px or string (e.g., '50vh').
   */
  height?: number | string
  /**
   * Start loading automatically when mounted if true
   */
  immediate?: boolean
  /**
   * Distance in px from bottom to trigger load when using scroll listener fallback
   */
  offset?: number
  /**
   * Whether a request is in progress (controlled by parent)
   */
  loading?: boolean
  /**
   * Whether all data has been loaded
   */
  finished?: boolean
  /**
   * Disable loading trigger
   */
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  height: 400,
  immediate: true,
  offset: 100,
  loading: false,
  finished: false,
  disabled: false,
})

const emit = defineEmits<{
  load: []
}>()

const containerRef = ref<HTMLDivElement>()
const sentinelRef = ref<HTMLDivElement>()
let observer: IntersectionObserver | null = null
// Prevent repeated emits while parent hasn't flipped loading yet
const hasEmittedSinceIdle = ref(false)
// Track whether user has scrolled since last observer attach
const userScrolledSinceAttach = ref(false)
// Allow one initial immediate load; subsequent loads require scroll
const didFirstLoad = ref(false)

function toPx(val: number | string): string {
  if (typeof val === 'number')
    return `${val}px`
  return val
}

function tryLoad() {
  if (props.disabled || props.loading || props.finished || hasEmittedSinceIdle.value)
    return
  // After the first load, require a user scroll to trigger next loads
  if (didFirstLoad.value && !userScrolledSinceAttach.value)
    return
  // Only when actually near bottom of scroll container
  if (!isNearBottom())
    return
  // Pause observing to avoid immediate re-trigger while parent turns on loading
  cleanupObserver()
  hasEmittedSinceIdle.value = true
  emit('load')
  didFirstLoad.value = true
  userScrolledSinceAttach.value = false
}

function setupObserver() {
  if (!containerRef.value || !sentinelRef.value)
    return
  cleanupObserver()
  observer = new IntersectionObserver((entries) => {
    const entry = entries[0]
    if (entry && entry.isIntersecting)
      tryLoad()
  }, {
    root: containerRef.value,
    rootMargin: '0px 0px 0px 0px',
    threshold: 0.1,
  })
  observer.observe(sentinelRef.value)
}

function cleanupObserver() {
  if (observer) {
    observer.disconnect()
    observer = null
  }
}

// Fallback for environments without IntersectionObserver
function onScrollFallback(e: Event) {
  if (props.disabled || props.loading || props.finished)
    return
  const target = e.target as HTMLDivElement
  const { scrollTop, clientHeight, scrollHeight } = target
  userScrolledSinceAttach.value = true
  if (scrollTop + clientHeight + props.offset >= scrollHeight)
    tryLoad()
}

function isNearBottom() {
  const el = containerRef.value
  if (!el)
    return false
  // If content not scrollable yet, do NOT auto-trigger repeatedly
  if (el.scrollHeight <= el.clientHeight)
    return false
  return el.scrollTop + el.clientHeight + Number(props.offset || 0) >= el.scrollHeight
}

onMounted(() => {
  const supportIO = typeof window !== 'undefined' && 'IntersectionObserver' in window
  if (supportIO)
    setupObserver()
  if (!supportIO && containerRef.value)
    containerRef.value.addEventListener('scroll', onScrollFallback, { passive: true })
  // Even when using IO, also listen to scroll to know user interaction
  if (containerRef.value)
    containerRef.value.addEventListener('scroll', () => { userScrolledSinceAttach.value = true }, { passive: true })

  if (props.immediate)
    queueMicrotask(tryLoad)
})

onBeforeUnmount(() => {
  cleanupObserver()
  if (containerRef.value)
    containerRef.value.removeEventListener('scroll', onScrollFallback)
  if (containerRef.value)
    containerRef.value.removeEventListener('scroll', () => { userScrolledSinceAttach.value = true })
})

// Re-arm observer when loading finishes; pause while loading
watch(() => props.loading, (isLoading) => {
  if (isLoading) {
    cleanupObserver()
  } else {
    hasEmittedSinceIdle.value = false
    userScrolledSinceAttach.value = false
    // Only reattach if not finished/disabled
    if (!props.finished && !props.disabled)
      setupObserver()
  }
})

// Stop observing when finished/disabled toggles; re-arm when conditions allow
watch([() => props.finished, () => props.disabled], ([isFinished, isDisabled]) => {
  if (isFinished || isDisabled) {
    cleanupObserver()
  } else if (!props.loading) {
    userScrolledSinceAttach.value = false
    setupObserver()
  }
})
</script>

<template>
  <div
    ref="containerRef"
    class="scroll-pagination-container scrollbar"
    :style="{ height: toPx(height) }"
  >
    <div class="scroll-pagination-content">
      <slot />
      <div ref="sentinelRef" class="scroll-pagination-sentinel" />
      <div v-if="loading" class="scroll-pagination-status">
        <slot name="loading">加载中...</slot>
      </div>
      <div v-else-if="finished" class="scroll-pagination-status">
        <slot name="finished">没有更多了</slot>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.scroll-pagination-container {
  position: relative;
  width: 100%;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.scroll-pagination-content {
  position: relative;
  min-height: 98%;
  height: 98%;
}

.scroll-pagination-sentinel {
  width: 100%;
  height: 1px;
}

.scroll-pagination-status {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color);
  padding: 12px 0;
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

