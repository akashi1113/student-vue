<template>
  <div class="experiment-detail-container">
    <el-page-header @back="goBack" class="page-header">
      <template #content>
        <div class="page-header-content">
          <el-icon><arrow-left /></el-icon>
          <span>实验详情</span>
        </div>
      </template>
    </el-page-header>
    
    <div class="detail-card" v-if="experiment">
      <div class="detail-header">
        <div class="title-section">
          <h1>{{ experiment.name }}</h1>
          <el-tag :type="getStatusTagType(experiment.status)" size="large">
            {{ getStatusText(experiment.status) }}
          </el-tag>
        </div>
        <div class="action-buttons">
          <el-button type="primary" @click="handleBook" :disabled="experiment.status != '1'">
            <el-icon><calendar /></el-icon>
            立即预约
          </el-button>
        </div>
      </div>

      <el-divider />

      <div class="detail-content">
        <div class="left-section">
          <!-- <el-image 
            :src="experiment.image || 'https://via.placeholder.com/600x400?text=Experiment+Image'"
            fit="cover"
            class="experiment-image"
          /> -->
          
          <div class="info-grid">
            <div class="info-item">
              <el-icon><clock /></el-icon>
              <span>预计时长: {{ experiment.duration }}分钟</span>
            </div>
            <!-- <div class="info-item">
              <el-icon><user /></el-icon>
              <span>适合年级: {{ experiment.gradeLevel }}</span>
            </div> -->
            <div class="info-item">
              <el-icon><collection-tag /></el-icon>
              <span>学科分类: {{ getSubjectName(experiment.subject) }}</span>
            </div>
            <div class="info-item">
              <el-icon><location /></el-icon>
              <span>实验室位置: {{ experiment.location || '未指定' }}</span>
            </div>
          </div>
        </div>

        <div class="right-section">
          <el-tabs type="border-card">
            <el-tab-pane label="实验简介">
              <div class="description-content" v-html="experiment.description"></div>
            </el-tab-pane>
            <!-- <el-tab-pane label="实验步骤">
              <ol class="steps-list">
                <li v-for="(step, index) in experiment.steps" :key="index">
                  <h3>步骤 {{ index + 1 }}: {{ step.title }}</h3>
                  <p>{{ step.content }}</p>
                </li>
              </ol>
            </el-tab-pane> -->
            <el-tab-pane label="安全须知">
              <div class="safety-content">
                <el-alert
                  v-for="(item, index) in experiment.safetyNotes"
                  :key="index"
                  :title="item.title"
                  :type="item.type || 'warning'"
                  :closable="false"
                  class="safety-note"
                >
                  {{ item.content }}
                </el-alert>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>

    <div v-else class="loading-state">
      <el-skeleton :rows="10" animated />
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useExperimentStore } from '@/store/experiment'
import { 
  Calendar, Clock, CollectionTag, Location, ArrowLeft
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'ExperimentDetailView',
  components: {
    Calendar, Clock, CollectionTag, Location, ArrowLeft
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const experimentStore = useExperimentStore()
    const experiment = ref(null)
    // const id = route.params.id // 确保能获取到参数

    const subjects = [
      { value: 'c++', label: 'C++' },
      { value: 'java', label: 'JAVA' },
      { value: 'bianyi', label: '编译原理' },
      { value: 'ssd1', label: 'SSD1' },
      { value: 'database', label: '数据库' }
    ]

    // 更新状态映射为数字
    const statusTextMap = {
      1: '可预约',  // 对应后端的 STATUS_AVAILABLE
      2: '已满额',  // 对应后端的 STATUS_FULL
      0: '已禁用',  // 对应后端的 STATUS_DISABLED
      3: '已关闭'   // 对应后端的 STATUS_CLOSED
    }

    const statusTagTypes = {
      1: 'success', // 可预约 - 绿色
      2: 'warning', // 已满额 - 黄色
      0: 'danger',  // 已禁用 - 红色
      3: 'info'     // 已关闭 - 灰色
    }

   onMounted(async () => {
  try {
    console.log('当前路由参数:', route.params) // 调试输出
    
    const id = route.params.id
    if (!id) {
      throw new Error(`缺少实验ID参数，当前参数: ${JSON.stringify(route.params)}`)
    }
    
    console.log('正在获取实验ID:', id) // 调试输出
    
    const response = await experimentStore.getExperimentById(id)
    experiment.value = response
    
    // 确保数据结构完整
    if (!experiment.value.steps) {
      experiment.value.steps = []
    }
    if (!experiment.value.safetyNotes) {
  experiment.value.safetyNotes = [
    { 
      title: '基本行为规范', 
      content: '禁止饮食、吸烟或携带危险物品；保持安静，不得随意拆卸设备。',
      type: 'warning'
    },
    { 
      title: '设备使用安全', 
      content: '使用前检查设备是否正常，发现故障立即报告；操作时规范使用计算机，禁止乱插拔电源或外接设备，U盘需先杀毒。',
      type: 'warning'
    },
    { 
      title: '用电与网络安全', 
      content: '注意用电安全，不私拉电线，关闭设备后切断电源。严禁访问非法网站或安装未授权软件，禁止攻击他人计算机或窃取数据。',
      type: 'error'
    },
    { 
      title: '应急处理', 
      content: '遇到设备异常（如冒烟、短路）立即断电并报告；火灾时优先撤离。',
      type: 'error'
    },
    { 
      title: '离开前注意事项', 
      content: '退出账号、整理桌面，将设备归位。故意损坏需赔偿，严重违规者将限制使用权限。',
      type: 'info'
    }
  ]
}
  } catch (error) {
    console.error('获取实验详情失败详情:', error) // 更详细的错误日志
    ElMessage.error('获取实验详情失败: ' + (error.message || error))
    router.push('/experimentList')
  }
})

    const getSubjectName = (value) => {
      const subject = subjects.find(s => s.value === value)
      return subject ? subject.label : value
    }

     const getStatusText = (status) => {
      return statusTextMap[status] || '未知状态'
    }

    const getStatusTagType = (status) => {
      return statusTagTypes[status] || 'info'
    }

    const handleBook = () => {
  try {
    if (!experiment.value || !experiment.value.id) {
      throw new Error('实验信息不完整')
    }
    
    // 调试日志
    console.log('跳转前实验数据:', experiment.value)
    
    router.push({
      name: 'ExperimentBooking', // 使用命名路由更可靠
      params: { id: experiment.value.id },
      query: { 
        from: route.fullPath,
        experimentData: JSON.stringify(experiment.value)
      }
    })
  } catch (error) {
    console.error('预约跳转失败:', error)
    ElMessage.error(`预约跳转失败: ${error.message}`)
  }
}

    const goBack = () => {
      if (route.query.from) {
        router.push(route.query.from)
      } else {
        router.push('/experimentList')
      }
    }

    return {
      experiment,
      getSubjectName,
      getStatusText,
      getStatusTagType,
      goBack,
      handleBook
    }
  }
}
</script>

<style scoped>
.experiment-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-header-content .el-icon {
  cursor: pointer;
  font-size: 18px;
}

.page-header-content span {
  font-size: 18px;
  font-weight: 500;
}

.detail-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.title-section h1 {
  font-size: 28px;
  margin: 0;
  color: #303133;
}

.detail-content {
  display: flex;
  gap: 30px;
  margin-top: 20px;
}

.left-section {
  width: 40%;
  min-width: 300px;
}

.right-section {
  width: 60%;
  flex: 1;
}

.experiment-image {
  width: 100%;
  height: 300px;
  border-radius: 6px;
  margin-bottom: 20px;
  background-color: #f5f7fa;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  color: #606266;
}

.info-item .el-icon {
  color: #409EFF;
}

.description-content {
  line-height: 1.8;
}

.steps-list {
  padding-left: 20px;
}

.steps-list li {
  margin-bottom: 20px;
}

.steps-list h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 16px;
}

.steps-list p {
  margin: 0;
  color: #606266;
}

.safety-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.safety-note {
  margin-bottom: 0;
}

.loading-state {
  margin-top: 40px;
}

@media (max-width: 768px) {
  .detail-content {
    flex-direction: column;
  }
  
  .left-section, .right-section {
    width: 100%;
  }
  
  .detail-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>