<script setup lang="ts">
// import { PlusOutlined } from '@ant-design/icons-vue'
import { Form } from 'ant-design-vue'
import CrudTableModal from './crud-table-modal.vue'
import MapContainer from './MapContainer.vue'
// import type { CrudTableModel } from '~@/api/list/crud-table'
import { getListApi, getNoticeTypeApi } from '~@/api/notice'
import type { noticeListModel } from '~@/api/notice'
import selectTab from '~@/components/selectTab/index.vue'
const useForm = Form.useForm

// const message = useMessage()

// 位移报警开关，0开启，1关闭 / MOVE_ALARM("MOVE_ALARM", 0, "位移告警", "您的爱车产生位移"),
// 外电断开告警开关，0开启，1关闭 / EXTERNAL_POWER_ALARM("EXTERNAL_POWER_ALARM", 1, "拆除告警", "您爱车的定位设备被拆除"),
// 电子围栏告警开关，0开启，1关闭 / ELECTRONIC_FENCE_ALARM("ELECTRONIC_FENCE_ALARM", 2, "电子围栏告警", "您的爱车驶出设定的电子围栏区域"),
// 低电压告警开关，0开启，1关闭 / LOW_VOLTAGE_ALARM("LOW_VOLTAGE_ALARM", 3, "低电量告警", "您的爱车电量过低"),
// 14 N 高压报警  HIGH_VOLTAGE_ALARM("HIGH_VOLTAGE_ALARM", 4, "高电压告警", "您的爱车电压过高"),
// 导航栏
const selectedKeys = ref(['MOVE_ALARM'])
const typesList = ref([])
async function getTypesList() {
  try {
    const excludeType = [
        'BLUETOOTH_DOOR',
        'BLUETOOTH_CAR',
    ]
    const res = await getNoticeTypeApi();
    if (res.code === 0 && res.data?.length) {
      res.data = res.data.filter((item: any) => !excludeType.includes(item.noticeType))
      res.data.forEach((item: any) => {
        item.title = item.desc
        item.label = item.desc
        item.key = item.noticeType
      })
      selectedKeys.value[0] = res.data[0]?.noticeType
      typesList.value = res.data
      initQuery()
    }
  }
  catch (e) {
    console.log(e)
  }
}
getTypesList()

const columns = shallowRef([
  {
    title: '序号',
    dataIndex: 'index',
    customRender({ index }: { index: number }) {
      return index + 1
    },
    width: 100,
  },
  {
    title: '设备号(IMEI)',
    dataIndex: 'terminalNo',
  },
  {
    title: '名称',
    dataIndex: 'name',
  },
  {
    title: '信息时间',
    dataIndex: 'sysCreated',
  },
  // {
  //   title: '定位时间',
  //   dataIndex: 'remark1',
  // },
  // {
  //   title: '静止时间',
  //   dataIndex: 'remark1',
  // },
  {
    title: '操作',
    dataIndex: 'action',
    width: 100,
  },
])

const state = reactive({
  queryParams: {
    terminalNo: undefined,
  },
  loading: false,
  dataSource: [] as noticeListModel[],
})

async function initQuery() {
  if (state.loading)
    return
  state.loading = true
  try {
    const { data } = await getListApi({
      type: selectedKeys.value[0],
      terminalNo: state.queryParams.terminalNo,
    })
    if (data) {
      state.dataSource = data || []
    }
  }
  catch (e) {
    throw new Error(`Query Failed: ${e}`)
  }
  finally {
    state.loading = false
  }
}

// 重置查询条件
const { resetFields } = useForm(state.queryParams)
function restQuery() {
  resetFields()
  initQuery()
}

const crudTableModal = ref<InstanceType<typeof CrudTableModal>>()

// function handleAdd() {
//   crudTableModal.value?.open()
// }

// function handleEdit(record: CrudTableModel) {
//   crudTableModal.value?.open(record)
// }

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
          title="风控管理"
        >
          <a-menu
            v-model:selectedKeys="selectedKeys"
            style="width: 100%;border-right: 0;"
            mode="inline"
            :items="typesList"
            @select="initQuery"
          />
<!--          <select-tab v-model:selectedKeys="selectedKeys" :items="typesList" @select="initQuery"></select-tab>-->
        </a-card>
      </a-col>
      <!-- right-content -->
      <a-col :span="20">
        <a-card mb-2>
          <a-form class="system-crud-wrapper" :label-col="{ span: 7 }" :model="state.queryParams">
            <a-row :gutter="[15, 0]">
              <!-- <a-col flex="500px">
                <a-form-item
                  name="name" label="距离时长" :label-col="{ style: {
                    width: '80px',
                  } }"
                >
                  <a-radio-group v-model:value="state.queryParams.name" size="small">
                    <a-radio-button value="a">
                      一个小时以上
                    </a-radio-button>
                    <a-radio-button value="b">
                      三个小时以上
                    </a-radio-button>
                    <a-radio-button value="c">
                      一天以上
                    </a-radio-button>
                    <a-radio-button value="d">
                      三天以上
                    </a-radio-button>
                  </a-radio-group>
                </a-form-item>
              </a-col> -->
              <a-col flex="340px">
                <a-form-item name="terminalNo" label="设备号(IMEI)">
                  <a-input v-model:value="state.queryParams.terminalNo" placeholder="请输入设备号(IMEI)" />
                </a-form-item>
              </a-col>
              <a-col flex="auto">
                <a-space flex justify-end w-full>
                  <a-button :loading="state.loading" type="primary" @click="initQuery">
                    查询
                  </a-button>
                  <a-button :loading="state.loading" @click="restQuery">
                    重置
                  </a-button>
                </a-space>
              </a-col>
            </a-row>
          </a-form>
        </a-card>

        <a-card>
          <!-- <template #title>
            <a-space size="middle">
              <a-button type="default" :disabled="true">
                批量删除
              </a-button>
            </a-space>
          </template> -->
          <!-- <template #extra>
            <a-space size="middle">
              <a-button type="primary" @click="handleAdd">
                <template #icon>
                  <PlusOutlined />
                </template>
                导入
              </a-button>
            </a-space>
          </template> -->
          <a-table
            row-key="id" :row-selection="undefined" :loading="state.loading" :columns="columns"
            :data-source="state.dataSource" :pagination="false"
          >
            <template #bodyCell="scope">
              <template v-if="scope?.column?.dataIndex === 'terminalNo'">
                <a @click="toShowGcj02(scope?.record as any)">{{ scope?.record?.terminalNo }}</a>
              </template>
              <template v-if="scope?.column?.dataIndex === 'action'">
                <div flex gap-2>
                  <!-- <a-button type="link" @click="handleEdit(scope?.record as CrudTableModel)">
                    编辑
                  </a-button> -->
                  <a-button type="link" @click="toShowGcj02(scope?.record as any)">
                    查看
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
