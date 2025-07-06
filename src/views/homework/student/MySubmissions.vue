<template>
  <div class="my-submissions">
    <div class="header">
      <h1>我的作业提交记录</h1>
      <div class="controls">
        <input v-model="userId" placeholder="学生ID" @change="loadSubmissions" />
        <select v-model="statusFilter" @change="filterSubmissions">
          <option value="">所有状态</option>
          <option value="SUBMITTED">已提交</option>
          <option value="GRADED">已批改</option>
          <option value="RETURNED">已返回</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="content">
      <div class="submissions-list">
        <div
            v-for="submission in filteredSubmissions"
            :key="submission.id"
            class="submission-item">
          <div class="submission-header">
            <h3>{{ submission.homeworkTitle }}</h3>
            <span :class="['status', submission.status.toLowerCase()]">
              {{ getStatusText(submission.status) }}
            </span>
          </div>

          <div class="submission-info">
            <div class="info-item">
              <span class="label">课程:</span>
              <span>{{ submission.courseTitle }}</span>
            </div>
            <div class="info-item">
              <span class="label">提交时间:</span>
              <span>{{ formatDate(submission.submitTime) }}</span>
            </div>
            <div class="info-item">
              <span class="label">提交次数:</span>
              <span>{{ submission.submitTimes }}</span>
            </div>
            <div class="info-item">
              <span class="label">得分:</span>
              <span v-if="submission.totalScore !== null" class="score">
                {{ submission.totalScore }} 分
              </span>
              <span v-else class="pending">待批改</span>
            </div>
          </div>

          <div v-if="submission.teacherFeedback" class="feedback">
            <h4>教师反馈:</h4>
            <p>{{ submission.teacherFeedback }}</p>
          </div>

          <div class="submission-actions">
            <button @click="viewSubmission(submission)" class="view-btn">
              查看详情
            </button>
            <button
                v-if="submission.status === 'RETURNED'"
                @click="viewHomework(submission.homeworkId)"
                class="homework-btn">
              查看作业
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredSubmissions.length === 0" class="empty">
        {{ submissions.length === 0 ? '暂无提交记录' : '没有符合条件的记录' }}
      </div>
    </div>
  </div>
</template>

<script>
import homeworkApi from '@/api/homework';

export default {
  name: 'MySubmissions',
  data() {
    return {
      submissions: [],
      filteredSubmissions: [],
      loading: false,
      userId: 2, // 默认学生ID
      statusFilter: ''
    };
  },
  mounted() {
    this.loadSubmissions();
  },
  methods: {
    async loadSubmissions() {
      this.loading = true;
      try {
        const response = await homeworkApi.getStudentSubmissions(this.userId);
        if (response.data.success) {
          this.submissions = response.data.data;
          this.filteredSubmissions = [...this.submissions];
        }
      } catch (error) {
        console.error('加载提交记录失败:', error);
        alert('加载提交记录失败');
      } finally {
        this.loading = false;
      }
    },
    filterSubmissions() {
      if (this.statusFilter) {
        this.filteredSubmissions = this.submissions.filter(s => s.status === this.statusFilter);
      } else {
        this.filteredSubmissions = [...this.submissions];
      }
    },
    viewSubmission(submission) {
      // 跳转到提交详情页面
      this.$router.push(`/homework/${submission.homeworkId}/submission/student/${this.userId}`);
    },
    viewHomework(homeworkId) {
      this.$router.push(`/homework/${homeworkId}`);
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
.my-submissions {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.header h1 {
  margin: 0;
  color: #333;
}

.controls {
  display: flex;
  gap: 10px;
}

.controls input,
.controls select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.submissions-list {
  display: grid;
  gap: 20px;
}

.submission-item {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
}

.submission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.submission-header h3 {
  margin: 0;
  color: #333;
}

.status.submitted {
  background: #cce5ff;
  color: #0066cc;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status.graded {
  background: #d4edda;
  color: #155724;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status.returned {
  background: #f8f9fa;
  color: #6c757d;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.submission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.submission-header h3 {
  margin: 0;
  color: #333;
}

.status.submitted {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status.graded {
  background: #e8f5e8;
  color: #388e3c;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status.returned {
  background: #f3e5f5;
  color: #7b1fa2;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.submission-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  margin-bottom: 15px;
}

.info-item {
  display: flex;
  gap: 8px;
}

.info-item .label {
  font-weight: bold;
  color: #666;
  min-width: 80px;
}

.score {
  color: #28a745;
  font-weight: bold;
}

.pending {
  color: #ffc107;
  font-style: italic;
}

.feedback {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 15px;
}

.feedback h4 {
  margin: 0 0 8px 0;
  color: #333;
}

.feedback p {
  margin: 0;
  line-height: 1.6;
  color: #666;
}

.submission-actions {
  display: flex;
  gap: 10px;
}

.view-btn, .homework-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.view-btn {
  background: #007bff;
  color: white;
}

.homework-btn {
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