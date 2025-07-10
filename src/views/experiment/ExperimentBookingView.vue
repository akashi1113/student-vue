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
        v-if="experiment && timeSlots.length > 0"
        :experiment="experiment"
        :time-slots="timeSlots"
        @submit="handleSubmit"
        @cancel="goBack"
      />
      <el-empty v-else description="暂无可用时间段" />
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
import experimentApi from '@/api/experiment'


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
    const timeSlots = ref([])

    onMounted(async () => {
  try {
    // 优先使用路由参数中的实验数据
    if (route.query.experimentData) {
      experiment.value = JSON.parse(route.query.experimentData)
      console.log('从路由参数获取的实验数据:', experiment.value)
    }
    
    // 如果路由参数中没有，再从store获取
    if (!experiment.value) {
      const experimentData = await experimentStore.getExperimentById(route.params.id)
      experiment.value = experimentData
      console.log('从store获取的实验数据:', experiment.value)
    }

    if (!experiment.value) {
      throw new Error('无法获取实验信息')
    }

    // 获取可用时间段
    const response = await experimentApi.getAvailableTimeSlots(experiment.value.id)
    timeSlots.value = response.data || []
    
  } catch (error) {
    console.error('初始化失败:', error)
    ElMessage.error('获取实验信息失败: ' + error.message)
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
        if (!bookingData.timeSlotId) {
          throw new Error('请选择时间段');
        }

        // 确保实验ID存在且有效
        if (!experiment.value?.id) {
          throw new Error('无效的实验ID');
        }

        const tempUserId = 1; // 测试用，实际应从store获取

        // 先预约
        const booking = await experimentStore.bookExperiment({
          experimentId: Number(experiment.value.id),
          userId: tempUserId,
          timeSlotId: bookingData.timeSlotId
        });


        // 确保预约成功后再更新状态
        if (booking) {
          // 显示成功提示
          ElMessage.success('预约成功！');

          // 刷新数据
          await experimentStore.fetchExperiments();

          // 延迟跳转，让用户看到提示
          setTimeout(() => {
            router.push({
              path: '/experimentList',
              query: {
                booked: true,
                id: experiment.value.id,
                bookingId: booking.id
              }
            });
          }, 1000); // 1秒后跳转
        }
      } catch (error) {
        console.error('预约提交失败:', error);
        ElMessage.error(`预约失败: ${error.message}`);
      }
    }

    return {
      experiment,
      goBack,
      handleSubmit,
      timeSlots
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