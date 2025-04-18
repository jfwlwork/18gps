interface noticeListModel {
  id?: number
  type: string
  terminalNo?: string
}

type CrudTableParams = Partial<Omit<noticeListModel, 'id'>>

export async function getListApi(params?: CrudTableParams) {
  return useGet<noticeListModel[]>('/notice/list', params)
}

export async function getNoticeTypeApi(params?: any) {
  return useGet('/notice/type', params)
}

export type {
  noticeListModel,
  CrudTableParams,
}

// 用id查坐标
export async function getGcj02Api(params?: any) {
  return useGet('/notice/gcj02', params)
}

// 用id查坐标轨迹
export async function getGcj02listApi(params?: any) {
  return useGet('/notice/gcj02/list', params)
}
