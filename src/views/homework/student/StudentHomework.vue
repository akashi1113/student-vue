<template>
  <div class="homework-list">
    <div class="header">
      <h1>我的作业</h1>
      <div class="controls">
        <div class="user-info">
          <span class="user-name">{{ userName || '未登录' }}</span>
        </div>
      </div>
    </div>

    <div class="homework-tabs">
      <button
          :class="{ active: activeTab === 'available' }"
          @click="switchTab('available')"
      >
        可提交作业
      </button>
      <button
          :class="{ active: activeTab === 'all' }"
          @click="switchTab('all')"
      >
        全部作业
      </button>
      <button
          :class="{ active: activeTab === 'submitted' }"
          @click="switchTab('submitted')"
      >
        已提交作业
      </button>
    </div>

    <div class="homework-grid">
      <div
          v-for="homework in homeworkList"
          :key="homework.id"
          class="homework-card"
          @click="viewHomework(homework.id)"
      >
        <div class="card-header">
          <h3>{{ homework.title }}</h3>
          <span :class="['status', homework.status.toLowerCase()]">
            {{ getStatusText(homework.status) }}
          </span>
        </div>

        <div class="card-meta">
          <p class="course">
            {{ homework.courseTitle || '未指定课程' }}
          </p>
          <p class="teacher">
            教师: {{ homework.teacherName || '未知教师' }}
          </p>
        </div>

        <div class="divider"></div>

        <p class="description">{{ homework.description || '暂无描述' }}</p>

        <div class="homework-meta">
          <span class="type">{{ getTypeText(homework.homeworkType) }}</span>
          <span class="score">
            总分: {{ homework.totalScore }}分
          </span>
          <span v-if="homework.submissionCount > 0" class="submitted">
            已提交 {{ homework.submissionCount }} 次
          </span>
        </div>

        <div class="homework-time">
          <div class="time-item">
            <span class="time-label">开始时间:</span>
            {{ formatDate(homework.startTime) }}
          </div>
          <div class="time-item">
            <span class="time-label">截止时间:</span>
            {{ formatDate(homework.endTime) }}
          </div>
          <div v-if="homework.isExpired" class="expired-notice">
            已过期
          </div>
        </div>

        <div class="homework-actions" @click.stop>
          <button
              v-if="canSubmit(homework)"
              @click="submitHomework(homework.id)"
              class="submit-btn"
          >
            {{ homework.submissionCount > 0 ? '重新提交' : '开始作业' }}
          </button>
          <button
              v-if="homework.submissionCount > 0"
              @click="viewSubmissions(homework.id)"
              class="view-btn"
          >
            查看提交
          </button>
          <button
              v-if="!canSubmit(homework) && homework.submissionCount === 0"
              class="disabled-btn"
              disabled
          >
            无法提交
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-if="!loading && homeworkList.length === 0" class="empty">
      <p>{{ getEmptyMessage() }}</p>
    </div>
  </div>
</template>

<script>
import homeworkApi from '@/api/homework';

export default {
  name: 'StudentHomework',
  data() {
    return {
      homeworkList: [],
      loading: false,
      activeTab: 'available',
      userName: ''
    };
  },
  mounted() {
    this.initUserInfo();
    this.loadHomework();
  },
  methods: {
    getToken() {
      return localStorage.getItem('token');
    },

    initUserInfo() {
      this.userName = localStorage.getItem('userName') || localStorage.getItem('username') || '学生';
    },

    checkAuth() {
      const token = this.getToken();
      if (!token) {
        this.$message.error('请先登录');
        this.$router.push('/login');
        return false;
      }
      return true;
    },

    switchTab(tab) {
      this.activeTab = tab;
      this.loadHomework();
    },

    async loadHomework() {
      if (!this.checkAuth()) return;

      this.loading = true;
      this.homeworkList = [];

      try {
        const token = this.getToken();
        let response;

        if (this.activeTab === 'available') {
          response = await homeworkApi.getAvailableHomework(token);
        } else if (this.activeTab === 'all') {
          response = await homeworkApi.getHomeworkByStudent(token);
        } else if (this.activeTab === 'submitted') {
          response = await homeworkApi.getStudentSubmissions(token);
          if (response.data.success && response.data.data) {
            this.processSubmissionData(response.data.data);
            return;
          }
        }

        if (response && response.data && response.data.success) {
          this.homeworkList = response.data.data || [];
        } else {
          throw new Error('数据格式错误');
        }
      } catch (error) {
        console.error('加载作业失败:', error);
        this.$message.error('加载作业失败，请稍后重试');

        if (error.response?.status === 401) {
          this.$message.error('登录已过期，请重新登录');
          this.$router.push('/login');
        }
      } finally {
        this.loading = false;
      }
    },

    processSubmissionData(submissions) {
      const homeworkMap = new Map();

      submissions.forEach(submission => {
        if (!homeworkMap.has(submission.homeworkId)) {
          homeworkMap.set(submission.homeworkId, {
            id: submission.homeworkId,
            title: submission.homeworkTitle || '未知作业',
            courseTitle: submission.courseTitle || '未知课程',
            teacherName: submission.teacherName || '未知教师',
            status: submission.homeworkStatus || 'PUBLISHED',
            description: submission.homeworkDescription || '',
            homeworkType: submission.homeworkType || 'MIXED',
            totalScore: submission.totalScore || 0,
            startTime: submission.startTime,
            endTime: submission.endTime,
            submissionCount: 0,
            submissions: []
          });
        }

        const homework = homeworkMap.get(submission.homeworkId);
        homework.submissionCount++;
        homework.submissions.push(submission);
      });

      this.homeworkList = Array.from(homeworkMap.values());
    },

    canSubmit(homework) {
      const now = new Date();
      const endTime = new Date(homework.endTime);
      return homework.status === 'PUBLISHED' && now <= endTime;
    },

    viewHomework(homeworkId) {
      this.$router.push(`/homework/${homeworkId}`);
    },

    submitHomework(homeworkId) {
      this.$router.push(`/homework/${homeworkId}/submit`);
    },

    viewSubmissions(homeworkId) {
      this.$router.push(`/homework/${homeworkId}/submission`);
    },

    getEmptyMessage() {
      const messages = {
        'available': '暂无可提交的作业',
        'all': '暂无作业',
        'submitted': '暂无已提交的作业'
      };
      return messages[this.activeTab] || '暂无数据';
    },

    getTypeText(type) {
      const types = {
        'SUBJECTIVE': '主观题',
        'OBJECTIVE': '客观题',
        'MIXED': '混合题'
      };
      return types[type] || type;
    },

    getStatusText(status) {
      const statuses = {
        'DRAFT': '草稿',
        'PUBLISHED': '已发布',
        'CLOSED': '已截止'
      };
      return statuses[status] || status;
    },

    formatDate(dateString) {
      if (!dateString) return '未设置';
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit'});
    }
  }
};
</script>

<style scoped>
.homework-list {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px 20px;
  background: #f8fafc;
  min-height: calc(100vh - 48px);
}

.header {
  background: white;
  padding: 20px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-left: 4px solid #3b82f6;
}

.header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1e3a8a;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f0f7ff;
  border-radius: 8px;
  font-size: 14px;
  color: #1e40af;
}

.homework-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: white;
  padding: 8px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.homework-tabs button {
  padding: 10px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s;
  color: #64748b;
}

.homework-tabs button.active {
  background: #3b82f6;
  color: white;
}

.homework-tabs button:hover {
  background: #e0e7ff;
  color: #1e40af;
}

.homework-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.homework-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.homework-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.1);
  border-color: #bfdbfe;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.card-header h3 {
  margin: 0;
  color: #1e3a8a;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  flex: 1;
}

.status {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  margin-left: 8px;
  white-space: nowrap;
}

.status.draft {
  background: #e0f2fe;
  color: #0369a1;
}

.status.published {
  background: #dbeafe;
  color: #1d4ed8;
}

.status.closed {
  background: #fee2e2;
  color: #b91c1c;
}

.card-meta {
  margin: 8px 0;
}

.course, .teacher {
  margin: 4px 0;
  color: #475569;
  font-size: 14px;
}

.divider {
  height: 1px;
  background: #f1f5f9;
  margin: 12px 0;
}

.description {
  margin: 12px 0;
  color: #475569;
  font-size: 14px;
  line-height: 1.6;
  flex-grow: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.homework-meta {
  display: flex;
  gap: 8px;
  margin: 16px 0;
  flex-wrap: wrap;
}

.type, .score, .submitted {
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}

.type {
  background: #dbeafe;
  color: #1d4ed8;
}

.score {
  background: #e0f2fe;
  color: #0369a1;
}

.submitted {
  background: #dcfce7;
  color: #166534;
}

.homework-time {
  background: #f8fafc;
  padding: 12px;
  border-radius: 8px;
  margin: 16px 0;
  font-size: 13px;
}

.time-item {
  margin: 6px 0;
  color: #475569;
}

.time-label {
  color: #64748b;
}

.expired-notice {
  color: #b91c1c;
  font-weight: 500;
}

.homework-actions {
  margin-top: auto;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.submit-btn, .view-btn, .disabled-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.submit-btn {
  background: #3b82f6;
  color: white;
}

.submit-btn:hover {
  background: #2563eb;
}

.view-btn {
  background: #60a5fa;
  color: white;
}

.view-btn:hover {
  background: #3b82f6;
}

.disabled-btn {
  background: #e2e8f0;
  color: #64748b;
  cursor: not-allowed;
}

.loading, .empty {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  margin-top: 20px;
  grid-column: 1 / -1;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 16px;
  border: 4px solid rgba(59, 130, 246, 0.1);
  border-radius: 50%;
  border-top-color: #3b82f6;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty p {
  font-size: 16px;
  color: #64748b;
  margin: 0;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .homework-grid {
    grid-template-columns: 1fr;
  }

  .homework-tabs {
    overflow-x: auto;
    padding-bottom: 8px;
  }

  .homework-tabs button {
    white-space: nowrap;
  }

  .homework-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .homework-list {
    padding: 16px 12px;
  }

  .header {
    padding: 16px;
  }

  .homework-card {
    padding: 16px;
  }
}
</style>