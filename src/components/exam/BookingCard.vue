<template>
  <el-card class="booking-card" :class="getStatusClass(booking.bookingStatus)">
    <div class="booking-header">
      <div class="booking-info">
        <h3 class="exam-title">{{ booking.examTitle }}</h3>
        <p class="booking-number">预约号：{{ booking.bookingNumber }}</p>
      </div>
      <div class="booking-status">
        <el-tag :type="getStatusTagType(booking.bookingStatus)">
          {{ getStatusText(booking.bookingStatus) }}
        </el-tag>
      </div>
    </div>

    <div class="booking-content">
      <div class="exam-details">
        <div class="detail-item">
          <el-icon><Calendar /></el-icon>
          <span>考试时间：{{ formatDate(booking.slotDate) }} {{ booking.startTime }} - {{ booking.endTime }}</span>
        </div>

        <div class="detail-item">
          <el-icon><LocationFilled /></el-icon>
          <span>考试地点：{{ booking.examLocation }}</span>
        </div>

        <div class="detail-item">
          <el-icon><Monitor /></el-icon>
          <span>考试模式：{{ getExamModeText(booking.examMode) }}</span>
        </div>

        <div class="detail-item" v-if="booking.examDuration">
          <el-icon><Timer /></el-icon>
          <span>考试时长：{{ booking.examDuration }}分钟</span>
        </div>

        <div class="detail-item" v-if="booking.contactPhone">
          <el-icon><Phone /></el-icon>
          <span>联系电话：{{ booking.contactPhone }}</span>
        </div>
      </div>

      <div class="booking-actions">
        <el-button
            v-if="canCancel"
            type="danger"
            size="small"
            @click="handleCancel"
            :loading="cancelling"
        >
          取消预约
        </el-button>

        <el-button
            v-if="canCheckIn"
            type="success"
            size="small"
            @click="handleCheckIn"
        >
          签到
        </el-button>

        <el-button
            size="small"
            @click="viewDetails"
        >
          查看详情
        </el-button>
      </div>
    </div>

    <div class="booking-footer" v-if="booking.bookingTime">
      <span class="booking-time">预约时间：{{ formatDateTime(booking.bookingTime) }}</span>
      <span v-if="booking.cancelledTime" class="cancel-time">取消时间：{{ formatDateTime(booking.cancelledTime) }}</span>
    </div>
  </el-card>
</template>

<script setup>
import { computed, ref } from 'vue'
import {
  Calendar,
  LocationFilled,
  Monitor,
  Timer,
  Phone
} from '@element-plus/icons-vue'
import {
  formatDate,
  formatTime,
  formatDateTime,
  getStatusText,
  getExamModeText,
  canCancel as checkCanCancel
} from '@/utils/dateUtils'

const props = defineProps({
  booking: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['cancel', 'check-in', 'view-details'])

const cancelling = ref(false)

const canCancel = computed(() => {
  return props.booking.bookingStatus === 'BOOKED' &&
      checkCanCancel(
          `${props.booking.slotDate} ${props.booking.startTime}`,
          24 // 默认24小时截止时间
      )
})

const canCheckIn = computed(() => {
  const now = new Date()
  const examDate = new Date(`${props.booking.slotDate} ${props.booking.startTime}`)
  const checkInWindow = 30 * 60 * 1000 // 30分钟签到窗口

  return ['BOOKED', 'CONFIRMED'].includes(props.booking.bookingStatus) &&
      Math.abs(now - examDate) <= checkInWindow
})

const getStatusClass = (status) => {
  return `status-${status.toLowerCase()}`
}

const getStatusTagType = (status) => {
  const typeMap = {
    'BOOKED': 'warning',
    'CONFIRMED': 'success',
    'CANCELLED': 'danger',
    'COMPLETED': 'info',
    'NO_SHOW': 'danger'
  }
  return typeMap[status] || 'info'
}

const handleCancel = async () => {
  cancelling.value = true
  try {
    emit('cancel', props.booking)
  } finally {
    cancelling.value = false
  }
}

const handleCheckIn = () => {
  emit('check-in', props.booking)
}

const viewDetails = () => {
  emit('view-details', props.booking)
}
</script>

<style scoped>
.booking-card {
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.booking-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.booking-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.exam-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #303133;
}

.booking-number {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.booking-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.exam-details {
  flex: 1;
}

.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.detail-item .el-icon {
  margin-right: 8px;
  color: #409eff;
}

.booking-actions {
  margin-left: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.booking-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
  font-size: 12px;
  color: #909399;
}

.status-cancelled {
  opacity: 0.7;
}

.status-completed {
  background-color: #f0f9ff;
}
</style>