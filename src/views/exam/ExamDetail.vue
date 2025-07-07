<template>
  <div class="exam-detail-container">
    <div class="exam-header">
      <h1>{{ exam.title }}</h1>
      <div class="exam-meta">
        <el-tag :type="getStatusTagType(exam.status)" effect="dark">
          {{ formatStatus(exam.status) }}
        </el-tag>
        <span class="meta-item"><i class="el-icon-time"></i> 时长: {{ exam.duration }}分钟</span>
        <span class="meta-item"><i class="el-icon-medal"></i> 总分: {{ exam.totalScore }}分</span>
        <span class="meta-item"><i class="el-icon-date"></i> 开始: {{ formatTime(exam.startTime) }}</span>
        <span class="meta-item"><i class="el-icon-date"></i> 结束: {{ formatTime(exam.endTime) }}</span>
      </div>
    </div>

    <div class="exam-description">
      <h3>考试说明</h3>
      <p>{{ exam.description || '暂无详细说明' }}</p>
    </div>

    <div class="question-statistics" v-if="exam.questions && exam.questions.length > 0">
      <h3>题目统计</h3>
      <div class="stat-grid">
        <div v-for="(count, type) in questionTypes" :key="type" class="stat-item">
          <div class="stat-icon" :style="{ color: getTypeColor(type) }">
            <i :class="getTypeIcon(type)"></i>
          </div>
          <div class="stat-info">
            <div class="stat-count">{{ count }}</div>
            <div class="stat-name">{{ getTypeName(type) }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="action-buttons">
      <el-button
          v-if="isStudent"
          type="primary"
          size="large"
          @click="startExam"
          :disabled="!canStartExam"
          class="start-btn"
          :icon="canStartExam ? 'el-icon-arrow-right' : 'el-icon-warning-outline'"
          :loading="startingExam"
      >
        {{ startingExam ? '正在开始...' : (canStartExam ? '开始考试' : '考试未开放') }}
      </el-button>
      <el-button
          size="large"
          @click="goBack"
          class="back-btn"
          icon="el-icon-arrow-left"
      >
        返回
      </el-button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import examApi from '@/api/exam'

export default {
  name: 'ExamDetail',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const exam = ref({
      id: null,
      title: '',
      description: '',
      duration: 0,
      totalScore: 100,
      startTime: null,
      endTime: null,
      status: '',
      createdBy: null,
      createdAt: null,
      updatedAt: null,
      questions: []
    })

    const startingExam = ref(false)
    const isStudent = ref(false)

    // 获取用户身份
    const getUserRole = () => {
      // 这里可以根据实际项目从store或localStorage获取用户角色
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      isStudent.value = userInfo.role === '学生'
    }

    // 获取token的统一方法
    const getToken = () => {
      return localStorage.getItem('token')
    }

    // 统一处理API响应的方法
    const extractData = (response) => {
      console.log('API Response:', response)

      if (response && typeof response === 'object' && !response.data) {
        return response
      }

      if (response && response.data) {
        if (response.data.success && response.data.data) {
          return response.data.data
        }
        if (typeof response.data === 'object') {
          return response.data
        }
        return response.data
      }

      return response
    }

    // 获取考试详情
    const fetchExamDetail = async () => {
      try {
        console.log('Fetching exam detail for ID:', route.params.examId)
        const response = await examApi.getExamById(route.params.examId)
        console.log('Exam detail response:', response)

        const data = extractData(response)
        exam.value = {
          ...exam.value,
          ...data
        }

        console.log('Processed exam data:', exam.value)
      } catch (error) {
        console.error('获取考试详情失败:', error)
        ElMessage.error('获取考试详情失败：' + (error.message || '请稍后重试'))

        if (error.message && error.message.includes('认证')) {
          router.push('/login')
        }
      }
    }

    // 格式化时间显示
    const formatTime = (time) => {
      if (!time) return '未设置'
      return new Date(time).toLocaleString()
    }

    // 格式化状态显示
    const formatStatus = (status) => {
      const statusMap = {
        'DRAFT': '草稿',
        'PUBLISHED': '进行中',
        'ENDED': '已结束',
        'CANCELLED': '已取消'
      }
      return statusMap[status] || status
    }

    // 状态标签类型
    const getStatusTagType = (status) => {
      const typeMap = {
        'DRAFT': 'info',
        'PUBLISHED': 'success',
        'ENDED': 'danger',
        'CANCELLED': 'warning'
      }
      return typeMap[status] || ''
    }

    // 是否可以开始考试
    const canStartExam = computed(() => {
      return exam.value.status === 'PUBLISHED'
    })

    // 开始考试
    const startExam = async () => {
      try {
        const token = getToken()
        if (!token) {
          ElMessage.error('未找到认证信息，请重新登录')
          router.push('/login')
          return
        }

        await ElMessageBox.confirm(
            '确定要开始考试吗？考试开始后将无法退出。',
            '开始考试',
            {
              confirmButtonText: '开始考试',
              cancelButtonText: '取消',
              type: 'warning',
            }
        )

        startingExam.value = true

        console.log('Starting exam with ID:', route.params.examId)
        const response = await examApi.startExam(route.params.examId, token)
        console.log('Start exam response:', response)

        const examRecord = extractData(response)

        if (examRecord && examRecord.id) {
          ElMessage.success('考试已开始，正在跳转...')
          router.push(`/exams/${route.params.examId}/take`)
        } else {
          throw new Error('开始考试失败，未返回考试记录')
        }

      } catch (error) {
        console.error('开始考试失败:', error)

        if (error === 'cancel') {
          return
        }

        let errorMessage = '开始考试失败'
        if (error.message) {
          if (error.message.includes('已经完成')) {
            errorMessage = '您已经完成该考试，无法再次开始'
          } else if (error.message.includes('认证')) {
            errorMessage = '认证失败，请重新登录'
            router.push('/login')
            return
          } else {
            errorMessage = error.message
          }
        }

        ElMessage.error(errorMessage)
      } finally {
        startingExam.value = false
      }
    }

    // 返回上一页
    const goBack = () => {
      router.go(-1)
    }

    // 计算各种题型的数量
    const questionTypes = computed(() => {
      const types = {}
      exam.value.questions?.forEach(q => {
        types[q.type] = (types[q.type] || 0) + 1
      })
      return types
    })

    // 获取题型名称
    const getTypeName = (type) => {
      const map = {
        'SINGLE': '单选题',
        'MULTIPLE': '多选题',
        'JUDGE': '判断题',
        'TEXT': '简答题',
        'FILL': '填空题',
        'PROGRAMMING': '编程题',
      }
      return map[type] || type
    }

    // 获取题型图标
    const getTypeIcon = (type) => {
      const map = {
        'SINGLE': 'el-icon-circle-check',
        'MULTIPLE': 'el-icon-check',
        'JUDGE': 'el-icon-question',
        'TEXT': 'el-icon-edit',
        'FILL': 'el-icon-edit-outline',
        'PROGRAMMING': 'el-icon-cpu'
      }
      return map[type] || 'el-icon-question'
    }

    // 获取题型颜色
    const getTypeColor = (type) => {
      const map = {
        'SINGLE': '#409EFF',
        'MULTIPLE': '#67C23A',
        'JUDGE': '#E6A23C',
        'TEXT': '#F56C6C',
        'FILL': '#9B59B6',
        'PROGRAMMING': '#2ECC71'
      }
      return map[type] || '#909399'
    }

    onMounted(() => {
      getUserRole()
      fetchExamDetail()
    })

    return {
      exam,
      startingExam,
      isStudent,
      formatTime,
      formatStatus,
      getStatusTagType,
      questionTypes,
      canStartExam,
      startExam,
      goBack,
      getTypeName,
      getTypeIcon,
      getTypeColor
    }
  }
}
</script>

<style scoped>
.exam-detail-container {
  max-width: 2000px;
  margin: 0 auto;
  padding: 20px;
}

.exam-header {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.exam-header h1 {
  margin-bottom: 15px;
  color: #303133;
  font-size: 24px;
  text-align: center;
}

.exam-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  color: #606266;
  font-size: 14px;
}

.meta-item i {
  margin-right: 5px;
  color: #409EFF;
}

.exam-description {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.exam-description h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #303133;
  font-size: 18px;
  border-left: 4px solid #409EFF;
  padding-left: 10px;
}

.question-statistics {
  margin: 30px 0;
}

.question-statistics h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  font-size: 24px;
  margin-right: 15px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(64, 158, 255, 0.1);
}

.stat-icon i {
  font-size: 20px;
}

.stat-info {
  flex: 1;
}

.stat-count {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 5px;
}

.stat-name {
  font-size: 14px;
  color: #909399;
}

.action-buttons {
  margin-top: 40px;
  text-align: center;
  display: flex;
  justify-content: center;
  gap: 30px;
}

.start-btn {
  padding: 12px 36px;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 1px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
  border-radius: 8px;
}

.start-btn:hover:not(.is-disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}

.start-btn:active:not(.is-disabled) {
  transform: translateY(0);
}

.start-btn.is-disabled {
  opacity: 0.7;
  box-shadow: none;
  cursor: not-allowed;
}

.back-btn {
  padding: 12px 36px;
  font-size: 16px;
  font-weight: 500;
  color: #606266;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  transition: all 0.3s ease;
  background-color: #fff;
}

.back-btn:hover {
  color: #409EFF;
  border-color: #c6e2ff;
  background-color: #ecf5ff;
}

.back-btn:active {
  color: #3a8ee6;
}

.stat-item:nth-child(1) .stat-icon {
  color: #409EFF;
  background: rgba(64, 158, 255, 0.1);
}

.stat-item:nth-child(2) .stat-icon {
  color: #67C23A;
  background: rgba(103, 194, 58, 0.1);
}

.stat-item:nth-child(3) .stat-icon {
  color: #E6A23C;
  background: rgba(230, 162, 60, 0.1);
}

.stat-item:nth-child(4) .stat-icon {
  color: #F56C6C;
  background: rgba(245, 108, 108, 0.1);
}

.stat-item:nth-child(5) .stat-icon {
  color: #9B59B6;
  background: rgba(155, 89, 182, 0.1);
}

.stat-item:nth-child(6) .stat-icon {
  color: #2ECC71;
  background: rgba(46, 204, 113, 0.1);
}
</style>