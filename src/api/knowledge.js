import request from '../utils/request'

// 获取知识库列表（分页+搜索+分类）
export function getKnowledgeList(params = {}) {
  return request({
    url: '/api/knowledge/books',
    method: 'get',
    params
  })
}

// 获取知识库详情
export function getKnowledgeDetail(id) {
  return request({
    url: `/api/knowledge/book/detail/${id}`,
    method: 'get'
  })
}

// 获取所有分类
export function getCategories() {
  return request({
    url: '/api/knowledge/categories',
    method: 'get'
  })
}

// 创建知识库
export function createKnowledge(data) {
  return request({
    url: '/api/knowledge/book',
    method: 'post',
    data
  })
}

// 批量添加知识库
export function batchCreateKnowledge(data) {
  return request({
    url: '/api/knowledge/books/batch',
    method: 'post',
    data
  })
}

// 更新知识库
export function updateKnowledge(data) {
  return request({
    url: '/api/knowledge/book',
    method: 'put',
    data
  })
}

// 删除知识库
export function deleteKnowledge(id) {
  return request({
    url: `/api/knowledge/book/${id}`,
    method: 'delete'
  })
}

// 添加收藏
export function addFavorite({ knowledgeId, remark }) {
  return request({
    url: '/api/knowledge/favorite',
    method: 'POST',
    params: { knowledgeId, remark }
  })
}

// 取消收藏
export function cancelFavorite(knowledgeId) {
  return request({
    url: '/api/knowledge/unfavorite',
    method: 'POST',
    params: { knowledgeId }
  })
}

// 查询收藏列表
export function getFavoriteList(page = 1, size = 10) {
  return request({
    url: '/api/knowledge/favorite/list',
    method: 'GET',
    params: { page, size }
  })
}

// 判断是否已收藏
export function getFavoriteStatus(knowledgeId) {
  return request({
    url: '/api/knowledge/favorite/status',
    method: 'GET',
    params: { knowledgeId }
  })
}

// AI图书推荐相关接口
// 生成AI书籍推荐
export function generateAIRecommendations() {
  return request({
    url: '/api/ai/book-recommendations/generate',
    method: 'post'
  })
}

// 获取用户所有书籍推荐
export function getAIRecommendations() {
  return request({
    url: '/api/ai/book-recommendations',
    method: 'get'
  })
}

// 获取特定课程的书籍推荐
export function getCourseRecommendations(courseId) {
  return request({
    url: `/api/ai/book-recommendations/course/${courseId}`,
    method: 'get'
  })
}

// 标记推荐为已读
export function markRecommendationAsRead(recommendationId) {
  return request({
    url: `/api/ai/book-recommendations/${recommendationId}/read`,
    method: 'post'
  })
}

// 删除AI推荐记录
export function deleteAIRecommendation(id) {
  return request({
    url: `/api/ai/book-recommendations/${id}`,
    method: 'delete'
  })
}


