// 省列表
export async function getProvinceListApi(params?: any) {
  return useGet('/terminal/list/province', params)
}

// 市列表
export async function getCityListApi(params?: any) {
  return useGet('/terminal/list/city', params)
}

// mine，出货统计
export async function getMineApi(params?: any) {
  return useGet('/terminal/statistic/mine', params)
}

// 经销商统计
export async function getDistributorApi(params?: any) {
  return useGet('/terminal/statistic/distributor', params)
}

// 经销商排名
export async function getRankApi(params?: any) {
  return useGet('/terminal/statistic/distributor/ranking', params)
}
