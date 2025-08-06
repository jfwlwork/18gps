// 管理员-分页查询未分配设备
export async function unallocatedList(params?: any) {
  return useGet('/terminal/unallocated', params)
}

// 管理员-分页查询已分配设备
export async function allocatedList(params?: any) {
  return useGet('/terminal/allocated', params)
}

// 管理员-设备列表
export async function terminalListApi(params?: any) {
  if (params.unallocated) {
    delete params.unallocated
    return useGet('/terminal/unallocated', params)
  }
  delete params.unallocated
  return useGet('/terminal/allocated', params)
}

// 管理员-经销商列表
export async function companyList(params?: any) {
  return useGet('/company/list', params)
}

// 管理员-分配设备到经销商
export async function allocatedItem(params?: any) {
  return usePost('/terminal/allocated', params)
}

// 管理员-导入设备  导入界面挂个模板下载链接，/template/importTerminal.xlsx
export async function importExcel(params?: any) {
  return usePost('/terminal/importExcel', params)
}

// 管理员-扫码枪添加设备
export async function scanAddDeviceApi(params?: any) {
  return usePost('/terminal/scanCodeAddTerminal', params,{
    headers: {
      'Content-Type': 'application/json'
    }
  })
}
