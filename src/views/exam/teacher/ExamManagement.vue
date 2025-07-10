<template>
  <div class="teacher-exam-container">
    <!-- 顶部标题和操作按钮 -->
    <div class="page-header">
      <h1 class="page-title">考试管理</h1>
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

          <div class="pagination-container" v-if="filteredExams.length > 0">
            <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :total="totalExams"
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
  Search,
  User
} from '@element-plus/icons-vue'
import { formatDate, formatTime, formatDateTime } from '@/utils/dateUtils'
import examApi from '@/api/exam'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'TeacherExamManagement',
  components: {
    Refresh,
    Plus,
    List,
    Clock,
    Document,
    Search,
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
      userRole: localStorage.getItem('role') || ''
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
      } else if (tab.paneName === 'monitor') {
        this.goToMonitorManagement()
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

    goToMonitorManagement() {
      this.$router.push('/teacher/exams/monitor')
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
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  background-color: #f8fafc;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-left: 5px solid #5b8cff;
  background: linear-gradient(135deg, #f8fafc 0%, #ebf0f7 100%);
}

.page-title {
  margin: 0;
  color: #2c3e50;
  font-size: 26px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-actions .el-button {
  padding: 10px 20px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.header-actions .el-button--primary {
  background-color: #5b8cff;
  border-color: #5b8cff;
}

.header-actions .el-button--primary:hover {
  background-color: #4a7df5;
  border-color: #4a7df5;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(91, 140, 255, 0.3);
}

.exam-tabs {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.exam-tabs :deep(.el-tabs__nav-wrap) {
  padding: 0 24px;
}

.exam-tabs :deep(.el-tabs__item) {
  padding: 0 20px;
  height: 56px;
  font-size: 15px;
  font-weight: 500;
  color: #64748b;
}

.exam-tabs :deep(.el-tabs__item.is-active) {
  color: #5b8cff;
}

.exam-tabs :deep(.el-tabs__active-bar) {
  background-color: #5b8cff;
  height: 3px;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.tab-content {
  padding: 24px;
  min-height: 400px;
}

.exam-filter {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px;
  background: #f1f5f9;
  border-radius: 8px;
}

.exam-filter .el-input {
  --el-input-focus-border-color: #5b8cff;
  --el-input-hover-border-color: #cbd5e1;
}

.exam-filter .el-input__inner {
  height: 40px;
  border-radius: 8px;
}

.exam-filter .el-select {
  --el-select-input-focus-border-color: #5b8cff;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  background: white;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.el-table {
  margin-top: 16px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.el-table :deep(.el-table__header) th {
  background-color: #f1f5f9;
  color: #334155;
  font-weight: 600;
}

.el-table :deep(.el-table__cell) {
  padding: 14px 0;
}

.el-table :deep(.cell) {
  padding: 0 12px;
}

.el-table :deep(.el-table__row:hover) {
  background-color: #f8fafc !important;
}

.el-tag {
  font-weight: 500;
  padding: 0 10px;
  height: 26px;
  line-height: 26px;
}

.el-tag--primary {
  background-color: #ebf2ff;
  border-color: #d6e4ff;
  color: #5b8cff;
}

.el-tag--success {
  background-color: #f0fdf4;
  border-color: #dcfce7;
  color: #22c55e;
}

.el-tag--warning {
  background-color: #fefce8;
  border-color: #fef08a;
  color: #eab308;
}

.el-tag--info {
  background-color: #f0f9ff;
  border-color: #e0f2fe;
  color: #0ea5e9;
}

.el-tag--danger {
  background-color: #fef2f2;
  border-color: #fee2e2;
  color: #ef4444;
}

.el-button + .el-button {
  margin-left: 10px;
}

.el-button--small {
  padding: 8px 14px;
  border-radius: 6px;
  font-weight: 500;
}

.el-button--success {
  --el-button-bg-color: #22c55e;
  --el-button-border-color: #22c55e;
  --el-button-hover-bg-color: #16a34a;
  --el-button-hover-border-color: #16a34a;
}

.el-button--danger {
  --el-button-bg-color: #ef4444;
  --el-button-border-color: #ef4444;
  --el-button-hover-bg-color: #dc2626;
  --el-button-hover-border-color: #dc2626;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    padding: 20px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .exam-filter {
    flex-direction: column;
    gap: 12px;
  }

  .exam-filter .el-input,
  .exam-filter .el-select {
    width: 100% !important;
    margin-left: 0 !important;
  }

  .pagination-container {
    justify-content: center;
  }

  .exam-tabs :deep(.el-tabs__item) {
    padding: 0 12px;
    font-size: 14px;
  }
}
</style>