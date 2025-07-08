<template>
  <div class="teacher-experiment-container">
    <el-page-header class="page-header">
      <template #content>
        <div class="page-header-content">
          <span>实验管理</span>
        </div>
      </template>
      <template #extra>
        <div class="header-actions">
          <el-button
              type="info"
              @click="goToApprovals"
              class="approval-btn"
          >
            <el-icon><DocumentChecked /></el-icon> 预约审批
          </el-button>
          <el-button type="primary" @click="handleCreateClick">
            <el-icon><Plus /></el-icon> 创建新实验
          </el-button>
        </div>
      </template>
    </el-page-header>

    <el-card class="experiment-card">
      <el-skeleton :rows="6" animated v-if="loading" />
      <template v-else>
        <el-table
            :data="experiments"
            style="width: 100%"
            v-if="experiments && experiments.length"
            :key="tableKey"
            stripe
        >
          <!-- 表格列保持不变 -->
          <el-table-column prop="id" label="ID" width="80" fixed="left">
            <template #default="{row}">
              {{ row?.id || '-' }}
            </template>
          </el-table-column>

          <el-table-column prop="name" label="实验名称" min-width="180" fixed="left">
            <template #default="{row}">
              <el-tooltip :content="row.description" placement="top" v-if="row.description">
                <span class="experiment-name">{{ row?.name || '未命名实验' }}</span>
              </el-tooltip>
              <span v-else>{{ row?.name || '未命名实验' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="学科分类" min-width="120">
            <template #default="{row}">
              {{ getSubjectName(row?.subject) }}
            </template>
          </el-table-column>

          <el-table-column label="时长(分钟)" width="100" align="center">
            <template #default="{row}">
              {{ row?.duration || 0 }}
            </template>
          </el-table-column>

          <el-table-column label="状态" width="120" align="center">
            <template #default="{row}">
              <el-tag :type="getStatusTagType(row?.status)" effect="light">
                {{ getStatusText(row?.status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="发布状态" width="120" align="center">
            <template #default="{row}">
              <el-tag :type="row?.isPublished ? 'success' : 'info'" effect="light">
                {{ row?.isPublished ? '已发布' : '未发布' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="320" fixed="right">
            <template #default="{row}">
              <el-button-group>
                <el-button
                    size="small"
                    @click="editExperiment(row)"
                    :disabled="!row?.id"
                >
                  <el-icon><Edit /></el-icon> 编辑
                </el-button>
                <el-button
                    size="small"
                    type="primary"
                    @click="manageTimeSlots(row)"
                    :disabled="!row?.id"
                >
                  <el-icon><Clock /></el-icon> 时间段
                </el-button>
                <el-button
                    size="small"
                    type="success"
                    @click="manageTemplate(row)"
                    :disabled="!row?.id"
                >
                  <el-icon><Files /></el-icon> 模板
                </el-button>
                <el-button
                    size="small"
                    :type="row?.isPublished ? 'warning' : 'primary'"
                    @click="togglePublish(row)"
                    :disabled="!row?.id"
                >
                  <el-icon v-if="row?.isPublished"><Close /></el-icon>
                  <el-icon v-else><Check /></el-icon>
                  {{ row?.isPublished ? '取消发布' : '发布' }}
                </el-button>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
        <el-empty description="暂无实验数据" v-else>
          <el-button type="primary" @click="handleCreateClick">创建第一个实验</el-button>
        </el-empty>
      </template>

      <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          @current-change="fetchExperiments"
          layout="total, prev, pager, next, jumper"
          class="pagination"
          :disabled="loading"
          :hide-on-single-page="true"
      />
    </el-card>

    <!-- 创建/编辑实验对话框 -->
    <el-dialog
        v-model="showEditDialog"
        :title="editingExperiment?.id ? '编辑实验' : '创建新实验'"
        :close-on-click-modal="false"
        width="600px"
    >
      <el-form
          :model="experimentForm"
          label-width="100px"
          :disabled="formLoading"
          :rules="formRules"
          ref="experimentFormRef"
      >
        <el-form-item label="实验名称" prop="name">
          <el-input
              v-model="experimentForm.name"
              placeholder="请输入实验名称"
              :maxlength="50"
              show-word-limit
          />
        </el-form-item>

        <el-form-item label="学科分类" prop="subject">
          <el-select
              v-model="experimentForm.subject"
              placeholder="请选择学科"
              clearable
              style="width: 100%"
          >
            <el-option
                v-for="subject in subjects"
                :key="subject.value"
                :label="subject.label"
                :value="subject.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="实验描述" prop="description">
          <el-input
              v-model="experimentForm.description"
              type="textarea"
              :rows="4"
              placeholder="请输入实验描述"
              :maxlength="500"
              show-word-limit
          />
        </el-form-item>

        <el-form-item label="预计时长" prop="duration">
          <el-input-number
              v-model="experimentForm.duration"
              :min="15"
              :max="240"
              controls-position="right"
              style="width: 120px"
          /> 分钟
        </el-form-item>

        <el-form-item label="实验室位置">
          <el-input
              v-model="experimentForm.location"
              placeholder="请输入实验室位置"
              :maxlength="100"
          />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="experimentForm.status">
            <el-radio :label="1">可预约</el-radio>
            <el-radio :label="2">已满额</el-radio>
            <el-radio :label="0">已禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showEditDialog = false" :disabled="formLoading">
          取消
        </el-button>
        <el-button
            type="primary"
            @click="submitForm"
            :loading="formLoading"
        >
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import request from '@/utils/request'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  Edit,
  Clock,
  Files,
  Check,
  Close,
  DocumentChecked
} from '@element-plus/icons-vue'
import {
  getTeacherExperiments,
  createExperiment,
  updateExperiment
} from '@/api/teacher_experiment'
import { ElMessage, ElNotification } from 'element-plus'

const router = useRouter()
const experiments = ref([])
const showEditDialog = ref(false)
const editingExperiment = ref(null)
const loading = ref(false)
const formLoading = ref(false)
const tableKey = ref(0)
const experimentFormRef = ref(null)

const experimentForm = ref({
  name: '',
  subject: '',
  description: '',
  duration: 60,
  location: '',
  status: 1,
  isPublished: false
})

const formRules = {
  name: [
    { required: true, message: '请输入实验名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在2到50个字符', trigger: 'blur' }
  ],
  subject: [
    { required: true, message: '请选择学科分类', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入实验描述', trigger: 'blur' },
    { min: 10, max: 500, message: '长度在10到500个字符', trigger: 'blur' }
  ],
  duration: [
    { required: true, message: '请输入预计时长', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

const pagination = ref({
  current: 1,
  size: 10,
  total: 0
})

const subjects = [
  { value: 'c++', label: 'C++' },
  { value: 'java', label: 'JAVA' },
  { value: 'bianyi', label: '编译原理' },
  { value: 'ssd1', label: 'SSD1' },
  { value: 'database', label: '数据库' }
]

const statusTextMap = {
  1: '可预约',
  2: '已满额',
  0: '已禁用',
  3: '已关闭'
}

const statusTagTypes = {
  1: 'success',
  2: 'warning',
  0: 'danger',
  3: 'info'
}

const fetchExperiments = async () => {
  loading.value = true
  try {
    const res = await getTeacherExperiments({
      pageNum: pagination.value.current,
      pageSize: pagination.value.size
    })

    if (res?.data?.list) {
      experiments.value = res.data.list
      pagination.value.total = Number(res.data.total) || 0
    } else {
      experiments.value = []
      pagination.value.total = 0
    }
  } catch (error) {
    console.error('获取实验列表失败:', error)
    ElMessage.error(`获取实验列表失败: ${error.message}`)
    experiments.value = []
  } finally {
    loading.value = false
  }
}

const goToApprovals = () => {
  router.push({ name: 'BookingApproval' })
}

const handleCreateClick = () => {
  editingExperiment.value = null
  experimentForm.value = {
    name: '',
    subject: '',
    description: '',
    duration: 60,
    location: '',
    status: 1,
    isPublished: false
  }
  showEditDialog.value = true
}

const getSubjectName = (value) => {
  if (!value) return '未分类'
  const subject = subjects.find(s => s.value === value)
  return subject?.label || value
}

const getStatusText = (status) => {
  return statusTextMap[status] || '未知状态'
}

const getStatusTagType = (status) => {
  return statusTagTypes[status] || 'info'
}

const editExperiment = (experiment) => {
  if (!experiment?.id) {
    ElMessage.error('无效的实验数据')
    return
  }

  editingExperiment.value = experiment
  experimentForm.value = {
    name: experiment.name || '',
    subject: experiment.subject || '',
    description: experiment.description || '',
    duration: Number(experiment.duration) || 60,
    location: experiment.location || '',
    status: Number(experiment.status) || 1,
    isPublished: Boolean(experiment.isPublished)
  }
  showEditDialog.value = true
}

const manageTimeSlots = (experiment) => {
  if (!experiment?.id) {
    ElMessage.error('无效的实验ID')
    return
  }
  router.push({
    name: 'TimeSlotManagement-experiment',
    params: { id: experiment.id },
    query: { experimentName: experiment.name }
  }).catch(err => {
    console.error('路由跳转失败:', err)
    ElMessage.error('无法跳转到时间段管理页面')
  })
}

const manageTemplate = (experiment) => {
  if (!experiment?.id) {
    ElMessage.error('无效的实验ID')
    return
  }
  router.push({
    name: 'ExperimentTemplate',
    params: { id: experiment.id }
  })
}

const submitForm = async () => {
  try {
    await experimentFormRef.value.validate()
    await saveExperiment()
  } catch (error) {
    console.log('表单验证失败', error)
  }
}

const saveExperiment = async () => {
  formLoading.value = true
  try {
    const teacherId = 1 // 临时测试值
    const requestData = {
      ...experimentForm.value,
      createdBy: teacherId
    }

    if (editingExperiment.value?.id) {
      await updateExperiment(requestData, editingExperiment.value.id)
      ElNotification.success({
        title: '成功',
        message: '实验更新成功',
        duration: 2000
      })
    } else {
      const res = await createExperiment(requestData)
      const experimentId = res.data?.id || res.data

      if (!experimentId) {
        throw new Error('未能获取实验ID')
      }

      ElNotification.success({
        title: '成功',
        message: '实验创建成功',
        duration: 2000
      })

      router.push({
        name: 'TimeSlotManagement-experiment',
        params: { id: experimentId.toString() }
      })
    }
    showEditDialog.value = false
    await fetchExperiments()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error(`保存失败: ${error.message}`)
  } finally {
    formLoading.value = false
  }
}

const togglePublish = async (experiment) => {
  if (!experiment?.id) {
    ElMessage.error('无效的实验数据')
    return
  }

  try {
    loading.value = true
    await publishExperiment(experiment.id, !experiment.isPublished)
    ElMessage.success(experiment.isPublished ? '已取消发布' : '已发布实验')
    await fetchExperiments()
  } catch (error) {
    console.error('发布操作失败:', error)
    ElMessage.error(`操作失败: ${error.message}`)
  } finally {
    loading.value = false
  }
}

const publishExperiment = async (experimentId, isPublished) => {
  try {
    const response = await request({
      url: `/api/teacher/experiment/${experimentId}/publish`,
      method: 'post',
      params: { isPublished }
    })
    return response
  } catch (error) {
    console.error('发布操作失败:', error)
    throw error
  }
}

onMounted(() => {
  fetchExperiments()
})
</script>

<style scoped>
.teacher-experiment-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.page-header-content {
  font-size: 18px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.approval-btn {
  background-color: #6c757d;
  border-color: #6c757d;
  color: white;
}

.approval-btn:hover {
  background-color: #5a6268;
  border-color: #545b62;
}

.experiment-card {
  margin-top: 20px;
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.experiment-name {
  font-weight: 500;
  cursor: pointer;
}

.experiment-name:hover {
  color: #409eff;
  text-decoration: underline;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

:deep(.el-table__row) {
  transition: all 0.3s;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa !important;
}

:deep(.el-tag) {
  font-weight: 500;
}

:deep(.el-dialog) {
  border-radius: 8px;
}

@media (max-width: 768px) {
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  :deep(.el-table__body-wrapper) {
    overflow-x: auto;
  }

  :deep(.el-table td.el-table__cell,
        .el-table th.el-table__cell) {
    padding: 8px 0;
  }
}
</style>