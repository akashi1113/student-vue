<template>
  <el-card>
    <div class="filter-bar">
      <el-form :inline="true" :model="filters" @submit.native.prevent="fetchData">
        <el-form-item label="用户">
          <el-input v-model="filters.username" placeholder="用户名/ID" clearable />
        </el-form-item>
        <el-form-item label="模块">
          <el-select v-model="filters.module" placeholder="请选择" clearable>
            <el-option v-for="item in moduleOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <div v-if="filters.module" style="margin-bottom: 8px; color: #409EFF; font-size: 14px;">
          当前选择模块：{{ filters.module }}
        </div>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filters.timeRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            clearable
          />
        </el-form-item>
        <el-button type="primary" @click="fetchData">查询</el-button>
        <el-button @click="handleExport">导出</el-button>
        <el-button type="default" @click="handleReset">重置</el-button>
      </el-form>
    </div>
    <el-table :data="tableData" v-loading="loading" style="width: 100%">
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="module" label="模块" />
      <el-table-column prop="operation" label="操作类型" />
      <el-table-column prop="count" label="操作总数" />
      <el-table-column prop="successCount" label="成功数" />
      <el-table-column prop="failedCount" label="失败数" />
      <el-table-column prop="lastOperationTime" label="最近操作时间" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button size="mini" @click="showDetail(scope.row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.size"
      :total="pagination.total"
      @current-change="fetchData"
      @size-change="fetchData"
      layout="total, sizes, prev, pager, next, jumper"
      :page-sizes="[10, 20, 50, 100]"
    />
    <div class="chart-switch-bar">
      <el-button @click="toggleChart" type="primary" size="small">
        切换为{{ chartType === 'pie' ? '柱状图' : '饼图' }}
      </el-button>
    </div>
    <div class="chart-center">
      <ModulePieChart v-if="chartType === 'pie'" :data="pieChartData" class="module-pie-chart" />
      <BarChart v-else :data="barChartData" class="module-bar-chart" />
    </div>
    <el-dialog v-model="detailVisible" title="操作详情" width="60%">
      <el-table :data="detailData">
        <el-table-column prop="id" label="ID" />
        <el-table-column prop="createTime" label="时间" />
        <el-table-column prop="status" label="状态" />
        <el-table-column prop="ipAddress" label="IP" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="requestUrl" label="请求URL" />
        <el-table-column prop="requestMethod" label="请求方式" />
      </el-table>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { fetchAuditReport, exportAuditReport, fetchAuditGroupDetails } from '@/api/audit'
import { ElMessage } from 'element-plus'
import ModulePieChart from '@/components/common/ModulePieChart.vue'
import BarChart from '@/components/common/BarChart.vue'

const chartType = ref('pie')
function toggleChart() {
  chartType.value = chartType.value === 'pie' ? 'bar' : 'pie'
}

const filters = reactive({
  username: '',
  module: '',
  timeRange: [],
})
const tableData = ref([])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})
const detailVisible = ref(false)
const detailData = ref([])
const moduleOptions = ref([])

function fetchData() {
  loading.value = true
  const params = {
    username: filters.username,
    module: filters.module,
    startTime: filters.timeRange?.[0] || '',
    endTime: filters.timeRange?.[1] || '',
    page: pagination.page,
    size: pagination.size
  }
  fetchAuditReport(params)
    .then(res => {
      tableData.value = res.list || []
      pagination.total = res.total || 0
    })
    .catch(() => {
      ElMessage.error('获取日志数据失败')
    })
    .finally(() => {
      loading.value = false
    })
}

function showDetail(row) {
  const params = {
    module: row.module,
    operation: row.operation,
    startTime: filters.timeRange?.[0] || '',
    endTime: filters.timeRange?.[1] || '',
    page: 1,
    size: 100
  }
  detailData.value = []
  detailVisible.value = true
  fetchAuditGroupDetails(params)
    .then(res => {
      detailData.value = res.list || res.data?.list || []
    })
    .catch(() => {
      detailData.value = []
      ElMessage.error('获取操作详情失败')
    })
}

function handleExport() {
  const params = {
    username: filters.username,
    module: filters.module,
    startTime: filters.timeRange?.[0] || '',
    endTime: filters.timeRange?.[1] || '',
    page: pagination.page,
    size: pagination.size
  }
  exportAuditReport(params)
    .then(res => {
      const blob = new Blob([res], { type: 'application/vnd.ms-excel' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = '操作日志报表.xlsx'
      link.click()
      window.URL.revokeObjectURL(url)
    })
    .catch(() => {
      ElMessage.error('导出失败')
    })
}

function handleReset() {
  filters.username = ''
  filters.module = ''
  filters.timeRange = []
  fetchData()
}

onMounted(() => {
  moduleOptions.value = ['成绩管理', '知识库', '考试', '作业', '用户管理']
  fetchData()
})

const pieChartData = computed(() => {
  const map = new Map()
  tableData.value.forEach(item => {
    if (!item.module) return
    if (!map.has(item.module)) {
      map.set(item.module, 0)
    }
    map.set(item.module, map.get(item.module) + (item.count || 0))
  })
  return Array.from(map.entries()).map(([module, count]) => ({ module, count }))
})

const barChartData = computed(() => {
  return tableData.value.map(item => ({
    module: item.module,
    count: item.count || 0
  }))
})
</script>

<style scoped>
.filter-bar {
  margin-bottom: 20px;
  background: #f4f8fb;
  border-radius: 8px;
  padding: 18px 24px 8px 24px;
  box-shadow: 0 2px 8px 0 rgba(64,158,255,0.06);
}
.el-card {
  background: #fafdff;
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(64,158,255,0.10);
  border: none;
}
.el-form-item__label {
  color: #2d5fa7;
  font-weight: 500;
  font-size: 15px;
}
.el-input__inner, .el-select .el-input__inner {
  border-radius: 6px;
  border: 1px solid #b3d8fd;
  background: #fff;
  font-size: 15px;
}
.el-button--primary {
  background: linear-gradient(90deg, #409eff 0%, #2d5fa7 100%);
  border: none;
  font-weight: 500;
  letter-spacing: 1px;
}
.el-button--default {
  background: #eaf3fb;
  color: #2d5fa7;
  border: none;
}
.el-table {
  background: #fff;
  border-radius: 8px;
  font-size: 15px;
  box-shadow: 0 2px 8px 0 rgba(64,158,255,0.04);
}
.el-table th {
  background: #eaf3fb;
  color: #2d5fa7;
  font-weight: 600;
  font-size: 15px;
}
.el-table td {
  color: #222;
  font-size: 15px;
}
.el-pagination {
  margin: 18px 0 8px 0;
  justify-content: center;
}
.el-dialog__wrapper .el-dialog {
  border-radius: 12px;
  background: #fafdff;
}
.el-dialog__title {
  color: #2d5fa7;
  font-size: 18px;
  font-weight: 600;
}
.el-dialog__body {
  padding-top: 10px;
}
.chart-switch-bar {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  margin-bottom: 8px;
}
.chart-center {
  display: flex;
  justify-content: center;
  align-items: center;
}
.module-pie-chart, .module-bar-chart {
  width: 480px;
  min-width: 320px;
  max-width: 600px;
}
</style> 