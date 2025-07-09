<template>
  <div class="my-bookings">
    <div class="page-header">
      <h1>我的预约</h1>
      <div class="header-actions">
        <el-select
            v-model="selectedStatus"
            placeholder="预约状态"
            clearable
            style="width: 150px; margin-right: 16px;"
            @change="loadBookings"
        >
          <el-option label="全部" value="null" />
          <el-option label="已预约" value="BOOKED" />
          <el-option label="已确认" value="CONFIRMED" />
          <el-option label="已取消" value="CANCELLED" />
          <el-option label="已完成" value="COMPLETED" />
        </el-select>

        <el-button @click="loadBookings" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <div class="stats-cards">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-number">{{ stats.total_bookings || 0 }}</div>
              <div class="stats-label">总预约</div>
            </div>
            <el-icon class="stats-icon"><Calendar /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card active">
            <div class="stats-content">
              <div class="stats-number">{{ stats.active_bookings || 0 }}</div>
              <div class="stats-label">有效预约</div>
            </div>
            <el-icon class="stats-icon"><Clock /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card completed">
            <div class="stats-content">
              <div class="stats-number">{{ stats.completed_bookings || 0 }}</div>
              <div class="stats-label">已完成</div>
            </div>
            <el-icon class="stats-icon"><CircleCheck /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card cancelled">
            <div class="stats-content">
              <div class="stats-number">{{ stats.cancelled_bookings || 0 }}</div>
              <div class="stats-label">已取消</div>
            </div>
            <el-icon class="stats-icon"><CircleClose /></el-icon>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="bookings-list" v-loading="loading">
      <div v-if="bookings.length === 0" class="empty-state">
        <el-empty description="暂无预约记录" />
      </div>

      <div v-else>
        <BookingCard
            v-for="booking in bookings"
            :key="booking.bookingId"
            :booking="booking"
            @cancel="handleCancelBooking"
            @check-in="handleCheckIn"
            @view-details="viewBookingDetails"
        />
      </div>
    </div>

    <!-- 取消预约确认对话框 -->
    <ConfirmDialog
        v-model="cancelDialogVisible"
        title="取消预约"
        message="确定要取消这个预约吗？取消后可能无法重新预约。"
        :show-input="true"
        input-placeholder="请输入取消原因"
        :loading="cancelling"
        @confirm="confirmCancel"
        @cancel="cancelDialogVisible = false"
    />

    <!-- 签到对话框 -->
    <el-dialog
        v-model="checkInDialogVisible"
        title="考试签到"
        width="400px"
    >
      <div class="check-in-content">
        <p>确认签到参加考试：</p>
        <div class="exam-info">
          <p><strong>{{ selectedBooking?.examTitle }}</strong></p>
          <p>时间：{{ formatDate(selectedBooking?.slotDate) }} {{ formatTime(selectedBooking?.startTime) }}</p>
          <p>地点：{{ selectedBooking?.examLocation }}</p>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="checkInDialogVisible = false">取消</el-button>
          <el-button
              type="primary"
              @click="confirmCheckIn"
              :loading="checkingIn"
          >
            确认签到
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 预约详情对话框 -->
    <el-dialog
        v-model="detailsDialogVisible"
        title="预约详情"
        width="700px"
    >
      <div v-if="selectedBooking" class="booking-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="预约号">
            {{ selectedBooking.bookingNumber }}
          </el-descriptions-item>
          <el-descriptions-item label="预约状态">
            <el-tag :type="getStatusTagType(selectedBooking.bookingStatus)">
              {{ getStatusText(selectedBooking.bookingStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="考试名称">
            {{ selectedBooking.examTitle }}
          </el-descriptions-item>
          <el-descriptions-item label="考试时长">
            {{ selectedBooking.examDuration }}分钟
          </el-descriptions-item>
          <el-descriptions-item label="考试时间">
            {{ formatDate(selectedBooking.slotDate) }} {{ selectedBooking.startTime }} - {{ selectedBooking.endTime }}
          </el-descriptions-item>
          <el-descriptions-item label="考试地点">
            {{ selectedBooking.examLocation }}
          </el-descriptions-item>
          <el-descriptions-item label="考试模式">
            {{ getExamModeText(selectedBooking.examMode) }}
          </el-descriptions-item>
          <el-descriptions-item label="联系电话">
            {{ selectedBooking.contactPhone }}
          </el-descriptions-item>
          <el-descriptions-item label="联系邮箱">
            {{ selectedBooking.contactEmail }}
          </el-descriptions-item>
          <el-descriptions-item label="预约时间">
            {{ formatDateTime(selectedBooking.bookingTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="特殊需求" v-if="selectedBooking.specialRequirements">
            <span>{{ selectedBooking.specialRequirements }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="备注" v-if="selectedBooking.remarks">
            <span>{{ selectedBooking.remarks }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  Refresh,
  Calendar,
  Clock,
  CircleCheck,
  CircleClose
} from '@element-plus/icons-vue'
import BookingCard from '@/components/exam/BookingCard.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { useBookingStore } from '@/stores/booking'
import examBookingApi from '@/api/examBooking'
import {
  formatDate,
  formatTime,
  formatDateTime,
  getStatusText,
  getExamModeText
} from '@/utils/dateUtils'

export default {
  name: 'MyBookings',
  components: {
    BookingCard,
    ConfirmDialog
  },
  data() {
    return {
      loading: false,
      cancelling: false,
      checkingIn: false,
      selectedStatus: null,
      bookings: [], // 直接管理预约数据
      stats: {
        total_bookings: 0,
        active_bookings: 0,
        completed_bookings: 0,
        cancelled_bookings: 0
      },
      cancelDialogVisible: false,
      checkInDialogVisible: false,
      detailsDialogVisible: false,
      selectedBooking: null
    }
  },
  computed: {
    bookingStore() {
      return useBookingStore()
    }
  },
  created() {
    this.loadBookings()
    this.loadStats()
  },
  methods: {
    // 获取token的统一方法
    getToken() {
      return localStorage.getItem('token')
    },

    // 统一处理API响应的方法
    extractData(response) {
      console.log('API Response:', response)

      // 如果response直接是数据
      if (Array.isArray(response)) {
        return response
      }

      // 如果response有data属性
      if (response && response.data) {
        // 如果是{success: true, data: [...]}格式
        if (response.data.success && response.data.data) {
          return response.data.data
        }
        // 如果data直接是数组或对象
        if (Array.isArray(response.data) || typeof response.data === 'object') {
          return response.data
        }
        return response.data
      }

      return response
    },

    async loadBookings() {
      this.loading = true
      try {
        const token = this.getToken()
        if (!token) {
          this.$message.error('未找到认证信息，请重新登录')
          this.$router.push('/login')
          return
        }
        const status = this.selectedStatus === "null" ? null : this.selectedStatus
        console.log('Loading user bookings with token:', token)
        console.log('Request parameters:', {
          token: token,
          status: status
        })
        const response = await examBookingApi.getUserBookings(token, status)
        console.log('User bookings response:', response)

        const data = this.extractData(response)
        this.bookings = Array.isArray(data) ? data : []

        console.log('Processed bookings:', this.bookings)
      } catch (error) {
        console.error('Failed to load bookings:', error)
        this.$message.error('加载预约列表失败：' + (error.message || '请稍后重试'))

        // 如果是认证错误，跳转到登录页
        if (error.message && error.message.includes('认证')) {
          this.$router.push('/login')
        }
      } finally {
        this.loading = false
      }
    },

    async loadStats() {
      try {
        const token = this.getToken()
        if (!token) {
          console.warn('No token found, skipping stats loading')
          return
        }

        console.log('Loading user booking stats with token:', token)
        const response = await examBookingApi.getUserBookingStats(token)
        console.log('User booking stats response:', response)

        const data = this.extractData(response)
        Object.assign(this.stats, data)

        console.log('Processed stats:', this.stats)
      } catch (error) {
        console.error('Failed to load stats:', error)
        // 统计数据加载失败不影响主要功能，只记录错误
      }
    },

    handleCancelBooking(booking) {
      this.selectedBooking = booking
      this.cancelDialogVisible = true
    },

    async confirmCancel(cancelReason) {
      if (!cancelReason.trim()) {
        this.$message.warning('请输入取消原因')
        return
      }

      this.cancelling = true
      try {
        const token = this.getToken()
        if (!token) {
          throw new Error('未找到认证信息，请重新登录')
        }

        const cancelData = {
          cancelReason: cancelReason.trim()
        }

        console.log('Cancelling booking:', this.selectedBooking.bookingId, cancelData)
        const response = await examBookingApi.cancelBooking(
            this.selectedBooking.bookingId,
            cancelData,
            token
        )
        console.log('Cancel booking response:', response)

        this.$message.success('预约已取消')
        this.cancelDialogVisible = false

        // 重新加载数据
        await this.loadBookings()
        await this.loadStats()
      } catch (error) {
        console.error('Failed to cancel booking:', error)
        this.$message.error('取消预约失败：' + (error.message || '请稍后重试'))
      } finally {
        this.cancelling = false
      }
    },

    handleCheckIn(booking) {
      this.selectedBooking = booking
      this.checkInDialogVisible = true
    },

    async confirmCheckIn() {
      this.checkingIn = true
      try {
        const checkInData = {
          checkInStatus: 'CHECKED_IN'
        }

        console.log('Checking in booking:', this.selectedBooking.bookingId, checkInData)
        const response = await examBookingApi.checkIn(this.selectedBooking.bookingId, checkInData)
        console.log('Check in response:', response)

        this.$message.success('签到成功')
        this.checkInDialogVisible = false

        // 重新加载预约列表
        await this.loadBookings()
      } catch (error) {
        console.error('Failed to check in:', error)
        this.$message.error('签到失败：' + (error.message || '请稍后重试'))
      } finally {
        this.checkingIn = false
      }
    },

    viewBookingDetails(booking) {
      this.selectedBooking = booking
      this.detailsDialogVisible = true
    },

    getStatusTagType(status) {
      const typeMap = {
        'BOOKED': 'warning',
        'CONFIRMED': 'success',
        'CANCELLED': 'danger',
        'COMPLETED': 'info',
        'NO_SHOW': 'danger'
      }
      return typeMap[status] || 'info'
    },

    formatDate,
    formatTime,
    formatDateTime,
    getStatusText,
    getExamModeText
  }
}
</script>

<style scoped>
.my-bookings {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  background-color: #f8fafc;
}

/* 顶部标题区域 - 白底蓝调 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(59, 130, 246, 0.08);
  border-left: 4px solid #3b82f6;
}

.page-header h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-header h1 .el-icon {
  color: #3b82f6;
  font-size: 24px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 统计卡片 - 蓝色主题 */
.stats-cards {
  margin-bottom: 28px;
}

.stats-card {
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  height: 120px;
  color: white;
}

.stats-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
}

/* 总预约卡片 - 改为白底蓝字 */
.stats-card:not(.active):not(.completed):not(.cancelled) {
  background: white;
  color: #1e293b; /* 深灰色文字 */
  border-top: 4px solid #3b82f6; /* 顶部蓝色边框 */
}

.stats-card.active {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
}

.stats-card.completed {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.stats-card.cancelled {
  background: linear-gradient(135deg, #64748b 0%, #475569 100%);
}

.stats-content {
  position: relative;
  z-index: 2;
  padding: 20px;
}

.stats-number {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
}

.stats-label {
  font-size: 14px;
  opacity: 0.9;
}

.stats-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 60px;
  opacity: 0.2;
  z-index: 1;
}

.stats-card:not(.active):not(.completed):not(.cancelled) .stats-icon {
  color: #3b82f6; /* 蓝色图标 */
}

/* 预约列表 */
.bookings-list {
  background: white;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(59, 130, 246, 0.05);
  min-height: 400px;
}

.empty-state {
  padding: 80px 0;
  text-align: center;
}

/* 对话框样式 */
.check-in-content {
  text-align: center;
  padding: 20px 0;
}

.exam-info {
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
  border-left: 3px solid #3b82f6;
}

.exam-info p {
  margin: 8px 0;
  color: #64748b;
}

.exam-info p strong {
  color: #1e293b;
  font-size: 16px;
}

.booking-details {
  padding: 16px 0;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .my-bookings {
    padding: 16px;
  }

  .stats-card {
    height: 110px;
  }

  .stats-number {
    font-size: 28px;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 16px;
  }

  .stats-cards .el-col {
    margin-bottom: 16px;
  }

  .stats-card {
    height: 100px;
  }

  .stats-number {
    font-size: 24px;
  }

  .stats-icon {
    font-size: 50px;
  }
}

@media (max-width: 576px) {
  .my-bookings {
    padding: 12px;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
    gap: 12px;
  }

  .stats-cards .el-col {
    width: 100%;
  }
}
</style>