<script lang="ts" setup>
import { type FormInstance, type TreeProps, message } from 'ant-design-vue'
import { cloneDeep } from 'lodash'
import { tagAddApi, tagUpdateApi } from '~@/api/myUsers'

interface Item {
  id?: number
}
type RecordItem = Partial<Item>

const emit = defineEmits(['cancel', 'ok'])

const isUpdate = ref(false)

const visible = ref(false)

const title = computed(() => {
  return isUpdate.value ? '修改标签' : '添加标签'
})

const formRef = ref<FormInstance>()

const formData = ref<any>({
  tag: undefined,
  id: undefined,
  password: undefined,
})

const labelCol = { style: { width: '100px' } }
const wrapperCol = { span: 24 }

function open(record?: RecordItem) {
  visible.value = true
  isUpdate.value = !!record?.id
  formData.value = cloneDeep(record) ?? {
    tag: '',
  }
}
const expandedKeys = ref<string[]>(['0'])
const selectedKeys = ref<string[]>([])
const checkedKeys = ref<string[]>([])

async function handleOk() {
  try {
    await formRef.value?.validate()
    if (checkedKeys.value.length === 0) {
      message.error('请选择权限')
      return
    }

    // 新增或者编辑接口...
    if (isUpdate.value) {
      const res = await tagUpdateApi(formData.value)
      if (res.code === 0) {
        emit('ok')
        message.success('操作成功')
      }
    }
    else {
      const res = await tagAddApi(formData.value)
      if (res.code === 0) {
        emit('ok')
        message.success('操作成功')
      }
    }
    visible.value = false
  }
  catch (errorInfo) {
    console.log('Form Validate Failed:', errorInfo)
  }
}

function handleCancel() {
  formRef.value?.resetFields()
  emit('cancel')
}

const treeData: TreeProps['treeData'] = [
  {
    title: '所有',
    key: '0',
    children: [
      {
        title: '导入',
        key: '0-1',
      },
      {
        title: '添加',
        key: '0-2',
      },
      {
        title: '批量上电',
        key: '0-3',
      },
      {
        title: '批量下电',
        key: '0-4',
      },
    ],
  },
]

defineExpose({
  open,
})
</script>

<template>
  <a-modal v-model:open="visible" :title="title" @ok="handleOk" @cancel="handleCancel">
    <a-form ref="formRef" :model="formData" class="w-full" :label-col="labelCol" :wrapper-col="wrapperCol">
      <a-form-item name="tag" label="供应商名称" :rules="[{ required: true, message: '请输入名称' }]">
        <a-input v-model:value="formData.tag" :maxlength="50" placeholder="请输入名称" />
      </a-form-item>
      <a-form-item name="password" label="密码" :rules="[{ required: true, message: '请输入密码' }]">
        <a-input v-model:value="formData.password" placeholder="请输入密码" type="password" />
      </a-form-item>
      <a-form-item name="selectedKeys" label="权限" :rules="[{ required: false }]">
        <a-tree v-model:expandedKeys="expandedKeys" v-model:selected-keys="selectedKeys"
                v-model:checked-keys="checkedKeys" checkable :tree-data="treeData"/>
      </a-form-item>
    </a-form>
  </a-modal>
</template>
