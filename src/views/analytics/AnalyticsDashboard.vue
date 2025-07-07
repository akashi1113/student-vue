<template>
  <div class="analytics-dashboard">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>教师分析中心</h2>
      <p>全面的考试数据分析，助力教学决策</p>
    </div>

    <!-- 筛选器 -->
    <FilterPanel 
      :loading="loading" 
      @filter-change="handleFilterChange"
    />

    <!-- 加载状态 -->
    <LoadingSpinner v-if="loading" />

    <!-- 主要内容 -->
    <div v-else class="dashboard-content">
      <!-- 数据提示 -->
      <el-alert
        v-if="!hasData"
        title="暂无数据"
        type="info"
        description="当前时间段内没有考试数据，请尝试调整筛选条件或联系管理员添加考试数据。"
        show-icon
        :closable="false"
        style="margin-bottom: 20px;"
      />
      
      <!-- 概览卡片 -->
      <div class="overview-section">
        <el-row :gutter="20">
          <el-col :span="6" v-for="card in overviewCards" :key="card.title">
            <AnalyticsCard v-bind="card" />
          </el-col>
        </el-row>
      </div>

      <!-- 图表区域 -->
      <div class="charts-section">
        <el-row :gutter="20">
          <!-- 成绩分布分析 -->
          <el-col :span="12">
            <el-card class="chart-card">
              <template #header>
                <span>成绩分布分析</span>
              </template>
              <div class="chart-container">
                <div ref="scoreDistributionChart" class="chart"></div>
              </div>
            </el-card>
          </el-col>
          <!-- 趋势分析 -->
          <el-col :span="12">
            <el-card class="chart-card">
              <template #header>
                <span>趋势分析</span>
              </template>
              <div class="chart-container">
                <div ref="trendChart" class="chart"></div>
              </div>
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="20" style="margin-top: 20px;">
          <!-- 考试对比分析 -->
          <el-col :span="24">
            <el-card class="chart-card" style="height: 480px;">
              <template #header>
                <span>考试对比分析</span>
              </template>
              <div class="chart-container" style="height: 100%;">
                <div ref="examComparisonChart" class="chart" style="height: 300px; margin-top: 20px;"></div>
              </div>
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="20" style="margin-top: 20px;">
          <!-- 学生排名 -->
          <el-col :span="24">
            <el-card class="chart-card">
              <template #header>
                <span>学生排名</span>
              </template>
              <div class="rankings-table">
                <el-table 
                  :data="studentRankings" 
                  style="width: 100%"
                  :max-height="300"
                  size="small"
                  :empty-text="studentRankings.length === 0 ? '暂无学生排名数据' : '暂无数据'"
                >
                  <el-table-column prop="rank" label="排名" width="60" align="center">
                    <template #default="scope">
                      <el-tag 
                        :type="scope.row.rank <= 3 ? 'success' : 'info'"
                        size="small"
                      >
                        {{ scope.row.rank }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="studentName" label="学生姓名" />
                  <el-table-column prop="averageScore" label="平均分" width="80" align="center">
                    <template #default="scope">
                      <span class="score">{{ scope.row.averageScore }}分</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="examCount" label="考试次数" width="80" align="center" />
                </el-table>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import AnalyticsCard from '../../components/analytics/AnalyticsCard.vue'
import FilterPanel from '../../components/analytics/FilterPanel.vue'
import { getCompleteAnalysis, getExamComparison } from '../../api/analytics.js'

export default {
  name: 'AnalyticsDashboard',
  components: {
    LoadingSpinner,
    AnalyticsCard,
    FilterPanel
  },
  data() {
    return {
      loading: false,
      analyticsData: null,
      scoreDistributionChart: null,
      examComparisonChart: null,
      trendChart: null,
      studentRankings: []
    }
  },
  computed: {
    hasData() {
      if (!this.analyticsData) return false
      
      const overview = this.analyticsData.overview
      const hasOverviewData = overview && (
        overview.totalStudents > 0 || 
        overview.totalExams > 0 || 
        overview.averageScore > 0 || 
        overview.passRate > 0
      )
      
      const hasScoreData = this.analyticsData.scoreDistribution && (
        this.analyticsData.scoreDistribution.excellentCount > 0 ||
        this.analyticsData.scoreDistribution.goodCount > 0 ||
        this.analyticsData.scoreDistribution.averageCount > 0 ||
        this.analyticsData.scoreDistribution.passCount > 0 ||
        this.analyticsData.scoreDistribution.failCount > 0
      )
      
      const hasExamData = this.analyticsData.examComparison && this.analyticsData.examComparison.length > 0
      const hasTrendData = this.analyticsData.trend && this.analyticsData.trend.length > 0
      const hasRankingData = this.studentRankings && this.studentRankings.length > 0
      
      return hasOverviewData || hasScoreData || hasExamData || hasTrendData || hasRankingData
    },
    
    overviewCards() {
      if (!this.analyticsData?.overview) return []
      
      const data = this.analyticsData.overview
      return [
        {
          title: '学生总数',
          value: data.totalStudents || 0,
          icon: 'el-icon-user',
          type: 'info'
        },
        {
          title: '考试总数',
          value: data.totalExams || 0,
          icon: 'el-icon-document',
          type: 'default'
        },
        {
          title: '平均分',
          value: data.averageScore || 0,
          icon: 'el-icon-data-analysis',
          type: 'success',
          format: 'number'
        },
        {
          title: '及格率',
          value: data.passRate || 0,
          icon: 'el-icon-pie-chart',
          type: 'warning',
          format: 'percentage'
        }
      ]
    }
  },
  mounted() {
    this.loadAnalyticsData()
    
    // 监听窗口大小变化，重绘图表
    window.addEventListener('resize', this.handleResize)
  },
  methods: {
    async loadAnalyticsData() {
      this.loading = true
      try {
        // 首先尝试测试API
        try {
          const { testAnalytics } = await import('../../api/analytics.js')
          await testAnalytics()
        } catch (testError) {}
        const requestData = {
          startTime: '2024-01-01 00:00:00',
          endTime: '2024-12-31 23:59:59',
          courseIds: [],
          examIds: [],
          studentIds: [],
          analysisType: 'COMPLETE',
          timeGranularity: 'MONTH'
        }
        // 并行获取完整分析数据和考试对比数据
        const [completeResponse, examComparisonResponse] = await Promise.all([
          getCompleteAnalysis(requestData),
          getExamComparison(requestData)
        ])
        
        const apiData = completeResponse.data
        this.analyticsData = {
          overview: {
            totalStudents: apiData.overviewStats?.totalStudents || 0,
            totalExams: apiData.overviewStats?.totalExams || 0,
            averageScore: apiData.overviewStats?.averageScore || 0,
            passRate: apiData.overviewStats?.passRate || 0
          },
          scoreDistribution: {
            excellentCount: apiData.scoreDistribution?.excellentCount || 0,
            goodCount: apiData.scoreDistribution?.goodCount || 0,
            averageCount: apiData.scoreDistribution?.averageCount || 0,
            passCount: apiData.scoreDistribution?.passCount || 0,
            failCount: apiData.scoreDistribution?.failCount || 0
          },
          examComparison: examComparisonResponse.data || [],
          trend: apiData.trendData || []
        }
        this.studentRankings = apiData.studentRankings || []
        this.$nextTick(() => {
          this.initCharts()
          setTimeout(() => {
            if (this.scoreDistributionChart) {
              this.scoreDistributionChart.resize()
            }
            if (this.examComparisonChart) {
              this.examComparisonChart.resize()
            }
            if (this.trendChart) {
              this.trendChart.resize()
            }
          }, 200)
        })
      } catch (error) {
        this.loadMockData()
        this.$message.error('加载分析数据失败，使用模拟数据')
      } finally {
        this.loading = false
      }
    },

    loadMockData() {
      // 模拟数据
      this.analyticsData = {
        overview: {
          totalStudents: 150,
          totalExams: 25,
          averageScore: 78.5,
          passRate: 85.2
        },
        scoreDistribution: {
          excellentCount: 25,
          goodCount: 45,
          averageCount: 35,
          passCount: 30,
          failCount: 15
        },
        examComparison: [
          { examName: '期中考试', averageScore: 82.3 },
          { examName: '期末考试', averageScore: 76.8 },
          { examName: '单元测试A', averageScore: 79.1 },
          { examName: '单元测试B', averageScore: 75.4 },
          { examName: '随堂测验', averageScore: 81.2 }
        ],
        trend: [
          { timePoint: '1月', averageScore: 75.2, passRate: 80.5 },
          { timePoint: '2月', averageScore: 77.8, passRate: 82.1 },
          { timePoint: '3月', averageScore: 79.3, passRate: 84.7 },
          { timePoint: '4月', averageScore: 78.9, passRate: 83.2 },
          { timePoint: '5月', averageScore: 81.2, passRate: 86.5 },
          { timePoint: '6月', averageScore: 82.5, passRate: 87.8 }
        ]
      }
      
      this.studentRankings = [
        { rank: 1, studentName: '张三', averageScore: 92.5, examCount: 8 },
        { rank: 2, studentName: '李四', averageScore: 89.3, examCount: 7 },
        { rank: 3, studentName: '王五', averageScore: 87.1, examCount: 8 },
        { rank: 4, studentName: '赵六', averageScore: 85.7, examCount: 6 },
        { rank: 5, studentName: '钱七', averageScore: 83.9, examCount: 7 },
        { rank: 6, studentName: '孙八', averageScore: 82.4, examCount: 8 },
        { rank: 7, studentName: '周九', averageScore: 80.1, examCount: 6 },
        { rank: 8, studentName: '吴十', averageScore: 78.5, examCount: 7 }
      ]
      
      this.$nextTick(() => {
        this.initCharts()
      })
    },

    handleFilterChange(filterData) {
      this.loadAnalyticsDataWithFilter(filterData)
    },

    async loadAnalyticsDataWithFilter(filterData) {
      this.loading = true
      try {
        // 并行获取完整分析数据和考试对比数据
        const [completeResponse, examComparisonResponse] = await Promise.all([
          getCompleteAnalysis(filterData),
          getExamComparison(filterData)
        ])
        
        // 处理完整分析数据
        const apiData = completeResponse.data
        this.analyticsData = {
          overview: {
            totalStudents: apiData.overviewStats?.totalStudents || 0,
            totalExams: apiData.overviewStats?.totalExams || 0,
            averageScore: apiData.overviewStats?.averageScore || 0,
            passRate: apiData.overviewStats?.passRate || 0
          },
          scoreDistribution: {
            excellentCount: apiData.scoreDistribution?.excellentCount || 0,
            goodCount: apiData.scoreDistribution?.goodCount || 0,
            averageCount: apiData.scoreDistribution?.averageCount || 0,
            passCount: apiData.scoreDistribution?.passCount || 0,
            failCount: apiData.scoreDistribution?.failCount || 0
          },
          examComparison: examComparisonResponse.data || [],
          trend: apiData.trendData || []
        }
        
        this.studentRankings = apiData.studentRankings || []
        
        this.$nextTick(() => {
          this.initCharts()
        })
      } catch (error) {
        console.error('加载分析数据失败:', error)
        this.$message.error('加载分析数据失败')
      } finally {
        this.loading = false
      }
    },

    initCharts() {
      this.$nextTick(() => {
        setTimeout(() => {
          this.initScoreDistributionChart()
          this.initExamComparisonChart()
          this.initTrendChart()
        }, 100)
      })
    },

    initScoreDistributionChart() {
      const chartDom = this.$refs.scoreDistributionChart
      if (!chartDom) return
      this.scoreDistributionChart = echarts.init(chartDom)
      this.updateScoreDistributionChart()
    },

    updateScoreDistributionChart() {
      if (!this.scoreDistributionChart || !this.analyticsData?.scoreDistribution) return
      const data = this.analyticsData.scoreDistribution
      const total = (data.excellentCount || 0) + (data.goodCount || 0) + (data.averageCount || 0) + (data.passCount || 0) + (data.failCount || 0)
      if (total === 0) {
        const option = {
          title: {
            text: '成绩分布',
            left: 'center'
          },
          graphic: {
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
              text: '暂无数据',
              fontSize: 16,
              fill: '#999'
            }
          }
        }
        this.scoreDistributionChart.setOption(option)
        return
      }
      const option = {
        title: {
          text: '成绩分布',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: [
          {
            name: '成绩分布',
            type: 'pie',
            radius: '50%',
            data: [
              { value: data.excellentCount || 0, name: '优秀(90-100)' },
              { value: data.goodCount || 0, name: '良好(80-89)' },
              { value: data.averageCount || 0, name: '中等(70-79)' },
              { value: data.passCount || 0, name: '及格(60-69)' },
              { value: data.failCount || 0, name: '不及格(0-59)' }
            ],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      }
      this.scoreDistributionChart.setOption(option)
    },

    initExamComparisonChart() {
      const chartDom = this.$refs.examComparisonChart
      if (!chartDom) return
      this.examComparisonChart = echarts.init(chartDom)
      this.updateExamComparisonChart()
    },

    updateExamComparisonChart() {
      if (!this.examComparisonChart || !this.analyticsData?.examComparison) return
      const data = this.analyticsData.examComparison
      if (!data || data.length === 0) {
        const option = {
          title: {
            text: '考试平均分对比',
            left: 'center'
          },
          graphic: {
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
              text: '暂无数据',
              fontSize: 16,
              fill: '#999'
            }
          }
        }
        this.examComparisonChart.setOption(option)
        return
      }
      const examNames = data.map(item => item.examName)
      const averageScores = data.map(item => item.averageScore)
      const option = {
        title: {
          text: '考试平均分对比',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        xAxis: {
          type: 'category',
          data: examNames,
          axisLabel: {
            rotate: 0,
            fontSize: 11,
            interval: 0,
            formatter: function(value) {
              return value.length > 6 ? value.replace(/(.{6})/g, '$1\n') : value;
            }
          }
        },
        yAxis: {
          type: 'value',
          name: '平均分'
        },
        series: [
          {
            name: '平均分',
            type: 'bar',
            data: averageScores,
            itemStyle: {
              color: '#1890ff'
            }
          }
        ]
      }
      this.examComparisonChart.setOption(option)
    },

    initTrendChart() {
      const chartDom = this.$refs.trendChart
      if (!chartDom) return
      this.trendChart = echarts.init(chartDom)
      this.updateTrendChart()
    },

    updateTrendChart() {
      if (!this.trendChart || !this.analyticsData?.trend) return
      const data = this.analyticsData.trend
      if (!data || data.length === 0) {
        const option = {
          title: {
            text: '成绩趋势分析',
            left: 'center'
          },
          graphic: {
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
              text: '暂无数据',
              fontSize: 16,
              fill: '#999'
            }
          }
        }
        this.trendChart.setOption(option)
        return
      }
      const timePoints = data.map(item => item.timePoint)
      const averageScores = data.map(item => item.averageScore)
      const passRates = data.map(item => item.passRate)
      const option = {
        title: {
          text: '成绩趋势分析',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['平均分', '及格率'],
          top: 30
        },
        xAxis: {
          type: 'category',
          data: timePoints
        },
        yAxis: [
          {
            type: 'value',
            name: '平均分',
            position: 'left'
          },
          {
            type: 'value',
            name: '及格率(%)',
            position: 'right'
          }
        ],
        series: [
          {
            name: '平均分',
            type: 'line',
            data: averageScores,
            itemStyle: {
              color: '#52c41a'
            }
          },
          {
            name: '及格率',
            type: 'line',
            yAxisIndex: 1,
            data: passRates,
            itemStyle: {
              color: '#faad14'
            }
          }
        ]
      }
      this.trendChart.setOption(option)
    },

    handleResize() {
      if (this.scoreDistributionChart) {
        this.updateScoreDistributionChart()
      }
      if (this.examComparisonChart) {
        this.updateExamComparisonChart()
      }
      if (this.trendChart) {
        this.updateTrendChart()
      }
    }
  },
  
  beforeUnmount() {
    // 移除事件监听器
    window.removeEventListener('resize', this.handleResize)
    
    // 销毁图表实例
    if (this.scoreDistributionChart) {
      this.scoreDistributionChart.dispose()
    }
    if (this.examComparisonChart) {
      this.examComparisonChart.dispose()
    }
    if (this.trendChart) {
      this.trendChart.dispose()
    }
  }
}
</script>

<style scoped>
.analytics-dashboard {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h2 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 28px;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 16px;
}

.dashboard-content {
  margin-top: 20px;
}

.overview-section {
  margin-bottom: 80px;
}

.charts-section {
  margin-bottom: 30px;
}

.trend-rankings-section {
  margin-bottom: 30px;
}

.chart-card {
  height: 400px;
}

.chart-container {
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.chart {
  width: 100% !important;
  height: 100% !important;
  min-height: 300px;
}

.rankings-table {
  height: 320px;
  overflow-y: auto;
}

.score {
  font-weight: bold;
  color: #1890ff;
}

.positive {
  color: #52c41a;
  font-weight: bold;
}

.negative {
  color: #ff4d4f;
  font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .analytics-dashboard {
    padding: 10px;
  }
  
  .page-header h2 {
    font-size: 24px;
  }
  
  .chart-card {
    height: 300px;
  }
  
  .chart-container {
    height: 220px;
  }
}
</style> 