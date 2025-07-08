<template>
  <div class="home-container">
    <div class="welcome-card">
      <h1>欢迎回来，{{ userInfo.username }}！</h1>
      <div class="user-info">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="角色">{{ userInfo.roleDesc }}</el-descriptions-item>
          <el-descriptions-item label="上次登录时间">{{ lastLoginTime }}</el-descriptions-item>
          <el-descriptions-item label="系统消息">您有 {{ messageCount }} 条未读消息</el-descriptions-item>
        </el-descriptions>
      </div>
    </div>

    <div class="quick-actions">
      <h2>快捷操作</h2>
      <div class="action-grid">
        <el-card
            v-for="action in quickActions"
            :key="action.path"
            shadow="hover"
            class="action-card"
            @click="navigateTo(action.path)"
        >
          <div class="action-content">
            <el-icon :size="36" :color="action.color">
              <component :is="action.icon" />
            </el-icon>
            <span>{{ action.title }}</span>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  User,
  Notebook,
  Document,
  CollectionTag,
  DataAnalysis,
  Clock,
  Star
} from '@element-plus/icons-vue'

export default {
  name: 'HomePage',
  setup() {
    const router = useRouter()

    // 用户信息从localStorage获取
    const userInfo = computed(() => {
      const userData = JSON.parse(localStorage.getItem('userInfo'))
      return userData?.user || {}
    })

    // 上次登录时间
    const lastLoginTime = ref(new Date().toLocaleString())

    // 未读消息数
    const messageCount = ref(3)

    // 快捷操作
    const quickActions = ref([
      { title: '知识库', path: '/knowledge', icon: CollectionTag, color: '#409EFF' },
      { title: '考试中心', path: '/exams', icon: CollectionTag, color: '#E6A23C' },
      { title: '作业中心', path: '/student/homework', icon: Document, color: '#67C23A' },
      { title: '课程中心', path: '/course-home', icon: Notebook, color: '#F56C6C' },
      { title: '智学助手', path: '/ai-chat', icon: Star, color: '#FFD700' }
    ])

    // 导航方法
    const navigateTo = (path) => {
      router.push(path)
    }

    // 组件挂载时更新登录时间
    onMounted(() => {
      // 这里可以添加获取用户详细信息的API调用
      console.log('用户已登录:', userInfo.value)
    })

    return {
      userInfo,
      lastLoginTime,
      messageCount,
      quickActions,
      navigateTo
    }
  }
}
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 16px 24px 16px;
}

.welcome-card {
  background: linear-gradient(135deg, #5fa8ff 0%, #a6c8ff 100%);
  color: white;
  padding: 40px 32px 32px 32px;
  border-radius: 20px;
  margin-bottom: 32px;
  box-shadow: 0 8px 32px rgba(64, 158, 255, 0.18);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.welcome-card h1 {
  margin: 0 0 24px 0;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 1px;
}

.user-info {
  background: white;
  padding: 24px 32px;
  border-radius: 16px;
  color: #606266;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.08);
  min-width: 320px;
}

.quick-actions {
  margin: 40px 0 32px 0;
}

.quick-actions h2 {
  color: #303133;
  margin-bottom: 28px;
  font-size: 26px;
  font-weight: 600;
  letter-spacing: 1px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 28px;
}

.action-card {
  cursor: pointer;
  transition: transform 0.25s, box-shadow 0.25s;
  border-radius: 18px;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.10);
  background: #fff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-card:hover {
  transform: translateY(-8px) scale(1.04);
  box-shadow: 0 8px 32px rgba(64, 158, 255, 0.18);
}

.action-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 0 24px 0;
}

.action-content span {
  margin-top: 16px;
  font-size: 18px;
  font-weight: 500;
  color: #333;
  letter-spacing: 0.5px;
}

@media (max-width: 900px) {
  .home-container {
    padding: 16px 4px;
  }
  .welcome-card {
    padding: 24px 12px;
    border-radius: 14px;
  }
  .user-info {
    padding: 16px 8px;
    border-radius: 10px;
    min-width: 0;
  }
  .action-content {
    padding: 18px 0 12px 0;
  }
}
</style>