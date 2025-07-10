<template>
  <div id="app">
    <!-- 顶部导航栏 -->
    <div class="top-navbar">
      <div class="logo-container">
        <h1>CSU智能化在线教学支持服务平台</h1>
      </div>

      <div class="user-profile" v-if="currentUser">
        <!-- 新增通知功能 -->
        <el-badge :value="unreadCount" :max="99" class="notification-badge" :hidden="unreadCount === 0">
          <el-icon class="notification-icon" @click="notificationDrawerVisible = true">
            <Bell />
          </el-icon>
        </el-badge>

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
        <!-- 通用导航项 - 所有人可见 -->
        <div class="nav-section">
          <router-link to="/" class="nav-item">
            <el-icon>
              <HomeFilled />
            </el-icon>
            <span>首页</span>
          </router-link>
          <router-link to="/forum" class="nav-item">
            <el-icon><ChatLineSquare /></el-icon>
            <span>社区论坛</span>
          </router-link>
        </div>

        <!-- 学生导航项 -->
        <div v-if="isStudent" class="nav-section">
          <router-link to="/course-home" class="nav-item">
            <el-icon>
              <School />
            </el-icon>
            <span>课程中心</span>
          </router-link>
          <router-link to="/knowledge" class="nav-item">
            <el-icon>
              <Collection />
            </el-icon>
            <span>知识库</span>
          </router-link>
          <router-link to="/exams" class="nav-item">
            <el-icon>
              <Document />
            </el-icon>
            <span>考试中心</span>
          </router-link>
          <router-link to="/student/homework" class="nav-item">
            <el-icon>
              <Notebook />
            </el-icon>
            <span>作业中心</span>
          </router-link>
          <router-link to="/experimentList" class="nav-item">
            <el-icon>
              <MagicStick />
            </el-icon>
            <span>实验中心</span>
          </router-link>
          <router-link to="/score-manage" class="nav-item">
            <el-icon>
              <DataLine />
            </el-icon>
            <span>我的成绩</span>
          </router-link>
          <router-link to="/learning-evaluation" class="nav-item">
            <el-icon>
              <TrendCharts />
            </el-icon>
            <span>学习评价</span>
          </router-link>
          <router-link to="/notes" class="nav-item">
            <el-icon>
              <Memo />
            </el-icon>
            <span>学习笔记</span>
          </router-link>
          <router-link to="/ai-chat" class="nav-item">
            <el-icon><ChatLineRound /></el-icon>
            <span>智学助手</span>
          </router-link>
          <router-link to="/ai/recommendation-history" class="nav-item">
            <el-icon>
              <Cpu />
            </el-icon>
            <span>AI推荐</span>
          </router-link>
        </div>

        <!-- 教师导航项 -->
        <div v-if="isTeacher" class="nav-section">
          <router-link to="/teacher/exams" class="nav-item">
            <el-icon>
              <EditPen />
            </el-icon>
            <span>考试管理</span>
          </router-link>
          <router-link to="/teacher/homework" class="nav-item">
            <el-icon>
              <Checked />
            </el-icon>
            <span>作业管理</span>
          </router-link>
          <router-link to="/teacher/experimentList" class="nav-item">
            <el-icon>
              <MagicStick />
            </el-icon>
            <span>实验管理</span>
          </router-link>
          <router-link to="/analytics" class="nav-item">
            <el-icon>
              <DataAnalysis />
            </el-icon>
            <span>教学分析</span>
          </router-link>
        </div>

        <!-- 管理员导航项 -->
        <div v-if="isAdmin" class="nav-section">
          <!-- 新增管理后台 -->
          <router-link to="/admin" class="nav-item">
            <el-icon>
              <Setting />
            </el-icon>
            <span>后台管理</span>
          </router-link>
          <router-link to="/teacher/exams" class="nav-item">
            <el-icon>
              <List />
            </el-icon>
            <span>考试管理</span>
          </router-link>
          <router-link to="/teacher/experimentList" class="nav-item">
            <el-icon>
              <MagicStick />
            </el-icon>
            <span>实验管理</span>
          </router-link>
          <router-link to="/audit/report" class="nav-item">
            <el-icon>
              <Monitor />
            </el-icon>
            <span>日志审计</span>
          </router-link>
        </div>
      </div>

      <!-- 主内容区 -->
      <div class="main-content">
        <router-view />
      </div>
    </div>

    <!-- 通知抽屉组件 -->
    <NotificationDrawer :visible="notificationDrawerVisible" :current-user-id="currentUserId"
      @close="notificationDrawerVisible = false" @update-unread-count="fetchUnreadCount" />
  </div>
</template>


<script>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElDropdown, ElDropdownMenu, ElDropdownItem, ElAvatar, ElIcon, ElBadge } from 'element-plus'
import {
  HomeFilled,
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
  List,
  Setting,
  User,
  Bell,
  ChatLineSquare,
  School,
  Memo
} from '@element-plus/icons-vue'
import NotificationDrawer from './components/NotificationDrawer.vue'
import { notificationAPI } from './api'

export default {
  name: 'App',
  components: {
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    ElAvatar,
    ElIcon,
    ElBadge,
    HomeFilled,
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
    List,
    Setting,
    Bell,
    NotificationDrawer,
    ChatLineSquare,
    School,
    Memo
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const defaultAvatar = ref('https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png')
    const currentUser = ref(null)

    // 新增通知功能相关状态
    const notificationDrawerVisible = ref(false);
    const unreadCount = ref(0);
    let pollInterval = null;
    const currentUserId = computed(() => {
      return currentUser.value?.id || localStorage.getItem('userId')
    })

    const loadUserInfo = () => {
      const token = localStorage.getItem('token')
      const userInfo = localStorage.getItem('userInfo')
      const role = localStorage.getItem('role')
      const username = localStorage.getItem('username')
      const userId = localStorage.getItem('userId')

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

          // 从JWT中提取用户ID
          if (userId && !currentUser.value.id) {
            currentUser.value.id = userId
          }
        } catch (e) {
          console.error('解析用户信息失败:', e)
          logout()
        }
      } else if (role && username) {
        currentUser.value = {
          username: username,
          roleDesc: role,
          id: userId || Date.now().toString() // 临时ID
        }
      }
    }

    // 新增通知功能方法
    const fetchUnreadCount = async () => {
      if (!currentUserId.value) return;
      try {
        const count = await notificationAPI.getUnreadCount({
          userId: currentUserId.value
        });
        unreadCount.value = count;
      } catch (error) {
        console.error("获取未读消息数失败:", error);
      }
    };

    const startPolling = () => {
      fetchUnreadCount();
      pollInterval = setInterval(fetchUnreadCount, 30000);
    };

    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };

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
      window.addEventListener('storage', handleStorageChange)
      startPolling();
    })

    onBeforeUnmount(() => {
      window.removeEventListener('storage', handleStorageChange)
      stopPolling();
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
      // 通知功能相关
      notificationDrawerVisible,
      unreadCount,
      currentUserId,
      fetchUnreadCount
    }
  }
}
</script>

<style scoped>
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

/* 顶部导航栏样式 - 蓝色渐变 */
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

/* 新增导航链接样式 */
.nav-links {
  display: flex;
  margin-left: 40px;
}

.nav-item {
  color: white;
  text-decoration: none;
  font-size: 16px;
  padding: 8px 15px;
  border-radius: 4px;
  transition: background-color 0.3s;
  margin-right: 10px;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.router-link-active {
  background-color: rgba(255, 255, 255, 0.2);
  font-weight: 500;
}

/* 用户信息区域调整 */
.user-profile {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* 通知图标样式 */
.notification-badge {
  cursor: pointer;
}

.notification-icon {
  font-size: 22px;
  color: white;
  transition: color 0.3s;
}

.notification-icon:hover {
  color: #e6f7ff;
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

.sidebar {
  width: 220px;
  background-color: white;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  overflow-y: auto;
  transition: all 0.3s;
  z-index: 5;
  padding: 8px 0; /* 减少整体内边距 */
}

/* 完全统一导航区块样式 */
.nav-section {
  margin-bottom: 0; /* 完全移除区块间距 */
  padding: 0 8px;
}

.nav-title {
  font-size: 12px;
  color: #8a92a5;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 8px 12px 4px; /* 调整标题内边距 */
  font-weight: 600;
  margin-top: 8px; /* 减少标题上方间距 */
}

/* 第一个导航区块不需要标题上边距 */
.nav-section:first-child .nav-title {
  margin-top: 0;
}

/* 完全统一导航项样式 */
.nav-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  color: #5a5e66;
  text-decoration: none;
  transition: all 0.3s;
  font-size: 14px;
  border-left: 3px solid transparent;
  border-radius: 4px;
  margin: 2px 0; /* 最小化上下间距 */
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
  color: #5a5e66;
}

.nav-item:hover .el-icon,
.nav-item.router-link-exact-active .el-icon {
  color: #1976d2;
}

.nav-item[href*="forum"] .el-icon {
  color: inherit;
}

.nav-item.router-link-exact-active[href*="forum"] {
  color: #1976d2;
  background-color: #f0f7ff;
  border-left-color: #1976d2;
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