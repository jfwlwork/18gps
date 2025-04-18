<script lang="ts" setup>
import type { PropType } from 'vue'
import { defineProps, onMounted, ref } from 'vue'
import { Column } from '@antv/g2plot'
import { getDistributorListApi } from '~@/api/distributor'

defineProps({
  width: {
    type: String as PropType<string>,
    default: '100%',
  },
  height: {
    type: String as PropType<string>,
    default: 'calc(100vh - 78px)',
  },
})

const chartRef = ref<HTMLDivElement | null>(null)

onMounted(() => {
  getDistributorListApi().then((res) => {
    const data: any = []
    const annotations: any = res.data.map((item: any) => {
      return {
        type: 'text',
        position: [item.tag, item.num],
        content: `总数：${item.num}`,
        style: { textAlign: 'center', fontSize: 14, fill: 'rgba(0,0,0,0.85)' },
        offsetY: -14,
      }
    })
    res.data.forEach((item: any) => {
      if (item.num - item.numActive > 0) {
        data.push({
          tag: item.tag,
          value: item.num - item.numActive,
          type: '未激活',
        })
      }
      if (item.numActive > 0) {
        data.push({
          tag: item.tag,
          value: item.numActive,
          type: '已激活',
        })
      }
    })

    const plot = new Column('container', {
      data,
      isStack: true,
      xField: 'tag',
      yField: 'value',
      seriesField: 'type',
      legend: {
        offsetY: 10,
      },
      label: {
        // 可手动配置 label 数据标签位置
        position: 'middle', // 'top', 'bottom', 'middle'
        // 可配置附加的布局方法
        layout: [
          // 柱形图数据标签位置自动调整
          { type: 'interval-adjust-position' },
          // 数据标签防遮挡
          { type: 'interval-hide-overlap' },
          // 数据标签文颜色自动调整
          { type: 'adjust-color' },
        ],
      },
      // 使用 annotation （图形标注）来展示：总数的 label
      annotations,
      yAxis: {
        max: Math.max(...data.map((item: any) => item.value)) + 20, // 将最大值增加 20%
        tickLine: null, // 去掉 y 轴的标尺刻度线
        grid: null, // 去掉背景横线
      },
      color: ({ type }) => {
        if (type === '未激活') {
          return '#cacaca'
        }
        return '' // 使用默认颜色
      },
      xAxis: {
        label: {
          style: {
            fill: '#346d91', // 设置 xField 名称的颜色为粉色
          },
        },
        tickLine: null, // 去掉 x 轴的标尺刻度
      },
    })

    plot.render()
  })
})
</script>

<template>
  <div id="container" ref="chartRef" :style="{ width: '100%', height: '100%' }" />
</template>

<style scoped>
#container {
  width: 100%;
  height: 100%;
  color: #cacaca;
}
</style>
