<template>
  <div class="available-exams">
    <div class="page-header">
      <h1>可预约考试</h1>
      <div class="header-actions">
        <el-select
            v-model="selectedExamMode"
            placeholder="选择考试模式"
            clearable
            style="width: 200px; margin-right: 16px;"
            @change="handleModeChange"
        >
          <el-option label="全部" value="" />
          <el-option label="线上考试" value="ONLINE" />
          <el-option label="线下考试" value="OFFLINE" />
          <el-option label="混合模式" value="HYBRID" />
        </el-select>

        <el-date-picker
            v-model="selectedDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="handleDateChange"
        />
      </div>
    </div>

    <div class="exam-list" v-loading="loading">
      <div v-if="availableExams.length === 0" class="empty-state">
        <el-empty description="暂无可预约的考试" />
      </div>

      <div v-else class="exam-grid">
        <div v-for="exam in availableExams" :key="exam.id" class="exam-item">
          <el-card class="exam-card">
            <div class="exam-header">
              <h3>{{ exam.title }}</h3>
              <el-tag type="primary">{{ exam.type }}</el-tag>
            </div>

            <div class="exam-info">
              <p class="exam-description">{{ exam.description }}</p>
              <div class="exam-meta">
                <span><el-icon><Timer /></el-icon>时长：{{ exam.duration }}分钟</span>
                <span><el-icon><Trophy /></el-icon>总分：{{ exam.totalScore }}分</span>
                <span><el-icon><Calendar /></el-icon>截止：{{ formatDateTime(exam.endTime) }}</span>
              </div>
            </div>

            <div class="time-slots-section">
              <h4>可预约时间段</h4>
              <div v-if="exam.timeSlots && exam.timeSlots.length > 0">
                <TimeSlotCard
                    v-for="timeSlot in exam.timeSlots"
                    :key="timeSlot.id"
                    :time-slot="timeSlot"
                    @book="handleBookExam"
                />
              </div>
              <div v-else class="no-slots">
                <el-button @click="loadTimeSlots(exam.id)" :loading="loadingSlots">
                  加载时间段
                </el-button>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>

    <!-- 预约对话框 -->
    <el-dialog
        v-model="bookingDialogVisible"
        title="考试预约"
        width="600px"
        @close="resetBookingForm"
    >
      <el-form
          ref="bookingFormRef"
          :model="bookingForm"
          :rules="bookingRules"
          label-width="100px"
      >
        <div class="selected-slot-info">
          <h4>选择的时间段</h4>
          <div class="slot-summary">
            <p><strong>考试：</strong>{{ selectedTimeSlot?.examTitle }}</p>
            <p><strong>时间：</strong>{{ formatDate(selectedTimeSlot?.slotDate) }} {{ formatTime(selectedTimeSlot?.startTime) }} - {{ formatTime(selectedTimeSlot?.endTime) }}</p>
            <p><strong>地点：</strong>{{ selectedTimeSlot?.examLocation }}</p>
            <p><strong>模式：</strong>{{ getExamModeText(selectedTimeSlot?.examMode) }}</p>
          </div>
        </div>

        <el-form-item label="联系电话" prop="contactPhone">
          <el-input
              v-model="bookingForm.contactPhone"
              placeholder="请输入联系电话"
              maxlength="11"
          />
        </el-form-item>

        <el-form-item label="联系邮箱" prop="contactEmail">
          <el-input
              v-model="bookingForm.contactEmail"
              placeholder="请输入联系邮箱"
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

        <el-form-item label="备注">
          <el-input
              v-model="bookingForm.remarks"
              type="textarea"
              :rows="2"
              placeholder="其他备注信息（可选）"
              maxlength="100"
              show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="bookingDialogVisible = false">取消</el-button>
          <el-button
              type="primary"
              @click="confirmBooking"
              :loading="bookingLoading"
          >
            确认预约
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { Timer, Trophy, Calendar } from '@element-plus/icons-vue'
import TimeSlotCard from '@/components/exam/TimeSlotCard.vue'
import { useBookingStore } from '@/stores/booking'
import { getAvailableTimeSlots } from '@/api/examBooking'
import { formatDate, formatTime, formatDateTime, getExamModeText } from '@/utils/dateUtils'

export default {
  name: 'AvailableExams',
  components: {
    TimeSlotCard
  },
  data() {
    return {
      loading: false,
      loadingSlots: false,
      bookingLoading: false,
      selectedExamMode: '',
      selectedDate: '',
      availableExams: [],
      bookingDialogVisible: false,
      selectedTimeSlot: null,

      // 表单相关
      bookingForm: {
        timeSlotId: null,
        userId: 1, // 这里应该从用户状态获取
        contactPhone: '',
        contactEmail: '',
        specialRequirements: '',
        remarks: ''
      },

      // 表单验证规则
      bookingRules: {
        contactPhone: [
          { required: true, message: '请输入联系电话', trigger: 'blur' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
        ],
        contactEmail: [
          { required: true, message: '请输入联系邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    bookingStore() {
      return useBookingStore()
    }
  },
  created() {
    this.loadAvailableExams()
  },
  methods: {
    async loadAvailableExams() {
      this.loading = true
      try {
        // 这里应该调用获取可用考试列表的API
        // 模拟数据
        this.availableExams = [
          {
            id: 1,
            title: '高等数学期末考试',
            description: '本学期高等数学课程期末考试，包含微积分、线性代数等内容',
            duration: 120,
            totalScore: 100,
            type: 'EXAM',
            endTime: '2024-01-15 23:59:59',
            timeSlots: []
          },
          {
            id: 2,
            title: '英语四级模拟考试',
            description: '英语四级考试模拟测试，帮助学生熟悉考试流程',
            duration: 150,
            totalScore: 710,
            type: 'EXAM',
            endTime: '2024-01-20 23:59:59',
            timeSlots: []
          }
        ]
      } catch (error) {
        this.$message.error('加载考试列表失败')
      } finally {
        this.loading = false
      }
    },

    async loadTimeSlots(examId) {
      this.loadingSlots = true
      try {
        const response = await getAvailableTimeSlots(examId)
        const exam = this.availableExams.find(e => e.id === examId)
        if (exam) {
          exam.timeSlots = response.data || []
        }
      } catch (error) {
        this.$message.error('加载时间段失败')
      } finally {
        this.loadingSlots = false
      }
    },

    handleModeChange() {
      // 根据模式筛选
      this.loadAvailableExams()
    },

    handleDateChange() {
      // 根据日期筛选
      this.loadAvailableExams()
    },

    handleBookExam(timeSlot) {
      this.selectedTimeSlot = timeSlot
      this.bookingForm.timeSlotId = timeSlot.id
      this.bookingDialogVisible = true
    },

    async confirmBooking() {
      try {
        await this.$refs.bookingForm.validate()

        this.bookingLoading = true
        const response = await this.bookingStore.bookExam(this.bookingForm)

        this.$message.success('预约成功！')
        this.bookingDialogVisible = false

        // 刷新时间段信息
        const exam = this.availableExams.find(e =>
            e.timeSlots.some(slot => slot.id === this.bookingForm.timeSlotId)
        )
        if (exam) {
          await this.loadTimeSlots(exam.id)
        }

      } catch (error) {
        if (error.message) {
          this.$message.error(error.message)
        }
      } finally {
        this.bookingLoading = false
      }
    },

    resetBookingForm() {
      this.bookingForm.timeSlotId = null
      this.bookingForm.contactPhone = ''
      this.bookingForm.contactEmail = ''
      this.bookingForm.specialRequirements = ''
      this.bookingForm.remarks = ''
      this.selectedTimeSlot = null

      if (this.$refs.bookingForm) {
        this.$refs.bookingForm.resetFields()
      }
    },

    formatDate,
    formatTime,
    formatDateTime,
    getExamModeText
  }
}
</script>

<style scoped>
.available-exams {
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

.exam-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(600px, 1fr));
  gap: 24px;
}

.exam-card {
  height: fit-content;
}

.exam-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.exam-header h3 {
  margin: 0;
  color: #303133;
}

.exam-description {
  margin: 0 0 12px 0;
  color: #606266;
  line-height: 1.5;
}

.exam-meta {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #909399;
}

.exam-meta span {
  display: flex;
  align-items: center;
}

.exam-meta .el-icon {
  margin-right: 4px;
}

.time-slots-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.time-slots-section h4 {
  margin: 0 0 16px 0;
  color: #303133;
}

.no-slots {
  text-align: center;
  padding: 20px;
  color: #909399;
}

.selected-slot-info {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.selected-slot-info h4 {
  margin: 0 0 12px 0;
  color: #303133;
}

.slot-summary p {
  margin: 4px 0;
  color: #606266;
}

.empty-state {
  padding: 40px;
  text-align: center;
}
</style>