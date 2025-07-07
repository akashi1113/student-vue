<template>
  <div class="teacher-experiment-container">
    <el-page-header class="page-header">
      <template #content>
        <div class="page-header-content">
          <span>实验管理</span>
        </div>
      </template>
      <template #extra>
        <el-button type="primary" @click="handleCreateClick">
          <el-icon><plus /></el-icon> 创建新实验
        </el-button>
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
        >
          <el-table-column prop="id" label="ID" width="80">
            <template #default="{row}">
              {{ row?.id || '-' }}
            </template>
          </el-table-column>
          
          <el-table-column prop="name" label="实验名称">
            <template #default="{row}">
              {{ row?.name || '未命名实验' }}
            </template>
          </el-table-column>
          
          <el-table-column label="学科分类">
            <template #default="{row}">
              {{ getSubjectName(row?.subject) }}
            </template>
          </el-table-column>
          
          <el-table-column label="时长(分钟)" width="100">
            <template #default="{row}">
              {{ row?.duration || 0 }}
            </template>
          </el-table-column>
          
          <el-table-column label="状态" width="120">
            <template #default="{row}">
              <el-tag :type="getStatusTagType(row?.status)">
                {{ getStatusText(row?.status) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="发布状态" width="120">
            <template #default="{row}">
              <el-tag :type="row?.isPublished ? 'success' : 'info'">
                {{ row?.isPublished ? '已发布' : '未发布' }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="280">
            <template #default="{row}">
              <el-button 
                size="small" 
                @click="editExperiment(row)"
                :disabled="!row?.id"
              >
                编辑
              </el-button>
              <el-button 
                size="small" 
                type="primary" 
                @click="manageTimeSlots(row)"
                :disabled="!row?.id"
              >
                管理时间段
              </el-button>
              <el-button 
                size="small" 
                type="success" 
                @click="manageTemplate(row)"
                :disabled="!row?.id"
              >
                管理模板
              </el-button>
              <el-button 
                size="small" 
                :type="row?.isPublished ? 'warning' : 'primary'" 
                @click="togglePublish(row)"
                :disabled="!row?.id"
              >
                {{ row?.isPublished ? '取消发布' : '发布' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty description="暂无实验数据" v-else />
      </template>
      
      <el-pagination
        v-model:current-page="pagination.current"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        @current-change="fetchExperiments"
        layout="prev, pager, next"
        class="pagination"
        :disabled="loading"
      />
    </el-card>
    
    <!-- 创建/编辑实验对话框 -->
    <el-dialog 
      v-model="showEditDialog" 
      :title="editingExperiment?.id ? '编辑实验' : '创建新实验'"
      :close-on-click-modal="false"
    >
      <el-form :model="experimentForm" label-width="100px" :disabled="formLoading">
        <el-form-item label="实验名称" required>
          <el-input 
            v-model="experimentForm.name" 
            placeholder="请输入实验名称" 
            :maxlength="50"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="学科分类" required>
          <el-select 
            v-model="experimentForm.subject" 
            placeholder="请选择学科"
            clearable
          >
            <el-option
              v-for="subject in subjects"
              :key="subject.value"
              :label="subject.label"
              :value="subject.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="实验描述" required>
          <el-input 
            v-model="experimentForm.description" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入实验描述"
            :maxlength="500"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="预计时长" required>
          <el-input-number 
            v-model="experimentForm.duration" 
            :min="15" 
            :max="240" 
            controls-position="right" 
          /> 分钟
        </el-form-item>
        
        <el-form-item label="实验室位置">
          <el-input 
            v-model="experimentForm.location" 
            placeholder="请输入实验室位置"
            :maxlength="100"
          />
        </el-form-item>
        
        <el-form-item label="状态">
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
          @click="saveExperiment"
          :loading="formLoading"
        >
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import request from '@/utils/request' // 根据你的项目结构调整路径
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { 
  getTeacherExperiments,
  createExperiment,
  updateExperiment
} from '@/api/teacher_experiment'
import { ElMessage } from 'element-plus'

const router = useRouter()
const experiments = ref([])
const showEditDialog = ref(false)
const editingExperiment = ref(null)
const loading = ref(false)
const formLoading = ref(false)
const tableKey = ref(0) // 用于强制刷新表格

const experimentForm = ref({
  name: '',
  subject: '',
  description: '',
  duration: 60,
  location: '',
  status: 1,
  isPublished: false
})

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
    console.log('API响应数据:', res); // 检查返回的数据结构
    if (res?.data?.list) {
    //   experiments.value = res.data.records.map(item => ({
    //     ...item,
    //     id: item.id || '',
    //     name: item.name || '未命名实验',
    //     subject: item.subject || '',
    //     duration: Number(item.duration) || 60,
    //     status: Number(item.status) || 1,
    //     isPublished: Boolean(item.isPublished)
    //   }))
    //   pagination.value.total = Number(res.data.total) || 0
    // } else {
    //   experiments.value = []
    //   pagination.value.total = 0
    //   throw new Error('获取的实验数据格式不正确')
    // }
      experiments.value = res.data.list;  // 直接赋值 lis
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
    // tableKey.value++ // 强制刷新表格
  }
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

// Teacher_ExperimentList.vue 中的 manageTimeSlots 方法
const manageTimeSlots = (experiment) => {
  if (!experiment?.id) {
    ElMessage.error('无效的实验ID')
    return
  }
  router.push({
    name: 'TimeSlotManagement-experiment', // 使用路由名称
    params: { id: experiment.id },
    query: { experimentName: experiment.name } // 传递名称
  }).catch(err => {
    // 捕获路由错误
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

const saveExperiment = async () => {
  formLoading.value = true
  try {
    // 获取当前登录教师的ID（假设存储在localStorage或Vuex中）
    // const userInfo = JSON.parse(localStorage.getItem('userInfo'))
    // const teacherId = userInfo?.id // 根据实际用户数据结构调整
    const teacherId = 1 // 临时测试值
    const requestData = {
      ...experimentForm.value,
      createdBy: teacherId
    }

    if (editingExperiment.value?.id) {
      await updateExperiment(requestData, editingExperiment.value.id)
      ElMessage.success('实验更新成功')
    } else {
      // 创建新实验，并获取返回的实验ID
      // 创建新实验时包含teacherId
      const res = await createExperiment(requestData)
      console.log('创建实验响应:', res) // 调试日志
      
      // 根据实际响应结构调整
      const experimentId = res.data?.id || res.data // 尝试获取id字段，如果没有则直接使用data
      
      if (!experimentId) {
        throw new Error('未能获取实验ID')
      }
      ElMessage.success('实验创建成功')

      // 新增：创建成功后自动跳转到该实验的时间段管理页面
      router.push({
        name: 'TimeSlotManagement-experiment', // 确保路由名称正确
        params: { id: experimentId.toString() } // 传递实验ID
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header-content {
  font-size: 18px;
  font-weight: 500;
}

.experiment-card {
  margin-top: 20px;
  width: 100%;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>