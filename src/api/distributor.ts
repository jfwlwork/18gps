// 经销商列表
export async function getDistributorListApi(params?: any) {
  return useGet('/terminal/list/distributor', params)
}
