<script setup lang="ts">
import { ref, reactive } from 'vue'
import carDetail from './components/carDetail.vue'
import { message } from 'ant-design-vue';
import {
  PlusOutlined
} from '@ant-design/icons-vue';
import { deleteVehicleModel, getVehicleModelListApi } from "~/api/securityCheck.ts";
interface VehicleModel {
  id: number | string;
  carType: string;
  certificate?: string;
  carCode?: string;
  leftFront?: string;
  leftAhead?: string;
  rightRear?: string;
  invoice?: string;
}

const detailShow = ref(false)
const loading = ref(false)
const visible = ref(false)
const visibleSrc = ref('')
const updateModule = ref('edit')
let carData = ref({
  certificateOfConformity: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZM6IQ8p7ZIqxW4hw23WO7XRtFn5awOjM28w&s',
  code: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZM6IQ8p7ZIqxW4hw23WO7XRtFn5awOjM28w&s',
  theLeftSide: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZM6IQ8p7ZIqxW4hw23WO7XRtFn5awOjM28w&s',
  leftFront: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZM6IQ8p7ZIqxW4hw23WO7XRtFn5awOjM28w&s',
  rightBack: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZM6IQ8p7ZIqxW4hw23WO7XRtFn5awOjM28w&s',
  invoice: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZM6IQ8p7ZIqxW4hw23WO7XRtFn5awOjM28w&s'
})

let currentEdit = ref({})
const carDetailRef = ref()
function editCar(item: any) {
  updateModule.value = 'edit'
  currentEdit.value = item
  carData.value = {
    certificateOfConformity: item.certificate,
    code: item.carCode,
    theLeftSide: item.leftFront,
    leftFront: item.leftAhead,
    rightBack: item.rightRear,
    invoice: item.invoice,
  }
  carDetailRef.value.open({
    editValue: item,
    carData: carData.value,
    updateModule: 'edit'
  })
}

function previewImage(item: string | undefined) {
  visibleSrc.value = item || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZM6IQ8p7ZIqxW4hw23WO7XRtFn5awOjM28w&s';
  visible.value = true
}

function addCar() {
  updateModule.value = 'add'
  carData.value = {
    certificateOfConformity: '',
    code: '',
    theLeftSide: '',
    leftFront: '',
    rightBack: '',
    invoice: '',
  }
  carDetailRef.value.open({
    carData: carData.value,
    updateModule: 'add'
  })
}

let vehicleModelList = reactive<VehicleModel[]>([])
const getVehicleModel = async () => {
  try {
    loading.value = true
    const res = await getVehicleModelListApi()
    if (res && res.code === 0) {
      vehicleModelList = res.data.data
    }
  } catch (e) {
    console.error(e)
  }
  loading.value = false
}
async function handleDelete(id: number | string) {
  try {
    const result = await deleteVehicleModel({
      id
    })
    if (result.code === 0) {
      message.success('删除成功')
      await getVehicleModel()
    }
  } catch (e) {
    console.error(e)
  }
}

getVehicleModel()
</script>

<template>
  <page-container>
    <a-row :gutter="24" :style="{ marginTop: '0px', minHeight: '80vh' }">
      <a-col :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
        <Suspense :fallback="null">
          <a-card :loading="loading" class="salesCard" :bordered="false" title="车型管理" :style="{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }" :body-style="{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }">
            <template #extra>
              <a-button type="primary" @click="addCar">
                <PlusOutlined :style="{ color: 'white', fontSize: '12px', fontWeight: 600 }" />
                添加车型
              </a-button>
            </template>
            <div class="carList">
              <div class="carItem" v-for="item in vehicleModelList">
                <div class="labelBox ">
                  <span class="label">车型编码：{{ item.carType }}</span>
                  <a-popconfirm title="确定删除这个车型吗？" ok-text="确定" cancel-text="取消" @confirm="handleDelete(item.id)">
                    <span class="handleText">删除</span>
                  </a-popconfirm>
                </div>
                <div class="carImage" @click="previewImage(item.leftAhead)">
                  <img :src="item.leftAhead" alt="车辆图片" />
                </div>
                <p class="handleDetail" @click="editCar(item)">详情</p>
              </div>
            </div>
          </a-card>
        </Suspense>
      </a-col>
    </a-row>
    <carDetail ref="carDetailRef" @submitAfter="getVehicleModel" />
    <div style="display: none">
      <a-image-preview-group :preview="{ visible, onVisibleChange: vis => (visible = vis) }">
        <a-image :src="visibleSrc" />
      </a-image-preview-group>
    </div>
  </page-container>
</template>

<style lang="less" scoped>
.carList {
  width: 100%;
  height: 100%;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-content: flex-start;

  .carItem {
    width: 302px;
    height: 253px;
    background: #F8F9FD;
    border-radius: 8px;
    padding: 12px 16px;
    box-sizing: border-box;

    .labelBox {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;

      .label {
        font-weight: 600;
        font-size: 16px;
        color: #2F3A4A;
        font-style: normal;
        text-transform: none;
      }

      .handleText {
        font-weight: 600;
        font-size: 14px;
        color: #6B7F94;
        font-style: normal;
        text-transform: none;
        cursor: pointer;
      }
    }

    .carImage {
      width: 100%;
      height: 160px;
      background: #F0F0F0;
      border-radius: 4px 4px 4px 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 16px 0 12px 0;

      img {
        max-width: 100%;
        max-height: 100%;
      }
    }

    .handleDetail {
      font-weight: 600;
      font-size: 14px;
      color: #168AFF;
      text-align: center;
      font-style: normal;
      text-transform: none;
      cursor: pointer;
    }
  }
}
</style>
