// src/utils/request.js
import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '../router';

// 两种请求方式并存，可以通过不同导出名使用
const BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080';

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
  const { url, method = 'GET', data, params, responseType } = options;
  
  // 构建完整URL
  let fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  
  // 添加查询参数
  if (params) {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {

      fullUrl += `?${queryString}`;
    }
  }
  
  // 构建请求配置
  const config = {
    method: method.toUpperCase(),
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include' // 支持跨域携带cookie，用于session认证
  };
  
  // 自动加token
  const token = localStorage.getItem('token')
  if (token) {
    config.headers['Authorization'] = 'Bearer ' + token
  }
  
  // 处理FormData（用于登录等接口）
  if (data instanceof FormData) {
    // 删除Content-Type，让浏览器自动设置
    delete config.headers['Content-Type'];
    config.body = data;
  } else if (data && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT')) {
    config.body = JSON.stringify(data);
  }
  
  // 发送请求
  return fetch(fullUrl, config)
    .then(async response => {
      if (!response.ok) {
        // 处理HTTP错误状态
        if (response.status === 401) {
          ElMessage.error('未授权，请重新登录');
          router.push('/login');
        } else if (response.status === 403) {
          ElMessage.error('拒绝访问');
        } else if (response.status === 404) {
          ElMessage.error('请求地址出错');
        } else if (response.status >= 500) {
          ElMessage.error('服务器内部错误');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // 检查响应内容类型和内容长度
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      
      // 如果是blob类型直接返回
      if (responseType === 'blob') {
        return response.blob();
      }
      
      // 如果响应可能为空
      if (!contentType || !contentType.includes('application/json') || 
          (contentLength && parseInt(contentLength) === 0)) {
        return { success: true, message: '操作成功', data: null };
      }
      
      try {
        const data = await response.json();
        return data;
      } catch (e) {
        console.warn('JSON解析失败，返回空响应', e);
        return { success: true, message: '操作成功', data: null };
      }
    })
    .then(data => {
      // 适配API响应格式
      if (data && typeof data.success !== 'undefined') {
        // 新的ApiResponse格式
        if (data.success) {
          return {
            code: 200,
            message: data.message || '操作成功',
            data: data.data
          };
        } else {
          // 失败时显示错误信息并抛出错误
          const errorMsg = data.message || '请求失败';
          ElMessage.error(errorMsg);
          const error = new Error(errorMsg);
          error.errorCode = data.errorCode;
          error.apiResponse = data;
          throw error;
        }
      } else if (data && typeof data.code !== 'undefined') {
        // 兼容旧的Result格式
        if (data.code === 200) {
          return data;
        } else {
          // 处理业务错误
          ElMessage.error(data.message || '操作失败');
          
          // 401未授权，跳转到登录页
          if (data.code === 401) {
            router.push('/login');
          }
          
          const error = new Error(data.message || '请求失败');
          error.code = data.code;
          error.apiResponse = data;
          throw error;
        }
      } else {
        // 直接返回原始数据（用于其他可能的响应格式）
        return data || { code: 200, message: '操作成功', data: null };
      }
    })
    .catch(error => {
      console.error('Request failed:', error);
      
      let errorMsg = error.message;
      
      // 特殊处理JSON解析错误
      if (error.message.includes('Failed to execute \'json\' on \'Response\'')) {
        errorMsg = '服务器返回了无效的响应格式';
      }
      // 处理网络错误
      else if (!error.apiResponse && !error.message.includes('HTTP error!')) {
        errorMsg = '网络错误，请检查网络连接';
      }
      
      // 显示错误消息
      if (errorMsg !== error.message) {
        ElMessage.error(errorMsg);
      }
      
      // 包装错误对象
      const wrappedError = new Error(errorMsg);
      wrappedError.originalError = error;
      wrappedError.apiResponse = error.apiResponse;
      
      throw wrappedError;
    });
}

// 导出两种请求方式
export {
  axiosInstance as axiosRequest,
  fetchRequest as default
};