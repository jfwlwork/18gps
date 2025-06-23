<script setup lang="ts">
import {ExclamationCircleOutlined, PlusOutlined, UserOutlined} from '@ant-design/icons-vue'
import type {TreeProps} from 'ant-design-vue'
import {createVNode} from 'vue'
import {Modal} from 'ant-design-vue'
import Edit from './edit.vue'
import TagEdit from './tagEdit.vue'
// import type { CrudTableModel } from '~@/api/list/crud-table'
// import { deleteApi } from '~@/api/list/crud-table'
import {getListApi, poweroffApi, poweronApi, tagDelApi, taglistApi} from '~@/api/myUsers'
import {useTableQuery} from '~@/composables/table-query'
import Transform from "~/pages/myUsers/transform.vue";
import UploadFileModal from "~/pages/company/uploadFileModal.vue";
import {importExcel} from '~@/api/company'

const message = useMessage()

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
  } catch (e) {
    console.log(e)
  }
}

getTagList()

const {state, initQuery, resetQuery, query} = useTableQuery({
  queryApi: getListApi,
  queryParams: {
    terminalNo: undefined,
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

const columns = shallowRef<any>([
  {
    title: '序号',
    dataIndex: 'index',
    customRender({index}: { index: number }) {
      return ((state.pagination.current ?? 1) - 1) * (state.pagination.pageSize ?? 10) + index + 1
    },
    width: 100,
    fixed: 'left',
  },
  {
    title: '设备号(IMEI)',
    dataIndex: 'terminalNo',
    fixed: 'left',
  },
  {
    title: '名称',
    dataIndex: 'name',
  },
  {
    title: '标签',
    dataIndex: 'tag',
  },
  {
    title: '终端用户手机号',
    dataIndex: 'customerPhone',
  },
  {
    title: '车架号',
    dataIndex: 'part1',
  },
  {
    title: '控制器',
    dataIndex: 'part2',
  },
  {
    title: '注册时间',
    dataIndex: 'regDate',
  },
  {
    title: '绑定时间',
    dataIndex: 'bindDate',
  },
  {
    title: '操作',
    dataIndex: 'action',
    fixed: 'right',
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

const TransformModalRef = ref<InstanceType<typeof TagEdit>>()

const openTransformModal = () => {
  TransformModalRef.value?.open()
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
    const res = await tagDelApi({id})
    if (res.code === 200)
      message.success('删除成功')
    await getTagList()
    await query()
  } catch (e) {
    console.log(e)
  }
}

async function handleDeleteTag(id: any) {
  Modal.confirm({
    title: '确认删除该标签吗?',
    icon: createVNode(ExclamationCircleOutlined),
    // content: 'Some descriptions',
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
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
      handleTagEdit({id: treeKey, tag: title})
      break
    case '2':
      handleDeleteTag(treeKey)
      break
  }
}

const btn_loading1 = ref(false)
const btn_loading2 = ref(false)
const btn_loading3 = ref(false)

async function powerOpt(bol: boolean) {
  try {
    let res = null
    if (bol) {
      btn_loading1.value = true
      res = await poweronApi({
        terminalNoList: state.rowSelections.selectedRowKeys.join(','),
      })
    } else {
      btn_loading2.value = true
      res = await poweroffApi({
        terminalNoList: state.rowSelections.selectedRowKeys.join(','),
      })
    }
    if (res && res.code === 0) {
      message.success('操作成功')
      state.rowSelections.selectedRowKeys = []
    }
    btn_loading1.value = false
    btn_loading2.value = false
  } catch (errorInfo) {
    console.log('Form Validate Failed:', errorInfo)
  }
}

const showUploadFileModal = ref(false)
// 导入
const fileList = ref([])
const errorFile = ref()
const importLoading = ref(false)

async function confirmImport() {
  importLoading.value = true
  const params = new FormData()
  const f = fileList.value[0] as any
  if (f) {
    params.append('file', f.originFileObj)
  }

  importExcel(params)
      .then((res: any) => {
        if (res.code === 0) {
          // 清空上传列表
          showUploadFileModal.value = false
          fileList.value = []
          message.success('上传成功')
        } else {
          message.error(res.msg || res.message, 6)
          errorFile.value = res.error_file || res.data.error_file
        }
        query()
        importLoading.value = false
      })
      .catch(() => {
        message.error('上传失败')
      })
      .finally(() => {
        importLoading.value = false
      })
}
</script>

<template>
  <page-container>
    <a-row :gutter="24">
      <a-col :span="4" style="padding-right: 0px;">
        <a-card
            :bordered="false"
            title="供应商列表"
        >
          <template #extra>
            <a-space size="middle">
              <a-button type="link" @click="handleTagAdd">
                <template #icon>
                  <PlusOutlined/>
                </template>
                添加
              </a-button>
            </a-space>
          </template>
          <a-directory-tree
              v-model:selectedKeys="selectedTagIds"
              :show-line="showLine"
              :show-icon="showIcon"
              :default-expanded-keys="['0-0-0', '0-0-1', '0-0-2', '0-1', '0-1-0']"
              :tree-data="tagList"
              @select="onSelect"
          >
            <template #icon="{ key }">
              <template v-if="key.length >= 6">
                <UserOutlined/>
              </template>
            </template>
            <template #title="{ key: treeKey, title }">
              <a-dropdown :trigger="['contextmenu']">
                <div style="display: flex;align-items: center">
                  <div style="width: 20%">{{ treeKey }}</div>
                  <div style="flex: 1;min-width: 0;overflow-x: hidden;text-overflow:ellipsis;white-space:nowrap">
                    {{ title }}
                  </div>
                </div>
                <template #overlay>
                  <a-menu @click="({ key: menuKey }) => onContextMenuClick(treeKey, menuKey, title)">
                    <a-menu-item key="1">
                      修改
                    </a-menu-item>
                    <a-menu-item key="2">
                      删除
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
          <a-form class="system-crud-wrapper" :label-col="{ span: 7 }" :model="state.queryParams">
            <a-row :gutter="[15, 0]">
              <a-col flex="340px">
                <a-form-item name="terminalNo" label="设备号(IMEI)">
                  <a-input v-model:value="state.queryParams.terminalNo" placeholder="请输入设备号(IMEI)"/>
                </a-form-item>
              </a-col>
              <a-col flex="400px">
                <a-form-item
                    name="name" label="激活状态" :label-col="{ style: {
                    width: '80px',
                  } }"
                >
                  <a-radio-group v-model:value="state.queryParams.active" size="small">
                    <a-radio-button :value="2">
                      全部
                    </a-radio-button>
                    <a-radio-button :value="0">
                      未激活
                    </a-radio-button>
                    <a-radio-button :value="1">
                      已激活
                    </a-radio-button>
                  </a-radio-group>
                </a-form-item>
              </a-col>
              <a-col flex="auto">
                <a-space flex justify-end w-full>
                  <a-button :loading="state.loading" type="primary" @click="initQuery">
                    查询
                  </a-button>
                  <a-button :loading="state.loading" @click="resetList">
                    重置
                  </a-button>
                </a-space>
              </a-col>
            </a-row>
          </a-form>
        </a-card>

        <a-card>
          <template #title>
            <div class="flex" style="align-items: center;justify-content: space-between">
              <a-space size="middle">
                <a-popconfirm
                    title="确定批量上电吗？" ok-text="确定" cancel-text="取消"
                    @confirm="powerOpt(true)"
                >
                  <a-button type="default" :loading="btn_loading1"
                            :disabled="!state.rowSelections.selectedRowKeys?.length">
                    批量上电
                  </a-button>
                </a-popconfirm>
                <a-popconfirm
                    title="确定批量断电吗？" ok-text="确定" cancel-text="取消"
                    @confirm="powerOpt(false)"
                >
                  <a-button type="default" :loading="btn_loading2"
                            :disabled="!state.rowSelections.selectedRowKeys?.length">
                    批量断电
                  </a-button>
                </a-popconfirm>
                <a-button type="default" :loading="btn_loading3"
                          :disabled="!state.rowSelections.selectedRowKeys?.length"
                          @click="openTransformModal">
                  批量转移
                </a-button>
              </a-space>
              <a-space size="middle">
                <a-button type="primary" @click="showUploadFileModal = true">
                  <template #icon>
                    <PlusOutlined/>
                  </template>
                  导入
                </a-button>
              </a-space>
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
                  编辑
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

        <Edit ref="editItemModalRef" :tag-list="tagList" @ok="query"/>
        <TagEdit ref="tagEditModalRef" @ok="() => { getTagList();query(); }"/>
        <Transform ref="TransformModalRef" @ok="query" :tag-list="tagList"
                   :selectList="state.rowSelections.selectedRowKeys"/>
      </a-col>
    </a-row>
    <uploadFileModal
        v-model:fileList="fileList"
        :loading="importLoading"
        :visible="showUploadFileModal"
        :error-file="errorFile"
        download-temp-url="/template/importTerminal.xlsx"
        @confirm-upload="confirmImport"
        @cancel="showUploadFileModal = false"
    />
  </page-container>
</template>

<style lang="less" scoped>
.system-crud-wrapper {
  .ant-form-item {
    margin: 0;
  }
}
</style>
