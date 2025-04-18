<script lang="ts" setup>
import { type FormInstance, message } from 'ant-design-vue'
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

async function handleOk() {
  try {
    await formRef.value?.validate()

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

defineExpose({
  open,
})
</script>

<template>
  <a-modal v-model:open="visible" :title="title" @ok="handleOk" @cancel="handleCancel">
    <a-form ref="formRef" :model="formData" class="w-full" :label-col="labelCol" :wrapper-col="wrapperCol">
      <a-form-item name="tag" label="标签名称" :rules="[{ required: true, message: '请输入名称' }]">
        <a-input v-model:value="formData.tag" :maxlength="50" placeholder="请输入名称" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
