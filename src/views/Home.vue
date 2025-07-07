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

    <div class="recent-activities">
      <h2>最近活动</h2>
      <el-timeline>
        <el-timeline-item
            v-for="(activity, index) in activities"
            :key="index"
            :timestamp="activity.time"
            :color="activity.color"
        >
          {{ activity.content }}
        </el-timeline-item>
      </el-timeline>
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
      { title: '我的课程', path: '/courses', icon: Notebook, color: '#409EFF' },
      { title: '待做作业', path: '/student/homework', icon: Document, color: '#67C23A' },
      { title: '考试安排', path: '/exams', icon: CollectionTag, color: '#E6A23C' },
      { title: '学习分析', path: '/analytics', icon: DataAnalysis, color: '#F56C6C' }
    ])

    // 最近活动
    const activities = ref([
      {
        content: '完成了《数据结构》第3章作业',
        time: '2023-05-15 14:30',
        color: '#0bbd87'
      },
      {
        content: '参加了《操作系统》期中考试',
        time: '2023-05-10 09:00',
        color: '#409EFF'
      },
      {
        content: '提交了《数据库原理》实验报告',
        time: '2023-05-08 16:45',
        color: '#E6A23C'
      },
      {
        content: '加入了《计算机网络》课程',
        time: '2023-05-01 10:20',
        color: '#909399'
      }
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
      activities,
      navigateTo
    }
  }
}
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.welcome-card {
  background: linear-gradient(135deg, #409EFF 0%, #79BBFF 100%);
  color: white;
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.welcome-card h1 {
  margin: 0 0 20px 0;
  font-size: 28px;
}

.user-info {
  background: white;
  padding: 20px;
  border-radius: 8px;
  color: #606266;
}

.quick-actions {
  margin: 30px 0;
}

.quick-actions h2 {
  color: #303133;
  margin-bottom: 20px;
  font-size: 22px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.action-card {
  cursor: pointer;
  transition: transform 0.3s;
}

.action-card:hover {
  transform: translateY(-5px);
}

.action-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.action-content span {
  margin-top: 10px;
  font-size: 16px;
}

.recent-activities {
  margin-top: 30px;
}

.recent-activities h2 {
  color: #303133;
  margin-bottom: 20px;
  font-size: 22px;
}
</style>