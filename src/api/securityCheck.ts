import request from '~/utils/request'
import type { SecurityCheckDetail } from '~/types/securityCheck'

export function getSecurityCheckDetail(id: string) {
  return request<SecurityCheckDetail>({
    url: `/security-check/${id}`,
    method: 'get',
  })
} 