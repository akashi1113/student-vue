<template>
  <div class="score-manage">
    <div class="header">
      <h1>成绩管理</h1>
      <p>查看和分析学生的考试成绩及学习记录</p>
    </div>

    <!-- 查询条件 -->
    <div class="query-panel">
      <div class="query-row">
        <div class="query-item">
          <label>用户ID：</label>
          <input 
            v-model="userId" 
            placeholder="请输入用户ID" 
            @keyup.enter="handleQuery"
          />
        </div>
        <div class="query-item">
          <label>开始日期：</label>
          <input 
            v-model="startDate" 
            type="datetime-local"
          />
        </div>
        <div class="query-item">
          <label>结束日期：</label>
          <input 
            v-model="endDate" 
            type="datetime-local"
          />
        </div>
        <div class="query-item">
          <button @click="handleQuery" :disabled="!userId || loading" class="query-btn">
            {{ loading ? '查询中...' : '查询' }}
          </button>
          <button @click="handleReset" class="reset-btn">重置</button>
        </div>
      </div>
    </div>

    <!-- 数据展示区域 -->
    <div v-if="userId && hasData" class="content-area">
      <!-- 只保留考试记录 -->
      <div class="records-section">
        <div class="section-header">
          <h2>考试记录</h2>
          <div class="record-stats" v-if="examRecords">
            共 {{ examRecords.total || 0 }} 条记录
          </div>
        </div>
        <div v-if="examLoading" class="loading">加载考试记录中...</div>
        <div v-else-if="examRecords && examRecords.records && examRecords.records.length" class="records-table">
          <table>
            <thead>
              <tr>
                <th>考试名称</th>
                <th>分数</th>
                <th>考试时间</th>
                <th>考试状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in examRecords.records" :key="item.id">
                <td>{{ item.examTitle || '未知考试' }}</td>
                <td>
                  <span class="score" :class="getScoreClass(item.score)">
                    {{ item.score || 0 }}分
                  </span>
                </td>
                <td>{{ item.startTime ? item.startTime.replace('T', ' ') : '无' }}</td>
                <td>
                  <span class="status" :class="item.status">
                    {{ item.statusText || '未知' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="pagination">
            <button 
              :disabled="examPageNum === 1" 
              @click="examPageNum--; fetchExamRecords()"
              class="page-btn"
            >
              上一页
            </button>
            <span class="page-info">第 {{ examPageNum }} 页，共 {{ examRecords.pages || 1 }} 页</span>
            <button 
              :disabled="!examRecords.hasNextPage" 
              @click="examPageNum++; fetchExamRecords()"
              class="page-btn"
            >
              下一页
            </button>
          </div>
        </div>
        <div v-else class="no-data">暂无考试记录</div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="userId && !loading && !hasData" class="empty-state">
      <div class="empty-icon">📊</div>
      <h3>暂无数据</h3>
      <p>请检查用户ID是否正确，或者该用户暂无相关记录</p>
    </div>

    <!-- 初始状态 -->
    <div v-else-if="!userId" class="initial-state">
      <div class="initial-icon">🎯</div>
      <h3>欢迎使用成绩管理系统</h3>
      <p>请输入用户ID开始查询成绩和学习记录</p>
    </div>
  </div>
</template>

<script>
import {
  getUserExamRecords,
  getUserStudyRecords,
  getUserAnalysis,
  getChartData
} from '../../api/gradeAnalysis'

export default {
  name: 'ScoreManage',
  data() {
    return {
      userId: '',
      startDate: '',
      endDate: '',
      loading: false,
      examLoading: false,
      studyLoading: false,
      chartLoading: false,
      
      // 分页参数
      examPageNum: 1,
      examPageSize: 10,
      studyPageNum: 1,
      studyPageSize: 10,
      
      // 数据
      examRecords: null,
      studyRecords: null,
      analysis: null,
      chartType: 'radar',
      chartData: null,
      
      hasData: false,
      totalStudyTime: 0,
    }
  },
  computed: {
    averageScore() {
      if (!this.examRecords || !this.examRecords.records || this.examRecords.records.length === 0) {
        return 0
      }
      const total = this.examRecords.records.reduce((sum, item) => sum + (item.score || 0), 0)
      return (total / this.examRecords.records.length).toFixed(1)
    }
  },
  methods: {
    async handleQuery() {
      if (!this.userId.trim()) {
        alert('请输入用户ID')
        return
      }
      
      this.loading = true
      this.hasData = false
      this.resetPages()
      
      try {
        await Promise.all([
          this.fetchExamRecords(),
          this.fetchStudyRecords(),
          this.fetchAnalysis(),
          this.fetchChartData()
        ])
        this.hasData = true
      } catch (error) {
        console.error('查询失败:', error)
        alert('查询失败，请检查网络连接或联系管理员')
      } finally {
        this.loading = false
      }
    },
    
    handleReset() {
      this.userId = ''
      this.startDate = ''
      this.endDate = ''
      this.resetData()
      this.resetPages()
    },
    
    resetPages() {
      this.examPageNum = 1
      this.studyPageNum = 1
    },
    
    resetData() {
      this.examRecords = null
      this.studyRecords = null
      this.analysis = null
      this.chartData = null
      this.hasData = false
    },
    
    getQueryParams() {
      const params = {
        pageSize: this.examPageSize
      }
      if (this.startDate) params.startDate = this.startDate.replace('T', ' ') + ':00'
      if (this.endDate) params.endDate = this.endDate.replace('T', ' ') + ':00'
      return params
    },
    
    async fetchExamRecords() {
      if (!this.userId) return
      try {
        const res = await getUserExamRecords(this.userId, {
          pageNum: this.examPageNum,
          pageSize: this.examPageSize
        })
        console.log('考试记录返回数据:', res)
        if (res.code === 200) {
          this.examRecords = res.data
        } else {
          this.examRecords = null
          alert('获取考试记录失败')
        }
      } catch (e) {
        console.error('获取考试记录失败:', e)
        alert('获取考试记录失败')
      }
    },
    
    async fetchStudyRecords() {
      if (!this.userId) return
      try {
        const res = await getUserStudyRecords(this.userId, {
          pageNum: this.studyPageNum,
          pageSize: this.studyPageSize
        })
        console.log('学习记录返回数据:', res)
        if (res.code === 200) {
          this.studyRecords = res.data
          // 统计总学习时长
          this.totalStudyTime = res.data.records.reduce((sum, item) => sum + (item.duration || 0), 0)
        } else {
          this.studyRecords = null
          this.totalStudyTime = 0
          alert('获取学习记录失败')
        }
      } catch (e) {
        console.error('获取学习记录失败:', e)
        this.totalStudyTime = 0
        alert('获取学习记录失败')
      }
    },
    
    async fetchAnalysis() {
      if (!this.userId) return
      
      try {
        const params = {}
        if (this.startDate) params.startDate = this.startDate.replace('T', ' ') + ':00'
        if (this.endDate) params.endDate = this.endDate.replace('T', ' ') + ':00'
        
        const res = await getUserAnalysis(this.userId, params)
        if (res.code === 200) {
          this.analysis = res.data
        }
      } catch (error) {
        console.error('获取综合分析失败:', error)
      }
    },
    
    async fetchChartData() {
      if (!this.userId) return
      
      this.chartLoading = true
      try {
        const params = { type: this.chartType }
        if (this.startDate) params.startDate = this.startDate.replace('T', ' ') + ':00'
        if (this.endDate) params.endDate = this.endDate.replace('T', ' ') + ':00'
        
        const res = await getChartData(this.userId, params)
        if (res.code === 200) {
          this.chartData = res.data
        }
      } catch (error) {
        console.error('获取图表数据失败:', error)
      } finally {
        this.chartLoading = false
      }
    },
    
    getChartTitle() {
      const titles = {
        radar: '能力雷达图',
        bar: '成绩柱状图',
        line: '成绩折线图',
        pie: '成绩分布饼图',
        'score-trend': '成绩趋势图'
      }
      return titles[this.chartType] || '数据图表'
    },
    
    getScoreClass(score) {
      if (score >= 90) return 'excellent'
      if (score >= 80) return 'good'
      if (score >= 60) return 'average'
      return 'poor'
    },
    
    getStatusText(status) {
      const statusMap = {
        completed: '已完成',
        in_progress: '进行中',
        not_started: '未开始'
      }
      return statusMap[status] || '未知'
    },
    
    formatDate(dateStr) {
      if (!dateStr) return '无'
      const date = new Date(dateStr)
      return date.toLocaleString('zh-CN')
    }
  }
}
</script>

<style scoped>
.score-manage {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 30px;
  text-align: center;
}

.header h1 {
  color: #333;
  margin-bottom: 10px;
}

.header p {
  color: #666;
  font-size: 14px;
}

.query-panel {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.query-row {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.query-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.query-item label {
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}

.query-item input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.query-btn, .reset-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.query-btn {
  background: #409eff;
  color: white;
}

.query-btn:hover:not(:disabled) {
  background: #66b1ff;
}

.query-btn:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
}

.reset-btn {
  background: #f56c6c;
  color: white;
}

.reset-btn:hover {
  background: #f78989;
}

.analysis-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
}

.card h3 {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 14px;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.chart-section, .records-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.section-header h2 {
  margin: 0;
  color: #333;
}

.chart-selector {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.chart-container {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  text-align: center;
  width: 100%;
}

.chart-json {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  text-align: left;
  font-size: 12px;
  max-height: 300px;
  overflow-y: auto;
  margin: 15px 0;
}

.chart-tip {
  color: #409eff;
  font-size: 14px;
  margin-top: 10px;
}

.records-table {
  overflow-x: auto;
}

.records-table table {
  width: 100%;
  border-collapse: collapse;
}

.records-table th,
.records-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.records-table th {
  background: #f8f9fa;
  font-weight: 500;
  color: #333;
}

.score {
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.score.excellent {
  background: #f0f9ff;
  color: #1890ff;
}

.score.good {
  background: #f6ffed;
  color: #52c41a;
}

.score.average {
  background: #fff7e6;
  color: #fa8c16;
}

.score.poor {
  background: #fff2f0;
  color: #ff4d4f;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.progress-bar {
  position: relative;
  height: 20px;
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #66b1ff);
  transition: width 0.3s;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  color: #333;
  font-weight: 500;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
}

.page-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  border-color: #409eff;
  color: #409eff;
}

.page-btn:disabled {
  background: #f5f5f5;
  color: #c0c4cc;
  cursor: not-allowed;
}

.page-info {
  color: #666;
  font-size: 14px;
}

.loading {
  text-align: center;
  color: #666;
  padding: 40px;
}

.no-data, .no-chart {
  text-align: center;
  color: #999;
  padding: 40px;
}

.empty-state, .initial-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon, .initial-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.empty-state h3, .initial-state h3 {
  color: #333;
  margin-bottom: 10px;
}

.empty-state p, .initial-state p {
  color: #666;
}

.record-stats {
  color: #666;
  font-size: 14px;
}
</style>