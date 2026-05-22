<script setup lang="ts">
// import { PlusOutlined } from '@ant-design/icons-vue'
import { Form } from 'ant-design-vue'
import CrudTableModal from './crud-table-modal.vue'
import MapContainer from './MapContainer.vue'
// import type { CrudTableModel } from '~@/api/list/crud-table'
import { getListApi, getNoticeTypeApi } from '~@/api/notice'
import selectTab from '~@/components/selectTab/index.vue'
import { useTableQuery } from '~/composables/table-query.ts'

const useForm = Form.useForm

// const message = useMessage()
const { t } = useI18nLocale()

// 位移报警开关，0开启，1关闭 / MOVE_ALARM("MOVE_ALARM", 0, "位移告警", "您的爱车产生位移"),
// 外电断开告警开关，0开启，1关闭 / EXTERNAL_POWER_ALARM("EXTERNAL_POWER_ALARM", 1, "拆除告警", "您爱车的定位设备被拆除"),
// 电子围栏告警开关，0开启，1关闭 / ELECTRONIC_FENCE_ALARM("ELECTRONIC_FENCE_ALARM", 2, "电子围栏告警", "您的爱车驶出设定的电子围栏区域"),
// 低电压告警开关，0开启，1关闭 / LOW_VOLTAGE_ALARM("LOW_VOLTAGE_ALARM", 3, "低电量告警", "您的爱车电量过低"),
// 14 N 高压报警  HIGH_VOLTAGE_ALARM("HIGH_VOLTAGE_ALARM", 4, "高电压告警", "您的爱车电压过高"),
// 导航栏
const selectedKeys = ref<string[]>(['MOVE_ALARM'])
const typesList = ref<Array<{
  title: string
  label: string
  key: string
  desc: string
  noticeType: string
}>>([])

const typesListLoading = ref(false)
async function getTypesList() {
  try {
    typesListLoading.value = true
    const excludeType = [
      'BLUETOOTH_DOOR',
      'BLUETOOTH_CAR',
    ]
    const res = await getNoticeTypeApi()
    if (res.code === 0 && res.data?.length) {
      res.data = res.data.filter((item: any) => !excludeType.includes(item.noticeType))
      res.data.forEach((item: any) => {
        item.title = item.desc
        item.label = item.desc
        item.key = item.noticeType
      })
      selectedKeys.value = [res.data[0]?.noticeType]
      typesList.value = res.data
      initQuery()
    }
    typesListLoading.value = false
  }
  catch (e) {
    console.log(e)
  }
}
getTypesList()

const columns = computed(() => [
  {
    title: t('pages.vehicleManagement.table.index'),
    dataIndex: 'index',
    customRender({ index }: { index: number }) {
      return ((state.pagination.current ?? 1) - 1) * (state.pagination.pageSize ?? 10) + index + 1
    },
    width: 100,
  },
  {
    title: t('pages.vehicleManagement.table.terminalNo'),
    dataIndex: 'terminalNo',
  },
  {
    title: t('pages.vehicleManagement.table.name'),
    dataIndex: 'name',
  },
  {
    title: t('pages.vehicleManagement.table.sysCreated'),
    dataIndex: 'sysCreated',
  },
  {
    title: t('pages.vehicleManagement.table.action'),
    dataIndex: 'action',
    width: 100,
  },
])

const { state, initQuery, resetQuery, query } = useTableQuery({
  queryApi: getListApi,
  queryOnMounted: false,
  queryParams: {
    terminalNo: undefined,
    type: selectedKeys.value[0],
  },
  afterQuery: (res) => {
    return res
  },
})

function searchFn() {
  state.pagination.current = 1
  query()
}

// 重置查询条件
// const { resetFields } = useForm(state.queryParams)
function restQuery() {
  state.queryParams.terminalNo = undefined
  initQuery()
}

const crudTableModal = ref<InstanceType<typeof CrudTableModal>>()

// 定位 轨迹
const showGcj02 = ref<boolean>(false)
const current_item = ref<any>({})
function toShowGcj02(item: any) {
  current_item.value = item
  showGcj02.value = true
}
</script>

<template>
  <page-container>
    <a-row :gutter="24">
      <a-col :span="4" style="padding-right: 0px;">
        <a-card
          :bordered="false"
          :title="t('pages.vehicleManagement.title')"
        >
          <div v-if="typesListLoading" class="w-full h-100px flex justify-center">
            <a-spin />
          </div>
          <select-tab
            v-model:selected-keys="selectedKeys" :items="typesList" @select="() => {
              state.queryParams.type = selectedKeys[0]
              query()
            }"
          />
        </a-card>
      </a-col>
      <a-col :span="20">
        <a-card mb-2>
          <a-form class="system-crud-wrapper" :label-col="{ span: 9 }" :model="state.queryParams">
            <a-row :gutter="[15, 0]">
              <a-col flex="340px">
                <a-form-item name="terminalNo" :label="t('pages.vehicleManagement.form.terminalNo.label')">
                  <a-input v-model:value="state.queryParams.terminalNo" :placeholder="t('pages.vehicleManagement.form.terminalNo.placeholder')" />
                </a-form-item>
              </a-col>
              <a-col flex="auto">
                <a-space flex justify-end w-full>
                  <a-button :loading="state.loading" type="primary" @click="searchFn">
                    {{ t('pages.vehicleManagement.form.search') }}
                  </a-button>
                  <a-button :loading="state.loading" @click="restQuery">
                    {{ t('pages.vehicleManagement.form.reset') }}
                  </a-button>
                </a-space>
              </a-col>
            </a-row>
          </a-form>
        </a-card>

        <a-card>
          <a-table
            row-key="id" :row-selection="undefined" :loading="state.loading" :columns="columns"
            :data-source="state.dataSource" :pagination="state.pagination"
          >
            <template #bodyCell="scope">
              <template v-if="scope?.column?.dataIndex === 'terminalNo'">
                <a @click="toShowGcj02(scope?.record as any)">{{ scope?.record?.terminalNo }}</a>
              </template>
              <template v-if="scope?.column?.dataIndex === 'action'">
                <div flex gap-2>
                  <a-button type="link" @click="toShowGcj02(scope?.record as any)">
                    {{ t('pages.common.view') }}
                  </a-button>
                </div>
              </template>
            </template>
          </a-table>
        </a-card>

        <CrudTableModal ref="crudTableModal" />

        <a-drawer
          v-model:open="showGcj02"
          class="custom-class"
          root-class-name="root-class-name"
          :title="current_item.terminalNo"
          placement="right"
          width="65%"
          :destroy-on-close="true"
        >
          <MapContainer :id="current_item.id" />
        </a-drawer>
      </a-col>
    </a-row>
  </page-container>
</template>

<style lang="scss" scoped>
.system-crud-wrapper{
  .ant-form-item{
    margin: 0;
  }
}
</style>

<style lang="scss">
.custom-class {
  .ant-drawer-body {
    height: 80%;
    padding: 0;
    overflow: hidden;
  }
}
</style>
