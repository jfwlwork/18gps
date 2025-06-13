<script setup lang="ts">
import { delayTimer } from '@v-c/utils'
import GlobalLayoutFooter from '~/layouts/components/global-footer/index.vue'
import pageBubble from '@/utils/page-bubble'

const appStore = useAppStore()
const { layoutSetting } = storeToRefs(appStore)
const { t } = useI18nLocale()
const resetCounter = 60
const bubbleCanvas = ref<HTMLCanvasElement>()
const { pause } = useInterval(1000, {
  controls: true,
  immediate: false,
  callback(count) {
    if (count) {
      if (count === resetCounter)
        pause()
    }
  },
})
onMounted(async () => {
  await delayTimer(300)
  pageBubble.init(unref(bubbleCanvas)!)
})

onBeforeUnmount(() => {
  pageBubble.removeListeners()
})
</script>

<template>
  <div class="login-container">
    <div h-screen w-screen absolute z-10>
      <canvas ref="bubbleCanvas" />
    </div>
    <div class="login-content flex-center">
      <div class="ant-pro-form-login-main rounded">
        <!-- 登录头部 -->
        <div
            class="flex-between h-15 px-4 mb-[2px]"
        >
          <div class="flex-end">
            <span class="ant-pro-form-login-logo">
              <img w-full h-full object-cover src="/logo.svg">
            </span>
            <span class="ant-pro-form-login-title">
              集方出行
            </span>
            <span class="ant-pro-form-login-desc">
              {{ t("pages.layouts.userLayout.title") }}
            </span>
          </div>
          <div class="login-lang flex-center relative z-11">
            <span
                class="flex-center cursor-pointer text-16px"
                @click="appStore.toggleTheme(layoutSetting.theme === 'dark' ? 'light' : 'dark')"
            >
              <!-- 亮色和暗黑模式切换按钮 -->
              <template v-if="layoutSetting.theme === 'light'">
                <carbon-moon />
              </template>
              <template v-else>
                <carbon-sun />
              </template>
            </span>
            <!-- <SelectLang /> -->
          </div>
        </div>
        <a-divider m-0 />
        <!-- 登录主体 -->
        <div class="box-border flex min-h-[520px]">
          <!-- 登录框左侧 -->
          <div class="ant-pro-form-login-main-left min-h-[520px] flex-center  bg-[var(--bg-color-container)]">
            <img src="@/assets/images/bg4.png" class="h-20/24 w-88/100">
            <div class="aver2 min-h-[520px] max-w-[190px] flex-center">
              <a id="li9" class="w-1/1 flex-center">
                <img class="w-3/4" src="../../assets/images/QRcode.png">
                <h2 class="qRcodeTitle c-text">集方出行</h2>
                <p class="c-textSecondary" style="font-size: 12px;">一款操作简单方便的基础版APP，具备实时查车、回放轨迹、下发指令、实时接收设备故障与异常报警推送等基础功能。</p>
              </a>
            </div>
          </div>
          <a-divider m-0 type="vertical" class="ant-pro-login-divider  min-h-[520px]" />
          <!-- 登录框右侧 -->
          <div class="ant-pro-form-login-main-right px-5 w-[335px] flex-center flex-col relative z-11">
            <div class="text-center py-6 text-2xl">
              {{ t('pages.login.tips') }}
            </div>
            <router-view/>
          </div>
        </div>
      </div>
    </div>
    <div py-24px px-50px fixed bottom-0 z-11 w-screen :data-theme="layoutSetting.theme" text-14px>
      <GlobalLayoutFooter
          :copyright="layoutSetting.copyright" icp="闽ICP备2024054817号"
      >
      </GlobalLayoutFooter>
    </div>
  </div>
</template>

<style lang="less" scoped>
.login-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: auto;
  background: var(--bg-color-container);
}

.login-lang {
  height: 40px;
  line-height: 44px;
}

.login-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.ant-pro-form-login-container {
  display: flex;
  flex: 1 1;
  flex-direction: column;
  height: 100%;
  padding: 32px 0;
  overflow: auto;
  background: inherit
}

.ant-pro-form-login-header a {
  text-decoration: none
}

.ant-pro-form-login-title {
  color: var(--text-color);
  font-weight: 600;
  font-size: 33px;
  line-height: 1;
}

.ant-pro-form-login-logo {
  width: 44px;
  height: 44px;
  margin-right: 16px;
  vertical-align: top
}

.ant-pro-form-login-desc {
  color: var(--text-color-1);
  font-size: 14px;
  margin-left: 16px
}

.ant-pro-form-login-main-right {
  .ant-tabs-nav-list {
    margin: 0 auto;
    font-size: 16px;
  }

  .ant-pro-form-login-other {
    line-height: 22px;
    text-align: center
  }

}

.ant-pro-form-login-main{
  box-shadow: var(--c-shadow);
}

.icon {
  margin-left: 8px;
  color: var(--text-color-2);
  font-size: 24px;
  vertical-align: middle;
  cursor: pointer;
  transition: color .3s;

  &:hover {
    color: var(--pro-ant-color-primary);
  }
}
.login-media(@width:100%) {
  .ant-pro-form-login-main{
    width: @width;
  }
  .ant-pro-form-login-main-left{
    display: none;
  }
  .ant-pro-form-login-main-right{
    width: 100%;
  }
  .ant-pro-form-login-desc{
    display: none;
  }
}
@media (min-width : 992px) {
  .ant-pro-form-login-main-left{
    width: 700px;
  }
}
@media(min-width:768px) and (max-width:991px){
  .ant-pro-login-divider{
    display: none;
  }
  .login-media(400px)
}
@media screen and (max-width:767px) {
  .login-media(350px);

  .ant-pro-login-divider{
    display: none;
  }
}

.ant-pro-form-login-main-left {
  position: relative;
}
.aver2 {
  position: absolute;
  left: 24px;
}
.aver2 a {
  flex-direction: column;
}
.qRcodeTitle {
  font-size: 1.5em;
  margin: 10px 0;
}
</style>
