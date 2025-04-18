import type { LayoutSetting } from '~@/stores/app'

export default {
  title: '集方出行',
  theme: 'inverted',
  logo: './logo.svg',
  collapsed: false,
  drawerVisible: false,
  colorPrimary: 'rgb(52 109 145)',
  // colorPrimary: '#6455F5',
  // colorPrimary: '#7764CF',
  // colorPrimary: '#1677FF',
  layout: 'side',
  contentWidth: 'Fluid',
  fixedHeader: false,
  fixedSider: true,
  splitMenus: false,
  header: true,
  menu: true,
  watermark: false,
  menuHeader: true,
  footer: false,
  colorWeak: false,
  colorGray: false,
  multiTab: false,
  multiTabFixed: false,
  keepAlive: true,
  accordionMode: false,
  leftCollapsed: true,
  compactAlgorithm: false,
  headerHeight: 48,
  copyright: '2024',
  animationName: 'slide-fadein-right',
} as LayoutSetting

export const animationNameList = [
  {
    label: 'None',
    value: 'none',
  },
  {
    label: 'Fadein Up',
    value: 'slide-fadein-up',
  },
  {
    label: 'Fadein Right',
    value: 'slide-fadein-right',
  },
  {
    label: 'Zoom Fadein',
    value: 'zoom-fadein',
  },
  {
    label: 'Fadein',
    value: 'fadein',
  },
]
export type AnimationNameValueType = 'none' | 'slide-fadein-up' | 'slide-fadein-right' | 'zoom-fadein' | 'fadein'
