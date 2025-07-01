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
          <el-option label="全部" value="" />
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
              <div class="stats-number">{{ stats.totalBookings || 0 }}</div>
              <div class="stats-label">总预约</div>
            </div>
            <el-icon class="stats-icon"><Calendar /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card active">
            <div class="stats-content">
              <div class="stats-number">{{ stats.activeBookings || 0 }}</div>
              <div class="stats-label">有效预约</div>
            </div>
            <el-icon class="stats-icon"><Clock /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card completed">
            <div class="stats-content">
              <div class="stats-number">{{ stats.completedBookings || 0 }}</div>
              <div class="stats-label">已完成</div>
            </div>
            <el-icon class="stats-icon"><CircleCheck /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card cancelled">
            <div class="stats-content">
              <div class="stats-number">{{ stats.cancelledBookings || 0 }}</div>
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
            {{ formatDate(selectedBooking.slotDate) }} {{ formatTime(selectedBooking.startTime) }} - {{ formatTime(selectedBooking.endTime) }}
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
import { getUserBookingStats, checkIn } from '@/api/examBooking'
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
      selectedStatus: '',
      stats: {
        totalBookings: 0,
        activeBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0
      },
      cancelDialogVisible: false,
      checkInDialogVisible: false,
      detailsDialogVisible: false,
      selectedBooking: null,
      currentUserId: 1 // 实际项目中应该从用户状态获取
    }
  },
  computed: {
    bookings() {
      return useBookingStore().userBookings
    },
    bookingStore() {
      return useBookingStore()
    }
  },
  created() {
    this.loadBookings()
    this.loadStats()
  },
  methods: {
    async loadBookings() {
      this.loading = true
      try {
        await this.bookingStore.fetchUserBookings(this.currentUserId, this.selectedStatus)
      } catch (error) {
        this.$message.error('加载预约列表失败')
      } finally {
        this.loading = false
      }
    },

    async loadStats() {
      try {
        const response = await getUserBookingStats(this.currentUserId)
        Object.assign(this.stats, response.data.data)
      } catch (error) {
        console.error('加载统计数据失败:', error)
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
        await this.bookingStore.cancelBooking(
            this.selectedBooking.bookingId,
            this.currentUserId,
            cancelReason
        )
        this.$message.success('预约已取消')
        this.cancelDialogVisible = false
        await this.loadStats() // 重新加载统计数据
      } catch (error) {
        this.$message.error(error.message || '取消预约失败')
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
        await checkIn(this.selectedBooking.bookingId, {
          checkInStatus: 'CHECKED_IN'
        })
        this.$message.success('签到成功')
        this.checkInDialogVisible = false
        await this.loadBookings() // 重新加载预约列表
      } catch (error) {
        this.$message.error(error.message || '签到失败')
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
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  align-items: center;
}

.stats-cards {
  margin-bottom: 24px;
}

.stats-card {
  position: relative;
  overflow: hidden;
}

.stats-card.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stats-card.completed {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.stats-card.cancelled {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.stats-content {
  position: relative;
  z-index: 2;
}

.stats-number {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stats-label {
  font-size: 14px;
  opacity: 0.8;
}

.stats-icon {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 48px;
  opacity: 0.3;
  z-index: 1;
}

.bookings-list {
  min-height: 400px;
}

.empty-state {
  padding: 60px 0;
  text-align: center;
}

.check-in-content {
  text-align: center;
  padding: 20px 0;
}

.exam-info {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
}

.exam-info p {
  margin: 8px 0;
  color: #606266;
}

.booking-details {
  padding: 16px 0;
}
</style>