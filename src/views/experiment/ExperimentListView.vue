<template>
  <div class="experiment-container">
    <div class="header">
      <h1>虚拟仿真实验中心</h1>
      <div class="controls">
        <el-input
          v-model="searchQuery"
          placeholder="搜索实验项目..."
          class="search-input"
          clearable
        >
          <template #prefix>
            <el-icon><search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="subjectFilter" placeholder="学科分类" clearable>
          <el-option
            v-for="subject in subjects"
            :key="subject.value"
            :label="subject.label"
            :value="subject.value"
          />
        </el-select>
      </div>
    </div>

    <div v-if="experimentStore.isLoading" class="loading-state">
      <el-skeleton :rows="6" animated />
    </div>
    <template v-else>
      <div v-if="filteredExperiments.length === 0" class="empty-state">
        <el-empty description="暂无实验数据" />
      </div>
      <div v-else class="experiment-grid">
        <experiment-card
          v-for="experiment in filteredExperiments"
          :key="experiment.id"
          :experiment="experiment"
          :booking-id="experiment.id"
          :statu="experiment.status"
          @book="openBookingDialog(experiment)"
        />
      </div>
    </template>

    <el-dialog v-model="bookingDialogVisible" title="预约实验" width="500px">
      <experiment-scheduler
        v-if="selectedExperiment"
        :experiment="selectedExperiment"
        @submit="handleBookingSubmit"
        @cancel="bookingDialogVisible = false"
      />
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, toRaw } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { useExperimentStore } from '@/store/experiment'
import { ElMessage, ElSkeleton, ElEmpty } from 'element-plus'
import { useRoute } from 'vue-router'

import ExperimentCard from '@/components/ExperimentCard.vue'
import ExperimentScheduler from '@/components/ExperimentScheduler.vue'

export default {
  components: {
    Search,
    ElSkeleton,
    ElEmpty,
    ExperimentCard,
    ExperimentScheduler
  },
  setup() {
    const experimentStore = useExperimentStore()
    const route = useRoute()
    const searchQuery = ref('')
    const subjectFilter = ref('')
    const bookingDialogVisible = ref(false)
    const selectedExperiment = ref(null)

    const subjects = [
      { value: 'c++', label: 'C++' },
      { value: 'java', label: 'JAVA' },
      { value: 'bianyi', label: '编译原理' },
      { value: 'ssd1', label: 'SSD1' },
      { value: 'database', label: '数据库' }
    ]

    onMounted(async () => {
      console.log(experimentStore,'-----------------');
      
      try {
        await experimentStore.fetchExperiments()
        console.log('Store数据加载完成:', toRaw(experimentStore.experiments))
        
        if (route.query.booked) {
          const bookedExperimentId = route.params.id || experimentStore.currentBooking?.experimentId
          const index = experimentStore.experiments.findIndex(e => e.id === bookedExperimentId)
          if (index !== -1) {
            experimentStore.experiments[index].status = 0
          }
        }
      } catch (error) {
        ElMessage.error(`加载实验数据失败: ${error.message}`)
      }
    })

    const filteredExperiments = computed(() => {
  const rawExperiments = toRaw(experimentStore.experiments) || []
  console.log('原始实验数据:', rawExperiments)

  return rawExperiments
    .filter(experiment => experiment.isPublished !== 0) // 只过滤未发布的实验
    .filter(experiment => {
      const matchesSearch = searchQuery.value
        ? (experiment.name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
           experiment.description?.toLowerCase().includes(searchQuery.value.toLowerCase()))
        : true
      
      const matchesSubject = subjectFilter.value
        ? experiment.subject === subjectFilter.value
        : true
      
      return matchesSearch && matchesSubject
    })
})

    const openBookingDialog = (experiment) => {
      selectedExperiment.value = experiment
      bookingDialogVisible.value = true
    }

    const handleBookingSubmit = async (booking) => {
      try {
        await experimentStore.bookExperiment(booking)
        const index = experimentStore.experiments.findIndex(e => e.id === booking.experimentId)
    if (index !== -1) {
      experimentStore.experiments[index].status = 0 // 设置为已预约状态
    }
        ElMessage.success('实验预约成功！')
        bookingDialogVisible.value = false
      } catch (error) {
        ElMessage.error(`预约失败: ${error.message}`)
      }
    }
    
    return {
      searchQuery,
      subjectFilter,
      subjects,
      bookingDialogVisible,
      selectedExperiment,
      filteredExperiments,
      experimentStore,
      openBookingDialog,
      handleBookingSubmit
    }
  }
}
</script>

<style scoped>
.experiment-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 20px;
}

.header h1 {
  font-size: 28px;
  color: #2c3e50;
  margin: 0;
}

.controls {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.search-input {
  width: 300px;
}

.experiment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 25px;
  margin-top: 20px;
}

.loading-state {
  margin-top: 40px;
}

.empty-state {
  margin-top: 60px;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .controls {
    width: 100%;
  }
  
  .search-input {
    width: 100%;
  }
  
  .experiment-grid {
    grid-template-columns: 1fr;
  }
}
</style>