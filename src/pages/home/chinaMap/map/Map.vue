<script lang="ts" setup>
import type { PropType, Ref } from 'vue'
import { onMounted, ref } from 'vue'
import axios from 'axios'
import { registerMap } from 'echarts'
import { ArrowLeftOutlined } from '@ant-design/icons-vue'
// import { mapData } from './data'
import { useECharts } from '@/hooks/useECharts'
import { getCityListApi, getProvinceListApi } from '~@/api/home'

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
const mapData = ref<any>([])
let maxNum = 0
async function setChinaOptions() {
  try {
    if (!mapData.value.length) {
      const res = await getProvinceListApi()
      if (res.code === 0 && res.data?.length) {
        maxNum = 0
        res.data.forEach((item: any) => {
          item.name = item.cate.replace(/省|市|回族|壮族|维吾尔|自治区|特别行政区/g, '')
          item.value = item.num
          maxNum = Math.max(maxNum, item.num)
        })
        mapData.value = res.data
      }
    }
    setOptions({
      visualMap: [
        {
          min: 0,
          max: maxNum,
          left: 36,
          bottom: 36,
          text: ['高', '低'],
          calculable: false,
          orient: 'horizontal',
          inRange: {
            color: ['#DEDFFC', '#4849F2'],
            symbolSize: [0, maxNum],
          },
          outOfRange: {
            color: ['#DEDFFC'],
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
            areaColor: '#DEDFFC',
            borderColor: '#fff',
          },
          data: mapData.value,
        },
      ],
    })
    showMapBack.value = false
  }
  catch (e) {
    console.log(e)
  }
}
onMounted(async () => {
  const json = (await (await import('./china.json')).default) as any
  chinaMap.value = json
  registerMap('china', json)
  await setChinaOptions()
  getInstance()?.on('click', (params) => {
    if (showMapBack.value) {
      return
    }
    const p = json.features.find((item: any) => item.properties.name === params.name)
    if (p.id) {
      axios.get(`./province/${p.id}.json`).then(async (p) => {
        registerMap(params.name, p.data)
        let res: any = { data: [] }
        if ((params.data as { cate?: string })?.cate) {
          res = await getCityListApi({
            province: (params.data as { cate?: string }).cate,
          })
        }
        let maxNum = 1
        res.data.forEach((item: any) => {
          item.name = item.cate
          item.value = item.num
          maxNum = Math.max(maxNum, item.num)
        })

        setOptions({
          visualMap: [
            {
              min: 0,
              max: maxNum,
              left: 36,
              bottom: 36,
              text: ['高', '低'],
              calculable: false,
              orient: 'horizontal',
              inRange: {
                color: ['#DEDFFC', '#4849F2'],
                symbolSize: [0, maxNum],
              },
              outOfRange: {
                color: ['#DEDFFC'],
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
                areaColor: '#DEDFFC',
                borderColor: '#fff',
              },
              data: res.data || [],
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
  right: 48px;
  top: 10vh;
  z-index: 10;
}
</style>
