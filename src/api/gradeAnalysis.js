import request from '../utils/request'

// ==================== 新增：获取当前用户数据的API ====================

// 获取当前用户考试记录
export function getMyExamRecords(params) {
  return request({
    url: '/api/grade-analysis/my/exam-records',
    method: 'GET',
    params
  })
}

// 获取当前用户学习记录
export function getMyStudyRecords(params) {
  return request({
    url: '/api/grade-analysis/my/study-records',
    method: 'GET',
    params
  })
}

// 获取当前用户综合分析
export function getMyAnalysis(params) {
  return request({
    url: '/api/grade-analysis/my/analysis',
    method: 'GET',
    params
  })
}

// 获取当前用户图表数据
export function getMyChartData(params) {
  return request({
    url: '/api/grade-analysis/my/chart',
    method: 'GET',
    params
  })
}

// ==================== 保留：管理员/教师查看其他用户数据的API ====================

// 获取用户考试记录
export function getUserExamRecords(userId, params) {
  return request({
    url: `/api/grade-analysis/exam-records/${userId}`,
    method: 'GET',
    params
  })
}

// 获取用户学习记录
export function getUserStudyRecords(userId, params) {
  return request({
    url: `/api/grade-analysis/study-records/${userId}`,
    method: 'GET',
    params
  })
}

// 获取用户综合分析
export function getUserAnalysis(userId, params) {
  return request({
    url: `/api/grade-analysis/analysis/${userId}`,
    method: 'GET',
    params
  })
}

// 获取图表数据
export function getChartData(userId, params) {
  return request({
    url: `/api/grade-analysis/chart/${userId}`,
    method: 'GET',
    params
  })
}

// 按考试ID获取考试记录
export function getExamRecordsByExamId(examId, params) {
  return request({
    url: `/api/grade-analysis/exam-records/exam/${examId}`,
    method: 'GET',
    params
  })
} 