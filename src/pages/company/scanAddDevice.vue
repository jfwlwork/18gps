<script setup>
import { ref, watchEffect, watch } from 'vue'
import { InboxOutlined } from '@ant-design/icons-vue'
import {scanAddDeviceApi} from "~@/api/company";
import { message } from 'ant-design-vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  }
})

const emit = defineEmits(['confirmUpload', 'update:visible', 'update:fileList', 'cancel'])


function cancelImport() {
  emit('update:visible', false)
  deviceCode.value = ''
  vehicleNumber.value = ''
  controller.value = ''
}

const loading = ref(false);
const deviceCode = ref('');
const vehicleNumber = ref('');
const controller = ref('');

const deviceCodeRef = ref()
const vehicleNumberRef = ref()
const controllerRef = ref()

// 记录输入时间，用于区分扫码枪和手动输入
const deviceCodeInputTime = ref(0)
const vehicleNumberInputTime = ref(0)
const controllerInputTime = ref(0)

// 检测是否为扫码枪输入
function isScannerInput(inputTime, currentTime, value) {
  // 扫码枪特征：输入时间间隔很短（通常<100ms）且一次性输入完整内容
  const timeDiff = currentTime - inputTime
  return timeDiff < 100 && value.length > 0
}

// 监听设备号输入完成，自动聚焦到车架号
watch(deviceCode, (newVal, oldVal) => {
  const currentTime = Date.now()
  if (newVal && newVal.trim() !== '' && newVal.length >= 10) {
    // 检测是否为扫码枪输入
    if (isScannerInput(deviceCodeInputTime.value, currentTime, newVal)) {
      // 扫码枪输入完成且符合长度要求，自动聚焦到车架号
      setTimeout(() => {
        vehicleNumberRef.value?.focus()
      }, 100)
    }
  }
  deviceCodeInputTime.value = currentTime
})

// 监听车架号输入完成，自动聚焦到控制器
watch(vehicleNumber, (newVal, oldVal) => {
  const currentTime = Date.now()
  if (newVal && newVal.trim() !== '') {
    // 检测是否为扫码枪输入
    if (isScannerInput(vehicleNumberInputTime.value, currentTime, newVal)) {
      // 扫码枪输入完成，自动聚焦到控制器
      setTimeout(() => {
        controllerRef.value?.focus()
      }, 100)
    }
  }
  vehicleNumberInputTime.value = currentTime
})

// 监听控制器输入完成，可以自动触发确认或聚焦到确定按钮
watch(controller, (newVal, oldVal) => {
  const currentTime = Date.now()
  if (newVal && newVal.trim() !== '') {
    // 检测是否为扫码枪输入
    if (isScannerInput(controllerInputTime.value, currentTime, newVal)) {
      // 扫码枪输入完成，可以选择自动触发确认或聚焦到确定按钮
      // 这里暂时不自动触发，让用户手动点击确定按钮
    }
  }
  controllerInputTime.value = currentTime
})

// 确认上传处理逻辑
async function confirmAdd() {
  // 校验设备号不能为空且大于等于十位
  if (!deviceCode.value || deviceCode.value.trim() === '') {
    message.error('设备号不能为空')
    return
  }
  if (deviceCode.value.length < 10) {
    message.error('设备号长度不能少于10位')
    return
  }

  // 校验车架号不能为空
  if (!vehicleNumber.value || vehicleNumber.value.trim() === '') {
    message.error('车架号不能为空')
    return
  }

  // 校验控制器不能为空
  if (!controller.value || controller.value.trim() === '') {
    message.error('控制器不能为空')
    return
  }

  loading.value = true
  scanAddDeviceApi({
    terminalNo: deviceCode.value.trim(),
    vin: vehicleNumber.value.trim(),
    controlNo: controller.value.trim()
  }).then(res => {
    console.log(res)
    if(res.code === 0) {
      message.success('添加成功')
      deviceCode.value = ''
      vehicleNumber.value = ''
      controller.value = ''
    }
  }).finally(() => {
    loading.value = false
  })
}

</script>

<template>
  <a-modal :open="props.visible" title="扫码添加设备" :closable="false">
    <template #footer>
      <a-button @click="cancelImport">
        取消
      </a-button>
      <a-button type="primary" :loading="loading" @click="confirmAdd">
        确定
      </a-button>
    </template>
    <slot />
    <div class="w-full p-y-16px">
      <div class="w-full flex items-center justify-between m-b-12px">
        <span class="m-r-12px">设备号</span>
        <a-input
          ref="deviceCodeRef"
          v-model:value="deviceCode"
          placeholder="设备号"
          class="flex-1"
          @keyup.enter="vehicleNumberRef?.focus()"
        />
      </div>
      <div class="w-full flex items-center justify-between m-b-12px">
        <span class="m-r-12px">车架号</span>
        <a-input
          ref="vehicleNumberRef"
          v-model:value="vehicleNumber"
          placeholder="车架号"
          class="flex-1"
          @keyup.enter="controllerRef?.focus()"
        />
      </div>
      <div class="w-full flex items-center justify-between ">
        <span class="m-r-12px">控制器</span>
        <a-input
          ref="controllerRef"
          v-model:value="controller"
          placeholder="控制器"
          class="flex-1"
        />
      </div>
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
