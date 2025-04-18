export interface SecurityCheckItem {
  id: string
  type: 'device' | 'system'
  status: '正常' | '异常'
  checkTime: string
  deviceName: string
  checker: string
  location: string
  longitude: number
  latitude: number
  checkItem: string
  result: string
  abnormalDesc?: string
  suggestion?: string
  terminalNo: string
  name: string
  sysCreated: string
}

export interface SecurityCheckDetail extends SecurityCheckItem {} 