<script lang="ts" setup>
import type { PropType, Ref } from 'vue'
import { onMounted, ref } from 'vue'
import axios from 'axios'
import { registerMap } from 'echarts'
import { ArrowLeftOutlined } from '@ant-design/icons-vue'
import { mapData } from './data'
import { useECharts } from '@/hooks/useECharts'

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
const { setOptions, getInstance } = useECharts(chartRef as Ref<HTMLDivElement>)

const showMapBack = ref(false)
const chinaMap = ref<any>(null)
function setChinaOptions() {
  setOptions({
    visualMap: [
      {
        min: 0,
        max: 1000,
        left: 'left',
        top: 'bottom',
        text: ['高', '低'],
        calculable: false,
        orient: 'horizontal',
        inRange: {
          color: ['#b5e3f8', '#006edd'],
          symbolSize: [30, 100],
        },
        outOfRange: {
          color: ['#b5e3f8'],
        },
      },
    ],
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(0, 0, 0, .6)',
      textStyle: {
        color: '#fff',
        fontSize: 12,
      },
    },
    series: [
      {
        name: '数量',
        type: 'map',
        map: 'china',
        label: {
          show: true,
          color: 'rgb(249, 249, 249)',
          fontSize: 10,
        },
        itemStyle: {
          areaColor: '#b5e3f8',
          borderColor: '#0DAAC1',
        },
        data: mapData,
      },
    ],
  })
  showMapBack.value = false
}
onMounted(async () => {
  const json = (await (await import('./china.json')).default) as any
  chinaMap.value = json
  registerMap('china', json)
  setChinaOptions()
  getInstance()?.on('click', (params) => {
    console.log(params)
    if (showMapBack.value) {
      return
    }
    const p = json.features.find((item: any) => item.properties.name === params.name)
    console.log(p)
    if (p.id) {
      axios.get(`/province/${p.id}.json`).then((res) => {
        console.log(res.data)
        registerMap(params.name, res.data)
        setOptions({
          visualMap: [
            {
              min: 0,
              max: 1000,
              left: 'left',
              top: 'bottom',
              text: ['高', '低'],
              calculable: false,
              orient: 'horizontal',
              inRange: {
                color: ['#b5e3f8', '#006edd'],
                symbolSize: [30, 100],
              },
              outOfRange: {
                color: ['#b5e3f8'],
                symbolSize: [30],
              },
            },
          ],
          tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(0, 0, 0, .6)',
            textStyle: {
              color: '#fff',
              fontSize: 12,
            },
          },
          series: [
            {
              name: '数量',
              type: 'map',
              map: params.name,
              label: {
                show: true,
                color: 'rgb(249, 249, 249)',
                fontSize: 10,
              },
              itemStyle: {
                areaColor: '#346d91',
                // areaColor: '#b5e3f8',
                borderColor: '#0DAAC1',
              },
              data: [],
            },
          ],
        })
        showMapBack.value = true
      })
    }
  })
})
</script>

<template>
  <div ref="chartRef" :style="{ width: '100%', height: '100%' }" />
  <a-button v-show="showMapBack" type="link" size="small" class="back-btn" @click="setChinaOptions">
    <template #icon>
      <ArrowLeftOutlined />
    </template>
    返回
  </a-button>
</template>

<style scoped>
.back-btn {
  position: absolute;
  right: 10px;
  top: 0px;
}
</style>
