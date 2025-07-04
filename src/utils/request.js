// src/utils/request.js
import axios from 'axios';
import { ElMessage } from 'element-plus'
import router from '../router'

// 两种请求方式并存，可以通过不同导出名使用
const BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'

// ==================== Axios 实例 ====================
const axiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器：自动加token
axiosInstance.interceptors.request.use(config => {
  // 自动加token
  const token = localStorage.getItem('token')
  if (token) {
    config.headers['Authorization'] = 'Bearer ' + token
  }
  config.headers = {
    ...(config.headers || {}),
    ...(config.headers.Authorization ? {
      'Authorization': config.headers.Authorization
    } : {})
  };
  // 如果没有手动设置Content-Type，才默认application/json
  if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

// ==================== Fetch 封装 ====================
function fetchRequest(options) {
  const { url, method = 'GET', data, params, responseType } = options
  
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
      
      // 添加调试日志，仅在查询审计报表时显示
      if (url.includes('/api/audit/report')) {
        console.log('发送到API的完整URL:', fullUrl)
        console.log('完整的请求参数:', params)
      }
    }
  }
  
  // 构建请求配置
  const config = {
    method: method.toUpperCase(),
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include' // 支持跨域携带cookie，用于session认证
  }
  
  // 自动加token
  const token = localStorage.getItem('token')
  if (token) {
    config.headers['Authorization'] = 'Bearer ' + token
  }
  
  // 处理FormData（用于登录等接口）
  if (data instanceof FormData) {
    // 删除Content-Type，让浏览器自动设置
    delete config.headers['Content-Type']
    config.body = data
  } else if (data && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT')) {
    config.body = JSON.stringify(data)
  }
  
  // 发送请求
  return fetch(fullUrl, config)
    .then(response => {
      if (!response.ok) {
        // 处理HTTP错误状态
        if (response.status === 401) {
          ElMessage.error('未授权，请重新登录')
          router.push('/login')
        } else if (response.status === 403) {
          ElMessage.error('拒绝访问')
        } else if (response.status === 404) {
          ElMessage.error('请求地址出错')
        } else if (response.status >= 500) {
          ElMessage.error('服务器内部错误')
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      // 新增：如果需要blob，直接返回blob
      if (responseType === 'blob') {
        return response.blob()
      }
      return response.json()
    })
    .then(data => {
      // 🔥 适配新的API响应格式
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
          // 失败时显示错误信息并抛出错误
          ElMessage.error(data.message || '请求失败')
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
          // 处理业务错误
          ElMessage.error(data.message || '操作失败')
          
          // 401未授权，跳转到登录页
          if (data.code === 401) {
            router.push('/login')
          }
          
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
      // 网络错误等情况
      if (!error.apiResponse && !error.message.includes('HTTP error!')) {
        ElMessage.error('网络错误，请检查网络连接')
      }
      throw error
    })
}

// 导出两种请求方式
export {
  axiosInstance as axiosRequest,
  fetchRequest as default
}