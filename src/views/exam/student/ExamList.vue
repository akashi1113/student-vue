<template>
  <div class="exam-container">
    <!-- 顶部标题区域 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-icon><Notebook /></el-icon>
          考试中心
        </h1>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
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
              <el-empty description="暂无可预约的考试" image-size="200" />
            </div>

            <div v-else class="exam-grid">
              <div v-for="exam in bookableExams" :key="exam.id" class="exam-card bookable-card">
                <div class="card-header">
                  <h3 class="exam-title">{{ exam.title }}</h3>
                  <div class="exam-badges">
                    <el-tag type="warning" effect="dark" size="small">可预约</el-tag>
                    <el-tag :type="getExamModeTagType(exam.examMode)" effect="plain" size="small">
                      {{ getExamModeText(exam.examMode) }}
                    </el-tag>
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
                  <div class="info-item">
                    <el-icon><User /></el-icon>
                    <span>剩余名额：{{ exam.remainingQuota || '不限' }}</span>
                  </div>
                </div>

                <div class="card-footer">
                  <div class="action-buttons">
                    <el-button size="small" @click="viewExamDetail(exam.id)" plain>
                      <el-icon><View /></el-icon>
                      详情
                    </el-button>
                    <el-button
                        size="small"
                        type="warning"
                        @click="showTimeSlots(exam)"
                        plain
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
              <el-empty description="暂无考试安排" image-size="200" />
            </div>

            <div v-else class="exam-sections">
              <!-- 线上考试 -->
              <div v-if="onlineExams.length > 0" class="exam-section">
                <div class="section-header">
                  <h3 class="section-title">
                    <el-icon><Monitor /></el-icon>
                    线上考试
                  </h3>
                  <el-tag type="primary" effect="light" round>
                    共 {{ onlineExams.length }} 场
                  </el-tag>
                </div>

                <div class="exam-grid">
                  <div v-for="exam in onlineExams" :key="exam.id" class="exam-card online-card">
                    <div class="card-header">
                      <h3 class="exam-title">{{ exam.title }}</h3>
                      <div class="exam-badges">
                        <el-tag type="success" effect="dark" size="small">已预约</el-tag>
                        <el-tag type="primary" effect="plain" size="small">线上</el-tag>
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
                      <div class="info-item" v-if="exam.startTime">
                        <el-icon><Calendar /></el-icon>
                        <span>时间：{{ formatDateTime(exam.startTime) }}</span>
                      </div>
                    </div>

                    <div class="card-footer">
                      <div class="action-buttons">
                        <el-button size="small" @click="viewExamDetail(exam.id)" plain>
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
                            type="success"
                            @click="viewExamResult(exam.id)"
                            v-if="exam.examStatus === 'COMPLETED'"
                            plain
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
                  <el-tag type="warning" effect="light" round>
                    共 {{ offlineExams.length }} 场
                  </el-tag>
                </div>

                <div class="exam-grid">
                  <div v-for="exam in offlineExams" :key="exam.id" class="exam-card offline-card">
                    <div class="card-header">
                      <h3 class="exam-title">{{ exam.title }}</h3>
                      <div class="exam-badges">
                        <el-tag type="success" effect="dark" size="small">已预约</el-tag>
                        <el-tag type="warning" effect="plain" size="small">线下</el-tag>
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
                      <div class="info-item" v-if="exam.examBooking">
                        <el-icon><Location /></el-icon>
                        <span>地点：{{ exam.examBooking.examLocation }}</span>
                      </div>
                      <div class="info-item" v-if="exam.examBooking">
                        <el-icon><Calendar /></el-icon>
                        <span>时间：{{ formatDateTime(exam.examBooking.timeSlot.slotDate) }} {{ exam.examBooking.timeSlot.startTime }}</span>
                      </div>
                    </div>

                    <div class="card-footer">
                      <div class="action-buttons">
                        <el-button size="small" @click="viewExamDetail(exam.id)" plain>
                          <el-icon><View /></el-icon>
                          详情
                        </el-button>
                        <el-button
                            size="small"
                            @click="viewBookingDetails(exam.id)"
                            :loading="loadingBookingDetails"
                            plain
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
                <el-button type="primary" @click="goToMyBookings" round>立即跳转</el-button>
              </template>
            </el-result>
          </div>
        </el-tab-pane>

        <!-- 消息通知 -->
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
                <el-button type="primary" @click="goToNotifications" round>立即跳转</el-button>
              </template>
            </el-result>
          </div>
        </el-tab-pane>
      </el-tabs>

      <!-- 时间段预约区域 -->
      <div class="time-slots-section" v-if="selectedExam">
        <div class="slots-header">
          <h2 class="section-title">{{ selectedExam.title }} - 可预约时间段</h2>
          <el-button size="small" @click="closeTimeSlots" plain round>
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
          <el-empty description="暂无可用时间段" image-size="150" />
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
                    effect="dark"
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
          center
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
              label-position="top"
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
            <el-button @click="bookingDialogVisible = false" round>取消</el-button>
            <el-button
                type="primary"
                @click="confirmBooking"
                :loading="bookingLoading"
                :disabled="!selectedTimeSlot"
                round
            >
              确认预约
            </el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script>
import {
  Notebook, Calendar, SuccessFilled, Document, Bell,
  Close, View, Clock, CaretRight, Trophy, Monitor,
  Location, Timer, User, Refresh
} from '@element-plus/icons-vue'
import { formatDate, formatTime, formatDateTime } from '@/utils/dateUtils'
import examApi from '@/api/exam'
import examBookingApi from '@/api/examBooking'
import { useBookingStore } from '@/stores/booking'

export default {
  name: 'ExamBookingCenter',
  components: {
    Notebook, Calendar, SuccessFilled, Document, Bell,
    Close, View, Clock, CaretRight, Trophy, Monitor,
    Location, Timer, User
  },
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
      userName: '',
      userAvatar: '',
      unreadCount: 0,
      refreshInterval: null
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
    this.initUserInfo()
    const token = this.getToken()
    if (token) {
      useBookingStore().fetchUserNotifications(token)
      this.refreshInterval = setInterval(() => {
        useBookingStore().fetchUserNotifications(token)
      }, 300000)
    }
    this.unreadCount = useBookingStore().unreadCount
  },
  beforeUnmount() {
    clearInterval(this.refreshInterval)
  },
  methods: {
    initUserInfo() {
      this.userName = localStorage.getItem('username') || '学生'
      this.userAvatar = localStorage.getItem('avatar') || ''
    },

    getToken() {
      return localStorage.getItem('token')
    },

    extractData(response) {
      console.log('API Response:', response)
      if (Array.isArray(response)) return response
      if (response && response.data) {
        if (response.data.success && response.data.data) {
          return response.data.data
        }
        if (Array.isArray(response.data)) {
          return response.data
        }
        return response.data
      }
      return []
    },

    async loadCurrentTabData() {
      if (this.activeTab === 'bookable') {
        await this.loadBookableExams()
      } else if (this.activeTab === 'myExams') {
        await this.loadBookedExams()
      }
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
        console.log('Loading bookable exams...')
        const response = await examApi.getBookableExams()
        console.log('Bookable exams response:', response)

        const data = this.extractData(response)
        this.bookableExams = data.map(exam => ({
          ...exam,
          allowBooking: true
        }))

        console.log('Processed bookable exams:', this.bookableExams)
      } catch (error) {
        console.error('Failed to load bookable exams:', error)
        this.$message.error('加载可预约考试失败：' + (error.message || '请稍后重试'))
        this.bookableExams = []
      } finally {
        this.loading = false
      }
    },

    async loadBookedExams() {
      this.loading = true
      try {
        const token = this.getToken()
        if (!token) {
          throw new Error('未找到认证信息，请重新登录')
        }

        console.log('Loading booked exams with token:', token)
        const response = await examApi.getBookedExams(token)
        console.log('Booked exams response:', response)

        const data = this.extractData(response)

        this.onlineExams = data.filter(exam => exam.examMode === 'ONLINE')
        this.offlineExams = data.filter(exam => exam.examMode === 'OFFLINE')

        console.log('Online exams:', this.onlineExams)
        console.log('Offline exams:', this.offlineExams)
      } catch (error) {
        console.error('Failed to load booked exams:', error)
        this.$message.error('加载已预约考试失败：' + (error.message || '请稍后重试'))
        this.onlineExams = []
        this.offlineExams = []
      } finally {
        this.loading = false
      }
    },

    async showTimeSlots(exam) {
      this.selectedExam = exam
      this.loadingSlots = true
      this.timeSlotsError = null
      try {
        console.log('Loading time slots for exam:', exam.id)
        const response = await examBookingApi.getAvailableTimeSlots(exam.id)
        console.log('Time slots response:', response)

        const data = this.extractData(response)
        this.timeSlots = data

        console.log('Processed time slots:', this.timeSlots)
      } catch (err) {
        console.error('Failed to load time slots:', err)
        this.timeSlotsError = err.message || '加载时间段失败'
        this.timeSlots = []
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

        const token = this.getToken()
        if (!token) {
          throw new Error('未找到认证信息，请重新登录')
        }

        const bookingData = {
          ...this.bookingForm,
          examId: this.selectedExam.id
        }

        console.log('Booking data:', bookingData)
        const response = await examBookingApi.bookExam(bookingData, token)
        console.log('Booking response:', response)

        this.$message.success('预约成功！')
        this.bookingDialogVisible = false

        await this.showTimeSlots(this.selectedExam)
        await this.loadBookableExams()

      } catch (error) {
        console.error('预约失败详情:', error)
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
        this.loadingBookingDetails = true
        const token = this.getToken()
        if (!token) {
          throw new Error('未找到认证信息，请重新登录')
        }

        console.log('Getting booking details for exam:', examId)
        const response = await examBookingApi.getBookingIdByUserAndExam(examId, token)
        console.log('Booking ID response:', response)

        const bookingId = this.extractData(response)

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
      if (exam.examBooking===null || exam.examMode !== 'ONLINE') return false

      const now = new Date()
      const examStartTime = new Date(exam.examBooking.timeSlot.bookingStartTime)
      const examEndTime = new Date(exam.examBooking.timeSlot.bookingEndTime)

      return now.getTime()>=examStartTime.getTime() && now.getTime()<=examEndTime.getTime()
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
/* 全局容器 - 变窄且下移 */
.exam-container {
  padding: 0;
  max-width: 1300px; /* 整体宽度缩小 */
  margin: 24px auto 0; /* 顶部增加外边距实现下移 */
  background-color: #f8fafc;
  min-height: calc(100vh - 24px);
}

/* 白底标题区域 */
.page-header {
  background: white;
  padding: 20px 24px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  border: 1px solid #e2e8f0;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1e293b;
}

.page-title .el-icon {
  font-size: 24px;
  color: #60a5fa; /* 淡蓝色图标 */
}

/* 主内容区域 - 变窄 */
.main-content {
  max-width: 1300px;
  margin: 0 auto;
  padding: 16px 16px 40px; /* 左右内边距缩小 */
}

/* 标签页样式 */
.exam-tabs {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-top: 8px; /* 下移间距 */
}

:deep(.el-tabs__header) {
  margin: 0;
  background: linear-gradient(to right, #f8fafc, #f0f9ff);
}

:deep(.el-tabs__nav-wrap) {
  padding: 0 16px; /* 内边距缩小 */
}

:deep(.el-tabs__item) {
  font-size: 14px;
  height: 50px;
  padding: 0 16px;
  color: #64748b;
  transition: all 0.3s ease;
}

:deep(.el-tabs__item:hover) {
  color: #60a5fa; /* 淡蓝色悬停 */
}

:deep(.el-tabs__item.is-active) {
  color: #3b82f6;
  font-weight: 600;
}

:deep(.el-tabs__active-bar) {
  height: 3px;
  background-color: #60a5fa; /* 淡蓝色激活条 */
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 考试卡片区域 - 变窄 */
.exam-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); /* 卡片宽度缩小 */
  gap: 20px;
  padding: 16px;
}

.exam-card {
  border-radius: 10px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  border-top: 4px solid transparent;
  overflow: hidden;
}

.exam-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(96, 165, 250, 0.15);
}

/* 卡片类型颜色 */
.bookable-card {
  border-top-color: #f59e0b;
}
.online-card {
  border-top-color: #60a5fa; /* 淡蓝色线上考试 */
}
.offline-card {
  border-top-color: #10b981;
}

.card-header {
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.exam-title {
  font-size: 16px;
  color: #1e293b;
  margin: 0 0 12px 0;
  font-weight: 600;
}

.exam-badges {
  display: flex;
  gap: 8px;
}

.exam-description {
  color: #64748b;
  font-size: 14px;
  margin: 0 16px 16px;
  line-height: 1.6;
  min-height: 60px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
  gap: 8px;
  font-size: 14px;
  color: #475569;
}

.card-footer {
  padding: 12px 16px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* 线上考试标题下移 */
.online-section .section-header {
  padding-top: 24px !important; /* 强制下移 */
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 0;
}

.section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #1e293b;
}

/* 时间段选择区域 */
.time-slots-section {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-top: 24px;
}

.time-slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.time-slot-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
}

.time-slot-card.available:hover {
  border-color: #60a5fa;
  box-shadow: 0 4px 12px rgba(96, 165, 250, 0.15);
}

.time-slot-card.selected {
  border-color: #60a5fa;
  background-color: #f0f9ff;
}

/* 按钮样式 */
.el-button {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}
.el-button--primary {
  background-color: #60a5fa;
  border-color: #60a5fa;
}
.el-button--primary:hover {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .exam-container {
    max-width: 100%;
    padding: 0 20px;
  }
}
@media (max-width: 768px) {
  .exam-grid {
    grid-template-columns: 1fr;
  }
  .online-section .section-header {
    padding-top: 20px !important;
  }
}
@media (max-width: 576px) {
  .page-title {
    font-size: 18px;
  }
  :deep(.el-tabs__item) {
    padding: 0 12px;
  }
}
</style>