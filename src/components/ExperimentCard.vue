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
        <span class="approval-status" :class="'approval-status-' + approvalStatus">
          {{ getApprovalStatusText(approvalStatus) }}
        </span>
      </div>
    </div>
    
    <div class="card-actions">
      <!-- <el-button 
        type="primary" 
        @click="handleBook"
        :disabled="!isBookable"
      >
        去实验
      </el-button>
      <el-button @click="viewDetails">查看详情</el-button> -->
      <el-button 
        type="primary" 
        @click="handleBook"
        :disabled="canStartExperiment"
      >
        {{ getButtonText() }}
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
import { useExperimentStore } from '@/store/experiment'
import { ref } from 'vue'
import { getPublishedExperiments } from '@/api/experiment'
import ExperimentConducting from '@/views/experiment/ExperimentConducting.vue'

export default {
  name: 'ExperimentCard',
  components: {
    Timer,
    CircleCheck,
    Warning,
    ExperimentConducting
  },
  props: {
    experiment: {
      type: Object,
      required: true,
      validator: (value) => {
        console.log('Card接收的experiment:', value)
        return 'id' in value && 'name' in value
      }
    },
    bookingId: {
      type: Number,
      required: false
    }
  },
  setup(props) {
    const router = useRouter()
    const experimentStore = useExperimentStore()
    const experiments = ref([])

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

    const approvalStatusTextMap = {
      0: '待审批',
      1: '审批中',
      2: '已批准',
      3: '已拒绝'
    }

    const approvalStatus = computed(() => {
      console.log('当前实验对象:', props.experiment); // 调试日志
      console.log('approval_status值:', props.experiment.approval_status);
      return props.experiment.approval_status ?? 0
    })

    // 计算是否可预约
    const isBookable = computed(() => {
      return props.experiment.status === 1 && approvalStatus.value === 2
    })

    // 计算是否可以开始实验（已批准且已预约）
    const canStartExperiment = computed(() => {
      return props.experiment.status === 0 && approvalStatus.value === 2
    })

    // 获取按钮文本
    const getButtonText = () => {
      if (props.experiment.status === 0) {
        return approvalStatus.value === 2 ? '去实验' : '已预约'
      }
      return '去实验'
    }

    const getApprovalStatusText = (status) => {
      return approvalStatusTextMap[status] || '未知审批状态'
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
      console.log(props.experiment.id)
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

    const handleBook = () => {
      // router.push({
      //     name: 'ExperimentConducting',
      //     params: { 
      //       experimentId: props.experiment.id 
      //     }
      //   }).catch(err => {
      //     console.error('路由跳转失败:', err)
      //     ElMessage.error('无法跳转到实验界面')
      //   })
      if (props.experiment.approval_status === 2) {
        // 已预约且已批准，可以开始实验
        router.push({
          name: 'ExperimentConducting',
          params: { 
            experimentId: props.experiment.id 
          }
        }).catch(err => {
          console.error('路由跳转失败:', err)
          ElMessage.error('无法跳转到实验界面')
        })
      } else if (props.experiment.status === 1 && props.experiment.approval_status === 2) {
        // 可预约状态，跳转到预约页面
        router.push({
          name: 'ExperimentBooking',
          params: { 
            id: props.experiment.id 
          },
          query: {
            from: router.currentRoute.value.fullPath
          }
        }).catch(err => {
          console.error('路由跳转失败:', err)
          ElMessage.error('无法跳转到预约页面')
        })
      } else {
        ElMessage.warning(`实验状态不可用 (状态:${props.experiment.status}, 审批:${props.experiment.approval_status})`)
      }
    }

    return {
      getSubjectName,
      getStatusText,
      getApprovalStatusText,
      statusTagType,
      viewDetails,
      handleBook,
      approvalStatus,
      isBookable,
      canStartExperiment,
      getButtonText
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

.status-available {
  color: #67c23a;
}

.status-full {
  color: #e6a23c;
}

.status-closed {
  color: #f56c6c;
}

.el-icon {
  vertical-align: middle;
}

.status-0 {
  color: #e6a23c; /* 已预约 - 黄色 */
}
.status-1 {
  color: #67c23a; /* 可预约 - 绿色 */
}
.status-2 {
  color: #f56c6c; /* 已满额 - 红色 */
}
.status-3 {
  color: #909399; /* 已关闭 - 灰色 */
}

.approval-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.approval-status-0 {
  color: #e6a23c; /* 待审批 - 黄色 */
}
.approval-status-1 {
  color: #409eff; /* 审批中 - 蓝色 */
}
.approval-status-2 {
  color: #67c23a; /* 已批准 - 绿色 */
}
.approval-status-3 {
  color: #f56c6c; /* 已拒绝 - 红色 */
}
</style>