<template>
  <div class="homework-submit">
    <div class="header">
      <button @click="goBack" class="back-btn">
        <span class="icon">←</span> 返回
      </button>
      <h1>{{ homework.title }} - 作业提交</h1>
      <div class="time-info" v-if="homework.endTime">
        <span :class="{ 'time-warning': isNearDeadline, 'time-expired': isExpired }">
          {{ isExpired ? '已过期' : '截止时间' }}: {{ formatDate(homework.endTime) }}
        </span>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="!homework.id" class="error">
      <p>作业不存在或已被删除</p>
      <button @click="goBack" class="back-btn">返回</button>
    </div>

    <div v-else-if="isExpired && !canSubmitAfterExpired" class="expired-notice">
      <h3>作业已过期</h3>
      <p>该作业已超过截止时间，无法提交</p>
      <button @click="goBack" class="back-btn">返回</button>
    </div>

    <div v-else-if="!hasAccess" class="no-access">
      <h3>无权限访问</h3>
      <p>您没有权限提交此作业</p>
      <button @click="goBack" class="back-btn">返回</button>
    </div>

    <div v-else class="content">
      <div class="homework-info">
        <div class="info-grid">
          <div class="info-item">
            <span class="label">课程:</span>
            <span class="value">{{ homework.courseTitle || '未指定' }}</span>
          </div>
          <div class="info-item">
            <span class="label">总分:</span>
            <span class="value">{{ homework.totalScore }}分</span>
          </div>
          <div class="info-item">
            <span class="label">类型:</span>
            <span class="value">{{ getTypeText(homework.homeworkType) }}</span>
          </div>
          <div class="info-item">
            <span class="label">允许重提:</span>
            <span class="value">{{ homework.allowResubmit ? '是' : '否' }}</span>
          </div>
        </div>
        <div v-if="homework.description" class="description">
          <span class="label">作业说明:</span>
          <p>{{ homework.description }}</p>
        </div>
      </div>

      <!-- 提交历史 -->
      <div v-if="submissionHistory.length > 0" class="submission-history">
        <h3>提交历史</h3>
        <div class="history-list">
          <div
              v-for="(submission, index) in submissionHistory"
              :key="submission.id"
              class="history-item"
          >
            <div class="history-header">
              <span class="submission-number">第{{ index + 1 }}次提交</span>
              <span class="submission-time">{{ formatDate(submission.submitTime) }}</span>
              <span :class="['submission-status', submission.status?.toLowerCase()]">
                {{ getSubmissionStatusText(submission.status) }}
              </span>
            </div>
            <div v-if="submission.score !== null" class="submission-score">
              得分: {{ submission.score }} / {{ homework.totalScore }}
            </div>
          </div>
        </div>
      </div>

      <form @submit.prevent="submitHomework" class="submit-form">
        <div class="questions-section">
          <h3>答题区域 (共{{ homework.questions?.length || 0 }}题)</h3>

          <div
              v-for="(question, index) in homework.questions"
              :key="question.id"
              class="question-item">
            <div class="question-header">
              <span class="question-number">第{{ index + 1 }}题</span>
              <span class="question-type">{{ getQuestionTypeText(question.questionType) }}</span>
              <span class="question-score">{{ question.score }}分</span>
              <span v-if="!answers[question.id] || answers[question.id].toString().trim() === ''" class="unanswered">
                未作答
              </span>
            </div>

            <div class="question-content">
              {{ question.questionContent }}
            </div>

            <!-- 单选题 -->
            <div v-if="question.questionType === 'SINGLE_CHOICE'" class="answer-section">
              <div v-for="(option, optIndex) in parseOptions(question.questionOptions)"
                   :key="optIndex" class="option">
                <label>
                  <input
                      type="radio"
                      :name="`question_${question.id}`"
                      :value="String.fromCharCode(65 + optIndex)"
                      v-model="answers[question.id]">
                  <span class="option-text">
                    {{ String.fromCharCode(65 + optIndex) }}. {{ option }}
                  </span>
                </label>
              </div>
            </div>

            <!-- 多选题 -->
            <div v-else-if="question.questionType === 'MULTIPLE_CHOICE'" class="answer-section">
              <div v-for="(option, optIndex) in parseOptions(question.questionOptions)"
                   :key="optIndex" class="option">
                <label>
                  <input
                      type="checkbox"
                      :value="String.fromCharCode(65 + optIndex)"
                      :checked="isMultipleChoiceSelected(question.id, String.fromCharCode(65 + optIndex))"
                      @change="updateMultipleChoice(question.id, String.fromCharCode(65 + optIndex), $event)">
                  <span class="option-text">
                    {{ String.fromCharCode(65 + optIndex) }}. {{ option }}
                  </span>
                </label>
              </div>
            </div>

            <!-- 填空题 -->
            <div v-else-if="question.questionType === 'FILL_BLANK'" class="answer-section">
              <input
                  type="text"
                  v-model="answers[question.id]"
                  placeholder="请输入答案"
                  class="text-input">
            </div>

            <!-- 简答题/论述题 -->
            <div v-else class="answer-section">
              <textarea
                  v-model="answers[question.id]"
                  placeholder="请输入答案"
                  class="textarea-input"
                  rows="6"></textarea>
              <div class="char-count">
                {{ getCharCount(answers[question.id]) }} 字符
              </div>
            </div>
          </div>
        </div>

        <div class="submit-section">
          <div class="submit-info">
            <div class="progress-info">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
              </div>
              <span class="progress-text">
                已完成 {{ answeredCount }} / {{ homework.questions?.length || 0 }} 题
              </span>
            </div>

            <div class="submit-rules">
              <p v-if="homework.allowResubmit">
                允许重新提交，最多 {{ homework.maxSubmitTimes || '无限' }} 次
              </p>
              <p v-else>
                仅允许提交一次，请仔细检查后提交
              </p>
              <p v-if="isNearDeadline" class="warning-text">
                距离截止时间不足1小时，请尽快提交
              </p>
            </div>
          </div>

          <div class="submit-actions">
            <button type="button" @click="saveDraft" class="save-btn" :disabled="saving">
              {{ saving ? '保存中...' : '保存草稿' }}
            </button>
            <button type="submit" :disabled="submitting || isExpired" class="submit-btn">
              {{ submitting ? '提交中...' : '提交作业' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import homeworkApi from '@/api/homework';

export default {
  name: 'HomeworkSubmit',
  data() {
    return {
      homework: {},
      answers: {},
      submissionHistory: [],
      loading: false,
      submitting: false,
      saving: false,
      isNearDeadline: false,
      isExpired: false,
      hasAccess: false,
      canSubmitAfterExpired: false
    };
  },
  computed: {
    homeworkId() {
      return this.$route.params.homeworkId;
    },
    answeredCount() {
      return Object.values(this.answers).filter(answer =>
          answer && answer.toString().trim() !== ''
      ).length;
    },
    progressPercentage() {
      const total = this.homework.questions?.length || 0;
      if (total === 0) return 0;
      return Math.round((this.answeredCount / total) * 100);
    }
  },
  async mounted() {
    await this.checkAccess();
    if (this.hasAccess) {
      await this.loadHomework();
      await this.loadSubmissionHistory();
      this.checkDeadline();
      this.loadDraft();
    }
  },
  methods: {
    getToken() {
      return localStorage.getItem('token');
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

    async checkAccess() {
      if (!this.checkAuth()) return;

      try {
        const token = this.getToken();
        const response = await homeworkApi.checkHomeworkAccess(this.homeworkId, token);
        this.hasAccess = response.data.success && response.data.data;

        if (!this.hasAccess) {
          this.$message.error('您没有权限访问此作业');
        }
      } catch (error) {
        console.error('检查权限失败:', error);
        this.hasAccess = false;
        if (error.response?.status === 401) {
          this.$message.error('登录已过期，请重新登录');
          this.$router.push('/login');
        }
      }
    },

    async loadHomework() {
      this.loading = true;
      try {
        const response = await homeworkApi.getHomeworkById(this.homeworkId);
        if (response.data.success) {
          this.homework = response.data.data;
          this.initializeAnswers();
        } else {
          throw new Error('加载作业失败');
        }
      } catch (error) {
        console.error('加载作业失败:', error);
        this.$message.error('加载作业失败');
        if (error.response?.status === 401) {
          this.$router.push('/login');
        } else {
          this.goBack();
        }
      } finally {
        this.loading = false;
      }
    },

    async loadSubmissionHistory() {
      try {
        const token = this.getToken();
        const response = await homeworkApi.getStudentSubmission(this.homeworkId, token);
        if (response.data.success) {
          this.submissionHistory = response.data.data || [];
        }
      } catch (error) {
        console.error('加载提交历史失败:', error);
      }
    },

    initializeAnswers() {
      const initialAnswers = {};
      if (this.homework.questions) {
        this.homework.questions.forEach(question => {
          initialAnswers[question.id] = '';
        });
      }
      this.answers = initialAnswers;
    },

    checkDeadline() {
      if (this.homework.endTime) {
        const endTime = new Date(this.homework.endTime);
        const now = new Date();
        const timeDiff = endTime - now;

        this.isExpired = timeDiff <= 0;
        this.isNearDeadline = timeDiff < 60 * 60 * 1000 && timeDiff > 0;
      }
    },

    async saveDraft() {
      this.saving = true;
      try {
        const draftKey = `homework_draft_${this.homeworkId}`;
        const draftData = {
          answers: this.answers,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem(draftKey, JSON.stringify(draftData));
        this.$message.success('草稿保存成功');
      } catch (error) {
        console.error('保存草稿失败:', error);
        this.$message.error('保存草稿失败');
      } finally {
        this.saving = false;
      }
    },

    loadDraft() {
      const draftKey = `homework_draft_${this.homeworkId}`;
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        try {
          const draftData = JSON.parse(draft);
          const draftAnswers = draftData.answers || {};

          // 处理多选题的格式
          Object.keys(draftAnswers).forEach(questionId => {
            const question = this.homework.questions?.find(q => q.id == questionId);
            if (question && question.questionType === 'MULTIPLE_CHOICE') {
              if (Array.isArray(draftAnswers[questionId])) {
                draftAnswers[questionId] = draftAnswers[questionId].join(',');
              } else if (typeof draftAnswers[questionId] === 'string') {
                draftAnswers[questionId] = draftAnswers[questionId]
                    .split(',')
                    .filter(item => item.trim() !== '')
                    .join(',');
              }
            }
          });

          this.answers = { ...this.answers, ...draftAnswers };

          if (draftData.savedAt) {
            this.$message.info(`已加载草稿 (保存于 ${this.formatDate(draftData.savedAt)})`);
          }
        } catch (error) {
          console.error('加载草稿失败:', error);
        }
      }
    },

    async submitHomework() {
      const unansweredQuestions = this.homework.questions?.filter(question => {
        const answer = this.answers[question.id];
        return !answer || answer.toString().trim() === '';
      }) || [];

      if (unansweredQuestions.length > 0) {
        const questionNumbers = unansweredQuestions.map(question => {
          const index = this.homework.questions.findIndex(q => q.id === question.id);
          return index + 1;
        });

        const confirm = await this.$confirm(
            `第 ${questionNumbers.join(', ')} 题未作答，确定要提交吗？`,
            '确认提交',
            {
              confirmButtonText: '确定提交',
              cancelButtonText: '继续答题',
              type: 'warning'
            }
        ).catch(() => false);

        if (!confirm) return;
      }

      this.submitting = true;
      try {
        const token = this.getToken();
        const submitData = {
          answers: this.homework.questions?.map(question => ({
            questionId: question.id,
            studentAnswer: this.answers[question.id] || ''
          })) || []
        };

        const response = await homeworkApi.submitHomework(this.homeworkId, submitData, token);

        if (response.data.success) {
          const draftKey = `homework_draft_${this.homeworkId}`;
          localStorage.removeItem(draftKey);

          this.$message.success('作业提交成功！');
          this.$router.push(`/homework/${this.homeworkId}`);
        } else {
          throw new Error(response.data.message || '提交失败');
        }
      } catch (error) {
        console.error('提交作业失败:', error);
        this.$message.error('提交作业失败: ' + (error.response?.data?.message || error.message));

        if (error.response?.status === 401) {
          this.$message.error('登录已过期，请重新登录');
          this.$router.push('/login');
        }
      } finally {
        this.submitting = false;
      }
    },

    updateMultipleChoice(questionId, option, event) {
      let currentAnswer = this.answers[questionId] || '';
      let selectedOptions = [];

      if (currentAnswer && currentAnswer.trim() !== '') {
        selectedOptions = currentAnswer.split(',').filter(item => item.trim() !== '');
      }

      if (event.target.checked) {
        if (!selectedOptions.includes(option)) {
          selectedOptions.push(option);
        }
      } else {
        selectedOptions = selectedOptions.filter(item => item !== option);
      }

      this.answers[questionId] = selectedOptions.length > 0 ? selectedOptions.sort().join(',') : '';
    },

    isMultipleChoiceSelected(questionId, option) {
      const answer = this.answers[questionId];
      if (!answer || answer.trim() === '') return false;

      const selectedOptions = answer.split(',').filter(item => item.trim() !== '');
      return selectedOptions.includes(option);
    },

    goBack() {
      this.$router.go(-1);
    },

    getCharCount(text) {
      return text ? text.length : 0;
    },

    getTypeText(type) {
      const types = {
        'SUBJECTIVE': '主观题',
        'OBJECTIVE': '客观题',
        'MIXED': '混合题'
      };
      return types[type] || type;
    },

    getQuestionTypeText(type) {
      const types = {
        'SINGLE_CHOICE': '单选题',
        'MULTIPLE_CHOICE': '多选题',
        'FILL_BLANK': '填空题',
        'SHORT_ANSWER': '简答题',
        'ESSAY': '论述题'
      };
      return types[type] || type;
    },

    getSubmissionStatusText(status) {
      const statuses = {
        'SUBMITTED': '已提交',
        'GRADED': '已批改',
        'RETURNED': '已返回'
      };
      return statuses[status] || status;
    },

    parseOptions(optionsJson) {
      try {
        return JSON.parse(optionsJson) || [];
      } catch {
        return [];
      }
    },

    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
};
</script>

<style scoped>
.homework-submit {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
  background: #f8f9fa;
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  flex-wrap: wrap;
}

.back-btn {
  padding: 8px 16px;
  background: #1e88e5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #1565c0;
}

.header h1 {
  flex: 1;
  margin: 0;
  color: #333;
  font-size: 22px;
  min-width: 200px;
}

.time-info {
  font-size: 14px;
  color: #666;
}

.time-warning {
  color: #ff8c00;
  font-weight: 500;
}

.time-expired {
  color: #e53935;
  font-weight: 500;
}

.loading {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 8px;
  margin-top: 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 16px;
  border: 4px solid rgba(30, 136, 229, 0.1);
  border-radius: 50%;
  border-top-color: #1e88e5;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error, .expired-notice, .no-access {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 8px;
  margin-top: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.error p, .expired-notice p, .no-access p {
  margin-bottom: 20px;
}

.homework-info {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-weight: 500;
  color: #555;
}

.value {
  color: #333;
}

.description {
  border-top: 1px solid #eee;
  padding-top: 16px;
}

.description p {
  margin: 8px 0 0 0;
  color: #555;
  line-height: 1.6;
}

.submission-history {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.submission-history h3 {
  margin: 0 0 16px 0;
  color: #333;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #1e88e5;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
}

.submission-number {
  font-weight: 500;
  color: #333;
}

.submission-time {
  color: #666;
  font-size: 14px;
}

.submission-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.submission-status.submitted {
  background: #e3f2fd;
  color: #1565c0;
}

.submission-status.graded {
  background: #e8f5e9;
  color: #2e7d32;
}

.submission-status.returned {
  background: #e1f5fe;
  color: #0277bd;
}

.submission-score {
  font-size: 14px;
  color: #43a047;
  font-weight: 500;
}

.submit-form {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.questions-section {
  padding: 20px;
}

.questions-section h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.question-item {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 16px;
  background: #fff;
}

.question-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.question-number {
  font-weight: bold;
  color: #1e88e5;
}

.question-type {
  background: #e3f2fd;
  color: #1565c0;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.question-score {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.unanswered {
  background: #ffebee;
  color: #c62828;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.question-content {
  margin-bottom: 12px;
  line-height: 1.6;
  color: #333;
  padding: 12px;
  background: #fafafa;
  border-radius: 4px;
}

.answer-section {
  margin-top: 12px;
}

.option {
  margin: 8px 0;
}

.option label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.option label:hover {
  background-color: #f5f5f5;
}

.option input[type="radio"],
.option input[type="checkbox"] {
  accent-color: #1e88e5;
}

.text-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.text-input:focus {
  outline: none;
  border-color: #1e88e5;
  box-shadow: 0 0 0 2px rgba(30, 136, 229, 0.1);
}

.textarea-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  min-height: 120px;
  transition: border-color 0.2s;
}

.textarea-input:focus {
  outline: none;
  border-color: #1e88e5;
  box-shadow: 0 0 0 2px rgba(30, 136, 229, 0.1);
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: #757575;
  margin-top: 4px;
}

.submit-section {
  background: #f5f5f5;
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  border-radius: 0 0 8px 8px;
}

.submit-info {
  margin-bottom: 20px;
}

.progress-info {
  margin-bottom: 16px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: #1e88e5;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  color: #555;
}

.submit-rules {
  color: #555;
  font-size: 14px;
}

.submit-rules p {
  margin: 8px 0;
}

.warning-text {
  color: #ff8c00;
  font-weight: 500;
}

.submit-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.save-btn {
  padding: 10px 20px;
  background: #757575;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.save-btn:hover {
  background: #616161;
}

.save-btn:disabled {
  background: #bdbdbd;
  cursor: not-allowed;
}

.submit-btn {
  padding: 10px 20px;
  background: #1e88e5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.submit-btn:hover {
  background: #1565c0;
}

.submit-btn:disabled {
  background: #90caf9;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .homework-submit {
    padding: 16px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header h1 {
    font-size: 20px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .question-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .submit-actions {
    flex-direction: column;
  }

  .save-btn, .submit-btn {
    width: 100%;
  }

  .history-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .homework-submit {
    padding: 12px;
  }

  .header {
    padding: 16px;
  }

  .homework-info {
    padding: 16px;
  }

  .questions-section {
    padding: 16px;
  }

  .question-item {
    padding: 12px;
  }

  .submit-section {
    padding: 16px;
  }

  .text-input, .textarea-input {
    font-size: 16px;
  }
}

@media print {
  .header, .submit-section {
    display: none;
  }

  .homework-submit {
    padding: 0;
  }

  .question-item {
    break-inside: avoid;
    margin-bottom: 20px;
  }

  .option label {
    break-inside: avoid;
  }
}
</style>