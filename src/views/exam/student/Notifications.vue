<template>
  <div class="notifications">
    <div class="page-header">
      <h1>消息通知</h1>
      <div class="header-actions">
        <el-badge :value="unreadCount" :hidden="unreadCount === 0">
          <el-button @click="loadNotifications" :loading="loading">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </el-badge>

        <el-button
            v-if="selectedNotifications.length > 0"
            @click="batchMarkAsRead"
            :loading="batchReading"
        >
          批量已读
        </el-button>

        <el-button
            v-if="unreadNotifications.length > 0"
            @click="markAllAsRead"
            :loading="markingAll"
        >
          全部已读
        </el-button>
      </div>
    </div>

    <div class="notifications-container" v-loading="loading">
      <div v-if="notifications.length === 0" class="empty-state">
        <el-empty description="暂无通知消息" />
      </div>

      <div v-else class="notifications-list">
        <div class="list-header">
          <el-checkbox
              v-model="selectAll"
              :indeterminate="indeterminate"
              @change="handleSelectAll"
          >
            全选
          </el-checkbox>
          <span class="notification-count">
            共 {{ notifications.length }} 条通知，{{ unreadCount }} 条未读
          </span>
        </div>

        <div class="notification-items">
          <div
              v-for="notification in notifications"
              :key="notification.id"
              class="notification-item"
              :class="{
              'unread': notification.sendStatus !== 'READ',
              'selected': selectedNotifications.includes(notification.id)
            }"
              @click="handleNotificationClick(notification)"
          >
            <div class="notification-checkbox">
              <el-checkbox
                  v-model="selectedNotifications"
                  :label="notification.id"
                  @click.stop
              />
            </div>

            <div class="notification-content">
              <div class="notification-header">
                <div class="notification-title">
                  <span class="title-text">{{ notification.title }}</span>
                  <el-tag
                      v-if="notification.sendStatus !== 'READ'"
                      type="danger"
                      size="small"
                      effect="plain"
                  >
                    未读
                  </el-tag>
                </div>
                <div class="notification-time">
                  {{ formatDateTime(notification.createdAt) }}
                </div>
              </div>

              <div class="notification-body">
                <p class="notification-text">{{ notification.content }}</p>
                <div class="notification-meta">
                  <el-tag
                      :type="getNotificationTypeTag(notification.notificationType)"
                      size="small"
                  >
                    {{ getNotificationTypeText(notification.notificationType) }}
                  </el-tag>
                  <span class="priority" :class="`priority-${notification.priority?.toLowerCase()}`">
                    {{ getPriorityText(notification.priority) }}
                  </span>
                </div>
              </div>
            </div>

            <div class="notification-actions">
              <el-button
                  v-if="notification.sendStatus !== 'READ'"
                  size="small"
                  @click.stop="markAsRead(notification.id)"
              >
                标记已读
              </el-button>

              <el-button
                  v-if="notification.bookingId"
                  size="small"
                  type="primary"
                  @click.stop="viewRelatedBooking(notification.bookingId)"
              >
                查看预约
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 通知详情对话框 -->
    <el-dialog
        v-model="detailDialogVisible"
        title="通知详情"
        width="600px"
    >
      <div v-if="selectedNotification" class="notification-detail">
        <div class="detail-header">
          <h3>{{ selectedNotification.title }}</h3>
          <div class="detail-meta">
            <el-tag :type="getNotificationTypeTag(selectedNotification.notificationType)">
              {{ getNotificationTypeText(selectedNotification.notificationType) }}
            </el-tag>
            <span class="detail-time">{{ formatDateTime(selectedNotification.createdAt) }}</span>
          </div>
        </div>

        <div class="detail-content">
          <p>{{ selectedNotification.content }}</p>
        </div>

        <div class="detail-footer" v-if="selectedNotification.bookingId">
          <el-button
              type="primary"
              @click="viewRelatedBooking(selectedNotification.bookingId)"
          >
            查看相关预约
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { Refresh } from '@element-plus/icons-vue'
import { useBookingStore } from '@/stores/booking'
import { formatDateTime } from '@/utils/dateUtils'

export default {
  name: 'NotificationsPage',
  components: {
    Refresh
  },
  data() {
    return {
      loading: false,
      batchReading: false,
      markingAll: false,
      selectedNotifications: [],
      selectAll: false,
      detailDialogVisible: false,
      selectedNotification: null
    }
  },
  computed: {
    notifications() {
      return useBookingStore().notifications
    },
    unreadNotifications() {
      return useBookingStore().unreadNotifications
    },
    unreadCount() {
      return this.unreadNotifications.length
    },
    indeterminate() {
      const selected = this.selectedNotifications.length
      const total = this.notifications.length
      return selected > 0 && selected < total
    },
    bookingStore() {
      return useBookingStore()
    }
  },
  watch: {
    selectAll(val) {
      if (val) {
        this.selectedNotifications = this.notifications.map(n => n.id)
      } else {
        this.selectedNotifications = []
      }
    }
  },
  created() {
    this.loadNotifications()
  },
  methods: {
    // 检查用户是否已登录
    checkAuth() {
      const token = this.bookingStore.getToken()
      if (!token) {
        this.$message.error('请先登录')
        this.$router.push('/login')
        return false
      }
      return true
    },

    async loadNotifications() {
      console.log('[Load] Starting to load notifications...')
      if (!this.checkAuth()) return

      this.loading = true
      try {
        console.log('[API] Calling fetchUserNotifications...')
        await this.bookingStore.fetchUserNotifications()

        // 添加详细的数据日志
        console.group('[Data] Notification Data:')
        console.log('Raw notifications:', this.bookingStore.notifications)
        console.log('Processed notifications:', this.notifications)
        console.log('Unread count:', this.unreadCount)
        console.groupEnd()

        if (this.notifications.length === 0) {
          console.warn('[Data] Notifications array is empty')
        } else {
          console.log(`[Data] Loaded ${this.notifications.length} notifications`)
        }
      } catch (error) {
        console.error('[API Error] Failed to load notifications:', error)
        this.handleApiError(error, '加载通知')
      } finally {
        this.loading = false
        console.log('[Load] Finished loading notifications')
      }
    },

    handleSelectAll(val) {
      this.selectAll = val
    },

    handleNotificationClick(notification) {
      this.selectedNotification = notification
      this.detailDialogVisible = true

      // 如果是未读通知，自动标记为已读
      if (notification.sendStatus !== 'READ') {
        this.markAsRead(notification.id)
      }
    },

    async markAsRead(notificationId) {
      if (!this.checkAuth()) return

      try {
        await this.bookingStore.markAsRead(notificationId)
        this.$message.success('已标记为已读')
      } catch (error) {
        this.handleApiError(error, '标记已读')
      }
    },

    async batchMarkAsRead() {
      if (!this.checkAuth()) return

      if (this.selectedNotifications.length === 0) {
        this.$message.warning('请选择要标记的通知')
        return
      }

      this.batchReading = true
      try {
        await this.bookingStore.batchMarkAsRead(this.selectedNotifications)
        this.selectedNotifications = []
        this.selectAll = false
        this.$message.success('批量标记成功')
      } catch (error) {
        this.handleApiError(error, '批量标记')
      } finally {
        this.batchReading = false
      }
    },

    async markAllAsRead() {
      if (!this.checkAuth()) return

      this.markingAll = true
      try {
        const unreadIds = this.unreadNotifications.map(n => n.id)
        if (unreadIds.length === 0) {
          this.$message.info('没有未读通知')
          return
        }

        await this.bookingStore.batchMarkAsRead(unreadIds)
        this.$message.success('全部标记为已读')
      } catch (error) {
        this.handleApiError(error, '标记全部已读')
      } finally {
        this.markingAll = false
      }
    },

    viewRelatedBooking(bookingId) {
      this.$router.push(`/exam-booking/details/${bookingId}`)
    },

    // 统一处理API错误
    handleApiError(error, action = '操作') {
      console.error(`${action}失败:`, error)

      let errorMessage = error.response?.data?.message ||
          error.message ||
          `${action}失败，请稍后重试`

      if (error.response?.status === 401) {
        errorMessage = '登录已过期，请重新登录'
        this.$router.push('/login')
      }

      this.$message.error(errorMessage)
    },

    getNotificationTypeText(type) {
      const typeMap = {
        'BOOKING_CONFIRMED': '预约确认',
        'BOOKING_CANCELLED': '预约取消',
        'EXAM_REMINDER': '考试提醒',
        'EXAM_CHANGED': '考试变更',
        'SYSTEM_NOTICE': '系统通知'
      }
      return typeMap[type] || type
    },

    getNotificationTypeTag(type) {
      const tagMap = {
        'BOOKING_CONFIRMED': 'success',
        'BOOKING_CANCELLED': 'danger',
        'EXAM_REMINDER': 'warning',
        'EXAM_CHANGED': 'primary',
        'SYSTEM_NOTICE': 'info'
      }
      return tagMap[type] || 'info'
    },

    getPriorityText(priority) {
      const priorityMap = {
        'LOW': '低',
        'NORMAL': '普通',
        'HIGH': '高',
        'URGENT': '紧急'
      }
      return priorityMap[priority] || priority
    },

    formatDateTime
  }
}
</script>

<style scoped>
.notifications {
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
  gap: 12px;
}

.notifications-container {
  min-height: 500px;
}

.empty-state {
  padding: 80px 0;
  text-align: center;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid #ebeef5;
}

.notification-count {
  font-size: 14px;
  color: #909399;
}

.notification-items {
  border: 1px solid #ebeef5;
  border-top: none;
  border-radius: 0 0 8px 8px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: all 0.3s ease;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background-color: #f8f9fa;
}

.notification-item.unread {
  background-color: #f0f9ff;
  border-left: 4px solid #409eff;
}

.notification-item.selected {
  background-color: #e8f4fd;
}

.notification-checkbox {
  margin-right: 12px;
  margin-top: 4px;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.notification-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-text {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.notification-time {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

.notification-body {
  margin-bottom: 8px;
}

.notification-text {
  margin: 0 0 8px 0;
  color: #606266;
  line-height: 1.5;
}

.notification-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.priority {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}

.priority-low {
  background: #f0f9ff;
  color: #409eff;
}

.priority-normal {
  background: #f8f9fa;
  color: #606266;
}

.priority-high {
  background: #fef0f0;
  color: #f56c6c;
}

.priority-urgent {
  background: #fdf6ec;
  color: #e6a23c;
}

.notification-actions {
  margin-left: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notification-detail {
  padding: 16px 0;
}

.detail-header {
  margin-bottom: 20px;
}

.detail-header h3 {
  margin: 0 0 8px 0;
  color: #303133;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-time {
  font-size: 14px;
  color: #909399;
}

.detail-content {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.detail-content p {
  margin: 0;
  line-height: 1.6;
  color: #606266;
}

.detail-footer {
  text-align: center;
}
</style>