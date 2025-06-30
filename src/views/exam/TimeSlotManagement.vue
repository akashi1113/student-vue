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
            {{ formatTime(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="endTime" label="结束时间" width="100">
          <template #default="{ row }">
            {{ formatTime(row.endTime) }}
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
            <el-button size="small" type="info" @click="viewBookings(row)">预约情况</el-button>
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

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { formatDate, formatTime, formatDateTime, getExamModeText } from '@/utils/dateUtils'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const selectedExam = ref('')
const timeSlots = ref([])
const examList = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()

// 表单数据
const form = reactive({
  examId: '',
  slotDate: '',
  startTime: '',
  endTime: '',
  examLocation: '',
  examMode: '',
  maxCapacity: 30,
  bookingEndTime: '',
  requirements: ''
})

// 表单验证规则
const rules = {
  slotDate: [{ required: true, message: '请选择考试日期', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  examLocation: [{ required: true, message: '请输入考试地点', trigger: 'blur' }],
  examMode: [{ required: true, message: '请选择考试模式', trigger: 'change' }],
  maxCapacity: [{ required: true, message: '请输入最大容量', trigger: 'blur' }],
  bookingEndTime: [{ required: true, message: '请选择预约截止时间', trigger: 'change' }]
}

// 生命周期
onMounted(() => {
  loadExamList()
})

// 方法
const loadExamList = async () => {
  try {
    // 模拟API调用
    examList.value = [
      { id: 1, title: '高等数学期末考试' },
      { id: 2, title: '英语四级模拟考试' },
      { id: 3, title: '计算机基础考试' }
    ]
  } catch (error) {
    ElMessage.error('加载考试列表失败')
  }
}

const loadTimeSlots = async () => {
  if (!selectedExam.value) return

  loading.value = true
  try {
    // 模拟API调用
    timeSlots.value = [
      {
        id: 1,
        examId: selectedExam.value,
        slotDate: '2024-01-15',
        startTime: '09:00',
        endTime: '11:00',
        examLocation: '教学楼A101',
        examMode: 'OFFLINE',
        maxCapacity: 30,
        currentBookings: 15,
        bookingEndTime: '2024-01-14 18:00:00',
        isActive: true,
        requirements: '请携带身份证和准考证'
      },
      {
        id: 2,
        examId: selectedExam.value,
        slotDate: '2024-01-15',
        startTime: '14:00',
        endTime: '16:00',
        examLocation: '在线考试系统',
        examMode: 'ONLINE',
        maxCapacity: 50,
        currentBookings: 25,
        bookingEndTime: '2024-01-14 20:00:00',
        isActive: true,
        requirements: '确保网络稳定'
      }
    ]
  } catch (error) {
    ElMessage.error('加载时间段失败')
  } finally {
    loading.value = false
  }
}

const showCreateDialog = () => {
  if (!selectedExam.value) {
    ElMessage.warning('请先选择考试')
    return
  }
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const editTimeSlot = (row) => {
  isEdit.value = true
  Object.assign(form, {
    id: row.id,
    examId: row.examId,
    slotDate: row.slotDate,
    startTime: row.startTime,
    endTime: row.endTime,
    examLocation: row.examLocation,
    examMode: row.examMode,
    maxCapacity: row.maxCapacity,
    bookingEndTime: row.bookingEndTime,
    requirements: row.requirements
  })
  dialogVisible.value = true
}

const submitForm = async () => {
  try {
    await formRef.value.validate()
    submitting.value = true

    form.examId = selectedExam.value

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
    dialogVisible.value = false
    loadTimeSlots()
  } catch (error) {
    if (error !== false) {
      ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
    }
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  Object.assign(form, {
    examId: '',
    slotDate: '',
    startTime: '',
    endTime: '',
    examLocation: '',
    examMode: '',
    maxCapacity: 30,
    bookingEndTime: '',
    requirements: ''
  })
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

const toggleStatus = async (row) => {
  try {
    await ElMessageBox.confirm(
        `确定要${row.isActive ? '禁用' : '启用'}该时间段吗？`,
        '确认操作',
        { type: 'warning' }
    )

    // 模拟API调用
    row.isActive = !row.isActive
    ElMessage.success(`${row.isActive ? '启用' : '禁用'}成功`)
  } catch (error) {
    // 用户取消操作
  }
}

const viewBookings = (row) => {
  ElMessage.info(`查看时间段 ${row.id} 的预约情况`)
  // 这里可以跳转到预约详情页面或打开对话框
}

const getModeTagType = (mode) => {
  const typeMap = {
    'ONLINE': 'success',
    'OFFLINE': 'primary',
    'HYBRID': 'warning'
  }
  return typeMap[mode] || 'info'
}
</script>

<style scoped>
.time-slot-management {
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

.time-slots-list {
  background: white;
  border-radius: 8px;
}
</style>