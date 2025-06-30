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
        @click="handleBook"
        :disabled="experiment.status == '1'"
      >
        去实验
      </el-button>
      <el-button @click="viewDetails">查看详情</el-button>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Timer, CircleCheck, Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useExperimentStore } from '@/store/experiment'

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
      required: true
    },
    bookingId: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    const router = useRouter()
    const route = useRoute()
    const experimentStore = useExperimentStore()

    const subjects = [
      { value: 'c++', label: 'C++' },
      { value: 'java', label: 'JAVA' },
      { value: 'bianyi', label: '编译原理 ' },
      { value: 'ssd1', label: 'SSD1' },
      { value: 'database', label: '数据库' }
    ]

     const statusTextMap = {
      1: '可预约',  // 对应后端的 STATUS_AVAILABLE
      2: '已满额',  // 对应后端的 STATUS_FULL
      0: '已预约',  // 对应后端的 STATUS_DISABLED
      3: '已关闭'   // 对应后端的 STATUS_CLOSED
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
        console.log(props.experiment.id);
        
  // 使用命名路由并确保参数传递正确
  router.push({
    name: 'ExperimentDetail', 
    params: { 
      id: props.experiment.id
    }
  }).catch(err => {
    console.error('路由跳转失败:', err);
    // 可以添加用户提示
    ElMessage.error('无法跳转到详情页');
  });
}

    const handleBook = () => {
        // 检查实验状态是否为已预约 (0)
  if (props.experiment.status !== 0) {
    ElMessage.warning('请先完成实验预约');
    return;
  }
        
        // 尝试从多个来源获取bookingId
        // const bookingId = 
        // route.query.bookingId || // 首先检查路由参数
        // experimentStore.currentBookingId || // 然后检查store
        // sessionStorage.getItem('currentBookingId') ||
        // localStorage.getItem('currentBookingId'); // 最后检查sessionStorage

        // if (!bookingId) {
        //   ElMessage.warning('预约信息无效，请重新预约');
        //   return;
        // }

        // 确保store中有最新的bookingId
        // experimentStore.setCurrentBookingId(bookingId);

      router.push({
        name: 'ExperimentSimulation',
        // params: { 
        //     bookingId: bookingId 
        // },
        // query: {
        //     bookingId: bookingId // 双重保险，同时放在query中
        // }
        params: { 
      experimentId: props.experiment.id 
    }
      }).catch(err => {
        console.error('路由跳转失败:', err)
        ElMessage.error('无法跳转到实验界面')
      })
    }

    return {
      getSubjectName,
      getStatusText,
      statusTagType,
      viewDetails,
      handleBook
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
</style>