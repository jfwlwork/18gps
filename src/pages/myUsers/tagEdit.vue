<script lang="ts" setup>
import { type FormInstance, message } from 'ant-design-vue'
import { cloneDeep } from 'lodash'
import { tagAddApi, tagUpdateApi } from '~@/api/myUsers'

const emit = defineEmits(['cancel', 'ok'])

const { t } = useI18nLocale()

interface Item {
  id?: number
}
type RecordItem = Partial<Item>

const isUpdate = ref(false)

const visible = ref(false)

const title = computed(() => {
  return isUpdate.value ? t('pages.myUsers.tag.titleEdit') : t('pages.myUsers.tag.titleAdd')
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
        message.success(t('pages.common.success'))
      }
    }
    else {
      const res = await tagAddApi(formData.value)
      if (res.code === 0) {
        emit('ok')
        message.success(t('pages.common.success'))
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
      <a-form-item name="tag" :label="t('pages.myUsers.tag.name.label')" :rules="[{ required: true, message: t('pages.myUsers.tag.name.required') }]">
        <a-input v-model:value="formData.tag" :maxlength="50" :placeholder="t('pages.myUsers.tag.name.placeholder')" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
