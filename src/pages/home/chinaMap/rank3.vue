<script setup lang="ts">
import { getRankApi } from '~@/api/home'

defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
})

onMounted(() => {
})

// 获取数据
const data: any = ref([])
async function getData() {
  try {
    const res = await getRankApi()
    if (res.code === 0 && res.data.length) {
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
        <img src="@/assets/images/Ellipse_5@2x.png" alt="">
        <span>代理/门店-销量排行榜</span>
      </header>
      <div class="aside">
        <div v-for="(item, index) in data" :key="index" class="item">
          <div class="num">
            {{ index + 1 }}
          </div>
          <div class="cont">
            {{ item.tag }}
          </div>
        </div>
      </div>
    </div>
  </a-card>
</template>

<style scoped lang="scss">
.salesCard {
  background: linear-gradient( 180deg, #FFF4F4 0%, #FFFFFF 20%);
}
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
    padding: 8px 0;
    flex-grow: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    .item {
      width: 100%;
      padding: 8px 0;
      display: flex;
      flex-direction: row;
      .num {
        flex-grow: 0;
        margin-right: 12px;
        font-family: DIN Alternate, DIN Alternate;
        font-weight: bold;
        font-size: 16px;
        color: #86909C;
      }
      .cont {
        flex-grow: 1;
        font-family: PingFang SC, PingFang SC;
        font-weight: 400;
        font-size: 16px;
      }
    }
  }
  .aside .item:first-child .num {
    background: linear-gradient(to bottom, #FFA0A0, #FF0000); /* 设置从上到下的渐变色 */
    -webkit-background-clip: text; /* 裁剪背景到文本 */
    background-clip: text; /* 标准背景裁剪 */
    color: transparent; /* 文字颜色设置为透明 */
  }
  .aside .item:nth-child(2) .num {
    background: linear-gradient(to bottom, #FF6B00, #FFD600); /* 设置从上到下的渐变色 */
    -webkit-background-clip: text; /* 裁剪背景到文本 */
    background-clip: text; /* 标准背景裁剪 */
    color: transparent; /* 文字颜色设置为透明 */
  }
  .aside .item:nth-child(3) .num {
    background: linear-gradient(to bottom, #EBFF00, #FFA800); /* 设置从上到下的渐变色 */
    -webkit-background-clip: text; /* 裁剪背景到文本 */
    background-clip: text; /* 标准背景裁剪 */
    color: transparent; /* 文字颜色设置为透明 */
  }
</style>
