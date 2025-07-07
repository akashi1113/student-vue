<template>
  <div class="teacher-exam-container">
    <!-- 顶部标题和操作按钮 -->
    <div class="page-header">
      <h1 class="page-title">考试管理中心</h1>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          创建考试
        </el-button>
        <el-button @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" class="exam-tabs">
      <!-- 全部考试 -->
      <el-tab-pane label="全部考试" name="all">
        <template #label>
          <span class="tab-label">
            <el-icon><List /></el-icon>
            全部考试
          </span>
        </template>

        <div v-loading="loading" class="tab-content">
          <div class="exam-filter">
            <el-input
                v-model="searchQuery"
                placeholder="搜索考试名称"
                clearable
                style="width: 300px"
                @clear="handleSearchClear"
                @keyup.enter="handleSearch"
            >
              <template #append>
                <el-button @click="handleSearch">
                  <el-icon><Search /></el-icon>
                </el-button>
              </template>
            </el-input>

            <el-select
                v-model="statusFilter"
                placeholder="按状态筛选"
                clearable
                style="width: 150px; margin-left: 10px"
                @change="fetchExams"
            >
              <el-option label="全部" value="" />
              <el-option label="草稿" value="DRAFT" />
              <el-option label="已发布" value="PUBLISHED" />
              <el-option label="已结束" value="ENDED" />
              <el-option label="已取消" value="CANCELLED" />
            </el-select>
          </div>

          <div v-if="filteredExams.length === 0" class="empty-state">
            <el-empty description="暂无考试数据" />
          </div>

          <el-table
              v-else
              :data="filteredExams"
              style="width: 100%"
              border
              stripe
              @sort-change="handleSortChange"
          >
            <el-table-column prop="title" label="考试名称" sortable width="220" />
            <el-table-column prop="examMode" label="考试模式" width="120">
              <template #default="{ row }">
                <el-tag :type="getExamModeTagType(row.examMode)" size="small">
                  {{ getExamModeText(row.examMode) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.status)" size="small">
                  {{ getExamStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="startTime" label="开始时间" sortable width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.startTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="duration" label="时长(分钟)" width="120" />
            <el-table-column prop="totalScore" label="总分" width="100" />
            <el-table-column prop="participants" label="参与人数" width="120">
              <template #default="{ row }">
                {{ row.participants || 0 }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="{ row }">
                <el-button
                    size="small"
                    @click="viewExamDetails(row.id)"
                    :icon="View"
                >
                  详情
                </el-button>
                <el-button
                    size="small"
                    type="primary"
                    @click="editExam(row)"
                    :icon="Edit"
                    v-if="row.status === 'DRAFT'"
                >
                  编辑
                </el-button>
                <el-button
                    size="small"
                    type="success"
                    @click="publishExam(row.id)"
                    :icon="Upload"
                    v-if="row.status === 'DRAFT'"
                >
                  发布
                </el-button>
                <el-button
                    size="small"
                    type="danger"
                    @click="confirmCancelExam(row.id)"
                    :icon="Close"
                    v-if="row.status === 'PUBLISHED'"
                >
                  取消
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-container">
            <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :total="totalExams"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 时间段管理 -->
      <el-tab-pane label="时间段管理" name="timeSlots">
        <template #label>
          <span class="tab-label">
            <el-icon><Clock /></el-icon>
            时间段管理
          </span>
        </template>

        <div class="redirect-message">
          <el-result
              icon="info"
              title="正在跳转到时间段管理"
              sub-title="请稍候..."
          >
            <template #extra>
              <el-button type="primary" @click="goToTimeSlotManagement">
                立即跳转
              </el-button>
            </template>
          </el-result>
        </div>
      </el-tab-pane>

      <!-- 预约管理 -->
      <el-tab-pane label="预约管理" name="bookings">
        <template #label>
          <span class="tab-label">
            <el-icon><Document /></el-icon>
            预约管理
          </span>
        </template>

        <div class="redirect-message">
          <el-result
              icon="info"
              title="正在跳转到预约管理"
              sub-title="请稍候..."
          >
            <template #extra>
              <el-button type="primary" @click="goToBookingManagement">
                立即跳转
              </el-button>
            </template>
          </el-result>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 创建/编辑考试对话框 -->
    <el-dialog
        v-model="examDialogVisible"
        :title="`${isEditMode ? '编辑' : '创建'}考试`"
        width="800px"
        @closed="resetExamForm"
    >
      <el-form
          ref="examFormRef"
          :model="examForm"
          :rules="examRules"
          label-width="120px"
          label-position="top"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="考试名称" prop="title">
              <el-input
                  v-model="examForm.title"
                  placeholder="请输入考试名称"
                  maxlength="100"
                  show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="考试模式" prop="examMode">
              <el-select
                  v-model="examForm.examMode"
                  placeholder="请选择考试模式"
                  style="width: 100%"
              >
                <el-option label="线上考试" value="ONLINE" />
                <el-option label="线下考试" value="OFFLINE" />
                <el-option label="混合模式" value="HYBRID" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始时间" prop="startTime">
              <el-date-picker
                  v-model="examForm.startTime"
                  type="datetime"
                  placeholder="选择考试开始时间"
                  style="width: 100%"
                  :disabled-date="disabledStartDate"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="考试时长(分钟)" prop="duration">
              <el-input-number
                  v-model="examForm.duration"
                  :min="10"
                  :max="300"
                  controls-position="right"
                  style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="考试说明" prop="description">
          <el-input
              v-model="examForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入考试说明"
              maxlength="500"
              show-word-limit
          />
        </el-form-item>

        <el-form-item label="总分" prop="totalScore">
          <el-input-number
              v-model="examForm.totalScore"
              :min="1"
              :max="200"
              controls-position="right"
          />
        </el-form-item>

        <el-form-item label="及格分数" prop="passingScore">
          <el-input-number
              v-model="examForm.passingScore"
              :min="0"
              :max="examForm.totalScore"
              controls-position="right"
          />
        </el-form-item>

        <el-form-item label="考试封面" prop="coverImage">
          <el-upload
              class="avatar-uploader"
              action="/api/upload"
              :show-file-list="false"
              :on-success="handleCoverUploadSuccess"
              :before-upload="beforeCoverUpload"
          >
            <img
                v-if="examForm.coverImage"
                :src="examForm.coverImage"
                class="exam-cover"
            />
            <el-icon v-else class="avatar-uploader-icon">
              <Plus />
            </el-icon>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="examDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitExamForm" :loading="submitting">
            {{ isEditMode ? '保存更改' : '创建考试' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import {
  Refresh,
  Plus,
  View,
  Edit,
  Upload,
  Close,
  List,
  Clock,
  Document,
  Search
} from '@element-plus/icons-vue'
import { formatDate, formatTime, formatDateTime } from '@/utils/dateUtils'
import examApi from '@/api/exam'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'TeacherExamManagement',
  components: {
    Refresh,
    Plus,
    View,
    Edit,
    Upload,
    Close,
    List,
    Clock,
    Document,
    Search
  },
  data() {
    return {
      loading: false,
      activeTab: 'all',
      exams: [],
      filteredExams: [],
      searchQuery: '',
      statusFilter: '',
      currentPage: 1,
      pageSize: 10,
      totalExams: 0,
      sortField: '',
      sortOrder: '',

      examDialogVisible: false,
      isEditMode: false,
      submitting: false,
      examForm: {
        id: null,
        title: '',
        examMode: 'ONLINE',
        startTime: '',
        duration: 60,
        description: '',
        totalScore: 100,
        passingScore: 60,
        coverImage: ''
      },
      examRules: {
        title: [
          { required: true, message: '请输入考试名称', trigger: 'blur' },
          { min: 3, max: 100, message: '长度在 3 到 100 个字符', trigger: 'blur' }
        ],
        examMode: [
          { required: true, message: '请选择考试模式', trigger: 'change' }
        ],
        startTime: [
          { required: true, message: '请选择开始时间', trigger: 'change' }
        ],
        duration: [
          { required: true, message: '请输入考试时长', trigger: 'blur' }
        ],
        totalScore: [
          { required: true, message: '请输入总分', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    getToken() {
      return localStorage.getItem('token')
    }
  },
  mounted() {
    this.fetchExams()
  },
  methods: {
    async fetchExams() {
      this.loading = true
      try {
        const token = this.getToken
        if (!token) {
          throw new Error('未找到认证信息，请重新登录')
        }

        const params = {
          pageNum: this.currentPage,
          pageSize: this.pageSize,
          status: this.statusFilter,
          search: this.searchQuery,
          sortField: this.sortField,
          sortOrder: this.sortOrder
        }

        const response = await examApi.getCreatedExams('ALL', token, params)
        this.exams = response.data || []
        this.filteredExams = this.exams
        this.totalExams = response.total || 0
      } catch (error) {
        console.error('获取考试列表失败:', error)
        ElMessage.error('获取考试列表失败: ' + (error.message || '请稍后重试'))
        this.exams = []
        this.filteredExams = []
      } finally {
        this.loading = false
      }
    },

    handleSearch() {
      this.currentPage = 1
      this.fetchExams()
    },

    handleSearchClear() {
      this.searchQuery = ''
      this.currentPage = 1
      this.fetchExams()
    },

    handleSortChange({ prop, order }) {
      this.sortField = prop
      this.sortOrder = order === 'ascending' ? 'asc' : 'desc'
      this.fetchExams()
    },

    handleSizeChange(val) {
      this.pageSize = val
      this.fetchExams()
    },

    handleCurrentChange(val) {
      this.currentPage = val
      this.fetchExams()
    },

    refreshData() {
      this.currentPage = 1
      this.fetchExams()
    },

    showCreateDialog() {
      this.isEditMode = false
      this.examDialogVisible = true
    },

    editExam(exam) {
      this.isEditMode = true
      this.examForm = {
        id: exam.id,
        title: exam.title,
        examMode: exam.examMode,
        startTime: exam.startTime,
        duration: exam.duration,
        description: exam.description,
        totalScore: exam.totalScore,
        passingScore: exam.passingScore,
        coverImage: exam.coverImage
      }
      this.examDialogVisible = true
    },

    async submitExamForm() {
      try {
        await this.$refs.examFormRef.validate()
        this.submitting = true

        const token = this.getToken
        if (!token) {
          throw new Error('未找到认证信息，请重新登录')
        }

        const examData = { ...this.examForm }

        if (this.isEditMode) {
          await examApi.updateExam(examData.id, examData, token)
          ElMessage.success('考试更新成功！')
        } else {
          await examApi.createExam(examData, token)
          ElMessage.success('考试创建成功！')
        }

        this.examDialogVisible = false
        this.fetchExams()
      } catch (error) {
        console.error('操作失败:', error)
        ElMessage.error(`操作失败: ${error.message}`)
      } finally {
        this.submitting = false
      }
    },

    resetExamForm() {
      this.$refs.examFormRef?.resetFields()
      this.examForm = {
        id: null,
        title: '',
        examMode: 'ONLINE',
        startTime: '',
        duration: 60,
        description: '',
        totalScore: 100,
        passingScore: 60,
        coverImage: ''
      }
    },

    async publishExam(examId) {
      try {
        await ElMessageBox.confirm('确定要发布此考试吗？发布后学生将可以预约。', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        const token = this.getToken
        if (!token) {
          throw new Error('未找到认证信息，请重新登录')
        }

        await examApi.publishExam(examId, token)
        ElMessage.success('考试发布成功！')
        this.fetchExams()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('发布考试失败:', error)
          ElMessage.error(`发布考试失败: ${error.message || '请稍后重试'}`)
        }
      }
    },

    async confirmCancelExam(examId) {
      try {
        await ElMessageBox.confirm('确定要取消此考试吗？已预约的学生将收到通知。', '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        const token = this.getToken
        if (!token) {
          throw new Error('未找到认证信息，请重新登录')
        }

        await examApi.cancelExam(examId, token)
        ElMessage.success('考试已取消！')
        this.fetchExams()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('取消考试失败:', error)
          ElMessage.error(`取消考试失败: ${error.message || '请稍后重试'}`)
        }
      }
    },

    viewExamDetails(examId) {
      this.$router.push(`/teacher/exams/${examId}`)
    },

    goToTimeSlotManagement() {
      this.$router.push('/exam-booking/time-slot-management')
    },

    goToBookingManagement() {
      this.$router.push('/exam-booking/booking-management')
    },

    disabledStartDate(time) {
      return time.getTime() < Date.now() - 24 * 60 * 60 * 1000
    },

    handleCoverUploadSuccess(response) {
      if (response.success) {
        this.examForm.coverImage = response.data.url
        ElMessage.success('上传成功！')
      } else {
        ElMessage.error(response.message || '上传失败')
      }
    },

    beforeCoverUpload(file) {
      const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
      const isLt2M = file.size / 1024 / 1024 < 2

      if (!isJPG) {
        ElMessage.error('封面图片只能是 JPG/PNG 格式!')
      }
      if (!isLt2M) {
        ElMessage.error('封面图片大小不能超过 2MB!')
      }
      return isJPG && isLt2M
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

    getExamStatusText(status) {
      const statusMap = {
        'DRAFT': '草稿',
        'PUBLISHED': '已发布',
        'ENDED': '已结束',
        'CANCELLED': '已取消'
      }
      return statusMap[status] || status
    },

    getStatusTagType(status) {
      const typeMap = {
        'DRAFT': 'info',
        'PUBLISHED': 'success',
        'ENDED': '',
        'CANCELLED': 'danger'
      }
      return typeMap[status] || ''
    },

    formatDate,
    formatTime,
    formatDateTime
  }
}
</script>

<style scoped>
.teacher-exam-container {
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
  border-left: 4px solid #409eff;
}

.page-title {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.exam-tabs {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.tab-content {
  padding: 20px;
  min-height: 400px;
}

.exam-filter {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.redirect-message {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.avatar-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 178px;
  height: 178px;
}

.avatar-uploader:hover {
  border-color: #409eff;
}

.exam-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}

.el-table {
  margin-top: 10px;
}

.el-table :deep(.el-table__cell) {
  padding: 12px 0;
}

.el-table :deep(.cell) {
  padding: 0 10px;
}

.el-button + .el-button {
  margin-left: 8px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .exam-filter {
    flex-direction: column;
    gap: 10px;
  }

  .exam-filter .el-input,
  .exam-filter .el-select {
    width: 100% !important;
    margin-left: 0 !important;
  }

  .pagination-container {
    justify-content: center;
  }
}
</style>