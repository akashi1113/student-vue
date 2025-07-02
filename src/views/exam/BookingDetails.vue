<template>
  <div class="booking-details">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-icon class="title-icon"><Document /></el-icon>
          预约详情
        </h1>
        <div class="header-actions">
          <el-button @click="$router.go(-1)" plain>
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <el-button v-if="canEdit" type="primary" @click="editBooking">
            <el-icon><Edit /></el-icon>
            编辑预约
          </el-button>
        </div>
      </div>
    </div>

    <div class="details-container" v-loading="loading">
      <template v-if="!loading && booking.bookingId">
        <el-row :gutter="24">
          <el-col :span="16">
            <!-- 预约信息卡片 -->
            <el-card class="info-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <div class="card-title">
                    <el-icon><Ticket /></el-icon>
                    <span>预约信息</span>
                  </div>
                  <el-tag :type="getStatusTagType(booking.bookingStatus)" size="large" effect="light" round>
                    {{ getStatusText(booking.bookingStatus) }}
                  </el-tag>
                </div>
              </template>

              <el-descriptions :column="2" border>
                <el-descriptions-item label="预约号" label-align="right" align="center">
                  <el-text tag="b" type="primary">{{ booking.bookingNumber }}</el-text>
                </el-descriptions-item>
                <el-descriptions-item label="预约状态" label-align="right" align="center">
                  <el-tag :type="getStatusTagType(booking.bookingStatus)" effect="light">
                    {{ getStatusText(booking.bookingStatus) }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="学生姓名" label-align="right" align="center">
                  {{ booking.studentName || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="联系电话" label-align="right" align="center">
                  {{ booking.contactPhone || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="联系邮箱" label-align="right" align="center">
                  {{ booking.contactEmail || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="预约时间" :span="2" label-align="right" align="center">
                  {{ formatDateTime(booking.bookingTime) }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <!-- 考试信息卡片 -->
            <el-card class="info-card" shadow="hover" style="margin-top: 24px;">
              <template #header>
                <div class="card-header">
                  <div class="card-title">
                    <el-icon><Notebook /></el-icon>
                    <span>考试信息</span>
                  </div>
                </div>
              </template>

              <el-descriptions :column="2" border>
                <el-descriptions-item label="考试名称" :span="2" label-align="right" align="center">
                  <el-text tag="b">{{ booking.examTitle }}</el-text>
                </el-descriptions-item>
                <el-descriptions-item label="考试日期" label-align="right" align="center">
                  <el-icon><Calendar /></el-icon>
                  {{ formatDate(booking.slotDate) }}
                </el-descriptions-item>
                <el-descriptions-item label="考试时间" label-align="right" align="center">
                  <el-icon><Clock /></el-icon>
                  {{ booking.startTime }} - {{ booking.endTime }}
                </el-descriptions-item>
                <el-descriptions-item label="考试地点" label-align="right" align="center">
                  <el-icon><Location /></el-icon>
                  {{ booking.examLocation }}
                </el-descriptions-item>
                <el-descriptions-item label="考试模式" label-align="right" align="center">
                  <el-tag :type="getModeTagType(booking.examMode)" effect="light">
                    {{ getExamModeText(booking.examMode) }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="考试时长" label-align="right" align="center">
                  <el-icon><Timer /></el-icon>
                  {{ booking.examDuration }} 分钟
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <!-- 附加信息卡片 -->
            <el-card v-if="booking.specialRequirements || booking.remarks" class="info-card" shadow="hover" style="margin-top: 24px;">
              <template #header>
                <div class="card-header">
                  <div class="card-title">
                    <el-icon><InfoFilled /></el-icon>
                    <span>附加信息</span>
                  </div>
                </div>
              </template>

              <el-descriptions :column="1" border>
                <el-descriptions-item v-if="booking.specialRequirements" label="特殊需求" label-align="right" align="center">
                  <el-text>{{ booking.specialRequirements }}</el-text>
                </el-descriptions-item>
                <el-descriptions-item v-if="booking.remarks" label="备注" label-align="right" align="center">
                  <el-text>{{ booking.remarks }}</el-text>
                </el-descriptions-item>
                <el-descriptions-item v-if="booking.cancelReason" label="取消原因" label-align="right" align="center">
                  <el-text type="danger">{{ booking.cancelReason }}</el-text>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>

          <el-col :span="8">
            <!-- 操作卡片 -->
            <el-card class="action-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <div class="card-title">
                    <el-icon><Operation /></el-icon>
                    <span>操作</span>
                  </div>
                </div>
              </template>

              <div class="action-buttons">
                <el-button
                    v-if="booking.bookingStatus === 'BOOKED'"
                    type="success"
                    size="large"
                    @click="confirmBooking"
                    :loading="confirming"
                    style="width: 100%; margin-bottom: 16px;"
                >
                  <el-icon><CircleCheck /></el-icon>
                  确认预约
                </el-button>

                <el-button
                    v-if="['BOOKED', 'CONFIRMED'].includes(booking.bookingStatus)"
                    type="danger"
                    size="large"
                    @click="showCancelDialog"
                    style="width: 100%; margin-bottom: 16px;"
                >
                  <el-icon><CircleClose /></el-icon>
                  取消预约
                </el-button>

                <el-button
                    v-if="booking.bookingStatus === 'CONFIRMED'"
                    type="primary"
                    size="large"
                    @click="checkIn"
                    style="width: 100%; margin-bottom: 16px;"
                >
                  <el-icon><Checked /></el-icon>
                  签到
                </el-button>

                <el-button
                    size="large"
                    @click="exportPDF"
                    style="width: 100%; margin-bottom: 16px;"
                >
                  <el-icon><DocumentCopy /></el-icon>
                  导出PDF
                </el-button>
              </div>
            </el-card>

            <!-- 操作记录卡片 -->
            <el-card class="timeline-card" shadow="hover" style="margin-top: 24px;">
              <template #header>
                <div class="card-header">
                  <div class="card-title">
                    <el-icon><Clock /></el-icon>
                    <span>操作记录</span>
                  </div>
                </div>
              </template>

              <el-timeline>
                <el-timeline-item
                    v-for="record in operationRecords"
                    :key="record.id"
                    :timestamp="formatDateTime(record.operationTime)"
                    placement="top"
                    :type="getTimelineItemType(record.operationType)"
                    :color="getTimelineItemColor(record.operationType)"
                    :icon="getTimelineItemIcon(record.operationType)"
                    hollow
                >
                  <div class="timeline-content">
                    <div class="operation-type">{{ record.operationType }}</div>
                    <div class="operation-desc">{{ record.description }}</div>
                    <div class="operator">
                      <el-icon><User /></el-icon>
                      <span>{{ record.operatorName }}</span>
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </el-card>
          </el-col>
        </el-row>
      </template>

      <template v-if="!loading && !booking.bookingId">
        <el-empty description="未找到预约信息" image-size="200">
          <template #image>
            <el-icon :size="80"><Search /></el-icon>
          </template>
          <el-button type="primary" @click="$router.go(-1)">返回</el-button>
        </el-empty>
      </template>
    </div>

    <!-- 取消预约对话框 -->
    <el-dialog
        v-model="cancelDialogVisible"
        title="取消预约"
        width="500px"
        align-center
    >
      <div class="cancel-warning">
        <el-result icon="warning" title="警告">
          <template #extra>
            <p class="warning-text">确定要取消这个预约吗？取消后无法恢复。</p>
          </template>
        </el-result>
      </div>

      <el-form :model="cancelForm" label-width="80px">
        <el-form-item label="取消原因" required>
          <el-input
              v-model="cancelForm.reason"
              type="textarea"
              :rows="4"
              placeholder="请输入取消原因"
              show-word-limit
              maxlength="200"
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
import { formatDate, formatTime, formatDateTime } from '@/utils/dateUtils';
import {
  ArrowLeft,
  Edit,
  Document,
  Ticket,
  Notebook,
  InfoFilled,
  Operation,
  CircleCheck,
  CircleClose,
  Checked,
  DocumentCopy,
  Calendar,
  Clock,
  Location,
  Timer,
  User,
  Search,
  Warning
} from '@element-plus/icons-vue';

export default {
  name: 'BookingDetails',
  components: {
    ArrowLeft,
    Edit,
    Document,
    Ticket,
    Notebook,
    InfoFilled,
    Operation,
    CircleCheck,
    CircleClose,
    Checked,
    DocumentCopy,
    Calendar,
    Clock,
    Location,
    Timer,
    User,
    Search
  },
  data() {
    return {
      booking: {},
      operationRecords: [],
      loading: false,
      error: null,
      confirming: false,
      cancelling: false,
      cancelDialogVisible: false,
      cancelForm: {
        reason: ''
      }
    };
  },
  computed: {
    canEdit() {
      return ['BOOKED'].includes(this.booking.bookingStatus);
    }
  },
  methods: {
    async loadBookingDetails() {
      this.loading = true;
      this.error = null;
      try {
        const bookingId = this.$route.params.bookingId;
        const response = await examBookingApi.getBookingDetails(bookingId);

        if (response.data && response.data.success && response.data.data) {
          this.booking = response.data.data;
          this.operationRecords = response.data.data.operationRecords || [
            {
              id: 1,
              operationType: '创建预约',
              description: '用户创建预约',
              operatorName: this.booking.studentName || '学生',
              operationTime: this.booking.bookingTime
            }
          ];

          if (this.booking.bookingStatus === 'CONFIRMED') {
            this.operationRecords.push({
              id: 2,
              operationType: '确认预约',
              description: '管理员确认预约',
              operatorName: '管理员',
              operationTime: this.booking.bookingTime
            });
          }
        } else {
          console.error('Invalid response structure:', response);
          this.$message.error('响应数据格式错误');
        }
      } catch (error) {
        console.error('Error loading booking details:', error);
        this.error = '加载预约详情失败: ' + (error.message || '请稍后重试');
        this.$message.error(this.error);
      } finally {
        this.loading = false;
      }
    },

    async confirmBooking() {
      this.confirming = true;
      try {
        await examBookingApi.confirmBooking(this.booking.bookingId);
        this.booking.bookingStatus = 'CONFIRMED';
        this.operationRecords.unshift({
          id: Date.now(),
          operationType: '确认预约',
          description: '管理员确认预约',
          operatorName: '管理员',
          operationTime: new Date().toISOString()
        });
        this.$message.success('预约确认成功');
      } catch (error) {
        console.error('Confirm booking failed:', error);
        this.$message.error('确认预约失败: ' + (error.message || error));
      } finally {
        this.confirming = false;
      }
    },

    showCancelDialog() {
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
        const cancelData = {
          userId: this.booking.userId,
          cancelReason: this.cancelForm.reason
        };

        await examBookingApi.cancelBooking(this.booking.bookingId, cancelData);

        this.booking.bookingStatus = 'CANCELLED';
        this.booking.cancelReason = this.cancelForm.reason;

        this.operationRecords.unshift({
          id: Date.now(),
          operationType: '取消预约',
          description: `预约已取消，原因：${this.cancelForm.reason}`,
          operatorName: '用户',
          operationTime: new Date().toISOString()
        });

        this.$message.success('预约取消成功');
        this.cancelDialogVisible = false;
      } catch (error) {
        console.error('Cancel booking failed:', error);
        this.$message.error('取消预约失败: ' + (error.message || error));
      } finally {
        this.cancelling = false;
      }
    },

    checkIn() {
      this.$message.success('签到功能待实现');
    },

    editBooking() {
      this.$message.info('编辑预约功能待实现');
    },

    exportPDF() {
      this.$message.info('导出PDF功能待实现');
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

    getModeTagType(mode) {
      const typeMap = {
        'ONLINE': 'success',
        'OFFLINE': 'primary',
        'HYBRID': 'warning'
      };
      return typeMap[mode] || 'info';
    },

    getStatusText(status) {
      const statusMap = {
        'BOOKED': '已预约',
        'CONFIRMED': '已确认',
        'CANCELLED': '已取消',
        'COMPLETED': '已完成'
      };
      return statusMap[status] || status;
    },

    getExamModeText(mode) {
      const modeMap = {
        'ONLINE': '线上',
        'OFFLINE': '线下',
        'HYBRID': '混合'
      };
      return modeMap[mode] || mode;
    },

    getTimelineItemType(operationType) {
      const typeMap = {
        '创建预约': 'primary',
        '确认预约': 'success',
        '取消预约': 'danger',
        '签到': 'warning'
      };
      return typeMap[operationType] || 'info';
    },

    getTimelineItemColor(operationType) {
      const colorMap = {
        '创建预约': '#409EFF',
        '确认预约': '#67C23A',
        '取消预约': '#F56C6C',
        '签到': '#E6A23C'
      };
      return colorMap[operationType] || '#909399';
    },

    getTimelineItemIcon(operationType) {
      const iconMap = {
        '创建预约': 'DocumentAdd',
        '确认预约': 'CircleCheck',
        '取消预约': 'CircleClose',
        '签到': 'Checked'
      };
      return iconMap[operationType] || 'Document';
    },

    formatDate,
    formatTime,
    formatDateTime
  },
  created() {
    this.loadBookingDetails();
  }
};
</script>

<style scoped lang="scss">
.booking-details {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px 24px;
  margin-bottom: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .page-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #303133;
    display: flex;
    align-items: center;

    .title-icon {
      margin-right: 8px;
      color: var(--el-color-primary);
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.details-container {
  min-height: 400px;
  background-color: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;

  .card-title {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: 600;

    .el-icon {
      margin-right: 8px;
      color: var(--el-color-primary);
    }
  }
}

.info-card {
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);

  :deep(.el-card__header) {
    border-bottom: 1px dashed var(--el-border-color-light);
    padding: 16px 20px;
  }

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.action-card {
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);

  :deep(.el-card__header) {
    border-bottom: 1px dashed var(--el-border-color-light);
    padding: 16px 20px;
  }

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.timeline-card {
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);

  :deep(.el-card__header) {
    border-bottom: 1px dashed var(--el-border-color-light);
    padding: 16px 20px;
  }

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.action-buttons {
  display: flex;
  flex-direction: column;
}

.timeline-content {
  padding: 8px 12px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;

  .operation-type {
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 4px;
  }

  .operation-desc {
    color: var(--el-text-color-regular);
    font-size: 14px;
    margin-bottom: 4px;
  }

  .operator {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    display: flex;
    align-items: center;

    .el-icon {
      margin-right: 4px;
    }
  }
}

.cancel-warning {
  margin-bottom: 20px;

  .warning-text {
    color: var(--el-text-color-regular);
    margin: 0;
    text-align: center;
  }
}

:deep(.el-descriptions__header) {
  margin-bottom: 16px;
}

:deep(.el-descriptions__title) {
  font-size: 15px;
}

:deep(.el-descriptions__label) {
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

:deep(.el-descriptions__content) {
  color: var(--el-text-color-primary);
}

:deep(.el-timeline-item__timestamp) {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

@media (max-width: 1200px) {
  .el-col {
    width: 100%;

    &.el-col-16, &.el-col-8 {
      max-width: 100%;
      flex: 0 0 100%;
    }
  }

  .action-card, .timeline-card {
    margin-top: 24px;
  }
}
</style>