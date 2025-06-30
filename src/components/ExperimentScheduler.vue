<template>
  <div class="experiment-scheduler">
    <el-form label-position="top">
      <el-form-item label="实验名称">
        <el-input :value="experimentName" disabled />
      </el-form-item>
      
      <el-form-item label="预约时间" required>
        <el-date-picker
          v-model="timeRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          :disabled-date="disabledDate"
          :disabled-hours="disabledHours"
          :disabled-minutes="disabledMinutes"
          :default-time="defaultTime"
        />
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
      <el-button type="primary" @click="submitBooking">确认预约</el-button>
    </div>
  </div>
</template>

<script>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

export default {
  props: {
    experiment: {
      type: Object,
      required: true,
      default: () => ({ name: '' }) // 添加默认对象
    }
  },
  emits: ['update:modelValue', 'submit', 'cancel'],
  setup(props, { emit }) {
    const localExperiment = ref({...props.modelValue})
    const experimentName = computed(() => props.experiment?.name || '未命名实验')
    const timeRange = ref([])
    const notes = ref('')

    watch(() => props.modelValue, (newVal) => {
      localExperiment.value = {...newVal}
      experimentName.value = newVal?.name || '未命名实验'
    }, { immediate: true })

    const defaultTime = computed(() => {
      const now = new Date()
      const nextHour = new Date(now)
      nextHour.setHours(nextHour.getHours() + 1)
      nextHour.setMinutes(0, 0, 0)
      return [nextHour, nextHour]
    })

    const disabledDate = (time) => {
      return time.getDay() === 0 || time.getDay() === 6
    }

    const disabledHours = () => {
      return [...Array(24).keys()].filter(h => h < 8 || h >= 20)
    }

    const disabledMinutes = (hour) => {
      return [...Array(60).keys()].filter(m => m % 30 !== 0)
    }

    const submitBooking = () => {
      if (!timeRange.value || timeRange.value.length !== 2) {
        ElMessage.warning('请选择预约时间范围')
        return
      }
      
      const [startTime, endTime] = timeRange.value
      const duration = (endTime - startTime) / (1000 * 60) // 分钟
      
      if (duration < 30) {
        ElMessage.warning('预约时间至少30分钟')
        return
      }
      
      if (duration > 240) {
        ElMessage.warning('单次预约时间不超过4小时')
        return
      }
      
      // 更新本地数据并通知父组件
      const updatedData = {
        ...localExperiment.value,
        startTime,
        endTime,
        notes: notes.value
      }
      
      emit('update:modelValue', updatedData)
      emit('submit', {
        experimentId: localExperiment.value.id,
        experimentName: experimentName.value,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        notes: notes.value
      })
    }
    
    return {
      localExperiment,
      experimentName,
      timeRange,
      notes,
      defaultTime,
      disabledDate,
      disabledHours,
      disabledMinutes,
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

:deep(.el-form-item__label) {
  font-weight: bold;
  color: #606266;
}
</style>