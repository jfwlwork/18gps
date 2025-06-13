<script setup lang="ts">
// import { AlipayCircleFilled, LockOutlined, MobileOutlined, TaobaoCircleFilled, UserOutlined, WeiboCircleFilled } from '@ant-design/icons-vue'
import { LockOutlined, MobileOutlined, UserOutlined } from '@ant-design/icons-vue'
import { delayTimer } from '@v-c/utils'
import { AxiosError } from 'axios'
import type { RuleObject } from 'ant-design-vue/es/form'
import { loginApi, loginSmsApi } from '~/api/common/login'
import { getQueryParam } from '~/utils/tools'
import type { LoginMobileParams, LoginParams } from '~@/api/common/login'
import pageBubble from '@/utils/page-bubble'
import { useUserInfo } from '~/composables/user-info'
import { AccessEnum } from '~@/utils/constant'

const message = useMessage()
const notification = useNotification()
const appStore = useAppStore()
const { layoutSetting } = storeToRefs(appStore)
const router = useRouter()
const token = useAuthorization()
const loginModel = reactive({
  username: undefined,
  phone: undefined,
  email: undefined,
  emailPassword: undefined,
  password: undefined,
  mobile: undefined,
  code: undefined,
  type: 'account',
  remember: true,
})

const { t } = useI18nLocale()
const formRef = shallowRef()
const codeLoading = shallowRef(false)
const resetCounter = 60
const submitLoading = shallowRef(false)
const errorMsg = ref('')
const errorAlert = shallowRef(false)
const bubbleCanvas = ref<HTMLCanvasElement>()
const { counter, pause, reset, resume, isActive } = useInterval(1000, {
  controls: true,
  immediate: false,
  callback(count) {
    if (count) {
      if (count === resetCounter)
        pause()
    }
  },
})
const hasGetCode = ref(false)
const codeRules: RuleObject[] = [
  {
    type: 'number',
    asyncValidator: () => {
      return new Promise((resolve, reject) => {
        if (!loginModel.username || !loginModel.password) {
          reject(new Error(`获取验证码前需先输入账号密码！`))
        }
        else {
          if (!loginModel.code) {
            if (!hasGetCode.value) {
              reject(new Error(`请获取验证码！`))
            }
            else {
              reject(new Error(t('pages.login.captcha.required')))
            }
          }
          else {
            resolve(true)
          }
        }
      })
    },
  } as any,
]
const loginMethod = [
  {
    label: t('pages.login.accountLogin.tab'),
    value:'account'
  },{
    label: t('pages.login.phoneLogin.tab'),
    value:'phone'
  },{
    label: t('pages.login.emailLogin.tab'),
    value:'email'
  }
]
async function getCode() {
  try {
    if (!loginModel.username || !loginModel.password) {
      await formRef.value.validate(['code'])
    }
    else {
      codeLoading.value = true
      const res = await loginSmsApi({ account: loginModel.username, pwd: loginModel.password })
      if (res.code === 0) {
        reset()
        resume()
        hasGetCode.value = true
        message.success(res.data ? `验证码已经发送到你的手机：${res.data}` : '验证码已经发送到你的手机')
        errorAlert.value = false
      }
      else {
        reset()
        hasGetCode.value = false
        errorMsg.value = res.msg || ''
        errorAlert.value = true
      }
      formRef.value.resetFields(['code'])
      codeLoading.value = false
    }
  }
  catch (error) {
    console.log(error)
    codeLoading.value = false
  }
}

async function submit() {
  submitLoading.value = true
  try {
    await formRef.value?.validate()
    let params: LoginParams | LoginMobileParams

    if (loginModel.type === 'account') {
      params = {
        account: loginModel.username,
        pwd: loginModel.password,
        authCode: loginModel.code,
      } as unknown as LoginParams
    }
    else {
      params = {
        mobile: loginModel.mobile,
        code: loginModel.code,
        type: 'mobile',
      } as unknown as LoginMobileParams
    }
    if (import.meta.env.VITE_APP_TEST === 'preview') {
      token.value = 'test'
      notification.success({
        message: '登录成功',
        description: '欢迎回来！',
        duration: 3,
      })
      router.push({
        path: getQueryParam('redirect', '/'),
        replace: true,
      })
      return
    }

    console.log(params)

    const res: any = await loginApi(params)
    if (res?.code === 0) {
      token.value = res.data?.token
      notification.success({
        message: '登录成功',
        description: '欢迎回来！',
        duration: 3,
      })
      const userInfo = useUserInfo()
      userInfo.value = JSON.stringify(res.data)
      // 获取当前是否存在重定向的链接，如果存在就走重定向的地址
      // const redirect = getQueryParam('redirect', '/')
      function get_ROOT_ROUTE_REDIRECT_PATH() {
        return JSON.parse(userInfo.value || '{}').role === AccessEnum.ADMIN ? '/company' : '/home'
      }

      router.push({
        path: get_ROOT_ROUTE_REDIRECT_PATH(),
        replace: true,
      })
    }
    else {
      errorMsg.value = res.msg || ''
      errorAlert.value = true
    }
    submitLoading.value = false
  }
  catch (e) {
    if (e instanceof AxiosError)
      errorAlert.value = true

    submitLoading.value = false
  }
}
onMounted(async () => {
  await delayTimer(300)
  pageBubble.init(unref(bubbleCanvas)!)
})

onBeforeUnmount(() => {
  pageBubble.removeListeners()
})

const toRegister = () => {
  router.push('/auth/register')
}
</script>

<template>
  <a-form ref="formRef" :model="loginModel">
    <a-tabs v-model:activeKey="loginModel.type" centered>
      <a-tab-pane v-for="item in loginMethod" :key="item.value" :tab="item.label" />
    </a-tabs>
    <!-- 判断是否存在error -->
    <a-alert
        v-if="errorAlert && loginModel.type === 'account'" mb-24px
        :message="errorMsg || t('pages.login.accountLogin.errorMessage')" type="error" show-icon
    />
    <a-alert
        v-if="errorAlert && loginModel.type === 'mobile'" mb-24px
        :message="t('pages.login.phoneLogin.errorMessage')" type="error" show-icon
    />
    <template v-if="loginModel.type === 'account'">
      <a-form-item name="username" :rules="[{ required: true, message: t('pages.login.username.required') }]">
        <a-input
            v-model:value="loginModel.username" allow-clear
            autocomplete="off"
            :placeholder="t('pages.login.username.placeholder')" size="large" @press-enter="submit"
        >
          <template #prefix>
            <UserOutlined />
          </template>
        </a-input>
      </a-form-item>
      <a-form-item name="password" :rules="[{ required: true, message: t('pages.login.password.required') }]">
        <a-input-password
            v-model:value="loginModel.password" allow-clear
            :placeholder="t('pages.login.password.placeholder')" size="large" @press-enter="submit"
        >
          <template #prefix>
            <LockOutlined />
          </template>
        </a-input-password>
      </a-form-item>
      <a-form-item name="code" :rules="codeRules">
        <div flex items-center>
          <a-input
              v-model:value="loginModel.code"
              style="flex: 1 1 0%; transition: width 0.3s ease 0s; margin-right: 8px;" allow-clear
              :placeholder="t('pages.login.captcha.placeholder')" size="large" @press-enter="submit"
          >
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input>
          <a-button :loading="codeLoading" :disabled="isActive" size="large" @click="getCode">
            <template v-if="!isActive">
              {{ t('pages.login.phoneLogin.getVerificationCode') }}
            </template>
            <template v-else>
              {{ resetCounter - counter }} {{ t('pages.getCaptchaSecondText') }}
            </template>
          </a-button>
        </div>
      </a-form-item>
    </template>
    <template v-if="loginModel.type === 'phone'">
      <a-form-item name="phone" :rules="[{ required: true, message: t('pages.login.phoneNumber.required') }]">
        <a-input
            v-model:value="loginModel.phone" allow-clear
            autocomplete="off"
            :placeholder="t('pages.login.phoneNumber.placeholder')" size="large" @press-enter="submit"
        >
          <template #prefix>
            <MobileOutlined />
          </template>
        </a-input>
      </a-form-item>
      <a-form-item name="code" :rules="codeRules">
        <div flex items-center>
          <a-input
              v-model:value="loginModel.code"
              style="flex: 1 1 0%; transition: width 0.3s ease 0s; margin-right: 8px;" allow-clear
              :placeholder="t('pages.login.captcha.placeholder')" size="large" @press-enter="submit"
          >
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input>
          <a-button :loading="codeLoading" :disabled="isActive" size="large" @click="getCode">
            <template v-if="!isActive">
              {{ t('pages.login.phoneLogin.getVerificationCode') }}
            </template>
            <template v-else>
              {{ resetCounter - counter }} {{ t('pages.getCaptchaSecondText') }}
            </template>
          </a-button>
        </div>
      </a-form-item>
    </template>
    <template v-if="loginModel.type === 'email'">
      <a-form-item name="email" :rules="[{ required: true, message: t('pages.login.emailLogin.required') }]">
        <a-input
            v-model:value="loginModel.email" allow-clear
            autocomplete="off"
            :placeholder="t('pages.login.emailLogin.placeholder')" size="large" @press-enter="submit"
        >
          <template #prefix>
            <UserOutlined />
          </template>
        </a-input>
      </a-form-item>
      <a-form-item name="password" :rules="[{ required: true, message: t('pages.login.password.required') }]">
        <a-input-password
            v-model:value="loginModel.emailPassword" allow-clear
            :placeholder="t('pages.login.password.placeholder')" size="large" @press-enter="submit"
        >
          <template #prefix>
            <LockOutlined />
          </template>
        </a-input-password>
      </a-form-item>
    </template>
    <template v-if="loginModel.type === 'mobile'">
      <a-form-item
          name="mobile" :rules="[
                    { required: true, message: t('pages.login.phoneNumber.required') },
                    {
                      pattern: /^(86)?1([38][0-9]|4[579]|5[0-35-9]|6[6]|7[0135678]|9[89])[0-9]{8}$/,
                      message: t('pages.login.phoneNumber.invalid'),
                    },
                  ]"
      >
        <a-input
            v-model:value="loginModel.mobile" allow-clear
            :placeholder="t('pages.login.phoneNumber.placeholder')" size="large" @press-enter="submit"
        >
          <template #prefix>
            <MobileOutlined />
          </template>
        </a-input>
      </a-form-item>
      <a-form-item name="code" :rules="[{ required: true, message: t('pages.login.captcha.required') }]">
        <div flex items-center>
          <a-input
              v-model:value="loginModel.code"
              style="flex: 1 1 0%; transition: width 0.3s ease 0s; margin-right: 8px;" allow-clear
              :placeholder="t('pages.login.captcha.placeholder')" size="large" @press-enter="submit"
          >
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input>
          <a-button :loading="codeLoading" :disabled="isActive" size="large" @click="getCode">
            <template v-if="!isActive">
              {{ t('pages.login.phoneLogin.getVerificationCode') }}
            </template>
            <template v-else>
              {{ resetCounter - counter }} {{ t('pages.getCaptchaSecondText') }}
            </template>
          </a-button>
        </div>
      </a-form-item>
    </template>
    <a-button type="primary" mt-4 block :loading="submitLoading" size="large" @click="submit">
      {{ t('pages.login.submit') }}
    </a-button>
    <div class="mb-24px flex-center" style="margin-top: 16px">
      <span>{{t('pages.login.registerTip')}}</span>
      <a @click="toRegister">{{t('pages.login.toRegister')}}</a>
    </div>
  </a-form>
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
