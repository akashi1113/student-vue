<template>
  <div class="teacher-exam-container">
    <!-- 顶部标题和操作按钮 -->
    <div class="page-header">
      <h1 class="page-title">考试管理中心</h1>
      <div class="header-actions">
        <el-button type="primary" @click="goToCreateExam">
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
    <el-tabs v-model="activeTab" class="exam-tabs" @tab-click="handleTabClick">
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
      </el-tab-pane>

      <!-- 预约管理 -->
      <el-tab-pane label="预约管理" name="bookings">
        <template #label>
          <span class="tab-label">
            <el-icon><Document /></el-icon>
            预约管理
          </span>
        </template>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import {
  Refresh,
  Plus,
  View,
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
      sortOrder: ''
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
    handleTabClick(tab) {
      if (tab.paneName === 'timeSlots') {
        this.goToTimeSlotManagement()
      } else if (tab.paneName === 'bookings') {
        this.goToBookingManagement()
      }
    },

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

        const response = await examApi.getCreatedExams('ALL', token)
        this.exams = response || []
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

    goToCreateExam() {
      this.$router.push('/teacher/exams/create')
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
      this.$router.push(`/exams/${examId}`)
    },

    goToTimeSlotManagement() {
      this.$router.push('/exam-booking/time-slot-management')
    },

    goToBookingManagement() {
      this.$router.push('/exam-booking/booking-management')
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
/* 样式保持不变，与之前相同 */
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