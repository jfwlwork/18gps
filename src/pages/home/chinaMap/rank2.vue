<script setup lang="ts">
import { getDistributorApi } from '~@/api/home'

defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
})

onMounted(() => {
})

// 获取数据
const data = ref({
  today: 0,
  yesterday: 0,
  total: 0,
})
async function getData() {
  try {
    const res = await getDistributorApi()
    if (res.code === 0) {
      data.value = res.data
    }
  }
  catch (e) {
    console.log(e)
  }
}
getData()
</script>

<template>
  <a-card
    :loading="loading"
    class="salesCard"
    :bordered="false"
    title=""
    :style="{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }"
    :body-style="{
      height: '100%',
    }"
  >
    <div class="content" :style="{ position: 'relative', width: '100%', height: '100%' }">
      <header>
        <img src="@/assets/images/Ellipse_4@2x.png" alt="">
        <span>经销商数据</span>
      </header>
      <div class="aside">
        <div class="item">
          <div class="cont">
            <div class="title">
              今日发货
            </div>
            <div class="num">
              {{ data.today }}
            </div>
          </div>
          <img src="@/assets/images/今日发货-经销商@2x.png" alt="">
        </div>
        <div class="item">
          <div class="cont">
            <div class="title">
              昨日发货
            </div>
            <div class="num">
              {{ data.yesterday }}
            </div>
          </div>
          <img src="@/assets/images/昨日发货-经销商@2x.png" alt="">
        </div>
        <div class="item">
          <div class="cont">
            <div class="title">
              历史发货
            </div>
            <div class="num">
              {{ data.total }}
            </div>
          </div>
          <img src="@/assets/images/今日发货@2x(1).png" alt="">
        </div>
      </div>
    </div>
  </a-card>
</template>

<style scoped lang="scss">
.content {
  display: flex;
  flex-direction: column;
}
  header {
    height: 38px;
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-grow: 0;
    img {
      width: 10px;
      height: 10px;
    }
    span {
      font-family: PingFang SC, PingFang SC;
      font-weight: 500;
      font-size: 16px;
      text-transform: none;
      font-style: normal;
      margin-left: 8px;
    }
  }
  .aside {
    width: 100%;
    padding: 0 18px;
    flex-grow: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    .item {
      width: 100%;
      margin-top: 1vh;
      background-color: #FAFBFF;
      border-radius: 12px 12px 12px 12px;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      padding: 10px 24px;
      flex-basis: 0;
      flex-grow: 1;
      .cont {
        flex-grow: 1;
        .title {
          font-family: PingFang SC, PingFang SC;
          font-size: 14px;
        }
        .num {
          font-family: PingFang SC, PingFang SC;
          font-weight: 500;
          font-size: 30px;
          color: #0094FF;
          line-height: 35px;
          margin-top: 6px
        }
      }
      img {
        width: 40px;
        height: 40px;
        margin-left: 12px;
        vertical-align: middle;
      }
    }
  }
</style>
