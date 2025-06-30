// src/composables/useUser.js
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  getUserInfo, 
  setUserInfo, 
  removeUserInfo, 
  isAuthenticated,
  getUserId,
  getUsername,
  getUserRole,
  isAdmin,
  getUserStatus,
  isUserActive,
  formatUserRole,
  formatUserStatus
} from '../utils/auth.js'

// 全局用户状态
const userInfo = ref(getUserInfo())
const isLoggedIn = computed(() => !!userInfo.value)

export function useUser() {
  const router = useRouter()
  
  // 更新用户信息
  const updateUserInfo = (newUserInfo) => {
    userInfo.value = newUserInfo
    if (newUserInfo) {
      setUserInfo(newUserInfo)
    } else {
      removeUserInfo()
    }
  }
  
  // 登录成功后更新用户信息
  const login = (userData) => {
    updateUserInfo(userData)
    ElMessage.success('登录成功！')
  }
  
  // 登出
  const logout = () => {
    updateUserInfo(null)
    ElMessage.success('已退出登录')
    router.push('/login')
  }
  
  // 计算属性
  const currentUser = computed(() => userInfo.value)
  const currentUserId = computed(() => userInfo.value?.id)
  const currentUsername = computed(() => userInfo.value?.username)
  const currentUserRole = computed(() => userInfo.value?.role)
  const currentUserStatus = computed(() => userInfo.value?.status)
  const currentUserEmail = computed(() => userInfo.value?.email)
  const currentUserAvatar = computed(() => userInfo.value?.avatar)
  
  // 权限检查
  const hasAdminRole = computed(() => {
    const role = currentUserRole.value
    return role === 1 || role === 2
  })
  
  const isUserStatusActive = computed(() => {
    return currentUserStatus.value === 1
  })
  
  // 格式化显示
  const userRoleText = computed(() => {
    return formatUserRole(currentUserRole.value)
  })
  
  const userStatusText = computed(() => {
    return formatUserStatus(currentUserStatus.value)
  })
  
  // 权限检查方法
  const hasPermission = (requiredRole = 0) => {
    const role = currentUserRole.value
    return role !== undefined && role >= requiredRole
  }
  
  // 检查是否可以执行管理员操作
  const canPerformAdminAction = () => {
    return hasAdminRole.value && isUserStatusActive.value
  }
  
  return {
    // 状态
    userInfo: currentUser,
    isLoggedIn,
    
    // 用户信息
    userId: currentUserId,
    username: currentUsername,
    userRole: currentUserRole,
    userStatus: currentUserStatus,
    userEmail: currentUserEmail,
    userAvatar: currentUserAvatar,
    
    // 权限相关
    hasAdminRole,
    isUserStatusActive,
    userRoleText,
    userStatusText,
    
    // 方法
    login,
    logout,
    updateUserInfo,
    hasPermission,
    canPerformAdminAction
  }
}