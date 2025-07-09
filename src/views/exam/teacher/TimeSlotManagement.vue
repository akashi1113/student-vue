<template>
  <div class="time-slot-management">
    <div class="page-header">
      <h1>时间段管理</h1>
      <div class="header-actions">
        <el-select
            v-model="selectedExam"
            placeholder="选择考试"
            style="width: 200px; margin-right: 16px;"
            @change="loadTimeSlots"
        >
          <el-option
              v-for="exam in examList"
              :key="exam.id"
              :label="exam.title"
              :value="exam.id"
          />
        </el-select>
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          新增时间段
        </el-button>
      </div>
    </div>

    <div class="time-slots-list" v-loading="loading">
      <el-table :data="timeSlots" border>
        <el-table-column prop="slotDate" label="考试日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.slotDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="100">
          <template #default="{ row }">
            {{ row.startTime }}
          </template>
        </el-table-column>
        <el-table-column prop="endTime" label="结束时间" width="100">
          <template #default="{ row }">
            {{ row.endTime }}
          </template>
        </el-table-column>
        <el-table-column prop="examLocation" label="考试地点" width="150" />
        <el-table-column prop="examMode" label="考试模式" width="100">
          <template #default="{ row }">
            <el-tag :type="getModeTagType(row.examMode)">
              {{ getExamModeText(row.examMode) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="容量" width="120">
          <template #default="{ row }">
            <span>{{ row.currentBookings }}/{{ row.maxCapacity }}</span>
            <el-progress
                :percentage="(row.currentBookings / row.maxCapacity) * 100"
                :show-text="false"
                :stroke-width="6"
                style="margin-top: 4px;"
            />
          </template>
        </el-table-column>
        <el-table-column prop="bookingEndTime" label="预约截止" width="150">
          <template #default="{ row }">
            {{ formatDateTime(row.bookingEndTime) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'">
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editTimeSlot(row)">编辑</el-button>
            <el-button
                size="small"
                :type="row.isActive ? 'danger' : 'success'"
                @click="toggleStatus(row)"
            >
              {{ row.isActive ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 创建/编辑时间段对话框 -->
    <el-dialog
        v-model="dialogVisible"
        :title="isEdit ? '编辑时间段' : '创建时间段'"
        width="600px"
        @close="resetForm"
    >
      <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="100px"
      >
        <el-form-item label="考试日期" prop="slotDate">
          <el-date-picker
              v-model="form.slotDate"
              type="date"
              placeholder="选择考试日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%;"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始时间" prop="startTime">
              <el-time-picker
                  v-model="form.startTime"
                  placeholder="开始时间"
                  format="HH:mm"
                  value-format="HH:mm"
                  style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" prop="endTime">
              <el-time-picker
                  v-model="form.endTime"
                  placeholder="结束时间"
                  format="HH:mm"
                  value-format="HH:mm"
                  style="width: 100%;"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="考试地点" prop="examLocation">
          <el-input v-model="form.examLocation" placeholder="请输入考试地点" />
        </el-form-item>

        <el-form-item label="考试模式" prop="examMode">
          <el-select v-model="form.examMode" placeholder="选择考试模式" style="width: 100%;">
            <el-option label="线上考试" value="ONLINE" />
            <el-option label="线下考试" value="OFFLINE" />
            <el-option label="混合模式" value="HYBRID" />
          </el-select>
        </el-form-item>

        <el-form-item label="最大容量" prop="maxCapacity">
          <el-input-number
              v-model="form.maxCapacity"
              :min="1"
              :max="200"
              style="width: 100%;"
          />
        </el-form-item>

        <el-form-item label="预约截止" prop="bookingEndTime">
          <el-date-picker
              v-model="form.bookingEndTime"
              type="datetime"
              placeholder="选择预约截止时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%;"
          />
        </el-form-item>

        <el-form-item label="特殊要求">
          <el-input
              v-model="form.requirements"
              type="textarea"
              :rows="3"
              placeholder="特殊要求说明（可选）"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">
            {{ isEdit ? '更新' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import examApi from '@/api/exam';
import examBookingApi from '@/api/examBooking';
import { formatDate, formatTime, formatDateTime, getExamModeText } from '@/utils/dateUtils';
import { Plus } from '@element-plus/icons-vue';

export default {
  name: 'TimeSlotManagement',
  data() {
    return {
      loading: false,
      submitting: false,
      selectedExam: null,
      timeSlots: [],
      examList: [],
      dialogVisible: false,
      isEdit: false,

      // 表单数据
      form: {
        id: '',
        examId: '',
        slotDate: '',
        startTime: '',
        endTime: '',
        examLocation: '',
        examMode: '',
        maxCapacity: 30,
        bookingEndTime: '',
        requirements: '',
        createdBy: 5
      },

      // 表单验证规则
      rules: {
        slotDate: [{ required: true, message: '请选择考试日期', trigger: 'change' }],
        startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
        endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
        examLocation: [{ required: true, message: '请输入考试地点', trigger: 'blur' }],
        examMode: [{ required: true, message: '请选择考试模式', trigger: 'change' }],
        maxCapacity: [{ required: true, message: '请输入最大容量', trigger: 'blur' }],
        bookingEndTime: [{ required: true, message: '请选择预约截止时间', trigger: 'change' }]
      }
    };
  },
  methods: {
    getToken() {
      return localStorage.getItem('token')
    },
    async loadExamList() {
      try {
        const response = await examApi.getAllExams();
        console.log('考试列表响应:', response); // 添加调试日志
        this.examList = response || [];
      } catch (error) {
        this.$message.error('加载考试列表失败: ' + (error.message || ''));
      }
    },

    async loadTimeSlots() {
      if (!this.selectedExam) return;
      this.loading = true;
      try {
        const response = await examBookingApi.getTimeSlots(this.selectedExam);
        this.timeSlots = response || [];
      } catch (error) {
        this.$message.error('加载时间段失败: ' + (error.message || ''));
      } finally {
        this.loading = false;
      }
    },

    showCreateDialog() {
      if (!this.selectedExam) {
        this.$message.warning('请先选择考试');
        return;
      }
      this.isEdit = false;
      this.resetForm();
      this.dialogVisible = true;
    },

    editTimeSlot(row) {
      this.isEdit = true;
      Object.assign(this.form, {
        id: row.id,
        examId: row.examId,
        slotDate: row.slotDate,
        startTime: row.startTime,
        endTime: row.endTime,
        examLocation: row.examLocation,
        examMode: row.examMode,
        maxCapacity: row.maxCapacity,
        bookingEndTime: row.bookingEndTime,
        requirements: row.requirements,
        createdBy: row.createdBy
      });
      this.dialogVisible = true;
    },

    async submitForm() {
      try {
        await this.$refs.formRef.validate();

        // 添加自定义验证
        if (this.form.startTime >= this.form.endTime) {
          this.$message.error('开始时间必须早于结束时间');
          return;
        }

        const bookingEnd = new Date(this.form.bookingEndTime);
        const examDate = new Date(`${this.form.slotDate} ${this.form.startTime}`);

        if (bookingEnd >= examDate) {
          this.$message.error('预约截止时间必须早于考试开始时间');
          return;
        }

        this.submitting = true;

        if (this.isEdit) {
          // 编辑时包含 id
          const formData = {
            ...this.form,
            examId: this.selectedExam,
            createdBy: 5
          };
          await examBookingApi.updateTimeSlot(this.form.id, formData,this.getToken());
          this.$message.success('更新成功');
        } else {
          // 创建时排除 id 字段
          const { id, ...formData } = this.form;
          const createData = {
            ...formData,
            examId: this.selectedExam,
            createdBy: 5
          };
          console.log('创建数据:', createData);
          await examBookingApi.createTimeSlot(createData,this.getToken());
          this.$message.success('创建成功');
        }

        this.dialogVisible = false;
        await this.loadTimeSlots();
      } catch (error) {
        console.error('提交失败:', error);
        if (error !== false) {
          const errorMessage = error.response?.data?.message || error.message || '未知错误';
          this.$message.error(`${this.isEdit ? '更新' : '创建'}失败: ${errorMessage}`);
        }
      } finally {
        this.submitting = false;
      }
    },

    resetForm() {
      Object.assign(this.form, {
        id: '',
        examId: '',
        slotDate: '',
        startTime: '',
        endTime: '',
        examLocation: '',
        examMode: '',
        maxCapacity: 30,
        bookingEndTime: '',
        requirements: '',
        createdBy: 5
      });
      if (this.$refs.form) {
        this.$refs.form.resetFields();
      }
    },

    async toggleStatus(row) {
      try {
        await this.$confirm(
            `确定要${row.isActive ? '禁用' : '启用'}该时间段吗？`,
            '确认操作',
            { type: 'warning' }
        );

        await examBookingApi.toggleTimeSlotStatus(row.id);
        row.isActive = !row.isActive;
        this.$message.success(`${row.isActive ? '启用' : '禁用'}成功`);
      } catch (error) {
        // 用户取消操作
      }
    },

    getModeTagType(mode) {
      const typeMap = {
        'ONLINE': 'success',
        'OFFLINE': 'primary',
        'HYBRID': 'warning'
      };
      return typeMap[mode] || 'info';
    },

    formatDate,
    formatTime,
    formatDateTime,
    getExamModeText
  },
  created() {
    this.loadExamList().then(() => {
      if (this.examList.length > 0) {
        this.selectedExam = this.examList[0].id; // 默认选择第一个考试
        this.loadTimeSlots();
      }
    });
  },
};
</script>

<style scoped>
.time-slot-management {
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

.header-actions .el-select {
  --el-select-input-focus-border-color: #5b8cff;
}

.header-actions .el-select .el-input__inner {
  height: 40px;
  border-radius: 8px;
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

.time-slots-list {
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

.el-tag--danger {
  background-color: #fef2f2;
  border-color: #fee2e2;
  color: #ef4444;
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

.el-progress {
  --el-progress-text-color: #64748b;
  --el-progress-bar-color: #5b8cff;
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

.el-input, .el-select, .el-date-editor {
  --el-input-focus-border-color: #5b8cff;
}

.el-textarea__inner {
  min-height: 80px;
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

  .header-actions .el-select {
    width: 100% !important;
    margin-right: 0 !important;
  }

  .time-slots-list {
    padding: 16px;
  }

  .el-table :deep(.el-table__cell) {
    padding: 8px 0;
  }
}
</style>