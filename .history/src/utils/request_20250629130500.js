// 简单的HTTP请求工具
// 这里使用fetch API，你也可以使用axios等库

const BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8081'

export default function request(options) {
  const { url, method = 'GET', data, params } = options
  
  // 构建完整URL
  let fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`
  
  // 添加查询参数
  if (params) {
    const searchParams = new URLSearchParams()
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key])
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      fullUrl += `?${queryString}`
    }
  }
  
  // 构建请求配置
  const config = {
    method: method.toUpperCase(),
    headers: {
      'Content-Type': 'application/json',
    }
  }
  
  // 添加请求体
  if (data && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT')) {
    config.body = JSON.stringify(data)
  }
  
  // 发送请求
  return fetch(fullUrl, config)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    })
    .then(data => {
      // 🔥 新增：适配新的API响应格式
      if (data && typeof data.success !== 'undefined') {
        // 新的ApiResponse格式
        if (data.success) {
          // 成功时返回兼容格式，保持组件代码不变
          return {
            code: 200,
            message: data.message,
            data: data.data
          }
        } else {
          // 失败时抛出错误
          const error = new Error(data.message || '请求失败')
          error.errorCode = data.errorCode
          error.apiResponse = data
          throw error
        }
      } else if (data && typeof data.code !== 'undefined') {
        // 兼容旧的Result格式（如果还有的话）
        if (data.code === 200) {
          return data
        } else {
          const error = new Error(data.message || '请求失败')
          error.code = data.code
          error.apiResponse = data
          throw error
        }
      } else {
        // 直接返回原始数据（用于其他可能的响应格式）
        return data
      }
    })
    .catch(error => {
      console.error('Request failed:', error)
      throw error
    })
}