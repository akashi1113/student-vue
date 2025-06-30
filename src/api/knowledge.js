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


