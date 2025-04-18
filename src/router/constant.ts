// import type { RouteRecordRaw } from 'vue-router'
import { AccessEnum } from '~@/utils/constant'
import { useUserInfo } from '~/composables/user-info'

const userInfo = useUserInfo()
const userInfoValue = JSON.parse(userInfo.value || '{}')

export const ROOT_ROUTE_REDIRECT_PATH = userInfoValue.role === AccessEnum.ADMIN ? '/company' : '/home'
const Layout = () => import('~/layouts/index.vue')

function get_ROOT_ROUTE_REDIRECT_PATH() {
  return JSON.parse(userInfo.value || '{}').role === AccessEnum.ADMIN ? '/company' : '/home'
}

export const rootRoute: any = () => {
  return {
    path: '/',
    name: 'rootPath',
    redirect: get_ROOT_ROUTE_REDIRECT_PATH(),
    component: Layout,
    children: [],
  }
}
