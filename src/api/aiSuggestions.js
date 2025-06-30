import request from '../utils/request'

// AI学习建议接口
export function getAILearningSuggestions(data) {
  return request({
    url: '/api/ai/learning-suggestions',
    method: 'post',
    data
  })
}

// 获取学习模式分析
export function getLearningPatternAnalysis(userId, params) {
  return request({
    url: `/api/ai/learning-pattern/${userId}`,
    method: 'get',
    params
  })
}

// 获取知识点薄弱分析
export function getKnowledgeWeaknessAnalysis(userId, params) {
  return request({
    url: `/api/ai/knowledge-weakness/${userId}`,
    method: 'get',
    params
  })
}

// 获取个性化学习路径建议
export function getPersonalizedLearningPath(userId, params) {
  return request({
    url: `/api/ai/learning-path/${userId}`,
    method: 'get',
    params
  })
} 