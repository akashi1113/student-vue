<template>
  <div class="report-list-container">
    <el-page-header
        @back="$router.go(-1)"
        :content="`实验报告 - ${experimentName}`"
    ></el-page-header>

    <el-card class="report-list-card">
      <el-table
          :data="reportList"
          style="width: 100%"
          v-loading="loading"
      >
        <el-table-column
            prop="studentName"
            label="学生姓名"
            width="120"
        ></el-table-column>
        <el-table-column
            prop="studentId"
            label="学号"
            width="150"
        ></el-table-column>
        <el-table-column
            prop="submitTime"
            label="提交时间"
            width="180"
        >
          <template #default="{row}">
            {{ formatTime(row.submitTime) }}
          </template>
        </el-table-column>
        <el-table-column
            prop="status"
            label="状态"
            width="100"
        >
          <template #default="{row}">
            <el-tag :type="row.status === 'COMPLETED' ? 'success' : 'info'">
              {{ row.status === 'COMPLETED' ? '已完成' : '进行中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
            prop="duration"
            label="实验时长"
            width="120"
        >
          <template #default="{row}">
            {{ formatDuration(row.duration) }}
          </template>
        </el-table-column>
        <el-table-column
            label="操作"
            width="120"
        >
          <template #default="{row}">
            <el-button
                type="text"
                size="small"
                @click="viewReportDetail(row.id)"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { getExperimentReports } from '@/api/experiment'

export default {
  name: 'ReportList',
  data() {
    return {
      experimentId: null,
      experimentName: '',
      reportList: [],
      loading: false
    }
  },
  created() {
    this.experimentId = this.$route.params.experimentId
    this.loadReports()
  },
  methods: {
    async loadReports() {
      this.loading = true
      try {
        const { data } = await getExperimentReports(this.experimentId)
        this.reportList = data.reports
        this.experimentName = data.experimentName
      } catch (error) {
        this.$message.error('加载报告列表失败: ' + (error.message || '未知错误'))
      } finally {
        this.loading = false
      }
    },
    formatTime(time) {
      if (!time) return '-'
      return this.$dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    formatDuration(minutes) {
      if (!minutes) return '-'
      if (minutes < 60) return `${minutes}分钟`
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours}小时${mins}分钟`
    },
    viewReportDetail(reportId) {
      this.$router.push(`/experiment/report/${reportId}`)
    }
  }
}
</script>

<style scoped>
.report-list-container {
  padding: 20px;
}
.report-list-card {
  margin-top: 20px;
}
</style>