import request from '../utils/request'

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