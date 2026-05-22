<script setup lang="ts">
import { ExclamationCircleOutlined, ExportOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons-vue'
import type { TreeProps } from 'ant-design-vue'
import { createVNode } from 'vue'
import { Modal } from 'ant-design-vue'
import Edit from './edit.vue'
import TagEdit from './tagEdit.vue'
// import type { CrudTableModel } from '~@/api/list/crud-table'
// import { deleteApi } from '~@/api/list/crud-table'
import { exportClientTable, getListApi, poweroffApi, poweronApi, tagDelApi, taglistApi } from '~@/api/myUsers'
import { useTableQuery } from '~@/composables/table-query'
import ScanAddDevice from '~/pages/company/scanAddDevice.vue'

const message = useMessage()
const { t } = useI18nLocale()

// 标签列表
const selectedTagIds = ref<string[] | number[]>([])
const tagList = ref<TreeProps['treeData']>([])
async function getTagList() {
  try {
    const res = await taglistApi()
    if (res.code === 0 && res.data?.length) {
      res.data.forEach((item: any) => {
        item.title = item.tag
        item.key = item.id
      })
      tagList.value = res.data
    }
  }
  catch (e) {
    console.log(e)
  }
}
getTagList()

const { state, initQuery, resetQuery, query } = useTableQuery({
  queryApi: getListApi,
  queryParams: {
    terminalNo: undefined,
    mngName: undefined,
    controlNo: undefined,
    tagId: undefined,
    active: 2,
  },
  afterQuery: (res) => {
    return res
  },
})

function resetList() {
  selectedTagIds.value = []
  resetQuery()
}

const columns = computed(() => [
  {
    title: t('pages.myUsers.table.index'),
    dataIndex: 'index',
    customRender({ index }: { index: number }) {
      return ((state.pagination.current ?? 1) - 1) * (state.pagination.pageSize ?? 10) + index + 1
    },
    width: 100,
    fixed: 'left' as const,
  },
  {
    title: t('pages.myUsers.table.terminalNo'),
    dataIndex: 'terminalNo',
    fixed: 'left' as const,
  },
  {
    title: t('pages.myUsers.table.name'),
    dataIndex: 'name',
  },
  {
    title: t('pages.myUsers.table.tag'),
    dataIndex: 'tag',
  },
  {
    title: t('pages.myUsers.table.customerPhone'),
    dataIndex: 'customerPhone',
  },
  {
    title: t('pages.myUsers.table.vin'),
    dataIndex: 'vin',
  },
  {
    title: t('pages.myUsers.table.controlNo'),
    dataIndex: 'controlNo',
  },
  {
    title: t('pages.myUsers.table.vehicleName'),
    dataIndex: 'vehicleName',
  },
  // {
  //   title: t('pages.myUsers.table.regDate'),
  //   dataIndex: 'regDate',
  // },
  {
    title: t('pages.myUsers.table.bindDate'),
    dataIndex: 'bindDate',
  },
  {
    title: t('pages.myUsers.table.action'),
    dataIndex: 'action',
    fixed: 'right' as const,
    width: 100,
  },
])

// 编辑
const editItemModalRef = ref<InstanceType<typeof Edit>>()
function handleEdit(record: any) {
  editItemModalRef.value?.open(record)
}

// 标签导航树
const showLine = ref<boolean>(false)
const showIcon = ref<boolean>(true)
// const treeData = ref<TreeProps['treeData']>([
//   {
//     title: '国内用户',
//     key: '0-0',
//     children: [
//       {
//         title: '车悟空',
//         key: '0-0-0',
//         children: [
//           { title: '用户1', key: '0-0-0-0' },
//           // {
//           //   key: '0-0-0-1',
//           // },
//           { title: '用户2', key: '0-0-0-2' },
//         ],
//       },
//       {
//         title: '星云车管家',
//         key: '0-0-1',
//         children: [{ title: '用户4', key: '0-0-1-0' }],
//       },
//       {
//         title: '风行车行',
//         key: '0-0-2',
//         children: [
//           { title: '用户5', key: '0-0-2-0' },
//           {
//             title: '用户6',
//             key: '0-0-2-1',
//           },
//         ],
//       },
//     ],
//   },
//   {
//     title: '国际用户',
//     key: '0-1',
//     children: [
//       {
//         title: '川普车行',
//         key: '0-1-0',
//         children: [
//           { title: '用户7', key: '0-1-0-0' },
//           { title: '用户8', key: '0-1-0-1' },
//         ],
//       },
//     ],
//   },
// ])

const onSelect: TreeProps['onSelect'] = (selectedKeys, info) => {
  console.log('selected', selectedKeys, info)
  state.queryParams.tagId = selectedKeys[0]
  initQuery()
}

// 标签-添加/修改/删除
const tagEditModalRef = ref<InstanceType<typeof TagEdit>>()
function handleTagAdd() {
  tagEditModalRef.value?.open()
}
function handleTagEdit(item: any) {
  tagEditModalRef.value?.open(item)
}

async function deleteTag(id: any) {
  try {
    const res = await tagDelApi({ id })
    if (res.code === 200)
      message.success(t('pages.common.deleteSuccess'))
    await getTagList()
    await query()
  }
  catch (e) {
    console.log(e)
  }
}
async function handleDeleteTag(id: any) {
  Modal.confirm({
    title: t('pages.myUsers.tag.confirmDelete'),
    icon: createVNode(ExclamationCircleOutlined),
    // content: 'Some descriptions',
    okText: t('pages.common.delete'),
    okType: 'danger',
    cancelText: t('pages.common.cancel'),
    onOk() {
      deleteTag(id)
    },
    onCancel() {
      console.log('Cancel')
    },
  })
}

function onContextMenuClick(treeKey: string, menuKey: string | number, title: string) {
  switch (menuKey) {
    case '1':
      handleTagEdit({ id: treeKey, tag: title })
      break
    case '2':
      handleDeleteTag(treeKey)
      break
  }
}

const btn_loading1 = ref(false)
const btn_loading2 = ref(false)
async function powerOpt(bol: boolean) {
  try {
    let res = null
    if (bol) {
      btn_loading1.value = true
      res = await poweronApi({
        terminalNoList: state.rowSelections.selectedRowKeys.join(','),
      })
    }
    else {
      btn_loading2.value = true
      res = await poweroffApi({
        terminalNoList: state.rowSelections.selectedRowKeys.join(','),
      })
    }
    if (res && res.code === 0) {
      message.success(t('pages.common.success'))
      state.rowSelections.selectedRowKeys = []
    }
    btn_loading1.value = false
    btn_loading2.value = false
  }
  catch (errorInfo) {
    console.log('Form Validate Failed:', errorInfo)
  }
}

const scanAddModal = ref(false)

function handleExport() {
  Modal.confirm({
    title: '确认导出全部数据吗?',
    icon: createVNode(ExclamationCircleOutlined),
    content: '导出为Excel',
    okText: '确定',
    cancelText: '取消',
    async onOk() {
      const parasm: any = { ...state.queryParams, terminalNos: state.queryParams.terminalNo }
      delete parasm.terminalNo
      try {
        const blob: Blob = await exportClientTable(parasm) as unknown as Blob
        if (!blob) {
          message.error('导出失败')
          return
        }
        if ((blob as any).type && String((blob as any).type).includes('application/json')) {
          const text = await (blob as Blob).text()
          try {
            const err = JSON.parse(text)
            message.error(err.msg || '导出失败')
          }
          catch {
            message.error('导出失败')
          }
          return
        }
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        const now = new Date()
        const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
        const fileName = `设备列表_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.xlsx`
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        message.success('开始下载')
      }
      catch (e) {
        console.log(e)
        message.error('导出异常')
      }
    },
    onCancel() {
      console.log('Cancel')
    },
  })
}
</script>

<template>
  <page-container>
    <a-row :gutter="24">
      <a-col :span="4" style="padding-right: 0px;">
        <a-card
          :bordered="false"
          :title="t('pages.myUsers.sidebar.title')"
        >
          <template #extra>
            <a-space size="middle">
              <a-button type="link" @click="handleTagAdd">
                <template #icon>
                  <PlusOutlined />
                </template>
                {{ t('pages.myUsers.sidebar.add') }}
              </a-button>
            </a-space>
          </template>
          <a-directory-tree
            v-model:selected-keys="selectedTagIds"
            :show-line="showLine"
            :show-icon="showIcon"
            :default-expanded-keys="['0-0-0', '0-0-1', '0-0-2', '0-1', '0-1-0']"
            :tree-data="tagList"
            @select="onSelect"
          >
            <template #icon="{ key }">
              <template v-if="key.length >= 6">
                <UserOutlined />
              </template>
            </template>
            <template #title="{ key: treeKey, title }">
              <a-dropdown :trigger="['contextmenu']">
                <div>{{ title }}</div>
                <template #overlay>
                  <a-menu @click="({ key: menuKey }) => onContextMenuClick(treeKey, menuKey, title)">
                    <a-menu-item key="1">
                      {{ t('pages.myUsers.sidebar.context.edit') }}
                    </a-menu-item>
                    <a-menu-item key="2">
                      {{ t('pages.myUsers.sidebar.context.delete') }}
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </template>
          </a-directory-tree>
        </a-card>
      </a-col>
      <!-- right-content -->
      <a-col :span="20">
        <a-card mb-2>
          <a-form class="system-crud-wrapper" :label-col="{ span: 9 }" :model="state.queryParams">
            <a-row :gutter="[15, 15]">
              <a-col flex="280px">
                <a-form-item name="terminalNo" :label="t('pages.myUsers.form.terminalNo.label')">
                  <a-input v-model:value="state.queryParams.terminalNo" :placeholder="t('pages.myUsers.form.terminalNo.placeholder')" />
                </a-form-item>
              </a-col>
              <a-col flex="280px">
                <a-form-item name="mngName" :label="t('pages.myUsers.table.vehicleName')">
                  <a-input v-model:value="state.queryParams.mngName" :placeholder="t('pages.myUsers.form.vehicleName.placeholder')" />
                </a-form-item>
              </a-col>
              <a-col flex="280px">
                <a-form-item name="controlNo" :label="t('pages.myUsers.table.controlNo')">
                  <a-input v-model:value="state.queryParams.controlNo" :placeholder="t('pages.myUsers.form.controlNo.placeholder')" />
                </a-form-item>
              </a-col>
              <a-col flex="400px">
                <a-form-item
                  name="name" :label="t('pages.myUsers.form.active.label')"
                >
                  <a-radio-group v-model:value="state.queryParams.active" size="small">
                    <a-radio-button :value="2">
                      {{ t('pages.myUsers.form.active.all') }}
                    </a-radio-button>
                    <a-radio-button :value="0">
                      {{ t('pages.myUsers.form.active.inactive') }}
                    </a-radio-button>
                    <a-radio-button :value="1">
                      {{ t('pages.myUsers.form.active.active') }}
                    </a-radio-button>
                  </a-radio-group>
                </a-form-item>
              </a-col>
              <a-col flex="auto">
                <a-space flex justify-end w-full>
                  <a-button :loading="state.loading" type="primary" @click="initQuery">
                    {{ t('pages.myUsers.form.search') }}
                  </a-button>
                  <a-button :loading="state.loading" @click="resetList">
                    {{ t('pages.myUsers.form.reset') }}
                  </a-button>
                </a-space>
              </a-col>
            </a-row>
          </a-form>
        </a-card>

        <a-card>
          <template #title>
            <div class="w-full">
              <div class="w-full flex items-center justify-between">
                <div class="flex items-center">
                  <a-popconfirm
                    :title="t('pages.myUsers.batch.powerOn.confirmTitle')" :ok-text="t('pages.myUsers.batch.ok')" :cancel-text="t('pages.myUsers.batch.cancel')"
                    @confirm="powerOpt(true)"
                  >
                    <a-button type="default" :loading="btn_loading1" :disabled="!state.rowSelections.selectedRowKeys?.length">
                      {{ t('pages.myUsers.batch.powerOn.button') }}
                    </a-button>
                  </a-popconfirm>
                  <a-popconfirm
                    :title="t('pages.myUsers.batch.powerOff.confirmTitle')" :ok-text="t('pages.myUsers.batch.ok')" :cancel-text="t('pages.myUsers.batch.cancel')"
                    @confirm="powerOpt(false)"
                  >
                    <a-button type="default" :loading="btn_loading2" :disabled="!state.rowSelections.selectedRowKeys?.length">
                      {{ t('pages.myUsers.batch.powerOff.button') }}
                    </a-button>
                  </a-popconfirm>
                </div>
                <a-space>
                  <a-button type="default" @click="handleExport">
                    <template #icon>
                      <ExportOutlined />
                    </template>
                    {{ t('pages.button.export') }}
                  </a-button>
                  <a-button type="primary" @click="scanAddModal = true">
                    <template #icon>
                      <PlusOutlined />
                    </template>
                    {{ t('pages.myUsers.scanAdd') }}
                  </a-button>
                </a-space>
              </div>
            </div>
          </template>
          <!-- <template #extra>
            <a-space size="middle">
              <a-button type="primary">
                <template #icon>
                  <PlusOutlined />
                </template>
                导入
              </a-button>
            </a-space>
          </template> -->
          <a-table
            row-key="terminalNo" :row-selection="state.rowSelections" :loading="state.loading" :columns="columns"
            :data-source="state.dataSource" :pagination="state.pagination"
            :scroll="{ x: 1200 }"
          >
            <template #bodyCell="scope">
              <template v-if="scope?.column?.dataIndex === 'action'">
                <a-button type="link" @click="handleEdit(scope?.record)">
                  {{ t('pages.common.edit') }}
                </a-button>
                <!-- <a-divider type="vertical" />
                <a-button type="link" @click="handleEdit(scope?.record)">
                  修改标签
                </a-button> -->
                <!-- <a-divider type="vertical" />
                <a-popconfirm
                  title="确定删除该条数据？" ok-text="确定" cancel-text="取消"
                  @confirm="handleDelete(scope?.record as CrudTableModel)"
                >
                  <a-button type="link">
                    删除
                  </a-button>
                </a-popconfirm> -->
              </template>
            </template>
          </a-table>
        </a-card>

        <Edit ref="editItemModalRef" :tag-list="tagList" @ok="query" />
        <TagEdit ref="tagEditModalRef" @ok="() => { getTagList();query(); }" />
      </a-col>
    </a-row>
    <ScanAddDevice
      v-model:visible="scanAddModal"
      @success="resetList"
      @cancel="scanAddModal = false"
    />
  </page-container>
</template>

<style lang="less" scoped>
.system-crud-wrapper{
    .ant-form-item{
      margin: 0;
    }
  }
</style>
