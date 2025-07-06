<template>
  <div class="filter-panel">
    <el-card>
      <template #header>
        <div class="filter-header">
          <span>筛选条件</span>
          <div class="filter-actions">
            <el-button size="small" @click="resetFilters">重置</el-button>
            <el-button type="primary" size="small" @click="applyFilters" :loading="loading">
              <i class="el-icon-refresh"></i>
              刷新数据
            </el-button>
          </div>
        </div>
      </template>
      
      <el-form :model="filterForm" label-width="80px" size="small">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="时间范围">
              <div class="time-range-container">
                <el-select v-model="filterForm.timePeriod" @change="updateDateRange" style="width: 100%; margin-bottom: 8px;">
                  <el-option label="全部时间" value="all" />
                  <el-option label="近一周" value="week" />
                  <el-option label="近一月" value="month" />
                  <el-option label="近三个月" value="quarter" />
                  <el-option label="自定义" value="custom" />
                </el-select>
                <div v-if="filterForm.timePeriod === 'custom'" class="custom-date-inputs">
                  <el-input
                    v-model="filterForm.startDate"
                    type="datetime-local"
                    placeholder="开始日期"
                    style="margin-bottom: 8px;"
                  />
                  <el-input
                    v-model="filterForm.endDate"
                    type="datetime-local"
                    placeholder="结束日期"
                  />
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { getExamList } from '../../api/exam.js'

export default {
  name: 'FilterPanel',
  props: {
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      filterForm: {
        timePeriod: 'all',
        startDate: '',
        endDate: ''
      },
      studentOptions: [
        // 已删除学生筛选
      ]
    }
  },
  mounted() {
    // 恢复本地筛选条件
    const saved = localStorage.getItem('analytics_filter_form')
    if (saved) {
      try {
        this.filterForm = JSON.parse(saved)
      } catch (e) {}
    }
    this.updateDateRange()
  },
  methods: {
    updateDateRange() {
      const now = new Date()
      const end = now.toISOString().slice(0, 16)
      let start = new Date()
      
      switch (this.filterForm.timePeriod) {
        case 'all':
          // 全部时间：设置为很早的日期到现在
          start = new Date('2020-01-01')
          break
        case 'week':
          start.setDate(now.getDate() - 7)
          break
        case 'month':
          start.setMonth(now.getMonth() - 1)
          break
        case 'quarter':
          start.setMonth(now.getMonth() - 3)
          break
        default:
          return
      }
      
      this.filterForm.startDate = start.toISOString().slice(0, 16)
      this.filterForm.endDate = end
      
      console.log('更新时间范围:', this.filterForm.startDate, '到', this.filterForm.endDate)
    },
    
    resetFilters() {
      this.filterForm = {
        timePeriod: 'all',
        startDate: '',
        endDate: ''
      }
      this.updateDateRange()
      // 保存到localStorage
      localStorage.setItem('analytics_filter_form', JSON.stringify(this.filterForm))
      this.$emit('filter-change', this.getFilterData())
    },
    
    applyFilters() {
      // 保存到localStorage
      localStorage.setItem('analytics_filter_form', JSON.stringify(this.filterForm))
      this.$emit('filter-change', this.getFilterData())
    },
    
    getFilterData() {
      let startTime = this.filterForm.startDate
      let endTime = this.filterForm.endDate
      
      // 根据接口文档，统一使用空格分隔格式
      const timeData = {
        startTime: startTime ? startTime.replace('T', ' ') + ':00' : null,
        endTime: endTime ? endTime.replace('T', ' ') + ':00' : null
      }
      
      console.log('发送的筛选数据:', {
        ...timeData,
        courseIds: this.filterForm.courseIds,
        studentIds: this.filterForm.studentIds,
        timeGranularity: this.filterForm.timeGranularity
      })
      
      return {
        ...timeData,
        courseIds: this.filterForm.courseIds,
        studentIds: this.filterForm.studentIds,
        timeGranularity: this.filterForm.timeGranularity
      }
    }
  }
}
</script>

<style scoped>
.filter-panel {
  margin-bottom: 20px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-actions {
  display: flex;
  gap: 8px;
}

.el-form-item {
  margin-bottom: 16px;
}

.time-range-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.custom-date-inputs {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style> 