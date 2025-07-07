<template>
  <div class="exam-result-container">
    <div class="result-header">
      <h1 class="exam-title">{{ exam.name }} - 考试结果</h1>
      <div class="exam-meta">
        <span class="meta-item">
          <i class="icon-calendar"></i>
          {{ formatDate(exam.createdAt) }}
        </span>
        <span class="meta-item">
          <i class="icon-clock"></i>
          考试时长: {{ exam.duration }}分钟
        </span>
      </div>
    </div>

    <div v-if="loading" class="loading-indicator">
      <div class="spinner"></div>
      <span>正在加载结果...</span>
    </div>

    <div v-else-if="error" class="error-message">
      <i class="error-icon"></i>
      <span>{{ error }}</span>
      <button @click="loadExamData" class="retry-btn">重试</button>
    </div>

    <div v-else class="result-content">
      <!-- 成绩概览 -->
      <div class="summary-card" :class="result.passed ? 'passed' : 'failed'">
        <div class="score-display">
          <div class="score-circle">
            <span class="score-value">{{ result.totalScore }}</span>
            <span class="score-max">/ {{ result.maxScore }}</span>
          </div>
          <div class="score-label">
            <span class="status-badge" :class="result.passed ? 'passed' : 'failed'">
              {{ result.passed ? '通过' : '未通过' }}
            </span>
            <p>及格分数: {{ result.passingScore }}</p>
          </div>
        </div>

        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-value">{{ correctCount }}</span>
            <span class="stat-label">答对</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ wrongCount }}</span>
            <span class="stat-label">答错</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ unansweredCount }}</span>
            <span class="stat-label">未答</span>
          </div>
        </div>
      </div>

      <!-- 题目分析 -->
      <div class="analysis-section">
        <h2 class="section-title">
          <i class="icon-analysis"></i>
          题目分析
        </h2>

        <div class="analysis-tabs">
          <button
              v-for="tab in tabs"
              :key="tab.value"
              :class="{ active: activeTab === tab.value }"
              @click="activeTab = tab.value"
          >
            {{ tab.label }} ({{ tabCounts[tab.value] }})
          </button>
        </div>

        <div class="question-list">
          <div
              v-for="item in filteredAnalysis"
              :key="item.questionId"
              class="question-card"
              :class="{
              'correct': item.isCorrect,
              'wrong': !item.isCorrect && item.studentAnswer,
              'unanswered': !item.studentAnswer
            }"
          >
            <div class="question-header">
              <h3>题目 {{ item.questionId }}</h3>
              <span class="score-badge">
                {{ item.earnedScore }} / {{ item.questionScore }}分
              </span>
            </div>

            <div class="answer-section">
              <div class="answer-row">
                <span class="answer-label">你的答案:</span>
                <span class="answer-value" :class="{ empty: !item.studentAnswer }">
                  {{ item.studentAnswer || '未作答' }}
                </span>
              </div>
              <div class="answer-row">
                <span class="answer-label">正确答案:</span>
                <span class="answer-value">{{ item.correctAnswer }}</span>
              </div>
            </div>

            <!-- 题目解析 -->
            <div v-if="item.analysis" class="analysis-section">
              <div class="section-header">
                <i class="icon-explanation"></i>
                <h4>题目解析</h4>
              </div>
              <div class="section-content">{{ item.analysis }}</div>
            </div>

            <!-- AI反馈 -->
            <div v-if="item.aiFeedback" class="ai-feedback-section">
              <div class="section-header">
                <i class="icon-ai"></i>
                <h4>AI反馈</h4>
                <span v-if="item.aiScoreRatio" class="score-ratio">匹配度: {{ item.aiScoreRatio*100 }}%</span>
              </div>
              <div class="section-content">{{ item.aiFeedback }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button @click="backToList" class="back-btn">
          <i class="icon-back"></i>
          返回考试列表
        </button>
        <button v-if="exam.allowRetake" @click="retakeExam" class="retake-btn">
          <i class="icon-retake"></i>
          重新考试
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import examApi from '../../../api/exam';
import questionApi from '../../../api/question';

export default {
  name: 'ExamResult',
  props: {
    examId: {
      type: [String, Number],
      required: true
    }
  },
  data() {
    return {
      exam: {},
      result: {},
      analysis: [],
      loading: false,
      error: null,
      activeTab: 'all'
    };
  },
  computed: {
    tabs() {
      return [
        { label: '全部', value: 'all' },
        { label: '答对', value: 'correct' },
        { label: '答错', value: 'wrong' },
        { label: '未答', value: 'unanswered' }
      ];
    },
    tabCounts() {
      return {
        all: this.safeAnalysis.length,
        correct: this.correctCount,
        wrong: this.wrongCount,
        unanswered: this.unansweredCount
      };
    },
    safeAnalysis() {
      return Array.isArray(this.analysis) ? this.analysis : [];
    },
    filteredAnalysis() {
      if (this.activeTab === 'all') return this.safeAnalysis;
      return this.safeAnalysis.filter(item => {
        if (this.activeTab === 'correct') return item.isCorrect;
        if (this.activeTab === 'wrong') return !item.isCorrect && item.studentAnswer;
        if (this.activeTab === 'unanswered') return !item.studentAnswer;
        return true;
      });
    },
    correctCount() {
      return this.safeAnalysis.filter(item => item.isCorrect).length;
    },
    wrongCount() {
      return this.safeAnalysis.filter(item => !item.isCorrect && item.studentAnswer).length;
    },
    unansweredCount() {
      return this.safeAnalysis.filter(item => !item.studentAnswer).length;
    }
  },
  methods: {
    // 获取token的统一方法
    getToken() {
      return localStorage.getItem('token');
    },

    // 检查认证状态
    checkAuth() {
      const token = this.getToken();
      if (!token) {
        this.error = '未找到认证信息，请重新登录';
        this.$router.push('/login');
        return false;
      }
      return true;
    },

    // 统一处理API响应的方法（参考exam.js的模式）
    extractData(response) {
      console.log('API Response:', response);

      // 如果response直接是数据
      if (response && typeof response === 'object' && !response.data) {
        return response;
      }

      // 如果response有data属性
      if (response && response.data) {
        // 如果是{success: true, data: {...}}格式
        if (response.data.success && response.data.data !== undefined) {
          return response.data.data;
        }
        // 如果data直接是对象或数组
        if (typeof response.data === 'object') {
          return response.data;
        }
        return response.data;
      }

      // 兜底返回原始response
      return response;
    },

    // 确保数据是数组的辅助方法
    ensureArray(data) {
      if (Array.isArray(data)) {
        return data;
      }
      if (data && typeof data === 'object') {
        if (data.items && Array.isArray(data.items)) {
          return data.items;
        }
        if (data.list && Array.isArray(data.list)) {
          return data.list;
        }
        if (data.data && Array.isArray(data.data)) {
          return data.data;
        }
        if (data.length !== undefined) {
          return Object.values(data);
        }
      }
      return [];
    },

    formatDate(dateString) {
      if (!dateString) return '未知日期';
      const date = new Date(dateString);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    },

    async loadExamData() {
      this.loading = true;
      this.error = null;

      try {
        if (!this.checkAuth()) {
          return;
        }

        console.log('Loading exam result data for exam ID:', this.examId);

        // 获取考试详情（无需token）
        const examResponse = await examApi.getExamById(this.examId);
        console.log('Exam response:', examResponse);
        this.exam = this.extractData(examResponse) || {};

        // 获取考试成绩（需要token）
        const token = this.getToken();
        console.log('当前使用的token:', token);
        console.log('Token字符编码:', [...token].map(c => c.charCodeAt(0)));

        // 测试：先调用成功的API
        console.log('=== 测试成功的API调用 ===');
        const resultResponse = await examApi.getExamScore(this.examId, token);
        console.log('Result response:', resultResponse);
        this.result = this.extractData(resultResponse) || {};

        // 初始化analysis为空数组
        this.analysis = [];

        // 如果有考试记录ID，获取题目分析
        if (this.result.examRecordId) {
          console.log('=== 测试问题API调用 ===');
          console.log('Loading question analysis for record ID:', this.result.examRecordId);
          console.log('使用相同的token:', token);

          try {
            // 在调用前再次验证token
            console.log('调用前token验证:');
            console.log('- Token长度:', token.length);
            console.log('- 是否包含Bearer:', token.includes('Bearer'));
            console.log('- Token前50个字符:', token.substring(0, 50));

            const analysisResponse = await questionApi.getQuestionAnalysis(this.result.examRecordId, token);
            console.log('Analysis response:', analysisResponse);
            const analysisData = this.extractData(analysisResponse);

            this.analysis = this.ensureArray(analysisData);
            console.log('Processed analysis:', this.analysis);
          } catch (analysisError) {
            console.error('Failed to load question analysis:', analysisError);
            console.error('分析错误的完整信息:', {
              message: analysisError.message,
              response: analysisError.response,
              status: analysisError.response?.status,
              data: analysisError.response?.data,
              config: analysisError.config
            });

            this.analysis = [];
          }
        } else {
          console.warn('No exam record ID found in result');
          this.analysis = [];
        }

        console.log('Exam result data loaded successfully');
      } catch (error) {
        console.error('Failed to load exam result:', error);
        // ... 错误处理保持不变
      } finally {
        this.loading = false;
      }
    },

    backToList() {
      this.$router.push('/exams');
    },

    async retakeExam() {
      try {
        if (!this.checkAuth()) {
          return;
        }

        // 确认重新考试
        const confirmed = await this.$confirm(
            '确定要重新考试吗？这将开始一次新的考试。',
            '重新考试',
            {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning'
            }
        );

        if (confirmed) {
          this.$router.push(`/exams/${this.examId}/take`);
        }
      } catch (error) {
        // 用户取消或其他错误
        if (error !== 'cancel') {
          console.error('Retake exam error:', error);
          this.$message.error('重新考试失败：' + (error.message || '请稍后重试'));
        }
      }
    }
  },

  created() {
    this.loadExamData();
  }
};
</script>

<style scoped>
/* 基础样式 */
.exam-result-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 30px 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.result-header {
  margin-bottom: 30px;
  text-align: center;
}

.exam-title {
  color: #2c3e50;
  font-size: 28px;
  margin-bottom: 10px;
  position: relative;
  display: inline-block;
}

.exam-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(to right, #409EFF, #42b983);
}

.exam-meta {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 15px;
  color: #666;
  font-size: 14px;
}

.meta-item {
  display: flex;
  align-items: center;
}

/* 图标样式 */
.icon-calendar, .icon-clock, .icon-analysis,
.icon-back, .icon-retake, .error-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 6px;
  vertical-align: middle;
}

.icon-calendar {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23666' d='M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10zM5 7V5h14v2H5zm2 4h10v2H7zm4 4h6v2h-6z'/%3E%3C/svg%3E") no-repeat center;
}

.icon-clock {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23666' d='M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z'/%3E%3C/svg%3E") no-repeat center;
}

.icon-analysis {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23409EFF' d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z'/%3E%3C/svg%3E") no-repeat center;
}

.icon-back {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23fff' d='M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z'/%3E%3C/svg%3E") no-repeat center;
}

.icon-retake {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23fff' d='M12 5V1L7 6l5 5V7c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6H4c0 4.4 3.6 8 8 8s8-3.6 8-8-3.6-8-8-8z'/%3E%3C/svg%3E") no-repeat center;
}

/* 加载指示器 */
.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(64, 158, 255, 0.2);
  border-radius: 50%;
  border-top-color: #409EFF;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 错误提示 */
.error-message {
  background-color: #fef0f0;
  color: #f56c6c;
  padding: 25px;
  border-radius: 8px;
  text-align: center;
  max-width: 500px;
  margin: 0 auto;
}

.error-icon {
  width: 24px;
  height: 24px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23f56c6c' d='M12 2L1 21h22L12 2zm0 3.5L19.5 19h-15L12 5.5zM12 16c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm-1-4V8h2v4h-2z'/%3E%3C/svg%3E") no-repeat center;
  margin-bottom: 15px;
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

/* 成绩概览卡片 */
.summary-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  padding: 30px;
  margin-bottom: 30px;
  transition: all 0.3s ease;
}

.summary-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.summary-card.passed {
  border-left: 5px solid #42b983;
}

.summary-card.failed {
  border-left: 5px solid #f56c6c;
}

.score-display {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.score-circle {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-right: 30px;
}

.score-value {
  font-size: 42px;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
}

.score-max {
  font-size: 16px;
  color: #666;
  margin-top: 5px;
}

.score-label {
  text-align: left;
}

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
}

.status-badge.passed {
  background-color: #e8f5e9;
  color: #42b983;
}

.status-badge.failed {
  background-color: #ffebee;
  color: #f56c6c;
}

.summary-stats {
  display: flex;
  justify-content: space-around;
  border-top: 1px dashed #eee;
  padding-top: 20px;
}

.stat-item {
  text-align: center;
  padding: 0 15px;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 5px;
}

.stat-item:nth-child(1) .stat-value {
  color: #42b983;
}

.stat-item:nth-child(2) .stat-value {
  color: #f56c6c;
}

.stat-item:nth-child(3) .stat-value {
  color: #909399;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

/* 题目分析区域 */
.analysis-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  padding: 30px;
  margin-bottom: 30px;
}

.ai-feedback-section {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid #409EFF;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  gap: 8px;
}

.section-header h4 {
  margin: 0;
  font-size: 16px;
  color: #409EFF;
}

.score-ratio {
  margin-left: auto;
  padding: 2px 8px;
  background-color: rgba(64, 158, 255, 0.1);
  border-radius: 4px;
  color: #409EFF;
  font-size: 12px;
  font-weight: 500;
}

.section-content {
  line-height: 1.6;
  color: #333;
}

/* AI图标 */
.icon-ai {
  display: inline-block;
  width: 18px;
  height: 18px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23409EFF' d='M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.522 4.82 3.889 6.115l-.78 2.77 3.116-1.65c.88.275 1.823.425 2.775.425 4.97 0 9-3.186 9-7.115C21 6.186 16.97 3 12 3zm0 1c4.416 0 8 2.691 8 6.115 0 3.424-3.584 6.115-8 6.115-.875 0-1.74-.14-2.56-.414l-.32-.107-1.793.95.48-1.706-.176-.317C6.342 14.043 5 12.183 5 10.115 5 6.691 8.584 4 12 4zm0 2.5a1 1 0 100 2 1 1 0 000-2zm-4 0a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2z'/%3E%3C/svg%3E") no-repeat center;
}

/* 解析图标 */
.icon-explanation {
  display: inline-block;
  width: 18px;
  height: 18px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%2342b983' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z'/%3E%3C/svg%3E") no-repeat center;
}

.section-title {
  color: #2c3e50;
  font-size: 22px;
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.analysis-tabs {
  display: flex;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}

.analysis-tabs button {
  padding: 10px 20px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  transition: all 0.3s;
  position: relative;
  margin-right: 10px;
}

.analysis-tabs button:hover {
  color: #409EFF;
}

.analysis-tabs button.active {
  color: #409EFF;
  border-bottom-color: #409EFF;
}

/* 题目卡片 */
.question-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.question-card {
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s ease;
}

.question-card.correct {
  background-color: rgba(66, 185, 131, 0.05);
  border-left: 4px solid #42b983;
}

.question-card.wrong {
  background-color: rgba(245, 108, 108, 0.05);
  border-left: 4px solid #f56c6c;
}

.question-card.unanswered {
  background-color: rgba(144, 147, 153, 0.05);
  border-left: 4px solid #909399;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.question-header h3 {
  margin: 0;
  font-size: 18px;
  color: #2c3e50;
}

.score-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.question-card.correct .score-badge {
  background-color: #e8f5e9;
  color: #42b983;
}

.question-card.wrong .score-badge {
  background-color: #ffebee;
  color: #f56c6c;
}

.question-card.unanswered .score-badge {
  background-color: #f5f7fa;
  color: #909399;
}

.answer-section {
  margin: 15px 0;
}

.answer-row {
  display: flex;
  margin-bottom: 8px;
  align-items: baseline;
}

.answer-label {
  font-weight: 500;
  color: #666;
  min-width: 80px;
}

.answer-value {
  flex: 1;
  word-break: break-word;
}

.answer-value.empty {
  color: #909399;
  font-style: italic;
}

.question-card.correct .answer-value {
  color: #42b983;
}

.question-card.wrong .answer-value {
  color: #f56c6c;
}

.analysis-label {
  font-weight: 500;
  color: #666;
  margin-bottom: 5px;
}

.analysis-content {
  background-color: #f9f9f9;
  padding: 12px;
  border-radius: 6px;
  line-height: 1.6;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 40px;
}

.back-btn, .retake-btn {
  padding: 12px 30px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.back-btn {
  background-color: #409EFF;
  color: white;
}

.back-btn:hover {
  background-color: #66b1ff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.retake-btn {
  background-color: #42b983;
  color: white;
}

.retake-btn:hover {
  background-color: #369f6b;
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .exam-title {
    font-size: 24px;
  }

  .score-display {
    flex-direction: column;
    text-align: center;
  }

  .score-circle {
    margin-right: 0;
    margin-bottom: 20px;
  }

  .summary-stats {
    flex-direction: column;
    gap: 15px;
  }

  .analysis-tabs {
    flex-wrap: wrap;
  }

  .action-buttons {
    flex-direction: column;
    gap: 15px;
  }

  .back-btn, .retake-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .exam-title {
    font-size: 20px;
  }

  .exam-meta {
    flex-direction: column;
    gap: 8px;
  }

  .section-title {
    font-size: 20px;
  }

  .analysis-tabs button {
    padding: 8px 12px;
    font-size: 13px;
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .ai-feedback-section,
  .analysis-section {
    padding: 12px;
  }

  .section-header h4 {
    font-size: 15px;
  }

  .score-ratio {
    font-size: 11px;
  }
}
</style>