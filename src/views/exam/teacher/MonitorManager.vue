<template>
  <div class="monitor-management">
    <div class="header">
      <h2>监考管理</h2>
      <div class="filters">
        <select v-model="selectedExam" @change="loadData">
          <option value="">选择考试</option>
          <option v-for="exam in exams" :key="exam.id" :value="exam.id">
            {{ exam.title }}
          </option>
        </select>

        <button @click="refreshData" class="btn btn-primary">刷新数据</button>
      </div>
    </div>

    <!-- 监考统计 -->
    <div class="stats-grid">
      <div class="stat-card">
        <h3>总参考人数</h3>
        <div class="stat-value">{{ totalStudents }}</div>
      </div>
      <div class="stat-card">
        <h3>异常人数</h3>
        <div class="stat-value text-danger">{{ abnormalStudents }}</div>
      </div>
      <div class="stat-card">
        <h3>总异常次数</h3>
        <div class="stat-value text-warning">{{ totalAbnormalCount }}</div>
      </div>
    </div>

    <!-- 学生监考列表 -->
    <div class="student-list">
      <table class="table">
        <thead>
        <tr>
          <th>学生ID</th>
          <th>姓名</th>
          <th>监考次数</th>
          <th>异常次数</th>
          <th>风险等级</th>
          <th>操作</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="student in students" :key="student.userId">
          <td>{{ student.userId }}</td>
          <td>{{ student.userName }}</td>
          <td>{{ student.totalCount }}</td>
          <td class="text-danger">{{ student.abnormalCount }}</td>
          <td>
              <span :class="getRiskClass(student.riskLevel)">
                {{ student.riskLevel }}
              </span>
          </td>
          <td>
            <button @click="viewDetails(student.userId)" class="btn btn-sm btn-info">
              详情
            </button>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import examApi from  '@/api/exam'
import monitorApi from '@/api/monitor'

export default {
  name: 'MonitorManagement',

  data() {
    return {
      exams: [],
      selectedExam: '',
      students: [],
      totalStudents: 0,
      abnormalStudents: 0,
      totalAbnormalCount: 0
    }
  },

  mounted() {
    this.loadExams()
  },

  methods: {
    async loadExams() {
      // 加载考试列表
      this.exams = await examApi.getAllExams()
    },

    async loadData() {
      if (!this.selectedExam) return

      try {
        const response = await monitorApi.getMonitorSummary(this.selectedExam)
        if (response.data.success) {
          this.students = response.data.data
          this.calculateStats()
        }
      } catch (error) {
        this.$message.error('加载监考数据失败')
      }
    },

    calculateStats() {
      this.totalStudents = this.students.length
      this.abnormalStudents = this.students.filter(s => s.abnormalCount > 0).length
      this.totalAbnormalCount = this.students.reduce((sum, s) => sum + s.abnormalCount, 0)
    },

    getRiskClass(riskLevel) {
      const classMap = {
        LOW: 'text-success',
        MEDIUM: 'text-warning',
        HIGH: 'text-danger'
      }
      return classMap[riskLevel] || ''
    },

    viewDetails(userId) {
      this.$router.push({
        name: 'MonitorDetail',
        params: { examId: this.selectedExam, userId }
      })
    },

    refreshData() {
      this.loadData()
    }
  }
}
</script>

<style scoped>
.monitor-management {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  margin-top: 10px;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}

.table th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-info {
  background-color: #17a2b8;
  color: white;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.text-danger {
  color: #dc3545;
}

.text-warning {
  color: #ffc107;
}

.text-success {
  color: #28a745;
}
</style>