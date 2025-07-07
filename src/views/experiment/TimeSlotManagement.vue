<template>
  <div class="time-slot-container">
    <el-page-header @back="goBack" class="page-header">
      <template #content>
        <div class="page-header-content">
          <el-icon><arrow-left /></el-icon>
          <span>实验时间段管理 - {{ experiment.name }}</span>
        </div>
      </template>
    </el-page-header>
    
    <el-card class="time-slot-card">
      <div class="toolbar">
        <el-button type="primary" @click="showDialog = true">
          <el-icon><plus /></el-icon> 添加时间段
        </el-button>
      </div>
      
      <el-table :data="timeSlots" style="width: 100%" :key="tableKey">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="时间段">
          <template #default="{row}">
            {{ formatDate(row.startTime) }} - {{ formatDate(row.endTime) }}
          </template>
        </el-table-column>
        <el-table-column label="容量">
          <template #default="{row}">
            {{ row.currentCapacity }} / {{ row.maxCapacity }}
          </template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="{row}">
            <el-tag :type="row.status ? 'success' : 'danger'">
              {{ row.status ? '开放' : '关闭' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{row}">
            <el-button size="small" @click="editTimeSlot(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteSlot(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 添加/编辑时间段对话框 -->
    <el-dialog v-model="showDialog" :title="editingSlot ? '编辑时间段' : '添加时间段'">
      <el-form :model="slotForm" label-width="100px">
        <el-form-item label="开始时间" required>
          <el-date-picker
            v-model="slotForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        
        <el-form-item label="结束时间" required>
          <el-date-picker
            v-model="slotForm.endTime"
            type="datetime"
            placeholder="选择结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        
        <el-form-item label="最大人数" required>
          <el-input-number v-model="slotForm.max_capacity" :min="1" :max="50" />
        </el-form-item>
        
        <el-form-item label="状态">
          <el-switch v-model="slotForm.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="saveTimeSlot">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Plus } from '@element-plus/icons-vue'
import { 
  getTimeSlots, 
  addTimeSlot, 
  updateTimeSlot, 
  deleteTimeSlot as apiDeleteTimeSlot
} from '@/api/teacher_experiment'
import { getExperimentById } from '@/api/experiment'

const route = useRoute()
const router = useRouter()
const experiment = ref({})
const timeSlots = ref([])
const showDialog = ref(false)
const editingSlot = ref(null)
const tableKey = ref(0);
const slotForm = ref({
  experimentId: null, // camelCase
  startTime: null,    // camelCase
  endTime: null,      // camelCase
  maxCapacity: 10,    // camelCase
  status: 1
})


// 获取实验详情
const fetchExperiment = async () => {
  const id = route.params.id
  if (!id) return
  
  try {
    // 直接获取时间段列表（实验名称可通过路由参数传递）
    await fetchTimeSlots(id)
    // 如果确实需要实验名称，可从路由query或TeacherExperimentList.vue传递
    experiment.value.name = route.query.experimentName || '实验时间段管理'
  } catch (error) {
    console.error('获取实验详情失败:', error)
    ElMessage.error('获取实验详情失败')
  }
}

// 获取时间段列表
const fetchTimeSlots = async (experimentId) => {
  try {
    console.log('正在获取时间段列表，实验ID:', experimentId); // 调试日志
    const res = await getTimeSlots(experimentId);
    console.log('获取到的响应数据:', res); // 调试日志
    timeSlots.value = Array.isArray(res) ? res : [];
    console.log('设置后的时间段列表:', timeSlots.value); // 调试日志
    tableKey.value++; // 强制刷新表格
  } catch (error) {
    console.error('获取时间段失败:', error);
    ElMessage.error('获取时间段失败');
    timeSlots.value = [];
  }
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return null;
  
  // 如果是字符串日期，先转换为Date对象
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  
  // 格式化为 yyyy-MM-dd HH:mm:ss
  const pad = num => num.toString().padStart(2, '0');
  
  const year = dateObj.getFullYear();
  const month = pad(dateObj.getMonth() + 1);
  const day = pad(dateObj.getDate());
  const hours = pad(dateObj.getHours());
  const minutes = pad(dateObj.getMinutes());
  const seconds = pad(dateObj.getSeconds());
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 编辑时间段
const editTimeSlot = (slot) => {
  editingSlot.value = slot
  slotForm.value = { ...slot }
  showDialog.value = true
}

// 保存时间段
const saveTimeSlot = async () => {
  try {
    const data = {
      id: editingSlot.value?.id,
      experimentId: route.params.id, // 直接使用路由参数
      startTime: formatDate(slotForm.value.startTime),
      endTime: formatDate(slotForm.value.endTime),
      maxCapacity: slotForm.value.maxCapacity,
      status: slotForm.value.status
    }

    console.log('Sending data:', data); // 调试日志
    // delete data.experiment_id // 移除旧的snake_case字段
    if (editingSlot.value) {
      await updateTimeSlot(editingSlot.value.id, data)
    } else {
      await addTimeSlot(data)
    }
    
    ElMessage.success('保存成功')
    showDialog.value = false
    // fetchTimeSlots(route.params.id)
    // 确保等待列表刷新完成
    await fetchTimeSlots(route.params.id);
    
    // 强制重置表单
    slotForm.value = {
      experimentId: route.params.id,
      startTime: null,
      endTime: null,
      maxCapacity: 10,
      status: 1
    };
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败: ' + error.message)
  }
}

// 删除时间段
const deleteSlot = async (id) => {
  try {
    await apiDeleteTimeSlot(id)
    ElMessage.success('删除成功')
    fetchTimeSlots(slotForm.value.experiment_id)
  } catch (error) {
    ElMessage.error('删除失败: ' + error.message)
  }
}

// 返回
const goBack = () => {
  router.push('/teacher/experimentList')
}

onMounted(fetchExperiment)
</script>

<style scoped>
.time-slot-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.time-slot-card {
  margin-top: 20px;
}

.toolbar {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>