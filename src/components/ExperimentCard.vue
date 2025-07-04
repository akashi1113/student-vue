<template>
  <div class="experiment-card">
    <div class="card-header">
      <h3>{{ experiment.name }}</h3>
      <el-tag :type="statusTagType">{{ getSubjectName(experiment.subject) }}</el-tag>
    </div>

    <div class="card-content">
      <p class="description">{{ experiment.description }}</p>

      <div class="meta-info">
        <span class="duration">
          <el-icon><Timer /></el-icon>
          约 {{ experiment.duration }} 分钟
        </span>
        <span class="status" :class="'status-' + experiment.status">
          <el-icon v-if="experiment.status === 1"><CircleCheck /></el-icon>
          <el-icon v-if="experiment.status === 0"><Warning /></el-icon>
          {{ getStatusText(experiment.status) }}
        </span>
      </div>
    </div>

    <div class="card-actions">
      <el-button
          type="primary"
          @click="handleStartExperiment"
          :disabled="experiment.status !== 1"
      >
        去实验
      </el-button>
      <el-button @click="viewDetails">查看详情</el-button>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Timer, CircleCheck, Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'ExperimentCard',
  components: {
    Timer,
    CircleCheck,
    Warning
  },
  props: {
    experiment: {
      type: Object,
      required: true,
      validator: (value) => {
        return value.id && value.name && value.status !== undefined
      }
    },
    bookingId: {
      type: Number,
      default: null
    }
  },
  setup(props) {
    const router = useRouter()

    const subjects = [
      { value: 'c++', label: 'C++' },
      { value: 'java', label: 'JAVA' },
      { value: 'bianyi', label: '编译原理' },
      { value: 'ssd1', label: 'SSD1' },
      { value: 'database', label: '数据库' }
    ]

    const statusTextMap = {
      1: '可预约',
      2: '已满额',
      0: '已预约',
      3: '已关闭'
    }

    const getSubjectName = (value) => {
      const subject = subjects.find(s => s.value === value)
      return subject ? subject.label : value
    }

    const getStatusText = (status) => {
      return statusTextMap[status] || '未知状态'
    }

    const statusTagType = computed(() => {
      const types = {
        'c++': '',
        'java': 'success',
        'bianyi': 'warning',
        'ssd1': 'danger',
        'database': 'info'
      }
      return types[props.experiment.subject] || ''
    })

    const viewDetails = () => {
      if (!props.experiment?.id) {
        ElMessage.error('无效的实验ID')
        return
      }

      router.push({
        name: 'ExperimentDetail',
        params: {
          id: props.experiment.id
        }
      }).catch(err => {
        console.error('路由跳转失败:', err)
        ElMessage.error('无法跳转到详情页')
      })
    }

    const handleStartExperiment = () => {
      if (!props.experiment?.id) {
        ElMessage.error('无效的实验ID')
        return
      }

      if (props.experiment.status !== 1) {
        ElMessage.warning(`当前实验状态为 ${getStatusText(props.experiment.status)}，无法进行`)
        return
      }

      console.log('正在跳转到实验页面，ID:', props.experiment.id)

      router.push({
        name: 'ExperimentConducting',
        params: {
          experimentId: props.experiment.id
        }
      }).catch(err => {
        console.error('路由跳转失败:', err)
        ElMessage.error(`无法跳转到实验界面: ${err.message}`)
      })
    }

    return {
      getSubjectName,
      getStatusText,
      statusTagType,
      viewDetails,
      handleStartExperiment
    }
  }
}
</script>

<style scoped>
.experiment-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.experiment-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.card-header {
  padding: 15px;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.card-content {
  padding: 15px;
  flex: 1;
}

.description {
  color: #606266;
  font-size: 14px;
  margin-bottom: 15px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 60px;
}

.meta-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  color: #909399;
  font-size: 13px;
}

.meta-info .duration {
  display: flex;
  align-items: center;
  gap: 5px;
}

.card-actions {
  padding: 10px 15px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
}

.status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.status-1 {
  color: #67c23a;
}

.status-2 {
  color: #f56c6c;
}

.status-0 {
  color: #e6a23c;
}

.status-3 {
  color: #909399;
}

.el-icon {
  vertical-align: middle;
}

/* 禁用按钮样式 */
.el-button.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>