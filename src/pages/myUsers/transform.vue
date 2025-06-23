<script lang="ts" setup>
import { type FormInstance, message } from 'ant-design-vue'
import { cloneDeep } from 'lodash'
import { updateNameApi, updateTagApi } from '~@/api/myUsers'

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

const title = computed(() => {
  return isUpdate.value ? '编辑' : '新增'
})

const formRef = ref<FormInstance>()

const formData = ref<any>({
  name: undefined,
  // tagId: undefined,
  terminalNo: undefined,
})

const labelCol = { style: { width: '100px' } }
const wrapperCol = { span: 24 }

function open(record?: RecordItem) {
  visible.value = true
  isUpdate.value = !!record?.terminalNo
  formData.value = cloneDeep(record) ?? {
    name: '',
    value: '',
  }
}

async function handleOk() {
  try {
    await formRef.value?.validate()
    console.log(props.selectList)
    // 转移

    // // 新增或者编辑接口...
    // const fetchArr = []
    // if (formData.value.name) {
    //   fetchArr.push(updateNameApi({
    //     terminalNo: formData.value.terminalNo,
    //     name: formData.value.name,
    //   }))
    // }
    // if (formData.value.tagId) {
    //   fetchArr.push(updateTagApi({
    //     terminalNo: formData.value.terminalNo,
    //     tagId: formData.value.tagId,
    //   }))
    // }
    // const res = await Promise.all(fetchArr)
    // if (fetchArr.length && (res[0].code === 0 || res[1].code === 0)) {
    //   emit('ok')
    //   message.success('操作成功')
    // }

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
  <a-modal v-model:open="visible" :title="title" @ok="handleOk" @cancel="handleCancel">
    <a-form ref="formRef" :model="formData" class="w-full" :label-col="labelCol" :wrapper-col="wrapperCol">
<!--      <a-form-item name="terminalNo" label="设备编号">-->
<!--        <span>{{ formData.terminalNo }}</span>-->
<!--      </a-form-item>-->
<!--      <a-form-item name="name" label="名称" :rules="[{ required: false, message: '请输入名称' }]">-->
<!--        <a-input v-model:value="formData.name" :maxlength="50" placeholder="请输入名称" />-->
<!--      </a-form-item>-->
      <a-form-item name="tagId" label="标签" :rules="[{ required: false, message: '请选择标签' }]">
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
