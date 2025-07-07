<script lang="ts" setup>
import { type FormInstance, message } from 'ant-design-vue'
import { cloneDeep } from 'lodash'
import { batchTransfer } from '~@/api/myUsers'

interface Item {
  terminalNo?: any
}
type RecordItem = Partial<Item>

const props = defineProps<{
  tagList?: any[],
  selectList:any[]
}>()

const emit = defineEmits(['cancel', 'ok'])

const isUpdate = ref(false)

const visible = ref(false)



const formRef = ref<FormInstance>()

const formData = ref<any>({
  tagId: undefined,
})

const labelCol = { style: { width: '100px' } }
const wrapperCol = { span: 24 }

function open(record?: RecordItem) {
  visible.value = true
  isUpdate.value = !!record?.terminalNo
  formData.value = cloneDeep(record) ?? {
    tagId: '',
  }
}

async function handleOk() {
  try {
    await formRef.value?.validate()
    let params = {
      terminalNos: props.selectList.join(','),
      tagId: formData.value.tagId,
    }

    const result = await batchTransfer(params)
    if (result.code === 0) {
      emit('ok')
      message.success('操作成功')
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

function filterOption(input: string, option: any) {
  console.log(input, option)

  return option.tag.toLowerCase().includes(input.toLowerCase())
}
defineExpose({
  open,
})
</script>

<template>
  <a-modal v-model:open="visible" title="转移" @ok="handleOk" @cancel="handleCancel">
    <a-form ref="formRef" :model="formData" class="w-full" :label-col="labelCol" :wrapper-col="wrapperCol">
      <a-form-item name="tagId" label="标签" :rules="[{ required: true, message: '请选择标签' }]">
        <a-select
            v-model:value="formData.tagId"
            show-search
            :filter-option="filterOption"
            :maxlength="50"
            placeholder="请选择标签"
            :options="props.tagList"
            :field-names="{ label: 'tag', value: 'id' }"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
