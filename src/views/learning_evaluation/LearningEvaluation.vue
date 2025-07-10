<template>
  <div class="learning-evaluation">
    <div class="header">
      <h1>我的学习效果评价</h1>
      <p>全面分析您的学习效果、进度和能力发展</p>
    </div>

    <!-- 查询条件 -->
    <div class="query-panel">
      <div class="query-row">
        <div class="query-item">
          <label>评价周期：</label>
          <select v-model="timePeriod" @change="updateDateRange">
            <option value="all">全部时间</option>
            <option value="week">近一周</option>
            <option value="month">近一月</option>
            <option value="quarter">近三个月</option>
            <option value="custom">自定义</option>
          </select>
        </div>
        <div class="query-item" v-if="timePeriod === 'custom'">
          <label>开始日期：</label>
          <input v-model="startDate" type="datetime-local" />
        </div>
        <div class="query-item" v-if="timePeriod === 'custom'">
          <label>结束日期：</label>
          <input v-model="endDate" type="datetime-local" />
        </div>
        <div class="query-item">
          <button @click="handleQuery" :disabled="loading" class="query-btn">
            {{ loading ? '分析中...' : '开始评价' }}
          </button>
          <button @click="handleReset" class="reset-btn">重置</button>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div v-if="hasData" class="content-area">
      <!-- 卡片区域 -->
      <div class="analysis-cards">
        <div class="card">
          <h3>平均分数</h3>
          <div class="card-value">{{ averageScore }}</div>
        </div>
        <div class="card">
          <h3>学习时长</h3>
          <div class="card-value">{{ (totalStudyTime / 3600).toFixed(1) }}h</div>
        </div>
        <div class="card">
          <h3>考试通过率</h3>
          <div class="card-value">{{ examPassRate }}%</div>
        </div>
      </div>
      <!-- 学习记录表格 -->
      <div class="records-section">
        <div class="section-header">
          <h2>学习记录</h2>
          <div class="record-stats" v-if="studyRecordsTable">
            共 {{ studyRecordsTable.total || 0 }} 条记录
          </div>
        </div>
        <div v-if="studyLoading" class="loading">加载学习记录中...</div>
        <div v-else-if="studyRecordsTable && studyRecordsTable.records && studyRecordsTable.records.length" class="records-table">
          <table>
            <thead>
              <tr>
                <th>课程名称</th>
                <th>视频名称</th>
                <th>学习进度</th>
                <th>学习时长</th>
                <th>最后学习时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in studyRecordsTable.records" :key="item.id || index">
                <td>{{ item.courseTitle || '未知课程' }}</td>
                <td>{{ item.videoTitle || '未知视频' }}</td>
                <td>
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: calculateProgress(item) + '%' }"></div>
                    <span class="progress-text">{{ calculateProgress(item) + '%' }}</span>
                  </div>
                </td>
                <td>
                  {{ item.progress ? Math.round(item.progress / 60) : 0 }} 分钟
                </td>
                <td>{{ formatDate(item.lastStudyTime) }}</td>
              </tr>
            </tbody>
          </table>
          <div class="pagination">
            <button 
              :disabled="studyPageNum === 1" 
              @click="studyPageNum--; fetchStudyRecordsTable()"
              class="page-btn"
            >
              上一页
            </button>
            <span class="page-info">第 {{ studyPageNum }} 页，共 {{ studyRecordsTable.pages || 1 }} 页</span>
            <button 
              :disabled="!studyRecordsTable.hasNextPage" 
              @click="studyPageNum++; fetchStudyRecordsTable()"
              class="page-btn"
            >
              下一页
            </button>
          </div>
        </div>
        <div v-else class="no-data">暂无学习记录</div>
      </div>
      <!-- 新增：成绩单模块 -->
      <div class="records-section">
        <div class="section-header">
          <h2>成绩单</h2>
          <div class="record-stats" v-if="examRecordsTable">
            共 {{ examRecordsTable.total || 0 }} 条记录
          </div>
        </div>
        <div v-if="examLoading" class="loading">加载成绩单中...</div>
        <div v-else-if="examRecordsTable && examRecordsTable.records && examRecordsTable.records.length" class="records-table">
          <table>
            <thead>
              <tr>
                <th>考试名称</th>
                <th>第几次考试</th>
                <th>分数</th>
                <th>考试时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in examRecordsTable.records" :key="item.id">
                <td>{{ item.examTitle || '未知考试' }}</td>
                <td>{{ item.attemptNumber || item.attempt_number || 1 }}</td>
                <td>
                  <span class="score" :class="getScoreClass(item.score)">
                    {{ item.score || 0 }}分
                  </span>
                </td>
                <td>{{ item.startTime ? formatDate(item.startTime) : '无' }}</td>
              </tr>
            </tbody>
          </table>
          <div class="pagination">
            <button 
              :disabled="examPageNum === 1" 
              @click="examPageNum--; fetchExamRecordsTable()"
              class="page-btn"
            >
              上一页
            </button>
            <span class="page-info">第 {{ examPageNum }} 页，共 {{ examRecordsTable.pages || 1 }} 页</span>
            <button 
              :disabled="examPageNum >= (examRecordsTable.pages || 1)" 
              @click="examPageNum++; fetchExamRecordsTable()"
              class="page-btn"
            >
              下一页
            </button>
          </div>
        </div>
        <div v-else class="no-data">暂无成绩记录</div>
      </div>
      <!-- 数据可视化区域 -->
      <div class="chart-section">
        <div class="section-header">
          <h2>数据可视化</h2>
          <select v-model="chartType" @change="handleChartTypeChange" class="chart-selector">
            <option value="radar">雷达图</option>
            <option value="bar">柱状图</option>
            <option value="line">折线图</option>
            <option value="score-trend">成绩趋势</option>
          </select>
        </div>
        <div class="chart-container">
          <div v-if="chartLoading" class="loading">加载图表中...</div>
          <div v-else class="chart-wrapper">
            <div ref="chartDom" class="chart-dom"></div>
          </div>
        </div>
      </div>
      <!-- 学习时间分布 -->
      <div class="progress-section">
        <h2> 学习时间分布</h2>
        <div class="time-distribution-container">
          <div class="time-card morning">
            <div class="time-icon">🌅</div>
            <div class="time-info">
              <h3>上午</h3>
              <div class="time-value">{{ getTimeDistribution('morning') }}小时</div>
              <div class="time-percentage">{{ getTimePercentage('morning') }}%</div>
            </div>
          </div>
          <div class="time-card afternoon">
            <div class="time-icon">☀️</div>
            <div class="time-info">
              <h3>下午</h3>
              <div class="time-value">{{ getTimeDistribution('afternoon') }}小时</div>
              <div class="time-percentage">{{ getTimePercentage('afternoon') }}%</div>
            </div>
          </div>
          <div class="time-card evening">
            <div class="time-icon">🌙</div>
            <div class="time-info">
              <h3>晚上</h3>
              <div class="time-value">{{ getTimeDistribution('evening') }}小时</div>
              <div class="time-percentage">{{ getTimePercentage('evening') }}%</div>
            </div>
          </div>
        </div>
        
          </div>

      <!-- AI学习建议 -->
      <div class="suggestion-section">
        <div class="section-header">
          <h2> AI学习建议</h2>
          <button @click="generateSuggestions" :disabled="!hasData" class="refresh-btn">
            刷新建议
          </button>
            </div>
        <div v-if="suggestions && suggestions.length" class="suggestions">
          <div v-for="(suggestion, index) in suggestions" :key="index" class="suggestion-item">
            <div class="suggestion-icon">{{ getSuggestionIcon(suggestion.type) }}</div>
            <div class="suggestion-content">
              <h4>{{ suggestion.title }}</h4>
              <p>{{ suggestion.content }}</p>
            </div>
              <div class="suggestion-priority" :class="suggestion.priority">
                {{ getPriorityText(suggestion.priority) }}
              </div>
            </div>
          </div>
        <div v-else class="no-data">
          <p>暂无AI学习建议，请先分析学习数据</p>
        </div>
      </div>

      <!-- 导出学习报告 -->
      <div class="report-section">
        <div class="section-header">
          <h2> 学习报告</h2>
          <button @click="generateReport" :disabled="!hasData" class="export-btn">
            导出PDF报告
          </button>
        </div>
        <div class="report-info">
          <p>基于您的学习数据生成详细的学习效果分析报告，包含成绩分析、学习建议等内容。</p>
      </div>
    </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!loading && !hasData" class="empty-state">
      <div class="empty-icon"></div>
      <h3>暂无数据</h3>
      <p>您暂无相关学习记录，请先开始学习</p>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="loading-state">
      <div class="loading-icon"></div>
      <h3>加载中...</h3>
      <p>正在获取您的学习效果数据</p>
    </div>
  </div>
  <DogAssistant />
</template>

<script>
import * as echarts from 'echarts'
import {
  getMyExamRecords,
  getMyStudyRecords,
  getMyAnalysis,
  getMyChartData
} from '../../api/gradeAnalysis'
import { isAuthenticated, getUserId } from '../../utils/auth'
import { getAILearningSuggestions } from '../../api/aiSuggestions'
import jsPDF from 'jspdf'
import request from '../../utils/request'
import DogAssistant from '@/components/DogAssistant.vue'

export default {
  name: 'LearningEvaluation',
  components: { DogAssistant },
  data() {
    return {
      timePeriod: 'all',
      startDate: '',
      endDate: '',
      loading: false,
      radarLoading: false,
      
      // 图表实例
      chartInstance: null,
      radarInstance: null,
      
      // 数据
      evaluation: null,
      radarData: null,
      studyProgress: null,
      examAnalysis: null,
      suggestions: null,
      
      hasData: false,
      studyRecordsTable: null,
      studyLoading: false,
      studyPageNum: 1,
      studyPageSize: 20, // 修改为每页20条
      chartType: 'radar',
      chartData: null,
      chartLoading: false,
      totalStudyTime: 0,
      completedCourses: 0,
      examPassRate: 0,
      examRecordsTable: null,
      examLoading: false,
      examPageNum: 1,
      examPageSize: 10
    }
  },
  computed: {
    averageScore() {
      if (!this.examRecordsTable || !this.examRecordsTable.records || this.examRecordsTable.records.length === 0) {
        return 0
      }
      const total = this.examRecordsTable.records.reduce((sum, item) => sum + (item.score || 0), 0)
      return (total / this.examRecordsTable.records.length).toFixed(1)
    }
  },
  methods: {
    // 柱状图配置
    getBarOption() {
      const data = this.examRecordsTable && this.examRecordsTable.records
        ? this.examRecordsTable.records
        : []
      const scores = data.map(item => item.score || 0)
      const categories = data.map(item => {
        const title = item.examTitle || '未知考试'
        const attempt = item.attemptNumber || item.attempt_number || 1
        return `${title}-第${attempt}次`
      })

      return {
        title: {
          text: '考试成绩柱状图',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: categories,
          axisLabel: {
            formatter: function(value) {
              // 将'-'后内容换行
              return value.replace(/-(第\d+次)/, '\n$1')
            },
            interval: 0, // 强制显示所有标签
            fontSize: 10 // 字体调小
          }
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 100
        },
        series: [{
          name: '成绩',
          type: 'bar',
          data: scores,
          itemStyle: { color: '#409eff' },
          barStyle: { color: '#409eff' },
          lineStyle: { color: '#409eff' },
          areaStyle: { color: '#66b1ff' },
          emphasis: { itemStyle: { color: '#66b1ff' } },
        }]
      }
    },
    
    // 折线图配置
    getLineOption() {
      const data = this.examRecordsTable && this.examRecordsTable.records
        ? this.examRecordsTable.records
        : []
      // 按考试名称分组并排序
      const sorted = [...data].sort((a, b) => {
        if (a.examTitle === b.examTitle) {
          const aNum = a.attemptNumber || a.attempt_number || 1
          const bNum = b.attemptNumber || b.attempt_number || 1
          return aNum - bNum
        }
        return (a.examTitle || '').localeCompare(b.examTitle || '')
      })
      const scores = sorted.map(item => item.score || 0)
      const categories = sorted.map(item => {
        const title = item.examTitle || '未知考试'
        const attempt = item.attemptNumber || item.attempt_number || 1
        return `${title}-第${attempt}次`
      })

      return {
        title: {
          text: '考试成绩折线图',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: categories,
          axisLabel: {
            formatter: function(value) {
              return value.replace(/-(第\d+次)/, '\n$1')
            },
            interval: 0,
            fontSize: 10
          }
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 100
        },
        series: [{
          name: '成绩',
          type: 'line',
          data: scores,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { color: '#409eff', width: 3 },
          itemStyle: { color: '#409eff' },
          areaStyle: { color: '#66b1ff' },
        }]
      }
    },
    
    // 成绩趋势图配置
    getTrendOption() {
      const data = this.examRecordsTable && this.examRecordsTable.records
        ? this.examRecordsTable.records
        : []
      // 按考试名称分组并排序
      const sorted = [...data].sort((a, b) => {
        if (a.examTitle === b.examTitle) {
          const aNum = a.attemptNumber || a.attempt_number || 1
          const bNum = b.attemptNumber || b.attempt_number || 1
          return aNum - bNum
        }
        return (a.examTitle || '').localeCompare(b.examTitle || '')
      })
      const scores = sorted.map(item => item.score || 0)
      const categories = sorted.map(item => {
        const title = item.examTitle || '未知考试'
        const attempt = item.attemptNumber || item.attempt_number || 1
        return `${title}-第${attempt}次`
      })

      const avgLine = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

      return {
        title: {
          text: '成绩趋势图',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['成绩', '平均分'],
          top: 30
        },
        xAxis: {
          type: 'category',
          data: categories,
          axisLabel: {
            formatter: function(value) {
              return value.replace(/-(第\d+次)/, '\n$1')
            },
            interval: 0,
            fontSize: 10
          }
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 100
        },
        series: [
          {
            name: '成绩',
            type: 'line',
            data: scores,
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
            lineStyle: { color: '#409eff', width: 3 },
            itemStyle: { color: '#409eff' },
          },
          {
            name: '平均分',
            type: 'line',
            data: new Array(scores.length).fill(avgLine),
            lineStyle: { color: '#66b1ff', type: 'dashed', width: 2 },
            itemStyle: { color: '#66b1ff' },
            tooltip: {
              show: false
            }
          }
        ]
      }
    },
    
    // 雷达图配置
    getRadarOption() {
      // 使用后端返回的指标名称，如果没有则使用默认值
      const indicators = this.chartData && this.chartData.indicators 
        ? this.chartData.indicators.map(name => ({ name, max: 100 }))
        : [
            { name: '考试成绩', max: 100 },
            { name: '通过率', max: 100 },
            { name: '完成率', max: 100 },
            { name: '学习时长', max: 100 },
            { name: '学习效率', max: 100 }
          ]
      
      // 使用后端返回的数据，如果没有则使用处理后的数据
      const data = this.chartData && this.chartData.values 
        ? this.chartData.values 
        : this.processRadarData()
      
      return {
        title: {
          text: '综合能力雷达图',
          left: 'center'
        },
        radar: {
          indicator: indicators
        },
        series: [{
          type: 'radar',
          data: [{
            value: data,
            name: '能力评分',
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(64,158,255,0.4)' },
                { offset: 0.5, color: 'rgba(64,158,255,0.25)' },
                { offset: 1, color: 'rgba(102,177,255,0.15)' }
              ])
            },
            lineStyle: { color: '#409eff', width: 2 },
            itemStyle: { color: '#409eff', borderColor: '#fff', borderWidth: 2 },
          }],
        }]
      }
    },
    
    getMasteryScore(mastery) {
      const scores = {
        excellent: 90,
        good: 75,
        average: 60,
        poor: 40
      }
      return scores[mastery] || 50
    },

    async handleQuery() {
      this.loading = true
      this.hasData = false
      this.resetPages()
      try {
        // 并行执行所有API调用，但不等待所有都成功
        const promises = [
          this.fetchExamRecordsTable().catch(e => console.error('获取考试记录失败:', e)),
          this.fetchStudyRecordsTable().catch(e => console.error('获取学习记录失败:', e)),
          this.fetchAnalysis().catch(e => console.error('获取分析数据失败:', e)),
          this.fetchChartData().catch(e => console.error('获取图表数据失败:', e))
        ]
        
        await Promise.allSettled(promises)
        
        // 只要有任一数据加载成功，就显示内容区域
        this.hasData = !!(this.examRecordsTable || this.studyRecordsTable || this.evaluation || this.chartData)
        
        console.log('数据加载状态:', {
          hasExamData: !!this.examRecordsTable,
          hasStudyData: !!this.studyRecordsTable,
          hasAnalysisData: !!this.evaluation,
          hasChartData: !!this.chartData,
          hasData: this.hasData
        })
        
        if (this.hasData) {
          // 生成AI学习建议
          await this.generateSuggestions().catch(e => console.error('生成AI建议失败:', e))
          // 初始化图表
          this.$nextTick(() => {
              this.initChart()
          })
        }
      } catch (error) {
        console.error('查询失败:', error)
        this.handleApiError(error)
      } finally {
        this.loading = false
      }
    },
    
    handleReset() {
      this.timePeriod = 'month'
      this.startDate = ''
      this.endDate = ''
      this.resetData()
      this.updateDateRange()
      this.destroyCharts()
    },
    
    resetData() {
      this.evaluation = null
      this.radarData = null
      this.studyProgress = null
      this.examAnalysis = null
      this.suggestions = null
      this.hasData = false
    },
    
    destroyCharts() {
      if (this.chartInstance) {
        this.chartInstance.dispose()
        this.chartInstance = null
      }
      if (this.radarInstance) {
        this.radarInstance.dispose()
        this.radarInstance = null
      }
    },
    
    updateDateRange() {
      const now = new Date()
      const end = now.toISOString().slice(0, 16)
      let start = new Date()
      
      switch (this.timePeriod) {
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
      
      this.startDate = start.toISOString().slice(0, 16)
      this.endDate = end
    },
    
    getQueryParams() {
      const params = {}
      if (this.startDate) params.startDate = this.startDate.replace('T', ' ') + ':00'
      if (this.endDate) params.endDate = this.endDate.replace('T', ' ') + ':00'
      return params
    },
    
    async fetchAnalysis() {
      try {
        const params = {}
        if (this.startDate) params.startDate = this.startDate.replace('T', ' ') + ':00'
        if (this.endDate) params.endDate = this.endDate.replace('T', ' ') + ':00'
        const res = await getMyAnalysis(params)
      if (res.code === 200) {
          this.evaluation = res.data
          // 从后端数据中获取通过率
          this.examPassRate = res.data.passRate || res.data.examPassRate || 0
        }
      } catch (error) {
        this.$message.error('获取综合分析失败')
      }
    },
    
    async fetchRadarData() {
      this.radarLoading = true
      try {
        const res = await getMyChartData({
          type: 'radar',
          ...this.getQueryParams()
        })
        if (res.code === 200) {
          this.radarData = this.processRadarData()
        }
      } finally {
        this.radarLoading = false
      }
    },
    
    async fetchProgressData() {
      const res = await getMyStudyRecords({
        pageSize: 50,
        ...this.getQueryParams()
      })
      if (res.code === 200) {
        this.studyProgress = this.processProgressData(res.data)
      }
    },
    
    async fetchExamAnalysis() {
      const res = await getMyExamRecords({
        pageSize: 20,
        ...this.getQueryParams()
      })
      if (res.code === 200) {
        this.examAnalysis = this.processExamData(res.data)
      }
    },
    
    processEvaluationData(data) {
      const avgScore = data.avgScore || 0
      const totalExams = data.totalExams || 0
      const studyTime = data.totalStudyTime || 0
      
      // 计算完成课程数和通过率
      this.completedCourses = data.completedCourses || Math.floor(Math.random() * 10) + 5
      this.examPassRate = data.passRate || Math.floor(Math.random() * 30) + 70
      
      return {
        overallScore: Math.min(100, Math.round(avgScore * 0.6 + (totalExams * 2) + (studyTime * 0.5))),
        activityLevel: Math.min(100, Math.round(studyTime * 2 + totalExams * 5)),
        masteryRate: Math.min(100, Math.round(avgScore * 0.8 + 10)),
        efficiency: Math.min(100, Math.round(avgScore * 0.7 + 20)),
        activityTrend: 'up',
        masteryTrend: 'up',
        efficiencyTrend: 'stable'
      }
    },
    
    processRadarData() {
  // 1. 学习成效：考试成绩平均分
  let avgScore = 0
  if (this.examRecordsTable && this.examRecordsTable.records && this.examRecordsTable.records.length) {
    avgScore = (this.examRecordsTable.records || []).reduce((a, b) => a + (b.score || 0), 0) / ((this.examRecordsTable.records || []).length || 1)
  }

  // 2. 学习投入度：学习进度/标准时长（5小时）
  let totalStudyTime = this.totalStudyTime / 3600 // 单位小时
  const standardTime = 5
  let investScore = Math.min(100, Math.round((totalStudyTime / standardTime) * 100))

  // 3. 知识掌握度：考试成绩方差越小分越高
  let masteryScore = 0
  if (this.examRecordsTable && this.examRecordsTable.records && this.examRecordsTable.records.length) {
    const mean = avgScore
    const variance = (this.examRecordsTable.records || []).reduce((a, b) => a + Math.pow((b.score || 0) - mean, 2), 0) / ((this.examRecordsTable.records || []).length || 1)
    const std = Math.sqrt(variance)
    masteryScore = Math.max(0, 100 - std * 2)
  }

  // 4. 学习规律性：一周内学习天数/7
  let freqScore = 0
  if (this.studyRecordsTable && this.studyRecordsTable.records && this.studyRecordsTable.records.length) {
        const days = new Set((this.studyRecordsTable.records || []).map(item => {
          const studyTimeStr = item.last_study_time || item.lastStudyTime;
          if (!studyTimeStr) return '';
          try {
            return (new Date(studyTimeStr)).toDateString();
          } catch (error) {
            console.error('日期解析错误:', error);
            return '';
          }
        }).filter(day => day !== ''))
    freqScore = Math.min(100, Math.round((days.size / 7) * 100))
  }

  return [
    Math.round(avgScore),
    Math.round(masteryScore),
    investScore,
    investScore,
    freqScore
  ]
},
    
    processProgressData(data) {
      const courses = data.list ? data.list.slice(0, 5).map(item => ({
        id: item.id,
        name: item.courseName || '课程' + item.id,
        progress: Math.round(item.progress || Math.random() * 100)
      })) : []
      
      return {
          courses
          // Time distribution is now calculated directly from studyRecordsTable
      }
    },
    
    processExamData(data) {
      const recentScores = data.list ? 
        data.list.slice(0, 6).map(item => item.score || 0) : 
        Array.from({length: 6}, () => Math.round(Math.random() * 40 + 60))
      
      return {
        recentScores,
        knowledgePoints: [
          { id: 1, name: '基础概念', mastery: 'excellent' },
          { id: 2, name: '核心理论', mastery: 'good' },
          { id: 3, name: '实践应用', mastery: 'average' },
          { id: 4, name: '高级技能', mastery: 'poor' }
        ]
      }
    },
    
      async generateSuggestions() {
        try {
          // 准备学习数据用于AI分析 - 清理数据格式，移除不需要的字段
          
        // 1. 处理学习记录，只保留基本统计信息
        const studyRecordCount = this.studyRecordsTable?.records?.length || 0;
        const totalStudyDuration = this.totalStudyTime || 0;
        const completedVideos = this.studyRecordsTable?.records?.filter(r => r.completed === 1 || r.completed === true).length || 0;
          
        // 2. 处理考试记录，只保留基本统计信息
        const examRecordCount = this.examRecordsTable?.records?.length || 0;
        const passedExams = this.examRecordsTable?.records?.filter(r => r.isPassed === 1 || r.isPassed === true).length || 0;
          
                    // 根据后端控制器代码，需要包含userId字段
          const learningData = {
            // 必须添加userId字段，这是后端Request类需要的
          userId: Number(this.getCurrentUserId()), // 从认证信息获取当前用户ID
            timePeriod: this.timePeriod,
            averageScore: parseFloat(this.averageScore),
          totalStudyTime: totalStudyDuration,
            examPassRate: this.examPassRate,
          // 添加后端期望的字段
          studyRecords: this.studyRecordsTable?.records?.map(record => ({
            courseTitle: record.course_title || record.courseTitle || '',
            videoTitle: record.video_title || record.videoTitle || '',
            progressPercentage: this.calculateProgress(record),
            progress: record.progress || 0
          })) || [],
          examRecords: this.examRecordsTable?.records?.map(record => ({
            examTitle: record.examTitle || '未知考试',
            score: record.score || 0,
            attemptNumber: record.attemptNumber || record.attempt_number || 1
          })) || []
          };

          console.log('AI建议数据:', learningData);
          
          // 调用AI建议接口
          const response = await getAILearningSuggestions(learningData);
          
          if (response.code === 200) {
            this.suggestions = response.data;
          } else {
            console.log('AI建议API返回错误:', response);
            // 如果AI接口失败，使用备用规则
            this.generateFallbackSuggestions();
          }
        } catch (error) {
          console.error('获取AI建议失败:', error);
          // 使用备用规则
          this.generateFallbackSuggestions();
        }
      },
  
      generateFallbackSuggestions() {
      const suggestions = [];
        
      // 基于实际数据生成建议
      if (this.averageScore < 60) {
        suggestions.push({
          type: 'improve',
          title: '提高考试成绩',
          content: `当前平均分为${this.averageScore}分，建议加强基础知识复习，多做历年真题，争取平均分提升到及格线以上。`,
          priority: 'high'
        });
      }
      
      if (this.examPassRate < 50) {
        suggestions.push({
          type: 'improve',
          title: '提升考试通过率',
          content: `当前考试通过率为${this.examPassRate}%，建议在充分准备后再参加考试，提高通过率。`,
          priority: 'high'
        });
      }
      
      if (this.totalStudyTime < 3600) { // 少于1小时
        suggestions.push({
          type: 'improve',
          title: '增加学习时长',
          content: `当前学习时长为${(this.totalStudyTime / 60).toFixed(1)}分钟，建议每天保持至少1小时的学习时间。`,
          priority: 'medium'
        });
      }
        
        if (this.averageScore >= 80) {
        suggestions.push({
          type: 'maintain',
          title: '保持良好状态',
          content: '你的学习状态良好，请继续保持！',
          priority: 'low'
        });
      }
        
      if (suggestions.length === 0) {
        suggestions.push({
          type: 'maintain',
          title: '保持学习节奏',
          content: '建议保持现有的学习节奏，定期复习已学内容。',
          priority: 'medium'
        });
      }
        
      this.suggestions = suggestions;
    },
    
    async fetchChartData() {
      this.chartLoading = true
      try {
        const params = { type: this.chartType }
        if (this.startDate) params.startDate = this.startDate.replace('T', ' ') + ':00'
        if (this.endDate) params.endDate = this.endDate.replace('T', ' ') + ':00'
        const res = await getMyChartData(params)
        if (res.code === 200) {
          this.chartData = res.data
          // 如果是雷达图，设置雷达数据
          if (this.chartType === 'radar' && res.data.values) {
            this.radarData = res.data.values
          }
        }
      } catch (error) {
        this.$message.error('获取图表数据失败')
      } finally {
        this.chartLoading = false
      }
    },
    
    async handleChartTypeChange() {
      await this.fetchChartData()
      if (this.hasData) {
        this.$nextTick(() => {
          this.initChart()
        })
      }
    },
    
    // 初始化主图表
    initChart() {
      if (!this.$refs.chartDom) {
        console.error('图表DOM元素不存在')
        return
      }
      
      if (this.chartInstance) {
        this.chartInstance.dispose()
      }
      
      try {
        this.chartInstance = echarts.init(this.$refs.chartDom)
        
        let option = {}
        
        switch (this.chartType) {
          case 'bar':
            option = this.getBarOption()
            break
          case 'line':
            option = this.getLineOption()
            break
          case 'score-trend':
            option = this.getTrendOption()
            break
          case 'radar':
            option = this.getRadarOption()
            break
          default:
            option = this.getBarOption()
        }
        
        this.chartInstance.setOption(option)
        console.log('图表初始化成功:', this.chartType)
        
        // 响应式
        window.addEventListener('resize', () => {
          if (this.chartInstance) {
            this.chartInstance.resize()
          }
        })
      } catch (error) {
        console.error('图表初始化失败:', error)
      }
    },
    
    // 初始化雷达图
    initRadarChart() {
      console.log('initRadarChart 调试: radarData =', this.radarData)
      console.log('initRadarChart 调试: radarDom =', this.$refs.radarDom)
      if (!this.$refs.radarDom || !this.radarData) return

      if (this.radarInstance) {
        this.radarInstance.dispose()
      }

      this.radarInstance = echarts.init(this.$refs.radarDom)

      // 兼容新格式：radarData 直接为数组
      const indicators = [
        { name: '学习成效', max: 100 },
        { name: '知识掌握度', max: 100 },
        { name: '学习投入度', max: 100 },
        { name: '学习活跃度', max: 100 },
        { name: '学习规律性', max: 100 }
      ]
      
      const option = {
        title: {
          text: '学习能力雷达图',
          left: 'center',
          top: 20,
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold',
            color: '#333'
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: function(params) {
            let html = '<div style="padding: 10px;">'
            html += '<div style="font-weight: bold; margin-bottom: 8px;">能力评分</div>'
            params.data.value.forEach((value, index) => {
              html += `<div style="margin: 4px 0;">
                <span style="display: inline-block; width: 8px; height: 8px; background: #667eea; border-radius: 50%; margin-right: 8px;"></span>
                ${indicators[index].name}: <span style="font-weight: bold; color: #667eea;">${value}分</span>
              </div>`
            })
            html += '</div>'
            return html
          }
        },
        radar: {
          indicator: indicators,
          radius: '65%',
          center: ['50%', '55%'],
          splitNumber: 5,
          name: {
            textStyle: {
              color: '#333',
              fontSize: 12,
              fontWeight: '500'
            }
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(0,0,0,0.1)',
              width: 1
            }
          },
          splitArea: {
            areaStyle: {
              color: [
                'rgba(114,172,209,0.02)', 
                'rgba(114,172,209,0.05)',
                'rgba(114,172,209,0.08)',
                'rgba(114,172,209,0.10)',
                'rgba(114,172,209,0.12)'
              ]
            }
          },
          axisLine: {
            lineStyle: {
              color: 'rgba(0,0,0,0.15)'
            }
          }
        },
        series: [{
          name: '能力评分',
          type: 'radar',
          data: [{
            value: Array.isArray(this.radarData) ? this.radarData : [],
            name: '当前能力'
          }],
          // 重要：添加区域填充样式
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64,158,255,0.4)' },
              { offset: 0.5, color: 'rgba(64,158,255,0.25)' },
              { offset: 1, color: 'rgba(102,177,255,0.15)' }
            ])
          },
          lineStyle: { color: '#409eff', width: 2 },
          itemStyle: { color: '#409eff', borderColor: '#fff', borderWidth: 2 },
          symbol: 'circle',
          symbolSize: 8,
          emphasis: {
            itemStyle: {
              color: '#4c63d2',
              shadowBlur: 10,
              shadowColor: 'rgba(102,126,234,0.5)'
            },
            lineStyle: {
              width: 4
            }
          }
        }]
      }

      this.radarInstance.setOption(option)

      // 响应式
      window.addEventListener('resize', () => {
        if (this.radarInstance) {
          this.radarInstance.resize()
        }
      })
    },
    
    async fetchExamRecordsTable() {
      this.examLoading = true
      try {
        const res = await getMyExamRecords({
          pageNum: this.examPageNum,
          pageSize: this.examPageSize,
          ...this.getQueryParams()
        })
        if (res.code === 200) {
          // 适配后端返回的数据结构
          this.examRecordsTable = {
            records: res.data.list || [],
            total: res.data.total || 0,
            pages: res.data.pages || 1,
            hasNextPage: (res.data.pageNum || 1) < (res.data.pages || 1)
          }
          } else {
          console.log('获取成绩单失败，使用默认数据');
          this.examRecordsTable = {
            records: [],
            total: 0,
            pages: 1,
            hasNextPage: false
          }
          this.$message.error('获取成绩单失败')
        }
      } catch (e) {
        console.error('获取成绩单出错:', e);
        console.log('使用默认成绩单数据');
        this.examRecordsTable = {
          records: [],
          total: 0,
          pages: 1,
          hasNextPage: false
        }
        this.$message.error('获取成绩单失败')
      } finally {
        this.examLoading = false
      }
    },
    
    async fetchStudyRecordsTable() {
      this.studyLoading = true
      try {
        console.log('开始获取学习记录，参数:', {
          pageNum: this.studyPageNum,
          pageSize: this.studyPageSize, // 每页20条
          ...this.getQueryParams()
        });
        
        const res = await getMyStudyRecords({
          pageNum: this.studyPageNum,
          pageSize: this.studyPageSize, // 每页20条
          ...this.getQueryParams()
        })
        
        console.log('学习记录API响应:', res);
        
        if (res.code === 200) {
          // 适配后端返回的数据结构
          const records = res.data.list || res.data.records || [];
          this.studyRecordsTable = {
            records: records,
            total: res.data.total || 0,
            pages: res.data.pages || 1,
            hasNextPage: (res.data.pageNum || 1) < (res.data.pages || 1)
          }
          
          // 计算总学习时间，使用后端返回的 progress 字段
          this.totalStudyTime = records.reduce((sum, item) => {
            const progress = item.progress || 0;
            return sum + progress;
          }, 0);
          
          console.log('学习记录数据:', {
            recordsCount: records.length,
            totalStudyTime: this.totalStudyTime,
            sampleRecord: records[0]
          });
          
          // 详细检查每条记录的时间字段
          records.forEach((record, index) => {
            console.log(`记录${index + 1}:`, {
              last_study_time: record.last_study_time,
              lastStudyTime: record.lastStudyTime,
              study_time: record.study_time,
              studyTime: record.studyTime,
              progress: record.progress,
              study_duration: record.study_duration,
              studyDuration: record.studyDuration
            });
          });
          console.log('学习记录原始数据:', records[0]);
        } else {
          console.log('获取学习记录失败，使用默认数据');
          // 设置默认的学习记录数据，以便时间分布模块能正常显示
          this.studyRecordsTable = {
            records: [],
            total: 0,
            pages: 1,
            hasNextPage: false
          }
          this.totalStudyTime = 0
          this.$message.error('获取学习记录失败')
        }
      } catch (e) {
        console.error('获取学习记录出错:', e);
        console.log('使用默认学习记录数据');
        // 设置默认的学习记录数据，以便时间分布模块能正常显示
        this.studyRecordsTable = {
          records: [],
          total: 0,
          pages: 1,
          hasNextPage: false
        }
        this.totalStudyTime = 0
        this.$message.error('获取学习记录失败')
      } finally {
        this.studyLoading = false
      }
    },
    
    formatDate(dateStr) {
      if (!dateStr) return '无'
      try {
        // 后端返回的是 "yyyy-MM-dd'T'HH:mm:ss" 格式，直接使用 new Date() 解析
        const date = new Date(dateStr)
        // 检查日期是否有效
        if (isNaN(date.getTime())) {
          console.error('无效的日期格式:', dateStr)
          return '无效日期'
        }
        return date.toLocaleString('zh-CN')
      } catch (error) {
        console.error('日期格式化错误:', error, dateStr)
        return '无法格式化'
      }
    },
    
    // 计算学习进度百分比
    calculateProgress(item) {
      // 如果已有progressPercentage字段，直接使用
      if (item.progressPercentage !== undefined) {
        return parseFloat(item.progressPercentage).toFixed(1);
      }
      // progress 和 videoDuration 计算百分比
      if (item.progress && item.videoDuration && item.videoDuration > 0) {
        const percentage = (item.progress / item.videoDuration) * 100;
        return Math.min(100, percentage).toFixed(1);
      }
      // 如果completed字段为true，表示已完成
      if (item.completed === true || item.completed === 1) {
        return '100.0';
      }
      // 如果没有必要的字段，返回0
      return '0.0';
    },
    
    async generateReport() {
      // 创建一个临时的HTML元素来生成报告内容
      const reportContainer = document.createElement('div');
      reportContainer.style.cssText = `
        position: fixed;
        top: -9999px;
        left: -9999px;
        width: 800px;
        background: white;
        padding: 40px;
        font-family: 'Alibaba PuHuiTi', 'Microsoft YaHei', sans-serif;
        font-size: 14px;
        line-height: 1.6;
        color: #333;
      `;

      // 生成报告HTML内容
      let reportContent = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 24px; font-weight: bold; color: #333; margin: 0 0 10px 0;">学习效果分析报告</h1>
          <div style="font-size: 12px; color: #666;">
            <p style="margin: 5px 0;">用户ID: ${this.getCurrentUserId()}</p>
            <p style="margin: 5px 0;">评价周期: ${this.timePeriod}</p>
            <p style="margin: 5px 0;">生成时间: ${new Date().toLocaleString()}</p>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 18px; font-weight: bold; color: #333; margin: 0 0 15px 0; border-bottom: 2px solid #667eea; padding-bottom: 5px;">主要数据</h2>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
            <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #667eea;">${this.averageScore}</div>
              <div style="font-size: 14px; color: #666;">平均分数</div>
            </div>
            <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #667eea;">${(this.totalStudyTime / 3600).toFixed(1)}</div>
              <div style="font-size: 14px; color: #666;">学习时长(小时)</div>
            </div>
            <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #667eea;">${this.examPassRate}%</div>
              <div style="font-size: 14px; color: #666;">考试通过率</div>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 18px; font-weight: bold; color: #333; margin: 0 0 15px 0; border-bottom: 2px solid #667eea; padding-bottom: 5px;">个性化学习建议</h2>
          ${(this.suggestions || []).map((s, idx) => `
            <div style="margin-bottom: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea;">
              <div style="font-weight: bold; margin-bottom: 8px;">${idx + 1}. ${s.title}（${this.getPriorityText(s.priority)}）</div>
              <div style="color: #666; line-height: 1.5;">${s.content}</div>
            </div>
          `).join('')}
        </div>
      `;

      // 如果有学习记录，添加表格
      if (this.studyRecordsTable && this.studyRecordsTable.records && this.studyRecordsTable.records.length) {
        const tableContent = `
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 18px; font-weight: bold; color: #333; margin: 0 0 15px 0; border-bottom: 2px solid #667eea; padding-bottom: 5px;">学习记录（部分）</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <thead>
                <tr style="background: #667eea; color: white;">
                  <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">课程名称</th>
                  <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">视频名称</th>
                  <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">进度</th>
                  <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">时长(分钟)</th>
                  <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">最后学习时间</th>
                </tr>
              </thead>
              <tbody>
                ${this.studyRecordsTable.records.slice(0, 10).map(item => `
                  <tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 10px; border: 1px solid #ddd;">${item.courseTitle || '未知课程'}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${item.videoTitle || '未知视频'}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${this.calculateProgress(item)}%</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${item.progress ? Math.round(item.progress / 60) : 0}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${this.formatDate(item.lastStudyTime)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
        reportContent += tableContent;
      }

      reportContainer.innerHTML = reportContent;
      document.body.appendChild(reportContainer);

      try {
        // 使用html2canvas将HTML转换为图片
        const html2canvas = await import('html2canvas');
        const canvas = await html2canvas.default(reportContainer, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });

        // 创建PDF
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;

        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // 下载PDF
        pdf.save(`学习报告_${this.getCurrentUserId()}_${Date.now()}.pdf`);
      } catch (error) {
        console.error('生成PDF失败:', error);
        alert('生成PDF失败，请检查网络连接');
      } finally {
        // 清理临时元素
        document.body.removeChild(reportContainer);
      }
    },
    
    getMasteryClass(mastery) {
      return mastery
    },
    
    getMasteryText(mastery) {
      const masteryMap = {
        excellent: '优秀',
        good: '良好',
        average: '一般',
        poor: '薄弱'
      }
      return masteryMap[mastery] || '未知'
    },
    
    getSuggestionIcon(type) {
      const iconMap = {
        improve: '🎯',
        maintain: '✅',
        optimize: '⚡'
      }
      return iconMap[type] || '💡'
    },
    
    getPriorityText(priority) {
      const priorityMap = {
        high: '高优先级',
        medium: '中优先级',
        low: '低优先级'
      }
      return priorityMap[priority] || '一般'
    },
    
    getScoreClass(score) {
      if (score >= 90) return 'excellent'
      if (score >= 80) return 'good'
      if (score >= 60) return 'average'
      return 'poor'
    },
    
        getTimeDistribution(period) {
        if (!this.studyRecordsTable || !this.studyRecordsTable.records || !this.studyRecordsTable.records.length) {
          console.log('学习记录为空，使用默认时间分布');
          // 如果没有学习记录，提供默认的时间分布数据用于测试
          const defaultDistribution = {
            morning: '2.5',
            afternoon: '3.2',
            evening: '1.8'
          };
          return defaultDistribution[period] || '0.0';
        }
        
        // Map period names to hour ranges (24-hour format)
        const periodRanges = {
          morning: { start: 6, end: 12 },    // 6:00 AM - 12:00 PM
          afternoon: { start: 12, end: 18 }, // 12:00 PM - 6:00 PM
          evening: { start: 18, end: 6 }     // 6:00 PM - 6:00 AM (next day)
        };
        
        // Calculate total study time for the specified period
        const records = this.studyRecordsTable.records;
        let periodStudyTime = 0;
        let validRecords = 0;
        
        console.log(`计算${period}时间段的学习时间分布，总记录数: ${records.length}`);
        
        for (const record of records) {
          // 根据后端返回的字段名：lastStudyTime 和 duration
          const studyTimeStr = record.lastStudyTime;
          const progress = record.progress || 0;
          
          if (!studyTimeStr || !progress) {
            console.log('跳过无效记录:', { studyTimeStr, progress });
            continue;
          }
          
          try {
            // 后端返回的是 "yyyy-MM-dd'T'HH:mm:ss" 格式，直接使用 new Date() 解析
            const studyTime = new Date(studyTimeStr);
            if (isNaN(studyTime.getTime())) {
              console.log('无效的日期格式:', studyTimeStr);
              continue;
            }
            
            const hour = studyTime.getHours();
            const range = periodRanges[period];
            
            // Check if the study time falls within the period
            let isInPeriod = false;
            if (period === 'evening') {
              // 晚上：18:00-06:00 (跨天)
              isInPeriod = hour >= range.start || hour < range.end;
            } else {
              // 上午和下午：正常时间段
              isInPeriod = hour >= range.start && hour < range.end;
            }
            
            if (isInPeriod) {
              periodStudyTime += progress;
              validRecords++;
            }
          } catch (error) {
            console.error('解析学习时间出错:', error, studyTimeStr);
            continue;
          }
        }
        
        console.log(`${period}时间段: 有效记录${validRecords}条，总时长${periodStudyTime}秒`);
        
        // Convert from seconds to hours
        return (periodStudyTime / 3600).toFixed(1);
    },
    
    getTimePercentage(period) {
        if (!this.studyRecordsTable || !this.studyRecordsTable.records || !this.studyRecordsTable.records.length) {
          console.log('学习记录为空，使用默认百分比');
          // 如果没有学习记录，提供默认的百分比数据
          const defaultPercentage = {
            morning: 33,
            afternoon: 42,
            evening: 25
          };
          return defaultPercentage[period] || 0;
        }
        
        if (this.totalStudyTime === 0) {
          console.log('总学习时间为0，使用默认百分比');
          const defaultPercentage = {
            morning: 33,
            afternoon: 42,
            evening: 25
          };
          return defaultPercentage[period] || 0;
        }
        
        const periodTime = parseFloat(this.getTimeDistribution(period)) * 3600;
        const percentage = Math.round((periodTime / this.totalStudyTime) * 100);
        
        console.log(`${period}时间段百分比: ${periodTime}秒 / ${this.totalStudyTime}秒 = ${percentage}%`);
        
        return percentage;
    },
    
    getMostActivePeriod() {
        if (!this.studyRecordsTable || !this.studyRecordsTable.records || !this.studyRecordsTable.records.length) {
          return '暂无数据';
        }
        
        const periods = ['morning', 'afternoon', 'evening'];
        const periodLabels = {
          'morning': '上午',
          'afternoon': '下午',
          'evening': '晚上'
        };
        
        let maxPeriod = 'morning';
        let maxValue = parseFloat(this.getTimeDistribution('morning'));
      
      for (const period of periods) {
          const value = parseFloat(this.getTimeDistribution(period));
        if (value > maxValue) {
            maxPeriod = period;
            maxValue = value;
        }
      }
      
        return maxValue > 0 ? periodLabels[maxPeriod] : '暂无数据';
    },

    resetPages() {
      this.examPageNum = 1
      this.studyPageNum = 1
    },

    handleApiError(error) {
      if (error.errorCode === 'USER_NOT_LOGGED_IN' || error.code === 401) {
        localStorage.removeItem('token')
        sessionStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        this.$message.error('登录已过期，请重新登录')
        this.$router.push('/login')
        return
      }
      if (error.errorCode === 'PERMISSION_DENIED' || error.code === 403) {
        this.$message.error('权限不足，无法访问此功能')
        return
      }
      this.$message.error(error.message || '操作失败，请稍后重试')
    },

    getCurrentUserId() {
      return getUserId()
    }
  },
  created() {
    // 检查用户是否已登录
    if (!isAuthenticated()) {
      this.$message.error('请先登录')
      this.$router.push('/login')
      return
    }
    // 自动加载数据
    this.handleQuery()
    
    // 测试时间分布方法
    console.log('测试时间分布方法:');
    console.log('上午:', this.getTimeDistribution('morning'));
    console.log('下午:', this.getTimeDistribution('afternoon'));
    console.log('晚上:', this.getTimeDistribution('evening'));
    
    // 测试时间解析
    const testTime = "2024-01-15T14:30:00";
    const testDate = new Date(testTime);
    console.log('测试时间解析:', {
      original: testTime,
      parsed: testDate,
      hour: testDate.getHours(),
      isValid: !isNaN(testDate.getTime())
    });
  },
  beforeUnmount() {
    this.destroyCharts()
    window.removeEventListener('resize', this.resizeHandler)
  }
}
</script>

<style scoped>
.learning-evaluation {
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
  background: #eaf6ff;
  padding: 20px;
  border-radius: 16px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
  gap: 20px;
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
  color: #222;
  white-space: nowrap;
}
.query-item input, .query-item select {
  padding: 8px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  font-size: 15px;
  height: 38px;
  box-sizing: border-box;
}
.query-btn, .reset-btn {
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 18px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 15px;
  transition: background-color 0.3s;
}
.query-btn {
  background: #409eff;
  color: #fff;
}
.query-btn:hover:not(:disabled) {
  background: #66b1ff;
}
.reset-btn {
  background: transparent;
  color: #222;
  border: 1px solid #409eff;
  border-radius: 4px;
  font-size: 15px;
  padding: 8px 18px;
  transition: background 0.2s, color 0.2s;
}
.reset-btn:hover {
  background: #409eff;
  color: #fff;
}
.analysis-cards .card-value {
  color: #409eff;
}

/* 卡片区域样式 */
.analysis-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.card {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
}

.card h3 {
  color: #333;
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 500;
}

.card-value {
  font-size: 32px;
  font-weight: bold;
  color: #667eea;
  margin: 0;
}

/* 数据可视化区域样式 */
.chart-section {
  background: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.section-header h2 {
  color: #333;
  margin: 0;
  font-size: 20px;
}

.chart-selector {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  cursor: pointer;
}

.chart-selector:focus {
  outline: none;
  border-color: #667eea;
}

.chart-container {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-wrapper {
  width: 100%;
  height: 400px;
}

.chart-dom {
  width: 100%;
  height: 100%;
}

/* 学习记录区域样式 */
.records-section {
  background: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.record-stats {
  color: #666;
  font-size: 14px;
}

.records-table {
  margin-top: 20px;
}

.records-table table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.records-table th,
.records-table td {
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.records-table th {
  background: #409eff;
  color: #fff;
  font-weight: 500;
  font-size: 14px;
}

.records-table td {
  color: #333;
  font-size: 14px;
}

.records-table tr:hover {
  background: #f8f9fa;
}

.records-table .progress-bar {
  position: relative;
  height: 20px;
  background: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
  min-width: 100px;
}

.records-table .progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  border-radius: 10px;
  transition: width 0.5s ease;
}

.records-table .progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  font-weight: 500;
  color: #333;
  z-index: 1;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
  padding: 20px 0;
}

.page-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  color: #333;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.page-btn:disabled {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #666;
}

.no-data {
  text-align: center;
  color: #999;
  padding: 60px;
  font-size: 16px;
}

/* 内容区域基础样式 */
.content-area {
  margin-top: 30px;
}

.radar-section, .progress-section, .exam-analysis-section, .suggestion-section, .report-section {
  background: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.radar-section h2, .progress-section h2, .exam-analysis-section h2, .suggestion-section h2, .report-section h2 {
  color: #333;
  margin-bottom: 25px;
  font-size: 20px;
}

.progress-grid, .exam-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.progress-card, .exam-card {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.course-item {
  margin-bottom: 15px;
}

.course-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.course-name {
  font-weight: 500;
}

.course-progress-text {
  color: #666;
  font-size: 14px;
}

.progress-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  transition: width 0.5s ease;
}

.time-distribution {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.time-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: white;
  border-radius: 6px;
}

.trend-chart {
  display: flex;
  align-items: end;
  justify-content: space-around;
  height: 150px;
  padding: 20px 0;
}

.score-point {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.point {
  width: 20px;
  background: linear-gradient(to top, #667eea, #764ba2);
  border-radius: 10px 10px 0 0;
  min-height: 20px;
}

.point-label {
  font-size: 12px;
  font-weight: 500;
}

.knowledge-mastery {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.knowledge-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: white;
  border-radius: 6px;
}

.mastery-level {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.mastery-level.excellent {
  background: #e8f5e8;
  color: #4CAF50;
}

.mastery-level.good {
  background: #e3f2fd;
  color: #2196F3;
}

.mastery-level.average {
  background: #fff3e0;
  color: #FF9800;
}

.mastery-level.poor {
  background: #ffebee;
  color: #f44336;
}

.suggestions {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.suggestion-item {
  display: flex;
  gap: 15px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid #667eea;
}

.suggestion-icon {
  font-size: 24px;
  margin-top: 5px;
}

.suggestion-content {
  flex: 1;
}

.suggestion-content h4 {
  margin: 0 0 8px 0;
  color: #333;
}

.suggestion-content p {
  margin: 0 0 10px 0;
  color: #666;
  line-height: 1.5;
}

.suggestion-priority {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  display: inline-block;
}

.suggestion-priority.high {
  background: #ffebee;
  color: #f44336;
}

.suggestion-priority.medium {
  background: #fff3e0;
  color: #FF9800;
}

.suggestion-priority.low {
  background: #e8f5e8;
  color: #4CAF50;
}

.report-options {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.report-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.report-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.loading {
  text-align: center;
  color: #666;
  padding: 60px;
  font-size: 16px;
}

.empty-state, .initial-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon, .initial-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-state h3, .initial-state h3 {
  color: #333;
  margin-bottom: 15px;
  font-size: 24px;
}

.empty-state p, .initial-state p {
  color: #666;
  font-size: 16px;
  line-height: 1.5;
}

/* 学习时间分布样式 */
.time-distribution-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.time-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;
}

.time-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2);
}

.time-card.morning::before {
  background: linear-gradient(90deg, #ff9a9e, #fecfef);
}

.time-card.afternoon::before {
  background: linear-gradient(90deg, #a8edea, #fed6e3);
}

.time-card.evening::before {
  background: linear-gradient(90deg, #667eea, #764ba2);
}

.time-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
}

.time-icon {
  font-size: 32px;
  margin-bottom: 15px;
}

.time-info h3 {
  color: #333;
  margin: 0 0 10px 0;
  font-size: 18px;
  font-weight: 600;
}

.time-value {
  font-size: 24px;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 5px;
}

.time-percentage {
  font-size: 14px;
  color: #666;
  background: #f8f9fa;
  padding: 4px 12px;
  border-radius: 12px;
  display: inline-block;
}

.time-summary {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 20px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.summary-label {
  color: #666;
  font-size: 14px;
}

.summary-value {
  color: #333;
  font-weight: 600;
  font-size: 16px;
}

@media (max-width: 768px) {
  .analysis-cards {
    grid-template-columns: 1fr;
  }
  
  .progress-grid, .exam-grid {
    grid-template-columns: 1fr;
  }
  
  .query-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .query-item {
    flex-direction: column;
    align-items: stretch;
  }
  
  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .records-table {
    overflow-x: auto;
  }
  
  .records-table table {
    min-width: 600px;
  }
  
  .pagination {
    flex-direction: column;
    gap: 10px;
  }
  
  .time-distribution-container {
    grid-template-columns: 1fr;
  }
  
  .time-summary {
    flex-direction: column;
    align-items: center;
  }
}

/* 新增样式 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.refresh-btn, .export-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.3s;
}

.refresh-btn:hover:not(:disabled), .export-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.refresh-btn:disabled, .export-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.report-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.report-info p {
  margin: 0;
  color: #666;
  line-height: 1.6;
}
</style>