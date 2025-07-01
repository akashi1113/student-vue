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
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetails(row)">详情</el-button>
            <el-button
                v-if="row.bookingStatus === 'BOOKED'"
                size="small"
                type="success"
                @click="confirmBooking(row)"
            >
              确认
            </el-button>
            <el-button
                v-if="['BOOKED', 'CONFIRMED'].includes(row.bookingStatus)"
                size="small"
                type="danger"
                @click="cancelBooking(row)"
            >
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
            v-model:current-page="pagination.currentPage"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadBookings"
            @current-change="loadBookings"
        />
      </div>
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
import { getBookings, getBookingStats, confirmBooking, cancelBooking } from '@/api/examBooking';
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
    async loadBookings() {
      this.loading = true;
      try {
        const params = {
          page: this.pagination.currentPage,
          size: this.pagination.pageSize,
          status: this.filters.status,
          startDate: this.filters.dateRange ? this.filters.dateRange[0] : null,
          endDate: this.filters.dateRange ? this.filters.dateRange[1] : null
        };

        const response = await getBookings(params);
        this.bookings = response.data.data.list || [];
        this.pagination.total = response.data.data.total || 0;
      } catch (error) {
        this.$message.error('加载预约列表失败: ' + (error.message || ''));
      } finally {
        this.loading = false;
      }
    },

    async loadStats() {
      try {
        const response = await getBookingStats();
        this.stats = {
          totalBookings: response.data.data.totalBookings || 0,
          confirmedBookings: response.data.data.confirmedBookings || 0,
          cancelledBookings: response.data.data.cancelledBookings || 0,
          completedBookings: response.data.data.completedBookings || 0
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

        await confirmBooking(booking.bookingId);
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
        await cancelBooking(this.selectedBooking.bookingId, { reason: this.cancelForm.reason });

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
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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
  margin-bottom: 20px;
}

.stats-card {
  text-align: center;
}

.stats-content {
  padding: 10px;
}

.stats-number {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stats-label {
  font-size: 14px;
  color: #606266;
}

.bookings-table {
  background: white;
  border-radius: 8px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>