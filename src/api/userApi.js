// src/api/userApi.js
import request from '../utils/request.js'

/**
 * 用户登录
 * @param {string} username 用户名
 * @param {string} password 密码
 */
export function login(username, password) {
  // 使用FormData因为后端接收@RequestParam
  const formData = new FormData()
  formData.append('username', username)
  formData.append('password', password)
  
  return request({
    url: '/api/users/login',
    method: 'POST',
    data: formData
  })
}

/**
 * 用户注册
 * @param {Object} userData 用户数据
 */
export function register(userData) {
  return request({
    url: '/api/users/register',
    method: 'POST',
    data: userData
  })
}

/**
 * 根据ID获取用户信息
 * @param {number} id 用户ID
 */
export function getUserById(id) {
  return request({
    url: `/api/users/${id}`,
    method: 'GET'
  })
}

/**
 * 更新用户信息
 * @param {number} id 用户ID
 * @param {Object} userData 用户数据
 */
export function updateProfile(id, userData) {
  return request({
    url: `/api/users/${id}`,
    method: 'PUT',
    data: userData
  })
}

/**
 * 修改密码
 * @param {number} id 用户ID
 * @param {string} oldPassword 旧密码
 * @param {string} newPassword 新密码
 */
export function changePassword(id, oldPassword, newPassword) {
  return request({
    url: `/api/users/${id}/password`,
    method: 'PUT',
    params: {
      oldPassword,
      newPassword
    }
  })
}