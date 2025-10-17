<script setup lang="ts">
import { PlusOutlined, UserOutlined } from '@ant-design/icons-vue'
import type { TreeProps } from 'ant-design-vue'
import dayjs from 'dayjs'
import Edit from './edit.vue'
import uploadFileModal from './uploadFileModal.vue'
import { companyList, importExcel, terminalListApi } from '~@/api/company'
import { useTableQuery } from '~@/composables/table-query'
import ScanAddDevice from "~/pages/company/scanAddDevice.vue";

const message = useMessage()
const { t } = useI18nLocale()

// 标签列表
const selectedTagIds = ref<string[] | number[]>(['unallocated'])
const tagList = ref<TreeProps['treeData']>([])
async function getTagList() {
  try {
    const res = await companyList()
    if (res.code === 0 && res.data?.length) {
      res.data.forEach((item: any) => {
        item.title = item.company
        item.key = item.companyId
      })
      res.data.unshift({
        title: t('pages.company.unallocated'),
        key: 'unallocated',
      })
      tagList.value = res.data
    }
  }
  catch (e) {
    console.log(e)
  }
}
getTagList()

const { state, initQuery, query } = useTableQuery({
  queryApi: terminalListApi,
  queryParams: {
    companyId: undefined,
    unallocated: true,
  },
  afterQuery: (res) => {
    return res
  },
})
function resetList() {
  selectedTagIds.value = ['unallocated']
  state.queryParams.unallocated = true
  state.queryParams.companyId = undefined
  state.queryParams.terminalNo = undefined
  initQuery()
}

const columns = computed(() => [
  {
    title: t('pages.company.table.index'),
    dataIndex: 'index',
    customRender({ index }: { index: number }) {
      return ((state.pagination.current ?? 1) - 1) * (state.pagination.pageSize ?? 10) + index + 1
    },
    width: 100,
    fixed: 'left' as const,
  },
  {
    title: t('pages.company.table.terminalNo'),
    dataIndex: 'terminalNo',
    fixed: 'left' as const,
  },
  {
    title: t('pages.company.table.company'),
    dataIndex: 'company',
  },
  {
    title: t('pages.company.table.sysCreated'),
    dataIndex: 'sysCreated',
  },
  {
    title: t('pages.company.table.expire'),
    dataIndex: 'expire',
    customRender({ text }: { text: any }) {
      return text ? dayjs(Number(text)).format('YYYY-MM-DD HH:mm:ss') : ''
    },
  },
  {
    title: t('pages.company.table.action'),
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
const onSelect: TreeProps['onSelect'] = (selectedKeys, info) => {
  console.log('selected', selectedKeys, info)
  state.queryParams.unallocated = selectedKeys[0] === 'unallocated'
  state.queryParams.companyId = selectedKeys[0]
  initQuery()
}

// 分配
const btn_loading = ref(false)
function toSet() {
  editItemModalRef.value?.open({
    terminalNo: state.rowSelections.selectedRowKeys?.join(','),
  })
}

// 导入
const fileList = ref([])
const errorFile = ref()
const showUploadFileModal = ref(false)
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
        message.success(t('pages.company.edit.company.upload.success'))
      }
      else {
        message.error(res.msg || res.message, 6)
        errorFile.value = res.error_file || res.data.error_file
      }
      query()
      importLoading.value = false
    })
    .catch(() => {
      message.error(t('pages.company.edit.company.upload.error'))
    })
    .finally(() => {
      importLoading.value = false
    })
}

const scanAddModal = ref(false)

</script>

<template>
  <page-container>
    <a-row :gutter="24">
      <a-col :span="4" style="padding-right: 0px;">
        <a-card
          :bordered="false"
          :title="t('pages.company.sidebar.title')"
        >
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
<!--                <UserOutlined />-->
              </template>
            </template>
            <template #title="{ title }">
              <div>{{ title }}</div>
            </template>
          </a-directory-tree>
        </a-card>
      </a-col>
      <a-col :span="20">
        <a-card mb-2>
          <a-form class="system-crud-wrapper" :label-col="{ span: 9 }" :model="state.queryParams">
            <a-row :gutter="[15, 0]">
              <a-col flex="340px">
                <a-form-item name="terminalNo" :label="t('pages.company.form.terminalNo.label')">
                  <a-input v-model:value="state.queryParams.terminalNo" :placeholder="t('pages.company.form.terminalNo.placeholder')" />
                </a-form-item>
              </a-col>
              <a-col flex="auto">
                <a-space flex justify-end w-full>
                  <a-button :loading="state.loading" type="primary" @click="initQuery">
                    {{ t('pages.company.form.search') }}
                  </a-button>
                  <a-button :loading="state.loading" @click="resetList">
                    {{ t('pages.company.form.reset') }}
                  </a-button>
                </a-space>
              </a-col>
            </a-row>
          </a-form>
        </a-card>
        <a-card>
          <template #title>
            <a-space size="middle">
              <a-button type="default" :loading="btn_loading" :disabled="!state.rowSelections.selectedRowKeys?.length" @click="toSet">
                {{ t('pages.company.batchAssign') }}
              </a-button>
            </a-space>
          </template>
          <template #extra>
            <a-space size="middle">
<!--              <a-button type="primary" @click="scanAddModal = true">-->
<!--                <template #icon>-->
<!--                  <PlusOutlined />-->
<!--                </template>-->
<!--                扫码添加-->
<!--              </a-button>-->
              <a-button type="primary" @click="showUploadFileModal = true">
                <template #icon>
                  <PlusOutlined />
                </template>
                {{ t('pages.company.import') }}
              </a-button>
            </a-space>
          </template>
          <a-table
            row-key="terminalNo" :row-selection="state.rowSelections" :loading="state.loading" :columns="columns"
            :data-source="state.dataSource" :pagination="state.pagination"
          >
            <template #bodyCell="scope">
              <template v-if="scope?.column?.dataIndex === 'action'">
                <a-button type="link" @click="handleEdit(scope?.record)">
                  {{ t('pages.company.assign') }}
                </a-button>
              </template>
            </template>
          </a-table>
        </a-card>

        <Edit ref="editItemModalRef" :state="state" :tag-list="tagList" @ok="query" />
        <!-- 导入 -->
        <uploadFileModal
          v-model:fileList="fileList"
          :loading="importLoading"
          :visible="showUploadFileModal"
          :error-file="errorFile"
          download-temp-url="/template/importTerminal.xlsx"
          @confirm-upload="confirmImport"
          @cancel="showUploadFileModal = false"
        />
        <scan-add-device
            :loading="importLoading"
            v-model:visible="scanAddModal"
            @cancel="showUploadFileModal = false"
        />
      </a-col>
    </a-row>
  </page-container>
</template>

<style lang="less" scoped>
.system-crud-wrapper{
    .ant-form-item{
      margin: 0;
    }
  }
</style>
