<template>
  <div class="experiment-scheduler">
    <el-form label-position="top">
      <el-form-item label="实验名称">
        <el-input :value="experimentName" disabled />
      </el-form-item>
      
      <el-form-item label="选择时间段" required>
        <el-select 
          v-model="selectedSlotId" 
          placeholder="请选择预约时间段"
          class="time-slot-select"
        >
          <el-option
            v-for="slot in availableSlots"
            :key="slot.id"
            :label="formatSlotTime(slot)"
            :value="slot.id"
          >
            <div class="slot-option">
              <span>{{ formatDate(slot.startTime) }}</span>
              <!-- <span>{{ formatTime(slot.startTime) }} - {{ formatTime(slot.endTime) }}</span> -->
              <el-tag size="small" :type="slot.status ? 'success' : 'danger'">
                {{ slot.status ? '可预约' : '已满' }}
              </el-tag>
              <span>剩余: {{ slot.maxCapacity - slot.currentCapacity }}个名额</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>
      
      <el-form-item label="备注">
        <el-input
          v-model="notes"
          type="textarea"
          :rows="2"
          placeholder="请输入预约备注信息（可选）"
        />
      </el-form-item>
    </el-form>
    
    <div class="actions">
      <el-button @click="$emit('cancel')">取消</el-button>
      <el-button 
        type="primary" 
        :disabled="!selectedSlotId" 
        @click="submitBooking"
      >
        确认预约
      </el-button>

    </div>
  </div>
</template>

<script>
import { computed, ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import experimentApi from '@/api/experiment'

export default {
  props: {
    experiment: {
      type: Object,
      required: true,
      default: () => ({ name: '' })
    }
  },
  emits: ['submit', 'cancel'],
  setup(props, { emit }) {
    const localExperiment = ref({...props.modelValue})
    const experimentName = computed(() => props.experiment?.name || '未命名实验')
    const timeRange = ref([])
    const notes = ref('')
    const selectedSlotId = ref(null)
    const availableSlots = ref([])

    watch(() => props.modelValue, (newVal) => {
      localExperiment.value = {...newVal}
      experimentName.value = newVal?.name || '未命名实验'
    }, { immediate: true })

    // 获取可用时间段
    const fetchAvailableSlots = async () => {
  try {
    const response = await experimentApi.getAvailableTimeSlots(props.experiment.id)
    console.log('完整响应:', response) // 调试日志
    
    // 确保我们操作的是数组数据
    const slotsData = Array.isArray(response) ? response : response.data || []
    
    availableSlots.value = slotsData.filter(slot => 
      slot.status === 1 && slot.currentCapacity < slot.maxCapacity
    )
    
    if (availableSlots.value.length === 0) {
      ElMessage.warning('该实验暂无可用时间段')
    }
  } catch (error) {
    console.error('获取可用时间段失败:', error)
    ElMessage.error('获取可用时间段失败: ' + error.message)
  }
}

    // 格式化日期
    const formatDate = (dateStr) => {
      const date = new Date(dateStr)
      return `${date.getMonth() + 1}月${date.getDate()}日`
    }
    
    // 格式化时间
    const formatTime = (dateStr) => {
      const date = new Date(dateStr)
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }
    
    // 格式化时间段显示
    const formatSlotTime = (slot) => {
      return `${formatDate(slot.startTime)} ${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`
    }

    const submitBooking = () => {
      if (!selectedSlotId.value) {
        ElMessage.warning('请选择预约时间段')
        return
      }
      
      const selectedSlot = availableSlots.value.find(slot => slot.id === selectedSlotId.value)
      
      emit('submit', {
        experimentId: props.experiment.id,
        experimentName: experimentName.value,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        notes: notes.value,
        timeSlotId: selectedSlotId.value
      })
    }

    onMounted(fetchAvailableSlots)
    
    return {
      localExperiment,
      experimentName,
      timeRange,
      selectedSlotId,
      notes,
      availableSlots,
      formatDate,
      formatTime,
      formatSlotTime,
      submitBooking
    }
  }
}
</script>

<style scoped>
.experiment-scheduler {
  padding: 10px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.time-slot-select {
  width: 100%;
}

.slot-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.slot-option > span {
  margin-right: 10px;
}

:deep(.el-form-item__label) {
  font-weight: bold;
  color: #606266;
}
</style>