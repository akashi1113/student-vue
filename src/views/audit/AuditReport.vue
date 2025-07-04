<template>
  <el-card>
    <div class="filter-bar">
      <el-form :inline="true" :model="filters" @submit.native.prevent="fetchData">
        <el-form-item label="用户">
          <el-input v-model="filters.username" placeholder="输入用户名或ID" clearable>
            <template #prepend>
              <el-tooltip content="输入数字将按ID查询，输入文本将按用户名查询">
                <span>用户</span>
              </el-tooltip>
            </template>
          </el-input>
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
    <el-table :data="groupedTableData" v-loading="loading" style="width: 100%" row-key="username">
      <el-table-column type="expand">
        <template #default="props">
          <el-table :data="props.row.children" border style="width: 100%" class="nested-table">
            <el-table-column prop="module" label="模块" />
            <el-table-column prop="operation" label="操作类型" />
            <el-table-column prop="count" label="操作总数" />
            <el-table-column prop="successCount" label="成功数" />
            <el-table-column prop="failedCount" label="失败数" />
            <el-table-column prop="lastOperationTime" label="最近操作时间" />
            <el-table-column label="操作" width="100">
              <template #default="scope">
                <el-button size="small" @click="showDetail(scope.row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </el-table-column>
      <el-table-column prop="username" label="用户名">
        <template #default="scope">
          <div class="username-cell">
            <span class="username-text">{{ scope.row.username }}</span>
            <el-tag size="small" type="success">{{ scope.row.children.length }}条记录</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="模块数量">
        <template #default="scope">
          <el-tooltip :content="Array.from(scope.row.moduleSet).join(', ')">
            <el-tag size="small" type="info">{{ scope.row.moduleSet.size }}个</el-tag>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="操作类型数">
        <template #default="scope">
          <el-tag size="small" type="info">{{ scope.row.operationCount }}种</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="count" label="总操作数" />
      <el-table-column prop="successCount" label="总成功数" />
      <el-table-column prop="failedCount" label="总失败数" />
      <el-table-column prop="lastOperationTime" label="最近操作时间" />
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
  size: 100,
  total: 0
})
const detailVisible = ref(false)
const detailData = ref([])
const moduleOptions = ref([])

function fetchData() {
  loading.value = true
  
  // 准备查询参数
  const params = {
    module: filters.module,
    startTime: filters.timeRange?.[0] || '',
    endTime: filters.timeRange?.[1] || '',
    page: pagination.page,
    size: pagination.size
  }
  
  // 正确处理用户名/用户ID
  const userInput = filters.username.trim();
  if (userInput) {
    // 检查输入是否为纯数字（用户ID）
    if (/^\d+$/.test(userInput)) {
      params.userId = parseInt(userInput);
    } else {
      // 输入是字符串，作为用户名查询
      params.username = userInput;
    }
  }

  console.log('查询参数:', params) // 添加日志，便于调试

  fetchAuditReport(params)
    .then(res => {
      console.log('API返回结果:', res) // 添加API返回结果的日志
      let resultList = [];
      
      // 获取结果列表
      if (res.list) {
        resultList = res.list;
      } else if (res.data && res.data.list) {
        resultList = res.data.list;
      } else if (Array.isArray(res)) {
        resultList = res;
      } else if (res.records) {
        resultList = res.records;
      }
      
      // 前端手动筛选 - 临时解决方案
      // 如果指定了用户名，则手动过滤结果
      if (filters.username.trim()) {
        const userInput = filters.username.trim().toLowerCase();
        // 检查是否为数字ID查询
        if (/^\d+$/.test(userInput)) {
          resultList = resultList.filter(item => 
            item.userId === parseInt(userInput)
          );
        } else {
          // 用户名查询 - 不区分大小写
          resultList = resultList.filter(item => 
            item.username && item.username.toLowerCase().includes(userInput)
          );
        }
        
        console.log('前端过滤后的结果:', resultList);
        
        // 显示过滤信息
        if (resultList.length === 0) {
          ElMessage.warning(`未找到与"${filters.username.trim()}"匹配的记录`);
        } else {
          ElMessage.success(`找到${resultList.length}条匹配的记录`);
        }
      }
      
      // 更新表格和分页数据
      tableData.value = resultList;
      pagination.total = res.total || resultList.length;
    })
    .catch((error) => {
      console.error('获取日志数据失败:', error)
      ElMessage.error('获取日志数据失败')
      tableData.value = []
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
  
  // 如果当前筛选了用户条件，也加到详情查询中
  const userInput = filters.username.trim();
  if (userInput) {
    // 检查输入是否为纯数字（用户ID）
    if (/^\d+$/.test(userInput)) {
      params.userId = parseInt(userInput);
    } else {
      // 输入是字符串，作为用户名查询
      params.username = userInput;
    }
  }
  
  // 还要包含当前行的用户ID，确保只查询该用户的记录
  if (row.userId) {
    params.userId = row.userId;
  }
  
  console.log('查询详情参数:', params) // 添加日志，便于调试
  
  detailData.value = []
  detailVisible.value = true
  fetchAuditGroupDetails(params)
    .then(res => {
      if (res.list) {
        detailData.value = res.list
      } else if (res.data && res.data.list) {
        detailData.value = res.data.list
      } else {
        detailData.value = []
        ElMessage.warning('没有找到详细记录')
      }
    })
    .catch((error) => {
      console.error('获取操作详情失败:', error)
      detailData.value = []
      ElMessage.error('获取操作详情失败')
    })
}

function handleExport() {
  const params = {
    module: filters.module,
    startTime: filters.timeRange?.[0] || '',
    endTime: filters.timeRange?.[1] || '',
    page: pagination.page,
    size: pagination.size
  }
  
  // 正确处理用户名/用户ID
  const userInput = filters.username.trim();
  if (userInput) {
    // 检查输入是否为纯数字（用户ID）
    if (/^\d+$/.test(userInput)) {
      params.userId = parseInt(userInput);
    } else {
      // 输入是字符串，作为用户名查询
      params.username = userInput;
    }
  }
  
  console.log('导出参数:', params) // 添加日志，便于调试
  
  // 注意：导出功能可能也存在相同问题，但由于直接导出为Excel文件，
  // 前端很难进行筛选，因此建议修复后端API
  ElMessage.info('正在导出数据，如果结果不准确，请联系开发人员修复后端API')
  
  exportAuditReport(params)
    .then(res => {
      const blob = new Blob([res], { type: 'application/vnd.ms-excel' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      // 添加用户名到文件名
      const username = filters.username.trim() ? `-${filters.username.trim()}` : '';
      link.download = `操作日志报表${username}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)
      ElMessage.success('导出成功，请检查数据是否符合筛选条件')
    })
    .catch((error) => {
      console.error('导出失败:', error)
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
  moduleOptions.value = ['成绩管理', '知识库', '考试', '作业', '用户','实验管理','课程管理','学习分析','成绩管理']
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
  // 统计每个模块出现的条数
  const moduleCountMap = new Map();
  tableData.value.forEach(item => {
    if (!item.module) return;
    moduleCountMap.set(item.module, (moduleCountMap.get(item.module) || 0) + 1);
  });
  return Array.from(moduleCountMap.entries()).map(([module, count]) => ({ module, count }));
})

// 添加分组数据计算属性
const groupedTableData = computed(() => {
  // 按用户名分组
  const groups = {};
  tableData.value.forEach(item => {
    // 如果用户名为空，使用 "未知用户" 作为键
    const username = item.username || '未知用户';
    
    if (!groups[username]) {
      groups[username] = [];
    }
    groups[username].push(item);
  });
  
  // 转换为表格需要的格式
  return Object.entries(groups).map(([username, items]) => ({
    username,
    userId: items[0].userId, // 保留第一条记录的userId
    isGroup: true, // 标记为分组行
    children: items, // 子项
    count: items.reduce((sum, item) => sum + (item.count || 0), 0), // 计算总操作次数
    successCount: items.reduce((sum, item) => sum + (item.successCount || 0), 0), // 成功次数
    failedCount: items.reduce((sum, item) => sum + (item.failedCount || 0), 0), // 失败次数
    operationCount: items.length, // 操作类型数量
    moduleSet: new Set(items.map(item => item.module).filter(Boolean)), // 用于计算涉及的模块数量
    lastOperationTime: items.reduce((latest, item) => {
      // 找出最近的操作时间
      if (!latest) return item.lastOperationTime;
      return item.lastOperationTime > latest ? item.lastOperationTime : latest;
    }, null)
  }));
});
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
.username-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.username-text {
  font-weight: 600;
  font-size: 16px;
}
.nested-table {
  margin: 10px;
}
.el-table__expanded-cell {
  padding: 15px !important;
  background-color: #f9fafc !important;
}
</style> 