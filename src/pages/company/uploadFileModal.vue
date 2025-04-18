<script setup>
import { ref, watchEffect } from 'vue'
import { InboxOutlined } from '@ant-design/icons-vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  maxCount: {
    type: Number,
    default: 1,
  },
  accept: {
    type: String,
    default: '.xls,.xlsx',
  },
  fileList: {
    type: Array,
    default: () => [],
  },
  width: {
    type: Number || String,
    default: 520,
  },
  downloadTempUrl: {
    type: String,
    default: '',
  },
  downloadErrUrl: {
    type: String,
    default: '',
  },
  // 下载出错文件
  errorFile: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['confirmUpload', 'update:visible', 'update:fileList', 'cancel'])
const errorFile = ref(props.errorFile)
watchEffect(() => {
  errorFile.value = props.errorFile
})

const fileList = ref(props.fileList)
watchEffect(() => {
  fileList.value = props.fileList
})

function cancelImport() {
  fileList.value = []
  errorFile.value = null
  emit('update:visible', false)
  emit('cancel')
}

// 确认上传处理逻辑
async function confirmImport() {
  emit('update:fileList', fileList.value)
  emit('confirmUpload')
}

// 下载模板
function emitDownloadTemp() {
  window.open(props.downloadTempUrl)
}

// 下载导入出错文件
function downloadTempErr(name) {
  window.open(`${props.downloadErrUrl}${name}`, '_blank')
}
</script>

<template>
  <a-modal :width="props.width" :open="props.visible" title="批量导入" :closable="false">
    <template #footer>
      <a-button @click="cancelImport">
        取消
      </a-button>
      <a-button type="primary" :loading="props.loading" @click="confirmImport">
        确定
      </a-button>
    </template>
    <slot />

    <a-upload-dragger
      v-model:fileList="fileList"
      name="file"
      :accept="props.accept"
      :max-count="1"
      :before-upload="() => false"
    >
      <p class="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p class="ant-upload-text">
        点击或者拖拽到此处上传文件
      </p>
      <span class="ant-upload-text">支持扩展名：{{ accept }}, 内容请严格按照模板标准</span>
    </a-upload-dragger>

    <div class="upload-btn-area">
      <slot name="bottom">
        <a-button type="primary" @click="emitDownloadTemp">
          点击下载模板
        </a-button>
        <span
          v-if="errorFile"
          style="cursor: pointer; color: #ff4d4f"
          @click="downloadTempErr(errorFile)"
        >{{ errorFile }}</span>
      </slot>
    </div>
  </a-modal>
</template>

<style lang="css" scoped>
.upload-btn-area {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 10px;
  flex-direction: column;
  align-items: center;
}
</style>
