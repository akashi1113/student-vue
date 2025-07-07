import request from '../utils/request'

// 测试接口
export function testAnalytics() {
  return request({
    url: '/api/teacher/analytics/test',
    method: 'get'
  })
}

// 快速概览
export function getQuickOverview(params = {}) {
  return request({
    url: '/api/teacher/analytics/quick-overview',
    method: 'get',
    params
  })
}

// 完整分析报告
export function getCompleteAnalysis(data = {}) {
  return request({
    url: '/api/teacher/analytics/complete-analysis',
    method: 'post',
    data
  })
}

// 总体概览
export function getOverview(data = {}) {
  return request({
    url: '/api/teacher/analytics/overview',
    method: 'post',
    data
  })
}

// 成绩分布
export function getScoreDistribution(data = {}) {
  return request({
    url: '/api/teacher/analytics/score-distribution',
    method: 'post',
    data
  })
}

// 考试对比
export function getExamComparison(data = {}) {
  return request({
    url: '/api/teacher/analytics/exam-comparison',
    method: 'post',
    data
  })
}

// 趋势分析
export function getTrend(data = {}) {
  return request({
    url: '/api/teacher/analytics/trend',
    method: 'post',
    data
  })
}

// 学生排名
export function getStudentRankings(data = {}) {
  return request({
    url: '/api/teacher/analytics/student-rankings',
    method: 'post',
    data
  })
} 