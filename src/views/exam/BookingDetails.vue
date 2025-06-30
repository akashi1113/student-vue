<template>
  <div class="booking-details">
    <div class="page-header">
      <h1>预约详情</h1>
      <div class="header-actions">
        <el-button @click="$router.go(-1)">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <el-button v-if="canEdit" type="primary" @click="editBooking">
          编辑预约
        </el-button>
      </div>
    </div>

    <div class="details-container" v-loading="loading">
      <el-row :gutter="20">
        <el-col :span="16">
          <el-card class="main-info">
            <template #header>
              <div class="card-header">
                <span>预约信息</span>
                <el-tag :type="getStatusTagType(booking.bookingStatus)" size="large">
                  {{ getStatusText(booking.bookingStatus) }}
                </el-tag>
              </div>
            </template>

            <el-descriptions :column="2" border>
              <el-descriptions-item label="预约号">
                <el-text tag="b">{{ booking.bookingNumber }}</el-text>
              </el-descriptions-item>
              <el-descriptions-item label="预约状态">
                <el-tag :type="getStatusTagType(booking.bookingStatus)">
                  {{ getStatusText(booking.bookingStatus) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="学生姓名">
                {{ booking.studentName }}
              </el-descriptions-item>
              <el-descriptions-item label="学生学号">
                {{ booking.studentId }}
              </el-descriptions-item>
              <el-descriptions-item label="联系电话">
                {{ booking.contactPhone }}
              </el-descriptions-item>
              <el-descriptions-item label="联系邮箱">
                {{ booking.contactEmail }}
              </el-descriptions-item>
              <el-descriptions-item label="预约时间" :span="2">
                {{ formatDateTime(booking.bookingTime) }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card class="exam-info" style="margin-top: 20px;">
            <template #header>
              <span>考试信息</span>
            </template>

            <el-descriptions :column="2" border>
              <el-descriptions-item label="考试名称" :span="2">
                <el-text tag="b">{{ booking.examTitle }}</el-text>
              </el-descriptions-item>
              <el-descriptions-item label="考试日期">
                {{ formatDate(booking.slotDate) }}
              </el-descriptions-item>
              <el-descriptions-item label="考试时间">
                {{ formatTime(booking.startTime) }} - {{ formatTime(booking.endTime) }}
              </el-descriptions-item>
              <el-descriptions-item label="考试地点">
                {{ booking.examLocation }}
              </el-descriptions-item>
              <el-descriptions-item label="考试模式">
                <el-tag :type="getModeTagType(booking.examMode)">
                  {{ getExamModeText(booking.examMode) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="考试时长">
                {{ booking.examDuration }} 分钟
              </el-descriptions-item>
              <el-descriptions-item label="预约截止">
                {{ formatDateTime(booking.bookingEndTime) }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card v-if="booking.specialRequirements || booking.remarks" class="additional-info" style="margin-top: 20px;">
            <template #header>
              <span>附加信息</span>
            </template>

            <el-descriptions :column="1" border>
              <el-descriptions-item v-if="booking.specialRequirements" label="特殊需求">
                {{ booking.specialRequirements }}
              </el-descriptions-item>
              <el-descriptions-item v-if="booking.remarks" label="备注">
                {{ booking.remarks }}
              </el-descriptions-item>
              <el-descriptions-item v-if="booking.cancelReason" label="取消原因">
                <el-text type="danger">{{ booking.cancelReason }}</el-text>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card class="actions-card">
            <template #header>
              <span>操作</span>
            </template>

            <div class="action-buttons">
              <el-button
                  v-if="booking.bookingStatus === 'BOOKED'"
                  type="success"
                  size="large"
                  @click="confirmBooking"
                  :loading="confirming"
                  style="width: 100%; margin-bottom: 12px;"
              >
                确认预约
              </el-button>

              <el-button
                  v-if="['BOOKED', 'CONFIRMED'].includes(booking.bookingStatus)"
                  type="danger"
                  size="large"
                  @click="showCancelDialog"
                  style="width: 100%; margin-bottom: 12px;"
              >
                取消预约
              </el-button>

              <el-button
                  v-if="booking.bookingStatus === 'CONFIRMED'"
                  type="primary"
                  size="large"
                  @click="checkIn"
                  style="width: 100%; margin-bottom: 12px;"
              >
                签到
              </el-button>

              <el-button
                  size="large"
                  @click="exportPDF"
                  style="width: 100%; margin-bottom: 12px;"
              >
                导出PDF
              </el-button>

              <el-button
                  type="info"
                  size="large"
                  @click="sendNotification"
                  style="width: 100%;"
              >
                发送通知
              </el-button>
            </div>
          </el-card>

          <el-card class="timeline-card" style="margin-top: 20px;">
            <template #header>
              <span>操作记录</span>
            </template>

            <el-timeline>
              <el-timeline-item
                  v-for="record in operationRecords"
                  :key="record.id"
                  :timestamp="formatDateTime(record.operationTime)"
                  placement="top"
              >
                <div class="timeline-content">
                  <div class="operation-type">{{ record.operationType }}</div>
                  <div class="operation-desc">{{ record.description }}</div>
                  <div class="operator">操作人：{{ record.operatorName }}</div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 取消预约对话框 -->
    <el-dialog
        v-model="cancelDialogVisible"
        title="取消预约"
        width="400px"
    >
      <div class="cancel-warning">
        <el-icon class="warning-icon"><Warning /></el-icon>
        <p>确定要取消这个预约吗？取消后无法恢复。</p>
      </div>

      <el-form :model="cancelForm" label-width="80px">
        <el-form-item label="取消原因" required>
          <el-input
              v-model="cancelForm.reason"
              type="textarea"
              :rows="4"
              placeholder="请输入取消原因"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="submitCancel" :loading="cancelling">
            确认取消
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Warning } from '@element-plus/icons-vue'
import { formatDate, formatTime, formatDateTime, getStatusText, getExamModeText } from '@/utils/dateUtils'

const route = useRoute()

// 响应式数据
const loading = ref(false)
const confirming = ref(false)
const cancelling = ref(false)
const cancelDialogVisible = ref(false)
const booking = ref({})
const operationRecords = ref([])

// 取消表单
const cancelForm = reactive({
  reason: ''
})

// 计算属性
const canEdit = computed(() => {
  return ['BOOKED'].includes(booking.value.bookingStatus)
})

// 生命周期
onMounted(() => {
  loadBookingDetails()
})

// 方法
const loadBookingDetails = async () => {
  loading.value = true
  try {
    const bookingId = route.params.bookingId

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))

    booking.value = {
      bookingId: bookingId,
      bookingNumber: 'BK20240115001',
      studentName: '张三',
      studentId: '2020001',
      contactPhone: '13812345678',
      contactEmail: 'zhangsan@example.com',
      bookingStatus: 'BOOKED',
      bookingTime: '2024-01-10 10:30:00',
      examTitle: '高等数学期末考试',
      slotDate: '2024-01-15',
      startTime: '09:00',
      endTime: '11:00',
      examLocation: '教学楼A101',
      examMode: 'OFFLINE',
      examDuration: 120,
      bookingEndTime: '2024-01-14 18:00:00',
      specialRequirements: '需要计算器',
      remarks: '第一次参加考试',
      cancelReason: null
    }

    operationRecords.value = [
      {
        id: 1,
        operationType: '创建预约',
        description: '学生成功预约考试',
        operatorName: '张三',
        operationTime: '2024-01-10 10:30:00'
      }
    ]
  } catch (error) {
    ElMessage.error('加载预约详情失败')
  } finally {
    loading.value = false
  }
}

const confirmBooking = async () => {
  confirming.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    booking.value.bookingStatus = 'CONFIRMED'
    operationRecords.value.unshift({
      id: Date.now(),
      operationType: '确认预约',
      description: '管理员确认预约',
      operatorName: '管理员',
      operationTime: new Date().toISOString()
    })

    ElMessage.success('预约确认成功')
  } catch (error) {
    ElMessage.error('确认预约失败')
  } finally {
    confirming.value = false
  }
}

const showCancelDialog = () => {
  cancelForm.reason = ''
  cancelDialogVisible.value = true
}

const submitCancel = async () => {
  if (!cancelForm.reason.trim()) {
    ElMessage.warning('请输入取消原因')
    return
  }

  cancelling.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    booking.value.bookingStatus = 'CANCELLED'
    booking.value.cancelReason = cancelForm.reason

    operationRecords.value.unshift({
      id: Date.now(),
      operationType: '取消预约',
      description: `预约已取消，原因：${cancelForm.reason}`,
      operatorName: '管理员',
      operationTime: new Date().toISOString()
    })

    ElMessage.success('预约取消成功')
    cancelDialogVisible.value = false
  } catch (error) {
    ElMessage.error('取消预约失败')
  } finally {
    cancelling.value = false
  }
}

const checkIn = () => {
  ElMessage.success('签到功能待实现')
}

const editBooking = () => {
  ElMessage.info('编辑预约功能待实现')
}

const exportPDF = () => {
  ElMessage.info('导出PDF功能待实现')
}

const sendNotification = () => {
  ElMessage.info('发送通知功能待实现')
}

const getStatusTagType = (status) => {
  const typeMap = {
    'BOOKED': 'warning',
    'CONFIRMED': 'success',
    'CANCELLED': 'danger',
    'COMPLETED': 'info'
  }
  return typeMap[status] || 'info'
}

const getModeTagType = (mode) => {
  const typeMap = {
    'ONLINE': 'success',
    'OFFLINE': 'primary',
    'HYBRID': 'warning'
  }
  return typeMap[mode] || 'info'
}
</script>

<style scoped>
.booking-details {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-buttons {
  display: flex;
  flex-direction: column;
}

.timeline-content {
  padding: 8px 0;
}

.operation-type {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.operation-desc {
  color: #606266;
  font-size: 14px;
  margin-bottom: 4px;
}

.operator {
  color: #909399;
  font-size: 12px;
}

.cancel-warning {
  text-align: center;
  margin-bottom: 20px;
}

.warning-icon {
  font-size: 48px;
  color: #e6a23c;
  margin-bottom: 12px;
}

.cancel-warning p {
  color: #606266;
  margin: 0;
}
</style>