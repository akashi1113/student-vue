<template>
  <div class="exam-container">
    <!-- 顶部标题 -->
    <div class="page-header">
      <h1 class="page-title">考试中心</h1>
      <div class="header-actions">
        <el-button @click="refreshCurrentTab" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="exam-tabs">
      <!-- 可预约考试 -->
      <el-tab-pane label="可预约考试" name="bookable">
        <template #label>
          <span class="tab-label">
            <el-icon><Calendar /></el-icon>
            可预约考试
            <el-badge v-if="bookableExams.length > 0" :value="bookableExams.length" class="tab-badge" />
          </span>
        </template>

        <div v-loading="loading" class="tab-content">
          <div v-if="bookableExams.length === 0" class="empty-state">
            <el-empty description="暂无可预约的考试" />
          </div>

          <div v-else class="exam-grid">
            <div v-for="exam in bookableExams" :key="exam.id" class="exam-card bookable-card">
              <div class="card-header">
                <h3 class="exam-title">{{ exam.title }}</h3>
                <div class="exam-badges">
                  <el-tag type="warning" size="small">可预约</el-tag>
                  <el-tag :type="getExamModeTagType(exam.examMode)" size="small">
                    {{ getExamModeText(exam.examMode) }}
                  </el-tag>
                  <span class="duration-badge">{{ exam.duration }}分钟</span>
                </div>
              </div>

              <p class="exam-description">{{ exam.description || '暂无考试说明' }}</p>

              <div class="exam-info">
                <div class="info-item">
                  <el-icon><Calendar /></el-icon>
                  <span>{{ formatDateTime(exam.startTime) }}</span>
                </div>
                <div class="info-item">
                  <el-icon><Timer /></el-icon>
                  <span>{{ exam.duration }}分钟</span>
                </div>
                <div class="info-item">
                  <el-icon><Trophy /></el-icon>
                  <span>总分：{{ exam.totalScore }}</span>
                </div>
              </div>

              <div class="card-footer">
                <div class="action-buttons">
                  <el-button size="small" @click="viewExamDetail(exam.id)">
                    <el-icon><View /></el-icon>
                    详情
                  </el-button>
                  <el-button
                      size="small"
                      type="warning"
                      @click="showTimeSlots(exam)"
                  >
                    <el-icon><Clock /></el-icon>
                    预约时段
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 我的考试 -->
      <el-tab-pane label="我的考试" name="myExams">
        <template #label>
          <span class="tab-label">
            <el-icon><SuccessFilled /></el-icon>
            我的考试
            <el-badge v-if="onlineExams.length + offlineExams.length > 0"
                      :value="onlineExams.length + offlineExams.length"
                      class="tab-badge" />
          </span>
        </template>

        <div v-loading="loading" class="tab-content">
          <div v-if="onlineExams.length === 0 && offlineExams.length === 0" class="empty-state">
            <el-empty description="暂无考试" />
          </div>

          <div v-else class="exam-sections">
            <!-- 线上考试 -->
            <div v-if="onlineExams.length > 0" class="exam-section">
              <div class="section-header">
                <h3 class="section-title">
                  <el-icon><Monitor /></el-icon>
                  线上考试
                </h3>
                <el-tag type="primary" effect="light">
                  共 {{ onlineExams.length }} 场
                </el-tag>
              </div>

              <div class="exam-grid">
                <div v-for="exam in onlineExams" :key="exam.id" class="exam-card online-card">
                  <div class="card-header">
                    <h3 class="exam-title">{{ exam.title }}</h3>
                    <div class="exam-badges">
                      <el-tag type="success" size="small">已预约</el-tag>
                      <el-tag type="primary" size="small">线上</el-tag>
                      <span class="duration-badge">{{ exam.duration }}分钟</span>
                    </div>
                  </div>

                  <p class="exam-description">{{ exam.description || '暂无考试说明' }}</p>

                  <div class="exam-info">
                    <div class="info-item">
                      <el-icon><Timer /></el-icon>
                      <span>{{ exam.duration }}分钟</span>
                    </div>
                    <div class="info-item">
                      <el-icon><Trophy /></el-icon>
                      <span>总分：{{ exam.totalScore }}</span>
                    </div>
                    <div class="info-item">
                      <el-icon><User /></el-icon>
                      <span>状态：{{ getExamStatusText(exam.status) }}</span>
                    </div>
                  </div>

                  <div class="card-footer">
                    <div class="action-buttons">
                      <el-button size="small" @click="viewExamDetail(exam.id)">
                        <el-icon><View /></el-icon>
                        详情
                      </el-button>
                      <el-button
                          size="small"
                          type="primary"
                          @click="startExam(exam.id)"
                          :disabled="!canStartExam(exam)"
                          v-if="canShowStartButton(exam)"
                      >
                        <el-icon><CaretRight /></el-icon>
                        开始考试
                      </el-button>
                      <el-button
                          size="small"
                          type="info"
                          @click="viewExamResult(exam.id)"
                          v-if="exam.examStatus === 'COMPLETED'"
                      >
                        <el-icon><Trophy /></el-icon>
                        查看成绩
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 线下考试 -->
            <div v-if="offlineExams.length > 0" class="exam-section">
              <div class="section-header">
                <h3 class="section-title">
                  <el-icon><Location /></el-icon>
                  线下考试
                </h3>
                <el-tag type="warning" effect="light">
                  共 {{ offlineExams.length }} 场
                </el-tag>
              </div>

              <div class="exam-grid">
                <div v-for="exam in offlineExams" :key="exam.id" class="exam-card offline-card">
                  <div class="card-header">
                    <h3 class="exam-title">{{ exam.title }}</h3>
                    <div class="exam-badges">
                      <el-tag type="success" size="small">已预约</el-tag>
                      <el-tag type="warning" size="small">线下</el-tag>
                      <span class="duration-badge">{{ exam.duration }}分钟</span>
                    </div>
                  </div>

                  <p class="exam-description">{{ exam.description || '暂无考试说明' }}</p>

                  <div class="exam-info">
                    <div class="info-item">
                      <el-icon><Timer /></el-icon>
                      <span>{{ exam.duration }}分钟</span>
                    </div>
                    <div class="info-item">
                      <el-icon><Trophy /></el-icon>
                      <span>总分：{{ exam.totalScore }}</span>
                    </div>
                    <div class="info-item">
                      <el-icon><User /></el-icon>
                      <span>状态：{{ getExamStatusText(exam.status) }}</span>
                    </div>
                    <div class="info-item" v-if="exam.bookingInfo">
                      <el-icon><Location /></el-icon>
                      <span>地点：{{ exam.bookingInfo.examLocation }}</span>
                    </div>
                  </div>

                  <div class="card-footer">
                    <div class="action-buttons">
                      <el-button size="small" @click="viewExamDetail(exam.id)">
                        <el-icon><View /></el-icon>
                        详情
                      </el-button>
                      <el-button
                          size="small"
                          @click="viewBookingDetails(exam.id)"
                          :loading="loadingBookingDetails"
                      >
                        <el-icon><Document /></el-icon>
                        预约详情
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 我的预约 -->
      <el-tab-pane label="我的预约" name="myBookings">
        <template #label>
          <span class="tab-label">
            <el-icon><Document /></el-icon>
            我的预约
          </span>
        </template>
        <div class="redirect-message">
          <el-result
              icon="info"
              title="正在跳转到我的预约"
              sub-title="请稍候..."
          >
            <template #extra>
              <el-button type="primary" @click="goToMyBookings">立即跳转</el-button>
            </template>
          </el-result>
        </div>
      </el-tab-pane>

      <el-tab-pane label="消息通知" name="notifications">
        <template #label>
          <span class="tab-label">
            <el-icon><Bell /></el-icon>
            消息通知
            <el-badge
                :value="unreadCount"
                :max="99"
                :hidden="unreadCount === 0"
                class="notification-badge"
            />
          </span>
        </template>

        <div class="redirect-message">
          <el-result
              icon="info"
              title="正在跳转到消息通知"
              sub-title="请稍候..."
          >
            <template #extra>
              <el-button type="primary" @click="goToNotifications">立即跳转</el-button>
            </template>
          </el-result>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 时间段预约区域 -->
    <div class="time-slots-section" v-if="selectedExam">
      <div class="slots-header">
        <h2 class="section-title">{{ selectedExam.title }} - 可预约时间段</h2>
        <el-button size="small" @click="closeTimeSlots">
          <el-icon><Close /></el-icon>
          关闭
        </el-button>
      </div>

      <div v-if="loadingSlots" class="loading-slots" v-loading="loadingSlots">
        <span>加载时间段...</span>
      </div>

      <div v-else-if="timeSlotsError" class="error-message">
        <el-alert
            :title="timeSlotsError"
            type="error"
            show-icon
            :closable="false"
        />
      </div>

      <div v-else-if="timeSlots.length === 0" class="empty-slots">
        <el-empty description="暂无可用时间段" />
      </div>

      <div v-else class="time-slots-grid">
        <div
            v-for="slot in timeSlots"
            :key="slot.id"
            class="time-slot-card"
            :class="{
            'available': slot.status === 'AVAILABLE',
            'full': slot.status === 'FULL',
            'selected': selectedTimeSlot?.id === slot.id
          }"
            @click="selectTimeSlot(slot)"
        >
          <div class="slot-header">
            <div class="slot-time">
              <div class="date">{{ formatDate(slot.slotDate) }}</div>
              <div class="time">{{ slot.startTime }} - {{ slot.endTime }}</div>
            </div>
            <div class="slot-status">
              <el-tag
                  :type="slot.status === 'AVAILABLE' ? 'success' : 'danger'"
                  size="small"
              >
                {{ slot.status === 'AVAILABLE' ? '可预约' : '已满' }}
              </el-tag>
            </div>
          </div>

          <div class="slot-info">
            <div class="info-row">
              <el-icon><Location /></el-icon>
              <span>{{ slot.examLocation }}</span>
            </div>
            <div class="info-row">
              <el-icon><User /></el-icon>
              <span>{{ slot.currentBookings }}/{{ slot.maxCapacity }}人</span>
            </div>
            <div class="info-row">
              <el-icon><Monitor /></el-icon>
              <span>{{ getExamModeText(slot.examMode) }}</span>
            </div>
          </div>

          <div class="slot-progress">
            <el-progress
                :percentage="(slot.currentBookings / slot.maxCapacity) * 100"
                :show-text="false"
                :stroke-width="6"
                :color="getProgressColor(slot.currentBookings / slot.maxCapacity)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 预约对话框 -->
    <el-dialog
        v-model="bookingDialogVisible"
        :title="`预约考试 - ${selectedExam?.title || ''}`"
        width="600px"
        @close="resetBookingForm"
    >
      <div v-if="selectedTimeSlot" class="booking-dialog-content">
        <div class="selected-slot-info">
          <h4>选择的时间段</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="考试名称" :span="2">
              {{ selectedExam.title }}
            </el-descriptions-item>
            <el-descriptions-item label="考试日期">
              {{ formatDate(selectedTimeSlot.slotDate) }}
            </el-descriptions-item>
            <el-descriptions-item label="考试时间">
              {{ selectedTimeSlot.startTime }} - {{ selectedTimeSlot.endTime }}
            </el-descriptions-item>
            <el-descriptions-item label="考试地点">
              {{ selectedTimeSlot.examLocation }}
            </el-descriptions-item>
            <el-descriptions-item label="考试模式">
              {{ getExamModeText(selectedTimeSlot.examMode) }}
            </el-descriptions-item>
            <el-descriptions-item label="预约截止">
              {{ formatDateTime(selectedTimeSlot.bookingEndTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="剩余名额">
              {{ selectedTimeSlot.maxCapacity - selectedTimeSlot.currentBookings }}人
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <el-form
            ref="bookingFormRef"
            :model="bookingForm"
            :rules="bookingRules"
            label-width="100px"
        >
          <el-form-item label="联系电话" prop="contactPhone">
            <el-input
                v-model="bookingForm.contactPhone"
                placeholder="请输入手机号码"
                maxlength="11"
            />
          </el-form-item>

          <el-form-item label="联系邮箱" prop="contactEmail">
            <el-input
                v-model="bookingForm.contactEmail"
                placeholder="请输入邮箱地址"
            />
          </el-form-item>

          <el-form-item label="特殊需求">
            <el-input
                v-model="bookingForm.specialRequirements"
                type="textarea"
                :rows="3"
                placeholder="如有特殊需求请说明（可选）"
                maxlength="200"
                show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="bookingDialogVisible = false">取消</el-button>
          <el-button
              type="primary"
              @click="confirmBooking"
              :loading="bookingLoading"
              :disabled="!selectedTimeSlot"
          >
            确认预约
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import {
  Refresh as RefreshIcon,
  Calendar as CalendarIcon,
  Timer as TimerIcon,
  Trophy as TrophyIcon,
  View as ViewIcon,
  Clock as ClockIcon,
  CaretRight as CaretRightIcon,
  Close as CloseIcon,
  Location as LocationIcon,
  User as UserIcon,
  Monitor as MonitorIcon,
  Document as DocumentIcon,
  SuccessFilled as SuccessFilledIcon,
  Bell as BellIcon
} from '@element-plus/icons-vue'
import { formatDate, formatTime, formatDateTime } from '@/utils/dateUtils'
import examApi from '@/api/exam'
import examBookingApi from '@/api/examBooking'
import { useBookingStore } from '@/stores/booking'

export default {
  name: 'ExamBookingCenter',
  data() {
    return {
      loading: false,
      activeTab: 'bookable',
      bookableExams: [],
      onlineExams: [],
      offlineExams: [],
      selectedExam: null,
      timeSlots: [],
      loadingSlots: false,
      timeSlotsError: null,
      selectedTimeSlot: null,
      bookingDialogVisible: false,
      bookingLoading: false,
      bookingForm: {
        timeSlotId: null,
        contactPhone: '',
        contactEmail: '',
        specialRequirements: ''
      },
      bookingRules: {
        contactPhone: [
          { required: true, message: '请输入联系电话', trigger: 'blur' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
        ],
        contactEmail: [
          { required: true, message: '请输入联系邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ]
      },
      loadingBookingDetails: false,
      dataLoaded: false,
    }
  },
  computed: {
    currentExams() {
      if (this.activeTab === 'bookable') {
        return this.bookableExams
      } else if (this.activeTab === 'myExams') {
        return [...this.onlineExams, ...this.offlineExams]
      }
      return []
    },
    unreadCount() {
      return useBookingStore().unreadCount
    }
  },
  watch: {
    activeTab: {
      handler(newTab) {
        if (newTab !== 'myBookings') {
          this.loadCurrentTabData()
        }
      },
      immediate: true
    }
  },
  mounted() {
    if (!this.dataLoaded) {
      this.loadCurrentTabData()
    }
    useBookingStore().fetchUserNotifications(this.getCurrentUserId())
    this.refreshInterval = setInterval(() => {
      useBookingStore().fetchUserNotifications(this.getCurrentUserId())
    }, 300000)
  },
  beforeUnmount() {
    clearInterval(this.refreshInterval)
  },
  methods: {
    async loadCurrentTabData() {
      if (this.activeTab === 'bookable') {
        await this.loadBookableExams()
      } else if (this.activeTab === 'myExams') {
        await this.loadBookedExams()
      }
      this.dataLoaded = true
    },
    handleTabClick(tab) {
      if (tab.paneName === 'myBookings') {
        this.goToMyBookings()
      } else if (tab.paneName === 'notifications') {
        this.goToNotifications()
      } else {
        this.activeTab = tab.paneName
      }
    },
    goToNotifications() {
      this.$router.push('/exam-booking/notifications')
    },
    refreshCurrentTab() {
      this.loadCurrentTabData()
    },
    async loadBookableExams() {
      this.loading = true
      try {
        const response = await examApi.getBookableExams()
        const data = response.data?.data || response.data || []
        this.bookableExams = data.map(exam => ({
          ...exam,
          allowBooking: true
        }))
      } catch (error) {
        console.error('Failed to load bookable exams:', error)
        this.$message.error('加载可预约考试失败：' + (error.message || '请稍后重试'))
      } finally {
        this.loading = false
      }
    },
    async loadBookedExams() {
      this.loading = true
      try {
        const response = await examApi.getBookedExams()
        const data = response.data?.data || []
        this.onlineExams = data.filter(exam => exam.examMode === 'ONLINE')
        this.offlineExams = data.filter(exam => exam.examMode === 'OFFLINE')
      } catch (error) {
        console.error('Failed to load booked exams:', error)
        this.$message.error('加载已预约考试失败：' + (error.message || '请稍后重试'))
      } finally {
        this.loading = false
      }
    },
    async showTimeSlots(exam) {
      this.selectedExam = exam
      this.loadingSlots = true
      this.timeSlotsError = null
      try {
        const response = await examBookingApi.getAvailableTimeSlots(exam.id)
        this.timeSlots = response.data?.data || response.data || []
      } catch (err) {
        console.error('Failed to load time slots:', err)
        this.timeSlotsError = err.message || '加载时间段失败'
      } finally {
        this.loadingSlots = false
      }
    },
    closeTimeSlots() {
      this.selectedExam = null
      this.timeSlots = []
      this.selectedTimeSlot = null
    },
    selectTimeSlot(slot) {
      if (slot.status !== 'AVAILABLE') {
        this.$message.warning('该时间段已满，无法预约')
        return
      }
      this.selectedTimeSlot = slot
      this.bookingForm.timeSlotId = slot.id
      this.bookingDialogVisible = true
    },
    async confirmBooking() {
      try {
        await this.$refs.bookingFormRef.validate()
        this.bookingLoading = true

        const bookingData = {
          ...this.bookingForm,
          examId: this.selectedExam.id,
          userId: this.getCurrentUserId()
        }

        const response = await examBookingApi.bookExam(bookingData)

        if (!response.data || !response.data.success) {
          throw new Error(response.data?.message || '预约失败')
        }

        if (!response.data.data?.id) {
          throw new Error('未返回预约ID')
        }

        this.$message.success('预约成功！ID: ' + response.data.data.id)
        this.bookingDialogVisible = false

        await this.showTimeSlots(this.selectedExam)
        await this.loadBookableExams()

      } catch (error) {
        console.error('预约失败详情:', error.response || error)
        this.$message.error(`预约失败: ${error.message}`)
      } finally {
        this.bookingLoading = false
      }
    },
    resetBookingForm() {
      this.bookingForm = {
        timeSlotId: null,
        contactPhone: '',
        contactEmail: '',
        specialRequirements: ''
      }
      if (this.$refs.bookingFormRef) {
        this.$refs.bookingFormRef.resetFields()
      }
    },
    async startExam(examId) {
      try {
        await this.$confirm(
            '确定要开始考试吗？考试开始后将无法退出。',
            '开始考试',
            {
              type: 'warning',
              confirmButtonText: '开始考试',
              cancelButtonText: '取消'
            }
        )
        this.$router.push(`/exams/${examId}/take`)
      } catch (error) {
        // 用户取消
      }
    },
    viewExamDetail(examId) {
      this.$router.push(`/exams/${examId}`)
    },
    async viewBookingDetails(examId) {
      try {
        const userId = this.getCurrentUserId()
        this.loadingBookingDetails = true
        const bookingResponse = await examBookingApi.getBookingIdByUserAndExam(userId, examId)
        const bookingId = bookingResponse.data?.data || bookingResponse.data

        if (!bookingId) {
          this.$message.error('未找到预约记录')
          return
        }

        this.$router.push(`/exam-booking/details/${bookingId}`)
      } catch (error) {
        console.error('Failed to view booking details:', error)
        this.$message.error(`获取预约详情失败: ${error.message || '请稍后重试'}`)
      } finally {
        this.loadingBookingDetails = false
      }
    },
    viewExamResult(examId) {
      this.$router.push(`/exams/${examId}/result`)
    },
    canStartExam(exam) {
      if (!exam.bookingInfo || exam.examMode !== 'ONLINE') return false

      const now = new Date()
      const examTime = new Date(exam.bookingInfo.examDateTime)
      const timeDiff = examTime.getTime() - now.getTime()

      return timeDiff <= 30 * 60 * 1000 && timeDiff >= -exam.duration * 60 * 1000
    },
    canShowStartButton(exam) {
      return exam.status === 'PUBLISHED'
    },
    getExamStatusText(status) {
      const statusMap = {
        'DRAFT': '草稿',
        'PUBLISHED': '已发布',
        'ENDED': '已结束',
        'CANCELLED': '已取消',
      }
      return statusMap[status] || status
    },
    getExamModeText(mode) {
      const modes = {
        'ONLINE': '线上考试',
        'OFFLINE': '线下考试',
        'HYBRID': '混合模式'
      }
      return modes[mode] || mode
    },
    getExamModeTagType(mode) {
      return mode === 'ONLINE' ? 'primary' : 'warning'
    },
    getProgressColor(percentage) {
      if (percentage < 0.5) return '#67c23a'
      if (percentage < 0.8) return '#e6a23c'
      return '#f56c6c'
    },
    getCurrentUserId() {
      const userInfo = localStorage.getItem('userInfo')
      if (userInfo) {
        try {
          const user = JSON.parse(userInfo)
          return user.id
        } catch (e) {
          return 1
        }
      }
      return 1
    },
    goToMyBookings() {
      this.$router.push('/exam-booking/my-bookings')
    },
    formatDate,
    formatTime,
    formatDateTime
  }
}
</script>

<style scoped>
.exam-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.page-title {
  margin: 0;
  color: #303133;
  font-size: 24px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.exam-tabs {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-text {
  margin-right: 4px; /* 为徽标预留空间 */
}

.tab-badge {
  margin-left: 4px;
}

.tab-content {
  padding: 20px;
  min-height: 400px;
}

.exam-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.exam-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #e4e7ed;
}

.section-title {
  margin: 0;
  font-size: 18px;
  color: #409eff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.exam-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
}

.exam-card {
  transition: transform 0.3s, box-shadow 0.3s;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.exam-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.bookable-card {
  border-left: 4px solid #e6a23c;
}

.online-card {
  border-left: 4px solid #409eff;
}

.offline-card {
  border-left: 4px solid #e6a23c;
}

.card-header {
  padding: 16px;
  background: linear-gradient(to right, #f8fafc, #fff);
}

.exam-title {
  font-size: 18px;
  color: #303133;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.exam-badges {
  display: flex;
  gap: 8px;
  align-items: center;
}

.duration-badge {
  background: #f0f9ff;
  color: #409eff;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.exam-description {
  color: #606266;
  font-size: 14px;
  margin: 0 16px 16px;
  line-height: 1.6;
}

.exam-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 0 16px 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #606266;
}

.card-footer {
  padding: 12px 16px;
  background: #f9f9f9;
  border-top: 1px solid #f0f0f0;
}

.action-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.redirect-message {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.time-slots-section {
  margin-top: 20px;
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.slots-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.time-slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.time-slot-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.time-slot-card.available:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.time-slot-card.full {
  background: #f9f9f9;
  cursor: not-allowed;
  opacity: 0.7;
}

.time-slot-card.selected {
  border-color: #409eff;
  background-color: #f0f7ff;
}

.slot-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.slot-time .date {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.slot-time .time {
  color: #606266;
  font-size: 13px;
  margin-top: 2px;
}

.slot-info {
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #606266;
  font-size: 13px;
  margin-bottom: 4px;
}

.slot-progress {
  margin-top: 8px;
}

.booking-dialog-content {
  padding: 0 4px;
}

.selected-slot-info {
  margin-bottom: 24px;
}

.selected-slot-info h4 {
  margin: 0 0 12px 0;
  color: #303133;
}

.loading-slots,
.empty-slots,
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}
/* 在style部分添加通知标签的特殊样式 */
.notification-tab {
  position: relative;
}

.notification-badge {
  position: static; /* 改为静态定位 */
  transform: none; /* 移除可能的变换 */
  margin-left: 0; /* 重置边距 */
}

.notification-badge {
  margin-left: 6px;
}

@media (max-width: 992px) {
  .exam-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}

@media (max-width: 768px) {
  .exam-grid {
    grid-template-columns: 1fr;
  }

  .exam-info {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .action-buttons {
    justify-content: center;
  }
}
</style>