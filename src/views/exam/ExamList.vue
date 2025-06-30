<template>
  <div class="exam-list-container">
    <h1 class="page-title">考试列表</h1>

    <div v-if="loading" class="loading-indicator">
      <div class="spinner"></div>
      <span>加载中...</span>
    </div>

    <div v-else-if="error" class="error-message">
      <i class="error-icon"></i>
      <span>{{ error }}</span>
      <button @click="fetchExams" class="retry-btn">重试</button>
    </div>

    <div v-else class="exam-grid">
      <div v-for="exam in exams" :key="exam.id" class="exam-card">
        <div class="card-header">
          <h2 class="exam-title">{{ exam.name }}</h2>
          <span class="duration-badge">{{ exam.duration }}分钟</span>
        </div>

        <p class="exam-description">{{ exam.description || '暂无考试说明' }}</p>

        <div class="card-footer">
          <div class="exam-meta">
            <span class="meta-item">
              <i class="icon-calendar"></i>
              {{ formatDate(exam.createdAt) }}
            </span>
          </div>

          <div class="action-buttons">
            <button @click="viewExamDetail(exam.id)" class="detail-btn">
              <i class="icon-eye"></i>
              查看详情
            </button>
            <button @click="startExam(exam.id)" class="start-btn">
              <i class="icon-play"></i>
              开始考试
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import examApi from '../../api/exam';

export default {
  name: 'ExamList',
  data() {
    return {
      exams: [],
      loading: false,
      error: null
    };
  },
  methods: {
    async fetchExams() {
      this.loading = true;
      this.error = null;
      try {
        const response = await examApi.getAllExams();
        this.exams = response.data.data;
      } catch (error) {
        this.error = '加载考试列表失败: ' + (error.message || '请稍后重试');
      } finally {
        this.loading = false;
      }
    },

    formatDate(dateString) {
      if (!dateString) return '未知日期';
      const date = new Date(dateString);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    },

    viewExamDetail(examId) {
      this.$router.push(`/exams/${examId}`);
    },

    startExam(examId) {
      this.$router.push(`/exams/${examId}/take`);
    }
  },
  created() {
    this.fetchExams();
  }
};
</script>

<style scoped>
/* 基础样式 */
.exam-list-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.page-title {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 30px;
  font-size: 28px;
  font-weight: 600;
  position: relative;
  padding-bottom: 15px;
}

.page-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 3px;
  background: linear-gradient(to right, #409EFF, #42b983);
}

/* 加载指示器 */
.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(64, 158, 255, 0.2);
  border-radius: 50%;
  border-top-color: #409EFF;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 错误提示 */
.error-message {
  background-color: #fef0f0;
  color: #f56c6c;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  max-width: 500px;
  margin: 0 auto;
}

.error-icon {
  display: inline-block;
  width: 24px;
  height: 24px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23f56c6c' d='M12 2L1 21h22L12 2zm0 3.5L19.5 19h-15L12 5.5zM12 16c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm-1-4V8h2v4h-2z'/%3E%3C/svg%3E") no-repeat center;
  margin-bottom: 10px;
}

.retry-btn {
  margin-top: 15px;
  padding: 8px 20px;
  background-color: #f56c6c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.retry-btn:hover {
  background-color: #f78989;
}

/* 考试网格布局 */
.exam-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 25px;
  margin-top: 20px;
}

/* 考试卡片样式 */
.exam-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
}

.exam-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
}

.card-header {
  padding: 20px 20px 15px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.exam-title {
  margin: 0;
  font-size: 18px;
  color: #333;
  flex: 1;
}

.duration-badge {
  background-color: #e6f7ff;
  color: #1890ff;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  margin-left: 10px;
}

.exam-description {
  padding: 15px 20px;
  margin: 0;
  color: #666;
  line-height: 1.5;
  flex: 1;
}

.card-footer {
  padding: 15px 20px;
  background-color: #f9f9f9;
  border-top: 1px solid #eee;
}

.exam-meta {
  margin-bottom: 12px;
  font-size: 13px;
  color: #888;
}

.meta-item {
  display: inline-flex;
  align-items: center;
}

.icon-calendar {
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-right: 5px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23888' d='M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10zM5 7V5h14v2H5zm2 4h10v2H7zm4 4h6v2h-6z'/%3E%3C/svg%3E") no-repeat center;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

button i {
  margin-right: 6px;
}

.detail-btn {
  background-color: #409EFF;
  color: white;
}

.detail-btn:hover {
  background-color: #66b1ff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.start-btn {
  background-color: #42b983;
  color: white;
}

.start-btn:hover {
  background-color: #369f6b;
  box-shadow: 0 2px 8px rgba(66, 185, 131, 0.3);
}

.icon-eye, .icon-play {
  display: inline-block;
  width: 14px;
  height: 14px;
}

.icon-eye {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23fff' d='M12 6a9.8 9.8 0 0 1 8 4.5 9.8 9.8 0 0 1-8 4.5 9.8 9.8 0 0 1-8-4.5A9.8 9.8 0 0 1 12 6zm0-2C7 4 2.7 7 1 12c1.7 5 6 8 11 8s9.3-3 11-8c-1.7-5-6-8-11-8zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0-2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z'/%3E%3C/svg%3E") no-repeat center;
}

.icon-play {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23fff' d='M8 5v14l11-7z'/%3E%3C/svg%3E") no-repeat center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .exam-grid {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .action-buttons {
    flex-direction: column;
  }

  button {
    width: 100%;
  }
}
</style>