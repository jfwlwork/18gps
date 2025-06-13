<script setup lang="ts">
import {defineProps,ref, defineEmits,watch, onMounted} from 'vue'
import dayjs, { Dayjs } from 'dayjs';
import { message } from 'ant-design-vue';
import {
  PlusOutlined,
  CloseOutlined
} from '@ant-design/icons-vue';

type ImageKeys = 'certificateOfConformity' | 'code' | 'theLeftSide' | 'leftFront' | 'rightBack' | 'invoice';

interface RenderItem {
  label: string;
  dataKey: ImageKeys;
}

interface CarData {
  certificateOfConformity: string;
  code: string;
  theLeftSide: string;
  leftFront: string;
  rightBack: string;
  invoice: string;
}

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  updateModule: {
    type: String,
    default: 'edit'
  },
  carData:{
    type: Object as () => CarData,
    default:() => ({
      certificateOfConformity: '',
      code: '',
      theLeftSide: '',
      leftFront: '',
      rightBack: '',
      invoice: ''
    })
  }
})
const emit = defineEmits(['update:show'])
const addTime = ref<Dayjs>(dayjs('2025-06-12 15:14'));
const salesTime = ref<Dayjs>(dayjs('2025-06-12 15:14'));
const carCode = ref('');

const data = ref<CarData>({
  certificateOfConformity: '',
  code: '',
  theLeftSide: '',
  leftFront: '',
  rightBack: '',
  invoice: ''
})

// 初始化数据
onMounted(() => {
  if (props.carData) {
    data.value = props.carData;
  }
})

// 监听数据变化
watch(() => props.carData,(newVal) => {
  if(newVal) {
    data.value = newVal;
  }
})

const uploadRef = ref();
const currentImageKey = ref<ImageKeys>('certificateOfConformity');
const submitLoading = ref(false);

const renderData: RenderItem[] = [
  {
    label:'合格证',
    dataKey:'certificateOfConformity'
  },
  {
    label:'整车编码',
    dataKey:'code'
  },
  {
    label:'车头朝左正侧面照',
    dataKey:'theLeftSide'
  },{
    label:'左前方45',
    dataKey:'leftFront'
  },{
    label:'右后方45',
    dataKey:'rightBack'
  },{
    label:'发票',
    dataKey:'invoice'
  }
]

const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    message.error('只能上传图片文件!');
    return false;
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('图片大小不能超过 2MB!');
    return false;
  }
  const reader = new FileReader();

  reader.onload = (e: ProgressEvent<FileReader>) => {
    const result = e.target?.result;
    if (typeof result === 'string') {
      // 创建临时预览对象
      data.value[currentImageKey.value] = result;
    }
  };

  // 读取文件生成DataURL
  reader.readAsDataURL(file);
  return false;
};

const handleUpload = (key: ImageKeys) => {
  currentImageKey.value = key;
  uploadRef.value?.click();
};

const close = (value:boolean) => {
  emit('update:show', value)
}

const submitUpdate = () => {
  close(false)
}


</script>

<template>
  <a-modal centered :open="show" @update:open="close" width="63.75vw" :footer="null"
           wrap-class-name="full-modal">
    <a-card
        class="salesCard"
        :bordered="false"
        title="车型编码：YK-S001"
        :style="{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }"
        :body-style="{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding:0,
              }"
    >
      <template #extra>
<!--        <CloseOutlined/>-->
      </template>
      <div class="imageList">
        <div class="flex">
          <div style="margin: 0 24px 24px 0" v-if="updateModule === 'edit'">
            <p class="label">添加时间</p>
            <a-date-picker show-time placeholder="添加时间" disabled v-model:value="addTime" />
          </div>
          <div style="margin: 0 24px 24px 0" v-else>
            <p class="label">车型编码</p>
            <a-input v-model:value="carCode" placeholder="车型编码" />
          </div>
          <div>
            <p class="label">销售时间</p>
            <a-date-picker show-time placeholder="销售时间"  v-model:value="salesTime" />
          </div>
        </div>
        <div class="list">
          <div v-for="item in renderData" :key="item.dataKey">
            <p class="label">{{ item.label }}</p>
            <div class="imgBox">
              <div v-if="data[item.dataKey]">
                <img :src="data[item.dataKey]" alt="图片" >
                <div class="overlay">
                  <div class="overlay-content">
                    <span @click="handleUpload(item.dataKey)">修改</span>
                  </div>
                </div>
              </div>
              <div v-else style="width: 100%;height: 100%;display: flex;align-items: center;justify-content: center" @click="handleUpload(item.dataKey)">
                <PlusOutlined  style="color:#6B7F94;font-size: 20px"  />
              </div>
            </div>
          </div>

        </div>
      </div>
      <div class="footerBox">
        <a-button  style="width: 98px;margin-right: 16px" @click="close(false)" >
          取消
        </a-button>
        <a-button style="width: 98px;background: #00A579;" type="primary" :loading="submitLoading" @click="submitUpdate">
          确定
        </a-button>
      </div>
    </a-card>
    <!-- 隐藏的上传组件 -->
    <a-upload
        :show-upload-list="false"
        :before-upload="beforeUpload"
        style="display: none"
    >
      <button ref="uploadRef"></button>
    </a-upload>


  </a-modal>
</template>

<style lang="less">
.full-modal {
  display: flex;
  align-items: center;
  justify-content: center;

  .ant-modal-content {
    width: 63.75vw;
    padding: 0;
  }

  .ant-modal-body {
    height: 100%;
  }

}

.imageList {
  width: 100%;
  height: 100%;
  padding: 24px 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;

  .label {
    font-weight: 600;
    font-size: 14px;
    color: #2F3A4A;
    font-style: normal;
    text-transform: none;
  }

  .list{
    flex: 1;
    width: 100%;
    gap:24px;
    display: flex;
    flex-wrap: wrap;

    .label {
      margin-bottom: 8px;
    }

    .imgBox{
      width: 280px;
      height: 163px;
      background: #F0F0F0;
      border-radius: 4px 4px 4px 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      cursor: pointer;

      img {
        max-width: 100%;
        max-height: 100%;
      }

      .overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
        border-radius: 4px;

        .overlay-content {
          font-size: 14px;
          color: #FFFFFF;
          font-style: normal;
          text-transform: none;
        }
      }

      &:hover {
        .overlay {
          opacity: 1;
        }
      }
    }
  }
}

.footerBox{
  width: 100%;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 16px 14px 0;
  box-sizing: border-box;
}
</style>