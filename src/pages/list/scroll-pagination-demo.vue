<script setup lang="ts">
import ScrollPagination from '~/components/scroll-pagination/index.vue'

interface Item {
  id: number
  text: string
}

const items = ref<Item[]>([])
const page = ref<number>(1)
const pageSize = 20
const loading = ref<boolean>(false)
const finished = ref<boolean>(false)

function mockFetch(pageNo: number, size: number) {
  return new Promise<Item[]>((resolve) => {
    setTimeout(() => {
      const start = (pageNo - 1) * size
      const end = start + size
      // Simulate total 95 items
      const total = 95
      const data: Item[] = []
      for (let i = start; i < Math.min(end, total); i++) {
        data.push({ id: i + 1, text: `Item #${i + 1}` })
      }
      resolve(data)
    }, 500)
  })
}

async function onLoad() {
  if (loading.value || finished.value)
    return
  loading.value = true
  const data = await mockFetch(page.value, pageSize)
  items.value.push(...data)
  if (data.length < pageSize)
    finished.value = true
  else
    page.value += 1
  loading.value = false
}
</script>

<template>
  <div style="padding: 16px">
    <h3>滚动分页使用示例</h3>
    <ScrollPagination
      :height="400"
      :loading="loading"
      :finished="finished"
      @load="onLoad"
    >
      <div
        v-for="item in items"
        :key="item.id"
        style="padding: 12px 16px; border-bottom: 1px solid #eee; background: var(--bg-color)"
      >
        {{ item.text }}
      </div>
      <template #loading>
        加载中...
      </template>
      <template #finished>
        没有更多了
      </template>
    </ScrollPagination>
  </div>
</template>

<style scoped>
h3 { margin: 8px 0 12px; }
</style>
