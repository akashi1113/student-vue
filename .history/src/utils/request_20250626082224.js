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
      // 这里可以根据你的API响应格式进行调整
      return data
    })
    .catch(error => {
      console.error('Request failed:', error)
      throw error
    })
}
