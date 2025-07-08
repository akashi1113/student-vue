<template>
  <div class="approval-container">
    <el-page-header @back="goBack" class="page-header">
      <template #content>
        <div class="page-header-content">
          <el-icon><arrow-left /></el-icon>
          <span>实验预约审批</span>
        </div>
      </template>
    </el-page-header>
    
    <el-card class="approval-card">
      <el-table :data="pendingBookings" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="实验名称">
          <template #default="{row}">
            {{ row.experimentName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="学生">
          <template #default="{row}">
            {{ `用户ID: ${row.userId}` || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="预约时间">
          <template #default="{row}">
            {{ formatDate(row.startTime) }} - {{ formatDate(row.endTime) }}
          </template>
        </el-table-column>
        <el-table-column label="审核状态" width="120">
          <template #default="{row}">
            <el-tag :type="row.approvalStatus === 0 ? 'warning' : row.approvalStatus === 1 ? 'success' : 'danger'">
        {{ row.approvalStatus === 0 ? '待审批' : row.approvalStatus === 1 ? '已通过' : '已拒绝' }}
      </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{row}">
            <el-button type="success" size="small" @click="approveBookingAction(row.id, 1)" :disabled="row.approvalStatus !== 0">通过</el-button>
            <el-button type="danger" size="small" @click="approveBookingAction(row.id, 2)" :disabled="row.approvalStatus !== 0">拒绝</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-model:current-page="pagination.current"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        @current-change="fetchBookings"
        layout="prev, pager, next"
        class="pagination"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import {ElMessage} from 'element-plus'
import { getPendingBookings, approveBooking } from '@/api/teacher_experiment'

const router = useRouter()
const pendingBookings = ref([])
const pagination = ref({
  current: 1,
  size: 10,
  total: 0
})

// 获取待审批预约
const fetchBookings = async () => {
  try {
    const res = await getPendingBookings({
      pageNum: pagination.value.current,  // 注意参数名改为 pageNum
      pageSize: pagination.value.size    // 注意参数名改为 pageSize
    })
    
    // 直接使用返回的数组数据
    pendingBookings.value = Array.isArray(res) ? res : res.data || []
    pagination.value.total = pendingBookings.value.length // 如果没有分页信息，使用数组长度
  } catch (error) {
    console.error('获取待审批预约失败:', error)
    pendingBookings.value = []
    ElMessage.error('获取待审批预约失败')
  }
}

// 格式化日期
const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString()
}

// 审批预约
const approveBookingAction = async (bookingId, status) => {
  try {
    await approveBooking({ 
      bookingId, 
      status 
    })
    ElMessage.success(status === 1 ? '已通过预约' : '已拒绝预约')
    fetchBookings()
  } catch (error) {
    ElMessage.error('操作失败: ' + error.message)
  }
}

// 返回
const goBack = () => {
  router.push('/teacher/dashboard')
}

onMounted(fetchBookings)
</script>

<style scoped>
.approval-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.approval-card {
  margin-top: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>