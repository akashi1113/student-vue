import request from '@/utils/request'

// 获取操作日志报表
export function fetchAuditReport(params) {
  return request({
    url: '/api/audit/report/operation',
    method: 'get',
    params
  })
}

// 导出操作日志报表
export function exportAuditReport(params) {
  return request({
    url: '/api/audit/report/operation/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// 获取操作日志详情
export function fetchAuditDetail(id) {
  return request({
    url: `/api/audit/report/operation/${id}`,
    method: 'get'
  })
}

// 获取分组下的所有操作明细
export function fetchAuditGroupDetails(params) {
  return request({
    url: '/api/audit/report/operation/details',
    method: 'get',
    params
  })
} 