<template>
  <div class="homework-submissions">
    <div class="header">
      <button @click="$router.go(-1)" class="back-btn">← 返回</button>
      <h1>{{ homework.title }} - 提交记录</h1>
      <div class="actions">
        <button @click="exportSubmissions" class="export-btn">导出记录</button>
        <button @click="batchReturn" :disabled="selectedSubmissions.length === 0" class="batch-btn">
          批量返回 ({{ selectedSubmissions.length }})
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="content">
      <div class="summary">
        <div class="summary-item">
          <span class="label">总学生数:</span>
          <span class="value">{{ statistics.total_student_count || 0 }}</span>
        </div>
        <div class="summary-item">
          <span class="label">已提交:</span>
          <span class="value">{{ statistics.submitted_count || 0 }}</span>
        </div>
        <div class="summary-item">
          <span class="label">提交率:</span>
          <span class="value">{{ getSubmissionRate() }}%</span>
        </div>
        <div class="summary-item">
          <span class="label">平均分:</span>
          <span class="value">{{ statistics.avg_score ? statistics.avg_score.toFixed(1) : 0 }}</span>
        </div>
      </div>

      <div class="filters">
        <select v-model="statusFilter" @change="filterSubmissions">
          <option value="">所有状态</option>
          <option value="SUBMITTED">已提交</option>
          <option value="GRADED">已批改</option>
          <option value="RETURNED">已返回</option>
        </select>
        <input
            type="text"
            v-model="searchKeyword"
            @input="filterSubmissions"
            placeholder="搜索学生姓名">
      </div>

      <div class="submissions-table">
        <table>
          <thead>
          <tr>
            <th>
              <input
                  type="checkbox"
                  @change="selectAll"
                  :checked="allSelected">
            </th>
            <th>学生姓名</th>
            <th>提交时间</th>
            <th>提交次数</th>
            <th>得分</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="submission in filteredSubmissions" :key="submission.id">
            <td>
              <input
                  type="checkbox"
                  :value="submission.id"
                  v-model="selectedSubmissions">
            </td>
            <td>{{ submission.studentName }}</td>
            <td>{{ formatDate(submission.submitTime) }}</td>
            <td>{{ submission.submitTimes }}</td>
            <td>
                <span v-if="submission.totalScore !== null">
                  {{ submission.totalScore }}/{{ homework.totalScore }}
                </span>
              <span v-else class="pending">待批改</span>
            </td>
            <td>
                <span :class="['status', submission.status.toLowerCase()]">
                  {{ getStatusText(submission.status) }}
                </span>
            </td>
            <td class="actions">
<!--              <button @click="viewSubmission(submission.id)" class="view-btn">-->
<!--                查看-->
<!--              </button>-->
              <button
                  v-if="submission.status === 'SUBMITTED'"
                  @click="gradeSubmission(submission.id)"
                  class="grade-btn">
                批改
              </button>
              <button
                  v-if="submission.status === 'GRADED'"
                  @click="returnSubmission(submission.id)"
                  class="return-btn">
                返回
              </button>
            </td>
          </tr>
          </tbody>
        </table>

        <div v-if="filteredSubmissions.length === 0" class="empty">
          {{ submissions.length === 0 ? '暂无提交记录' : '没有符合条件的记录' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import homeworkApi from '@/api/homework';

export default {
  name: 'HomeworkSubmissions',
  props: ['homeworkId'],
  data() {
    return {
      homework: {},
      submissions: [],
      filteredSubmissions: [],
      statistics: {},
      loading: false,
      statusFilter: '',
      searchKeyword: '',
      selectedSubmissions: []
    };
  },
  computed: {
    allSelected() {
      return this.filteredSubmissions.length > 0 &&
          this.selectedSubmissions.length === this.filteredSubmissions.length;
    }
  },
  async mounted() {
    await this.loadData();
  },
  methods: {
    async loadData() {
      this.loading = true;
      try {
        const [homeworkResponse, submissionsResponse, statisticsResponse] = await Promise.all([
          homeworkApi.getHomeworkById(this.homeworkId),
          homeworkApi.getHomeworkSubmissions(this.homeworkId),
          homeworkApi.getHomeworkStatistics(this.homeworkId)
        ]);

        if (homeworkResponse.data.success) {
          this.homework = homeworkResponse.data.data;
        }

        if (submissionsResponse.data.success) {
          this.submissions = submissionsResponse.data.data;
          this.filteredSubmissions = [...this.submissions];
        }

        if (statisticsResponse.data.success) {
          this.statistics = statisticsResponse.data.data;
        }
      } catch (error) {
        console.error('加载数据失败:', error);
        alert('加载数据失败');
      } finally {
        this.loading = false;
      }
    },
    filterSubmissions() {
      let filtered = [...this.submissions];

      // 状态筛选
      if (this.statusFilter) {
        filtered = filtered.filter(s => s.status === this.statusFilter);
      }

      // 关键词搜索
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase();
        filtered = filtered.filter(s =>
            s.studentName.toLowerCase().includes(keyword)
        );
      }

      this.filteredSubmissions = filtered;
      this.selectedSubmissions = [];
    },
    selectAll(event) {
      if (event.target.checked) {
        this.selectedSubmissions = this.filteredSubmissions.map(s => s.id);
      } else {
        this.selectedSubmissions = [];
      }
    },
    viewSubmission(submissionId) {
      // 跳转到提交详情页面
      this.$router.push(`/homework/submission/${submissionId}/view`);
    },
    gradeSubmission(submissionId) {
      this.$router.push(`/homework/submission/${submissionId}/grade`);
    },
    async returnSubmission(submissionId) {
      try {
        const response = await homeworkApi.returnGradedHomework([submissionId]);
        if (response.data.success) {
          alert('作业返回成功');
          await this.loadData();
        }
      } catch (error) {
        console.error('返回作业失败:', error);
        alert('返回作业失败');
      }
    },
    async batchReturn() {
      if (this.selectedSubmissions.length === 0) {
        alert('请选择要返回的提交记录');
        return;
      }

      if (!confirm(`确定要返回选中的 ${this.selectedSubmissions.length} 份作业吗？`)) {
        return;
      }

      try {
        const response = await homeworkApi.returnGradedHomework(this.selectedSubmissions);
        if (response.data.success) {
          alert('批量返回成功');
          this.selectedSubmissions = [];
          await this.loadData();
        }
      } catch (error) {
        console.error('批量返回失败:', error);
        alert('批量返回失败');
      }
    },
    exportSubmissions() {
      // 导出功能的简单实现
      const csvContent = this.generateCSV();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${this.homework.title}_提交记录.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    generateCSV() {
      const headers = ['学生姓名', '提交时间', '提交次数', '得分', '状态'];
      const rows = this.submissions.map(submission => [
        submission.studentName,
        this.formatDate(submission.submitTime),
        submission.submitTimes,
        submission.totalScore !== null ? `${submission.totalScore}/${this.homework.totalScore}` : '待批改',
        this.getStatusText(submission.status)
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    },
    getSubmissionRate() {
      if (!this.statistics.total_student_count) return 0;
      return Math.round((this.statistics.submitted_count / this.statistics.total_student_count) * 100);
    },
    getStatusText(status) {
      const statuses = {
        'SUBMITTED': '已提交',
        'GRADED': '已批改',
        'RETURNED': '已返回'
      };
      return statuses[status] || status;
    },
    formatDate(dateString) {
      if (!dateString) return '';
      return new Date(dateString).toLocaleString('zh-CN');
    }
  }
};
</script>

<style scoped>
.homework-submissions {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.back-btn {
  padding: 8px 16px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.header h1 {
  flex: 1;
  margin: 0;
  color: #333;
}

.actions {
  display: flex;
  gap: 10px;
}

.export-btn, .batch-btn {
  padding: 8px 16px;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.export-btn {
  background: #28a745;
}

.batch-btn {
  background: #007bff;
}

.batch-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.summary-item {
  text-align: center;
}

.summary-item .label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.summary-item .value {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.filters select,
.filters input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.submissions-table {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f8f9fa;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  font-weight: bold;
  color: #333;
}

.pending {
  color: #ffc107;
  font-style: italic;
}

.status.submitted {
  color: #007bff;
}

.status.graded {
  color: #28a745;
}

.status.returned {
  color: #6c757d;
}

.actions {
  display: flex;
  gap: 5px;
}

.view-btn, .grade-btn, .return-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.view-btn {
  background: #17a2b8;
  color: white;
}

.grade-btn {
  background: #ffc107;
  color: #212529;
}

.return-btn {
  background: #28a745;
  color: white;
}

.empty {
  text-align: center;
  padding: 40px;
  color: #666;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}
</style>