// src/utils/auth.js

/**
 * 获取用户信息
 */
export function getUserInfo() {
    const userInfo = localStorage.getItem('userInfo')
    try {
      return userInfo ? JSON.parse(userInfo) : null
    } catch (error) {
      console.error('解析用户信息失败:', error)
      removeUserInfo()
      return null
    }
  }
  
  /**
   * 设置用户信息
   * @param {Object} userInfo 用户信息
   */
  export function setUserInfo(userInfo) {
    localStorage.setItem('userInfo', JSON.stringify(userInfo))
  }
  
  /**
   * 移除用户信息
   */
  export function removeUserInfo() {
    localStorage.removeItem('userInfo')
  }
  
  /**
   * 检查是否已登录
   */
  export function isAuthenticated() {
    return !!getUserInfo()
  }
  
  /**
   * 获取用户ID
   */
  export function getUserId() {
    const userInfo = getUserInfo()
    return userInfo ? userInfo.id : null
  }
  
  /**
   * 获取用户名
   */
  export function getUsername() {
    const userInfo = getUserInfo()
    return userInfo ? userInfo.username : null
  }
  
  /**
   * 获取用户角色
   */
  export function getUserRole() {
    const userInfo = getUserInfo()
    return userInfo ? userInfo.role : null
  }
  
  /**
   * 检查是否是管理员
   */
  export function isAdmin() {
    const role = getUserRole()
    // 根据你的角色定义调整这里的判断逻辑
    // 假设角色定义：0-普通用户，1-管理员，2-超级管理员
    return role === 1 || role === 2
  }
  
  /**
   * 检查用户状态
   */
  export function getUserStatus() {
    const userInfo = getUserInfo()
    return userInfo ? userInfo.status : null
  }
  
  /**
   * 检查用户是否激活
   */
  export function isUserActive() {
    const status = getUserStatus()
    // 假设状态定义：0-禁用，1-正常
    return status === 1
  }
  
  /**
   * 登出
   */
  export function logout() {
    removeUserInfo()
    // 如果需要调用后端登出接口，可以在这里添加
    // 由于使用Session认证，可能需要调用后端的logout接口清除session
  }
  
  /**
   * 格式化用户角色显示文本
   * @param {number} role 角色值
   */
  export function formatUserRole(role) {
    const roleMap = {
      0: '普通用户',
      1: '管理员',
      2: '超级管理员'
    }
    return roleMap[role] || '未知'
  }
  
  /**
   * 格式化用户状态显示文本
   * @param {number} status 状态值
   */
  export function formatUserStatus(status) {
    const statusMap = {
      0: '已禁用',
      1: '正常'
    }
    return statusMap[status] || '未知'
  }