export interface LoginParams {
  account: string
  pwd: string
  authCode?: string
  type?: 'account'
}

export interface LoginMobileParams {
  mobile: string
  code: string
  type: 'mobile'
}

export interface LoginResultModel {
  code: number
  data: {
    token?: string
  }
  msg: string
  token?: string
}

export function loginApi(params: LoginParams | LoginMobileParams) {
  return usePost<LoginResultModel, LoginParams | LoginMobileParams>('/login/confirm', params, {
    // 设置为false的时候不会携带token
    token: false,
    // 开发模式下使用自定义的接口
    customDev: true,
    // 是否开启全局请求loading
    loading: true,
    // 是否关闭全局请求错误提示
    hideErrorTip: true,
  })
}

export function logoutApi() {
  return useGet('/logout')
}

export function loginSmsApi(params: any) {
  return usePost<any>('/login/sms', params, { token: false, hideErrorTip: true })
}

export function refreshTokenApi(params: any) {
  return usePost<any>('/login/confirmByRefreshToken', params, { token: false, hideErrorTip: true })
}
