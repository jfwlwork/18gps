<script lang="ts" setup>
import { type FormInstance, message } from 'ant-design-vue'
import { cloneDeep } from 'lodash'
import { allocatedItem } from '~@/api/company'
const { t } = useI18nLocale()

interface Item {
  terminalNo?: any
}
type RecordItem = Partial<Item>

const props = defineProps<{
  tagList?: any[]
  state?: any
}>()

const emit = defineEmits(['cancel', 'ok'])

const companyList = computed(() => {
  return props.tagList?.filter(v => v.key !== 'unallocated')
})

const isUpdate = ref(false)

const visible = ref(false)

const title = computed(() => {
  return t('pages.company.edit.title')
})

const formRef = ref<FormInstance>()

const formData = ref<any>({
  // name: undefined,
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

    const res = await allocatedItem({
      terminalNoList: [formData.value.terminalNo].join(','),
      companyId: formData.value.tagId,
    })
    if (res && res.code === 0) {
      emit('ok')
      message.success(t('pages.common.success'))
      // eslint-disable-next-line vue/no-mutating-props
      props.state.rowSelections.selectedRowKeys = []
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
  return option.company.toLowerCase().includes(input.toLowerCase())
}
defineExpose({
  open,
})
</script>

<template>
  <a-modal v-model:open="visible" :title="title" @ok="handleOk" @cancel="handleCancel">
    <a-form ref="formRef" :model="formData" class="w-full" :label-col="labelCol" :wrapper-col="wrapperCol">
      <a-form-item name="terminalNo" :label="t('pages.company.edit.terminalNo')">
        <span>{{ formData.terminalNo }}</span>
      </a-form-item>
      <a-form-item name="tagId" :label="t('pages.company.edit.company.label')" :rules="[{ required: true, message: t('pages.company.edit.company.required') }]">
        <a-select
          v-model:value="formData.tagId"
          show-search
          :filter-option="filterOption"
          :maxlength="50"
          :placeholder="t('pages.company.edit.company.placeholder')"
          :options="companyList"
          :field-names="{ label: 'company', value: 'companyId' }"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
