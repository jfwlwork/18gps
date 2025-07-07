interface CrudTableModel {
  id?: number
  /**
   * 名称
   */
  name: string
  /**
   * 值
   */
  value: string
  /**
   * 描述
   */
  remark?: string
}

type CrudTableParams = Partial<Omit<CrudTableModel, 'id'>>

export async function getListApi(params?: CrudTableParams) {
  return useGet<CrudTableModel[]>('/terminal/list', params)
}

export async function taglistApi(tag?: string | number) {
  return useGet('/tag/list', { tag })
}

export async function tagDelApi(params: any) {
  return useGet('/tag/del', params)
}

export async function tagAddApi(params: any) {
  return usePost('/tag/add', params)
}

export async function tagUpdateApi(params: any) {
  return usePost('/tag/update', params)
}

export async function updateNameApi(params: any) {
  return usePost('/terminal/updateName', params)
}

export async function updateTagApi(params: any) {
  return usePost('/terminal/updateTag', params)
}

export async function poweroffApi(params: any) {
  return usePost('/terminal/power/off', params)
}
export async function poweronApi(params: any) {
  return usePost('/terminal/power/on', params)
}
export async function batchTransfer (params: any) {
  return usePost('/terminal/updateTagList', params)
}

export type {
  CrudTableParams,
  CrudTableModel,
}
