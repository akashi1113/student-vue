<template>
  <div class="booking-container">
    <el-page-header @back="goBack" content="实验预约">
      <template #content>
        <div class="page-header-content">
          <el-icon @click="goBack"><arrow-left /></el-icon>
          <span>实验预约</span>
        </div>
      </template>
    </el-page-header>
    
    <div class="booking-card">
      <experiment-scheduler
        v-if="experiment"
        :experiment="experiment"
        @submit="handleSubmit"
        @cancel="goBack"
      />
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useExperimentStore } from '@/store/experiment'
import { ArrowLeft } from '@element-plus/icons-vue'
import ExperimentScheduler from '@/components/ExperimentScheduler.vue'
import { ElMessage } from 'element-plus'

export default {
  components: {
    ArrowLeft,
    ExperimentScheduler
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const experimentStore = useExperimentStore()
    const experiment = ref(null)

    onMounted(async () => {
      try {
        const experimentData = await experimentStore.getExperimentById(route.params.id)
        console.log('获取到的实验数据:', experimentData) // 调试日志
        experiment.value = experimentData
      } catch (error) {
        ElMessage.error('获取实验信息失败')
        goBack()
      }
    })

    const goBack = () => {
      if (route.query.from) {
        router.push(route.query.from)
      } else {
        router.push('/experimentList')
      }
    }

    const handleSubmit = async (bookingData) => {
      try {
        const booking = await experimentStore.bookExperiment({
          experimentId: Number(experiment.value.id), // 确保是 Number/Long
          experimentName: experiment.value.name,
          userId:null,        
          startTime: bookingData.startTime,          // 确保是合法的日期对象
          endTime: bookingData.endTime
        });
        // ElMessage.success('预约成功')
        // 更新实验状态为已预约(0)
        experiment.value.status = 0

        // 多重存储bookingId
        const bookingId = String(booking.id);
        experimentStore.setCurrentBookingId(bookingId);
        sessionStorage.setItem('currentBookingId', bookingId);
        localStorage.setItem('currentBookingId', bookingId);

        router.push({
          path: `/experimentList`,
          query: { 
            booked: true,
            id: experiment.value.id, // 传递实验 ID
            bookingId: booking.id
        }
        })
      } catch (error) {
        ElMessage.error(`预约失败: ${error.message}`)
      }
    }

    return {
      experiment,
      goBack,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.booking-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.booking-card {
  background: #fff;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-top: 20px;
}

.page-header-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-header-content .el-icon {
  cursor: pointer;
}
</style>