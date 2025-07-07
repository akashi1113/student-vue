<template>
  <div id="app">
    <!-- 顶部导航栏 -->
    <div class="top-navbar">
      <div class="logo-container">
        <h1>CSU学生管理系统</h1>
      </div>
      <div class="user-profile" v-if="currentUser">
        <el-dropdown>
          <div class="user-info">
            <el-avatar :size="36" :src="currentUser.avatar || defaultAvatar" />
            <div class="user-details">
              <span class="username">{{ currentUser.username }}</span>
              <span class="role">{{ currentUser.roleDesc }}</span>
            </div>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="goToProfile">个人中心</el-dropdown-item>
              <el-dropdown-item @click="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 侧边导航栏 -->
    <div class="app-container">
      <div class="sidebar" v-if="isAuthenticated">

        <!-- 学生导航项 -->
        <div v-if="isStudent" class="nav-section">
          <router-link to="/knowledge" class="nav-item">
            <el-icon><Collection /></el-icon>
            <span>知识库</span>
          </router-link>
          <router-link to="/exams" class="nav-item">
            <el-icon><Document /></el-icon>
            <span>考试中心</span>
          </router-link>
          <router-link to="/student/homework" class="nav-item">
            <el-icon><Notebook /></el-icon>
            <span>作业中心</span>
          </router-link>
          <router-link to="/experimentList" class="nav-item">
            <el-icon><MagicStick /></el-icon>
            <span>实验中心</span>
          </router-link>
          <router-link to="/score-manage" class="nav-item">
            <el-icon><DataLine /></el-icon>
            <span>我的成绩</span>
          </router-link>
          <router-link to="/learning-evaluation" class="nav-item">
            <el-icon><TrendCharts /></el-icon>
            <span>学习评价</span>
          </router-link>
          <router-link to="/ai/recommendation-history" class="nav-item">
            <el-icon><Cpu /></el-icon>
            <span>AI推荐</span>
          </router-link>
        </div>

        <!-- 教师导航项 -->
        <div v-if="isTeacher" class="nav-section">
          <router-link to="/teacher/exams" class="nav-item">
            <el-icon><EditPen /></el-icon>
            <span>考试管理</span>
          </router-link>
          <router-link to="/teacher/homework" class="nav-item">
            <el-icon><Checked /></el-icon>
            <span>作业管理</span>
          </router-link>
          <router-link to="/analytics" class="nav-item">
            <el-icon><DataAnalysis /></el-icon>
            <span>教学分析</span>
          </router-link>
        </div>

        <!-- 管理员导航项 -->
        <div v-if="isAdmin" class="nav-section">
          <div class="nav-title">管理功能</div>
          <router-link to="/exam-booking/time-slot-management" class="nav-item">
            <el-icon><Calendar /></el-icon>
            <span>考试安排</span>
          </router-link>
          <router-link to="/exam-booking/booking-management" class="nav-item">
            <el-icon><List /></el-icon>
            <span>预约管理</span>
          </router-link>
          <router-link to="/system/manage" class="nav-item">
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </router-link>
          <router-link to="/user/manage" class="nav-item">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </router-link>
          <router-link to="/audit/report" class="nav-item">
            <el-icon><Monitor /></el-icon>
            <span>日志审计</span>
          </router-link>
        </div>
      </div>

      <!-- 主内容区 -->
      <div class="main-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElDropdown, ElDropdownMenu, ElDropdownItem, ElAvatar, ElIcon } from 'element-plus'
import {
  Collection,
  Document,
  Notebook,
  MagicStick,
  DataLine,
  TrendCharts,
  Cpu,
  EditPen,
  Checked,
  DataAnalysis,
  Monitor,
  Calendar,
  List,
  Setting,
  User
} from '@element-plus/icons-vue'

export default {
  name: 'App',
  components: {
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    ElAvatar,
    ElIcon,
    Collection,
    Document,
    Notebook,
    MagicStick,
    DataLine,
    TrendCharts,
    Cpu,
    EditPen,
    Checked,
    DataAnalysis,
    Monitor,
    Calendar,
    List,
    Setting,
    User
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const defaultAvatar = ref('https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png')
    const currentUser = ref(null)

    const loadUserInfo = () => {
      const token = localStorage.getItem('token')
      const userInfo = localStorage.getItem('userInfo')
      const role = localStorage.getItem('role')
      const username = localStorage.getItem('username')

      // 如果没有token，清除用户信息
      if (!token) {
        currentUser.value = null
        return
      }

      if (userInfo) {
        try {
          const parsedUserInfo = JSON.parse(userInfo)
          currentUser.value = parsedUserInfo.user

          if (!currentUser.value.roleDesc && role) {
            currentUser.value.roleDesc = role
          }

          if (!currentUser.value.username && username) {
            currentUser.value.username = username
          }
        } catch (e) {
          console.error('解析用户信息失败:', e)
          logout()
        }
      } else if (role && username) {
        currentUser.value = {
          username: username,
          roleDesc: role
        }
      }
    }

    const logout = () => {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('role')
      localStorage.removeItem('username')

      currentUser.value = null
      router.push('/login')
      ElMessage.success('已成功退出登录')
    }

    const goToProfile = () => {
      router.push('/profile')
    }

    // 使用计算属性来动态判断用户状态和角色
    const isAuthenticated = computed(() => {
      return !!currentUser.value && !!localStorage.getItem('token')
    })

    const isStudent = computed(() => {
      return currentUser.value && currentUser.value.roleDesc === '学生'
    })

    const isTeacher = computed(() => {
      return currentUser.value && currentUser.value.roleDesc === '教师'
    })

    const isAdmin = computed(() => {
      return currentUser.value && currentUser.value.roleDesc === '管理员'
    })

    // 监听路由变化，在每次路由变化时重新加载用户信息
    watch(route, () => {
      loadUserInfo()
    }, { immediate: true })

    // 监听localStorage变化（可选，用于处理多标签页同步）
    const handleStorageChange = () => {
      loadUserInfo()
    }

    onMounted(() => {
      loadUserInfo()
      // 监听localStorage变化事件
      window.addEventListener('storage', handleStorageChange)
    })

    // 组件销毁时清除事件监听
    const cleanup = () => {
      window.removeEventListener('storage', handleStorageChange)
    }

    return {
      currentUser,
      defaultAvatar,
      logout,
      goToProfile,
      isAuthenticated,
      isStudent,
      isTeacher,
      isAdmin,
      cleanup
    }
  },
  beforeUnmount() {
    this.cleanup()
  }
}
</script>

<style scoped>
/* 你的样式保持不变 */
#app {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

/* 顶部导航栏样式 */
.top-navbar {
  height: 60px;
  background: linear-gradient(135deg, #1976d2 0%, #2196f3 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 10;
}

.logo-container h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.user-profile {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 20px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.user-details {
  display: flex;
  flex-direction: column;
  margin-left: 10px;
}

.username {
  font-size: 14px;
  font-weight: 500;
}

.role {
  font-size: 12px;
  opacity: 0.8;
}

/* 主容器布局 */
.app-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 侧边栏样式 */
.sidebar {
  width: 220px;
  background-color: white;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  overflow-y: auto;
  transition: all 0.3s;
  z-index: 5;
}

.nav-section {
  margin-bottom: 16px;
}

.nav-title {
  font-size: 12px;
  color: #8a92a5;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 16px 20px 8px;
  font-weight: 600;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: #5a5e66;
  text-decoration: none;
  transition: all 0.3s;
  font-size: 14px;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  color: #1976d2;
  background-color: #f0f7ff;
}

.nav-item.router-link-exact-active {
  color: #1976d2;
  background-color: #f0f7ff;
  border-left-color: #1976d2;
  font-weight: 500;
}

.nav-item .el-icon {
  margin-right: 8px;
  font-size: 18px;
}

/* 主内容区样式 */
.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #f5f7fa;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .sidebar {
    width: 200px;
  }
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -220px;
    top: 60px;
    bottom: 0;
    z-index: 100;
    transition: transform 0.3s;
  }

  .sidebar.active {
    transform: translateX(220px);
  }

  .top-navbar {
    padding: 0 16px;
  }

  .logo-container h1 {
    font-size: 18px;
  }
}

@media (max-width: 576px) {
  .user-details {
    display: none;
  }

  .user-info {
    padding: 8px;
  }

  .main-content {
    padding: 16px;
  }
}
</style>