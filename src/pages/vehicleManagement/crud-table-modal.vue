<script lang="ts" setup>
import type { FormInstance } from 'ant-design-vue'
import { cloneDeep } from 'lodash'
import type { CrudTableModel } from '~@/api/list/crud-table'
const { t } = useI18nLocale()

const emit = defineEmits(['cancel', 'ok'])

const isUpdate = ref(false)

const visible = ref(false)

const title = computed(() => {
  return isUpdate.value ? t('pages.vehicleManagement.modal.titleEdit') : t('pages.vehicleManagement.modal.titleAdd')
})

const formRef = ref<FormInstance>()

const formData = ref<CrudTableModel>({
  name: '',
  value: '',
})

const labelCol = { style: { width: '100px' } }
const wrapperCol = { span: 24 }

function open(record?: CrudTableModel) {
  visible.value = true
  isUpdate.value = !!record?.id
  formData.value = cloneDeep(record) ?? {
    name: '',
    value: '',
  }
}

async function handleOk() {
  try {
    await formRef.value?.validate()

    // 新增或者编辑接口...

    emit('ok')
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
      <a-form-item name="name" :label="t('pages.vehicleManagement.modal.name.label')" :rules="[{ required: true, message: t('pages.vehicleManagement.modal.name.required') }]">
        <a-input v-model:value="formData.name" :maxlength="50" :placeholder="t('pages.vehicleManagement.modal.name.placeholder')" />
      </a-form-item>
      <a-form-item name="value" :label="t('pages.vehicleManagement.modal.value.label')" :rules="[{ required: true, message: t('pages.vehicleManagement.modal.value.required') }]">
        <a-input v-model:value="formData.value" :maxlength="50" :placeholder="t('pages.vehicleManagement.modal.value.placeholder')" />
      </a-form-item>
      <a-form-item name="remark" :label="t('pages.vehicleManagement.modal.remark.label')">
        <a-textarea v-model:value="formData.remark" show-count :maxlength="200" :placeholder="t('pages.vehicleManagement.modal.remark.placeholder')" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
