// import request from '~/utils/request'
// import type { SecurityCheckDetail } from '~/types/securityCheck'
//
// export function getSecurityCheckDetail(id: string) {
//   return request<SecurityCheckDetail>({
//     url: `/security-check/${id}`,
//     method: 'get',
//   })
// }

// 获取车型列表
export function getVehicleModelListApi() {
  return useGet('/carTypeInfo/list')
}

// 添加车型
export function addVehicleModelApi(params:any) {
  return usePost('/carTypeInfo/add',params,{

  })
}

// 删除车型
export function deleteVehicleModel(params:any) {
  return useGet('/carTypeInfo/del',params)
}

// 获取轨迹记录
export function getRecordList(params:any) {
  return useGet('/terminal/recordList',params)
}

// 获取实时位置信息
export function getLocationInfoApi(params:any) {
  return useGet('/terminal/location',params)
}

// 获取电池信息
export function getBatteryApi(params:any) {
  return useGet('/terminal/battery',params)
}

// 获取总里程
export function getMileagesApi(params:any) {
  return useGet('/terminal/mileages',params)
}