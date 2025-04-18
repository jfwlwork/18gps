<script setup lang="ts">
import { Pie } from '@antv/g2plot'
import { getProvinceListApi } from '~@/api/home'

defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
})

const salesType = ref('all')
const pieContainer1 = ref()

const pies = shallowRef<Pie[]>([])

function renderPie(container: any, data: any) {
  data = data.sort((a: any, b: any) => b.num - a.num)
  const totalNum = data.reduce((total: any, item: any) => total + item.num, 0)
  const pie = new Pie(container, {
    // appendPadding: 10,
    // width: 200,
    // padding: [-70, 0, 0, 0],
    data,
    color: ['#965EE3', '#399FFE', '#35CACA', '#4DCA72', '#F9D236', '#F1627A', '#025DF4', '#DB6BCF', '#2498D1', '#BBBDE6', '#4045B2', '#21A97A', '#FF745A', '#007E99', '#FFA8A8', '#2391FF', '#FFC328', '#A0DC2C', '#946DFF', '#626681', '#EB4185', '#CD8150', '#36BCCB', '#327039', '#803488', '#83BC99'],
    angleField: 'y',
    colorField: 'x',
    radius: 0.8,
    innerRadius: 0.8,
    label: false,
    // label: {
    //   type: 'spider',
    //   formatter: (item) => {
    //     return `${item.x}: ${item.y.toLocaleString()}`
    //   },
    // },
    legend: {
      layout: 'vertical',
      position: 'bottom',
      // itemWidth: 260,
      itemSpacing: 0,
      // maxRow: 1,
      offsetX: 16,
      // offsetY: -20,
      itemHeight: 13,
      flipPage: true,
      itemName: {
        formatter: (text) => {
          const items = data.filter((d: any) => d.cate === text)
          return items.length ? `${text}  ${items[0].num}` : '-'
        },
        style: {
          opacity: 1,
        },
      },
      itemValue: {
        alignRight: true,
        formatter: (text) => {
          const items = data.filter((d: any) => d.cate === text)
          return items.length ? `|   ${(items[0].num * 100 / totalNum).toFixed(1)}%` : '-'
        },
      },
    },
    interactions: [{ type: 'element-selected' }, { type: 'element-active' }],
    statistic: {
      title: {
        content: '总数量',
      },
    },
  })
  pie.render()
  pies.value.push(pie)
}

// 获取省份列表
const provinceList = ref([])
async function getList() {
  try {
    const res = await getProvinceListApi()
    if (res.code === 0 && res.data?.length) {
      res.data.forEach((item: any) => {
        item.x = item.cate
        item.y = item.num
      })
      provinceList.value = res.data
      renderPie(pieContainer1.value, provinceList.value)
    }
  }
  catch (e) {
    console.log(e)
  }
}
getList()

onMounted(() => {
})

onUnmounted(() => {
  pies.value.forEach((pie) => {
    pie?.destroy?.()
  })
  pies.value = []
})
</script>

<template>
  <a-card
    :loading="loading"
    class="salesCard"
    :bordered="false"
    title=""
    :style="{
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
    <div :style="{ width: '100%' }">
      <div v-show="salesType === 'all'" ref="pieContainer1" class="xxxx" style="height: 100%;" />
    </div>
  </a-card>
</template>

<style scoped lang="less">
.salesCard {
  background: linear-gradient( 180deg, #EEF8FF 0%, #FFFFFF 20%);
  :deep(.ant-card-head) {
    position: relative;
  }
}
</style>
