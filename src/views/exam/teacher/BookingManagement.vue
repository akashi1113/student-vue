<template>
  <div class="booking-management">
    <div class="page-header">
      <h1>预约管理</h1>
      <div class="header-actions">
        <el-select
            v-model="filters.status"
            placeholder="预约状态"
            clearable
            style="width: 150px; margin-right: 16px;"
            @change="loadBookings"
        >
          <el-option label="已预约" value="BOOKED" />
          <el-option label="已确认" value="CONFIRMED" />
          <el-option label="已取消" value="CANCELLED" />
          <el-option label="已完成" value="COMPLETED" />
        </el-select>

        <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="loadBookings"
            style="margin-right: 16px;"
        />

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
              <div class="stats-number">{{ stats.totalBookings }}</div>
              <div class="stats-label">总预约数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-number">{{ stats.confirmedBookings }}</div>
              <div class="stats-label">已确认</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-number">{{ stats.cancelledBookings }}</div>
              <div class="stats-label">已取消</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-number">{{ stats.completedBookings }}</div>
              <div class="stats-label">已完成</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="bookings-table" v-loading="loading">
      <el-table :data="bookings" border>
        <el-table-column prop="bookingNumber" label="预约号" width="150" />
        <el-table-column prop="studentName" label="学生姓名" width="100" />
        <el-table-column prop="examTitle" label="考试名称" width="150" />
        <el-table-column prop="slotDate" label="考试日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.slotDate) }}
          </template>
        </el-table-column>
        <el-table-column label="考试时间" width="140">
          <template #default="{ row }">
            {{ row.startTime }} - {{ row.endTime }}
          </template>
        </el-table-column>
        <el-table-column prop="examLocation" label="考试地点" width="120" />
        <el-table-column prop="contactPhone" label="联系电话" width="120" />
        <el-table-column prop="bookingStatus" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.bookingStatus)">
              {{ getStatusText(row.bookingStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="bookingTime" label="预约时间" width="150">
          <template #default="{ row }">
            {{ formatDateTime(row.bookingTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button size="small" @click="viewDetails(row)">详情</el-button>
              <el-button
                  v-if="row.bookingStatus === 'BOOKED'"
                  size="small"
                  type="success"
                  @click="confirmBooking(row)"
                  class="confirm-btn"
              >
                确认
              </el-button>
              <el-button
                  v-if="['BOOKED', 'CONFIRMED'].includes(row.bookingStatus)"
                  size="small"
                  type="danger"
                  @click="cancelBooking(row)"
                  class="cancel-btn"
              >
                取消
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 取消预约对话框 -->
    <el-dialog
        v-model="cancelDialogVisible"
        title="取消预约"
        width="400px"
    >
      <el-form :model="cancelForm" label-width="80px">
        <el-form-item label="取消原因">
          <el-input
              v-model="cancelForm.reason"
              type="textarea"
              :rows="4"
              placeholder="请输入取消原因"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="submitCancel" :loading="cancelling">
            确认取消
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import examBookingApi from '@/api/examBooking';
import { formatDate, formatTime, formatDateTime, getStatusText } from '@/utils/dateUtils';
import { Refresh } from '@element-plus/icons-vue';

export default {
  name: 'BookingManagement',
  data() {
    return {
      loading: false,
      cancelling: false,
      bookings: [],
      cancelDialogVisible: false,
      selectedBooking: null,

      // 筛选条件
      filters: {
        status: '',
        dateRange: null
      },

      // 统计数据
      stats: {
        totalBookings: 0,
        confirmedBookings: 0,
        cancelledBookings: 0,
        completedBookings: 0
      },

      // 分页数据
      pagination: {
        currentPage: 1,
        pageSize: 20,
        total: 0
      },

      // 取消表单
      cancelForm: {
        reason: ''
      }
    };
  },
  methods: {
    getToken(){
      return localStorage.getItem('token');
    },
    async loadBookings() {
      this.loading = true;
      try {
        const params = {
          pageNum: this.pagination.currentPage,
          pageSize: this.pagination.pageSize,
          status: this.filters.status,
          startDate: this.filters.dateRange ? this.filters.dateRange[0] : null,
          endDate: this.filters.dateRange ? this.filters.dateRange[1] : null
        };

        const response = await examBookingApi.getBookings(params);
        this.bookings = response.list || [];
        this.pagination.total = response.total || 0;
      } catch (error) {
        this.$message.error('加载预约列表失败: ' + (error.message || ''));
      } finally {
        this.loading = false;
      }
    },

    async loadStats() {
      try {
        const params = {
          startDate: this.filters.dateRange ? this.filters.dateRange[0] : null,
          endDate: this.filters.dateRange ? this.filters.dateRange[1] : null
        };
        const response = await examBookingApi.getBookingStats(params);
        this.stats = {
          totalBookings: response.totalBookings || 0,
          confirmedBookings: response.confirmedBookings || 0,
          cancelledBookings: response.cancelledBookings || 0,
          completedBookings: response.completedBookings || 0
        };
      } catch (error) {
        console.error('加载统计数据失败:', error);
      }
    },

    viewDetails(booking) {
      this.$router.push({
        name: 'BookingDetails',
        params: { bookingId: booking.bookingId }
      });
    },

    async confirmBooking(booking) {
      try {
        await this.$confirm(
            `确定要确认学生 ${booking.studentName} 的预约吗？`,
            '确认预约',
            { type: 'warning' }
        );

        console.log(booking)
        await examBookingApi.confirmBooking(booking.bookingId,this.getToken());
        booking.bookingStatus = 'CONFIRMED';
        this.$message.success('预约确认成功');
        this.loadStats();
      } catch (error) {
        // 用户取消操作
      }
    },

    cancelBooking(booking) {
      this.selectedBooking = booking;
      this.cancelForm.reason = '';
      this.cancelDialogVisible = true;
    },

    async submitCancel() {
      if (!this.cancelForm.reason.trim()) {
        this.$message.warning('请输入取消原因');
        return;
      }

      this.cancelling = true;
      try {
        await examBookingApi.cancelBooking(this.selectedBooking.bookingId, { reason: this.cancelForm.reason });

        this.selectedBooking.bookingStatus = 'CANCELLED';
        this.$message.success('预约取消成功');
        this.cancelDialogVisible = false;
        this.loadStats();
      } catch (error) {
        this.$message.error('取消预约失败: ' + (error.message || ''));
      } finally {
        this.cancelling = false;
      }
    },

    getStatusTagType(status) {
      const typeMap = {
        'BOOKED': 'warning',
        'CONFIRMED': 'success',
        'CANCELLED': 'danger',
        'COMPLETED': 'info'
      };
      return typeMap[status] || 'info';
    },

    formatDate,
    formatTime,
    formatDateTime,
    getStatusText
  },
  created() {
    this.loadBookings();
    this.loadStats();
  }
};
</script>

<style scoped>
.booking-management {
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
}

.page-header h1 {
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

.header-actions .el-select,
.header-actions .el-date-editor {
  --el-input-focus-border-color: #5b8cff;
}

.header-actions .el-button {
  padding: 10px 20px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.header-actions .el-button:hover {
  transform: translateY(-2px);
}

.stats-cards {
  margin-bottom: 24px;
}

.stats-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: none;
  transition: all 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.stats-content {
  padding: 20px;
}

.stats-number {
  font-size: 28px;
  font-weight: 600;
  color: #5b8cff;
  margin-bottom: 8px;
}

.stats-label {
  font-size: 15px;
  color: #64748b;
  font-weight: 500;
}

.bookings-table {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.el-table {
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

.el-tag--warning {
  background-color: #fefce8;
  border-color: #fef08a;
  color: #eab308;
}

.el-tag--success {
  background-color: #f0fdf4;
  border-color: #dcfce7;
  color: #22c55e;
}

.el-tag--danger {
  background-color: #fef2f2;
  border-color: #fee2e2;
  color: #ef4444;
}

.el-tag--info {
  background-color: #f0f9ff;
  border-color: #e0f2fe;
  color: #0ea5e9;
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

/* 对话框样式 */
.el-dialog {
  border-radius: 12px;
  overflow: hidden;
}

.el-dialog__header {
  padding: 20px 24px;
  background-color: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
  margin-right: 0;
}

.el-dialog__title {
  color: #2c3e50;
  font-weight: 600;
}

.el-dialog__body {
  padding: 24px;
}

.el-dialog__footer {
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
}

.el-form-item {
  margin-bottom: 20px;
}

.el-form-item__label {
  color: #475569;
  font-weight: 500;
}

.el-textarea__inner {
  min-height: 100px;
  border-radius: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    padding: 20px;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
    gap: 12px;
  }

  .header-actions .el-select,
  .header-actions .el-date-editor {
    width: 100% !important;
    margin-right: 0 !important;
  }

  .stats-cards .el-col {
    margin-bottom: 16px;
  }

  .bookings-table {
    padding: 16px;
  }

  .el-table :deep(.el-table__cell) {
    padding: 8px 0;
  }
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
}

.action-buttons .el-button {
  flex: 1;
  min-width: 70px;
}

.action-buttons .confirm-btn {
  --el-button-bg-color: #22c55e;
  --el-button-border-color: #22c55e;
  --el-button-hover-bg-color: #16a34a;
  --el-button-hover-border-color: #16a34a;
}

.action-buttons .cancel-btn {
  --el-button-bg-color: #ef4444;
  --el-button-border-color: #ef4444;
  --el-button-hover-bg-color: #dc2626;
  --el-button-hover-border-color: #dc2626;
}
</style>