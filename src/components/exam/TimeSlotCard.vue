<template>
  <el-card class="time-slot-card" :class="{ 'full': isFull, 'expired': isExpired }">
    <div class="slot-header">
      <div class="slot-time">
        <el-icon><Clock /></el-icon>
        <span>{{ formatDate(timeSlot.slotDate) }} {{ formatTime(timeSlot.startTime) }} - {{ formatTime(timeSlot.endTime) }}</span>
      </div>
      <div class="slot-mode">
        <el-tag :type="getModeTagType(timeSlot.examMode)">
          {{ getExamModeText(timeSlot.examMode) }}
        </el-tag>
      </div>
    </div>

    <div class="slot-content">
      <div class="slot-info">
        <p class="location">
          <el-icon><LocationFilled /></el-icon>
          <span>{{ timeSlot.examLocation }}</span>
        </p>

        <div class="capacity-info">
          <el-progress
              :percentage="capacityPercentage"
              :color="getProgressColor()"
              :show-text="false"
              :stroke-width="8"
          />
          <span class="capacity-text">
            {{ timeSlot.currentBookings }}/{{ timeSlot.maxCapacity }}
            <span class="available">(剩余{{ availableSlots }}名额)</span>
          </span>
        </div>

        <div class="requirements" v-if="timeSlot.requirements">
          <p class="requirement-title">特殊要求：</p>
          <p class="requirement-content">{{ timeSlot.requirements }}</p>
        </div>
      </div>

      <div class="slot-actions">
        <el-button
            v-if="!isExpired && !isFull && showBookButton"
            type="primary"
            @click="handleBook"
            :loading="booking"
        >
          立即预约
        </el-button>

        <el-button
            v-if="showManageButton"
            type="success"
            @click="handleManage"
        >
          管理
        </el-button>

        <el-button
            v-if="isFull"
            disabled
        >
          已满员
        </el-button>

        <el-button
            v-if="isExpired"
            disabled
        >
          已过期
        </el-button>
      </div>
    </div>

    <div class="booking-deadline" v-if="timeSlot.bookingEndTime">
      <el-icon><AlarmClock /></el-icon>
      <span>预约截止：{{ formatDateTime(timeSlot.bookingEndTime) }}</span>
    </div>
  </el-card>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Clock, LocationFilled, AlarmClock } from '@element-plus/icons-vue'
import { formatDate, formatTime, formatDateTime, getExamModeText, isExpired as checkExpired } from '@/utils/dateUtils'

const props = defineProps({
  timeSlot: {
    type: Object,
    required: true
  },
  showBookButton: {
    type: Boolean,
    default: true
  },
  showManageButton: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['book', 'manage'])

const booking = ref(false)

const availableSlots = computed(() => {
  return props.timeSlot.maxCapacity - props.timeSlot.currentBookings
})

const isFull = computed(() => {
  return availableSlots.value <= 0
})

const isExpired = computed(() => {
  return checkExpired(props.timeSlot.bookingEndTime)
})

const capacityPercentage = computed(() => {
  return Math.round((props.timeSlot.currentBookings / props.timeSlot.maxCapacity) * 100)
})

const getModeTagType = (mode) => {
  const typeMap = {
    'ONLINE': 'success',
    'OFFLINE': 'primary',
    'HYBRID': 'warning'
  }
  return typeMap[mode] || 'info'
}

const getProgressColor = () => {
  const percentage = capacityPercentage.value
  if (percentage >= 90) return '#f56c6c'
  if (percentage >= 70) return '#e6a23c'
  return '#67c23a'
}

const handleBook = async () => {
  booking.value = true
  try {
    emit('book', props.timeSlot)
  } finally {
    booking.value = false
  }
}

const handleManage = () => {
  emit('manage', props.timeSlot)
}
</script>

<style scoped>
.time-slot-card {
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.time-slot-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.time-slot-card.full {
  opacity: 0.7;
}

.time-slot-card.expired {
  opacity: 0.5;
  background-color: #f5f5f5;
}

.slot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.slot-time {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.slot-time .el-icon {
  margin-right: 8px;
  color: #409eff;
}

.slot-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.slot-info {
  flex: 1;
}

.location {
  display: flex;
  align-items: center;
  margin: 0 0 12px 0;
  color: #606266;
}

.location .el-icon {
  margin-right: 6px;
}

.capacity-info {
  margin-bottom: 12px;
}

.capacity-text {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 14px;
  color: #606266;
}

.available {
  color: #67c23a;
}

.requirements {
  background: #f8f9fa;
  padding: 8px 12px;
  border-radius: 4px;
  margin-top: 8px;
}

.requirement-title {
  margin: 0 0 4px 0;
  font-size: 12px;
  color: #909399;
}

.requirement-content {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.slot-actions {
  margin-left: 16px;
}

.booking-deadline {
  display: flex;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
  font-size: 12px;
  color: #909399;
}

.booking-deadline .el-icon {
  margin-right: 4px;
}
</style>