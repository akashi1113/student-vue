<!-- views/homework/HomeworkCreate.vue -->
<template>
  <div class="homework-create">
    <div class="header">
      <button @click="$router.go(-1)" class="back-btn">← 返回</button>
      <h1>创建作业</h1>
    </div>

    <form @submit.prevent="createHomework" class="create-form">
      <div class="basic-info">
        <h3>基本信息</h3>

        <div class="form-group">
          <label>作业标题 *</label>
          <input
              type="text"
              v-model="homework.title"
              required
              placeholder="请输入作业标题">
        </div>

        <div class="form-group">
          <label>选择课程 *</label>
          <select v-model="homework.courseId">
            <option value="">请选择课程</option>
            <option
                v-for="course in courseList"
                :key="course.id"
                :value="course.id">
              {{ course.title }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>作业描述</label>
          <textarea
              v-model="homework.description"
              placeholder="请输入作业描述"
              rows="4"></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>作业类型 *</label>
            <select v-model="homework.homeworkType" required>
              <option value="OBJECTIVE">客观题</option>
              <option value="SUBJECTIVE">主观题</option>
              <option value="MIXED">混合题</option>
            </select>
          </div>

          <div class="form-group">
            <label>总分 *</label>
            <input
                type="number"
                v-model="homework.totalScore"
                required
                min="1"
                step="0.5">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>开始时间 *</label>
            <input
                type="datetime-local"
                v-model="homework.startTime"
                required>
          </div>

          <div class="form-group">
            <label>截止时间 *</label>
            <input
                type="datetime-local"
                v-model="homework.endTime"
                required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>
              <input
                  type="checkbox"
                  v-model="homework.allowResubmit">
              允许重新提交
            </label>
          </div>

          <div class="form-group" v-if="homework.allowResubmit">
            <label>最大提交次数</label>
            <input
                type="number"
                v-model="homework.maxSubmitTimes"
                min="1"
                max="10">
          </div>
        </div>
      </div>

      <div class="questions-section">
        <div class="questions-header">
          <h3>题目设置</h3>
          <button type="button" @click="addQuestion" class="add-btn">
            + 添加题目
          </button>
        </div>

        <div class="questions-list">
          <div
              v-for="(question, index) in questions"
              :key="index"
              class="question-item">
            <div class="question-header">
              <span class="question-number">第{{ index + 1 }}题</span>
              <select v-model="question.questionType" @change="onQuestionTypeChange(question)">
                <option value="SINGLE_CHOICE">单选题</option>
                <option value="MULTIPLE_CHOICE">多选题</option>
                <option value="FILL_BLANK">填空题</option>
                <option value="SHORT_ANSWER">简答题</option>
                <option value="ESSAY">论述题</option>
              </select>
              <input
                  type="number"
                  v-model="question.score"
                  placeholder="分值"
                  min="0.5"
                  step="0.5"
                  class="score-input">
              <button type="button" @click="removeQuestion(index)" class="remove-btn">
                删除
              </button>
            </div>

            <div class="question-content">
              <label>题目内容 *</label>
              <textarea
                  v-model="question.questionContent"
                  placeholder="请输入题目内容"
                  rows="3"
                  required></textarea>
            </div>

            <!-- 选择题选项 -->
            <div v-if="question.questionType === 'SINGLE_CHOICE' || question.questionType === 'MULTIPLE_CHOICE'"
                 class="options-section">
              <label>选项设置</label>
              <div class="options-list">
                <div
                    v-for="(option, optIndex) in question.options"
                    :key="optIndex"
                    class="option-item">
                  <span class="option-label">{{ String.fromCharCode(65 + optIndex) }}.</span>
                  <input
                      type="text"
                      v-model="question.options[optIndex]"
                      placeholder="选项内容"
                      class="option-input">
                  <button
                      type="button"
                      @click="removeOption(question, optIndex)"
                      v-if="question.options.length > 2"
                      class="remove-option-btn">
                    ×
                  </button>
                </div>
              </div>
              <button type="button" @click="addOption(question)" class="add-option-btn">
                + 添加选项
              </button>
            </div>

            <!-- 正确答案 -->
            <div class="correct-answer-section">
              <label>正确答案</label>

              <!-- 单选题答案 -->
              <div v-if="question.questionType === 'SINGLE_CHOICE'" class="answer-input">
                <select v-model="question.correctAnswer">
                  <option value="">请选择正确答案</option>
                  <option
                      v-for="(option, optIndex) in question.options"
                      :key="optIndex"
                      :value="String.fromCharCode(65 + optIndex)">
                    {{ String.fromCharCode(65 + optIndex) }}. {{ option }}
                  </option>
                </select>
              </div>

              <!-- 多选题答案 -->
              <div v-else-if="question.questionType === 'MULTIPLE_CHOICE'" class="answer-input">
                <div class="checkbox-group">
                  <label
                      v-for="(option, optIndex) in question.options"
                      :key="optIndex"
                      class="checkbox-label">
                    <input
                        type="checkbox"
                        :value="String.fromCharCode(65 + optIndex)"
                        @change="updateMultipleAnswer(question, $event)">
                    {{ String.fromCharCode(65 + optIndex) }}. {{ option }}
                  </label>
                </div>
              </div>

              <!-- 其他题型答案 -->
              <div v-else class="answer-input">
                <textarea
                    v-model="question.correctAnswer"
                    placeholder="请输入参考答案"
                    rows="3"></textarea>
              </div>
            </div>

            <!-- 题目解析 -->
            <div class="analysis-section">
              <label>题目解析</label>
              <textarea
                  v-model="question.analysis"
                  placeholder="请输入题目解析（可选）"
                  rows="2"></textarea>
            </div>
          </div>
        </div>

        <div v-if="questions.length === 0" class="empty-questions">
          暂无题目，请点击"添加题目"按钮开始创建
        </div>
      </div>

      <div class="submit-section">
        <div class="total-score">
          <strong>题目总分: {{ calculateTotalScore() }}</strong>
        </div>
        <div class="submit-actions">
          <button type="button" @click="saveDraft" class="save-draft-btn">
            保存草稿
          </button>
          <button type="submit" :disabled="submitting" class="submit-btn">
            {{ submitting ? '创建中...' : '创建作业' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import homeworkApi from '@/api/homework';

export default {
  name: 'HomeworkCreate',
  data() {
    return {
      homework: {
        title: '',
        description: '',
        courseId: '',
        homeworkType: 'MIXED',
        totalScore: 100,
        startTime: '',
        endTime: '',
        allowResubmit: false,
        maxSubmitTimes: 1,
        status: 'DRAFT'
      },
      questions: [],
      courseList: [],
      submitting: false
    };
  },
  async mounted() {
    await this.loadCourses();
    this.initializeDateTime();
    this.loadDraft();
  },
  methods: {
    getToken() {
      return localStorage.getItem('token')
    },
    async loadCourses() {
      try {
        const response = await homeworkApi.getCoursesByTeacher(this.getToken());
        if (response.data.success) {
          this.courseList = response.data.data;
        }
      } catch (error) {
        console.error('加载课程列表失败:', error);
      }
    },
    initializeDateTime() {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      this.homework.startTime = this.formatDateTime(tomorrow);
      this.homework.endTime = this.formatDateTime(nextWeek);
    },
    formatDateTime(date) {
      return date.toISOString().slice(0, 16);
    },
    addQuestion() {
      const newQuestion = {
        questionType: 'SINGLE_CHOICE',
        questionContent: '',
        options: ['', ''],
        correctAnswer: '',
        score: 5,
        analysis: ''
      };
      this.questions.push(newQuestion);
    },
    removeQuestion(index) {
      this.questions.splice(index, 1);
    },
    onQuestionTypeChange(question) {
      // 重置选项和答案
      if (question.questionType === 'SINGLE_CHOICE' || question.questionType === 'MULTIPLE_CHOICE') {
        if (!question.options) {
          question.options = ['', ''];
        }
      } else {
        question.options = [];
      }
      question.correctAnswer = '';
    },
    addOption(question) {
      if (!question.options) {
        question.options = [];
      }
      question.options.push('');
    },
    removeOption(question, index) {
      question.options.splice(index, 1);
    },
    updateMultipleAnswer(question, event) {
      if (!question.correctAnswer) {
        question.correctAnswer = '';
      }

      let answers = question.correctAnswer.split(',').filter(a => a);

      if (event.target.checked) {
        answers.push(event.target.value);
      } else {
        answers = answers.filter(a => a !== event.target.value);
      }

      question.correctAnswer = answers.sort().join(',');
    },
    calculateTotalScore() {
      return this.questions.reduce((total, question) => {
        return total + (parseFloat(question.score) || 0);
      }, 0);
    },
    saveDraft() {
      const draftKey = `homework_create_draft_${this.homework.teacherId}`;
      const draftData = {
        homework: this.homework,
        questions: this.questions
      };
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      alert('草稿保存成功');
    },
    loadDraft() {
      const draftKey = `homework_create_draft_${this.homework.teacherId}`;
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        try {
          const draftData = JSON.parse(draft);
          if (confirm('检测到未完成的草稿，是否恢复？')) {
            this.homework = { ...this.homework, ...draftData.homework };
            this.questions = draftData.questions || [];
          }
        } catch (error) {
          console.error('加载草稿失败:', error);
        }
      }
    },
    async createHomework() {
      console.log('开始创建作业，验证数据...');

      // 验证数据
      if (!this.homework.title || !this.homework.courseId) {
        console.error('验证失败: 标题或课程ID为空');
        alert('请填写必填信息');
        return;
      }

      if (this.questions.length === 0) {
        console.error('验证失败: 题目列表为空');
        alert('请至少添加一道题目');
        return;
      }

      // 验证题目
      for (let i = 0; i < this.questions.length; i++) {
        const question = this.questions[i];
        if (!question.questionContent) {
          console.error(`验证失败: 第${i + 1}题内容为空`);
          alert(`第${i + 1}题的题目内容不能为空`);
          return;
        }
        if (!question.score || question.score <= 0) {
          console.error(`验证失败: 第${i + 1}题分值无效`);
          alert(`第${i + 1}题的分值必须大于0`);
          return;
        }
      }

      this.submitting = true;
      try {
        console.log('处理题目数据...');

        // 修改数据处理逻辑以匹配后端格式
        const processedQuestions = this.questions.map((question) => {
          const processed = {
            questionType: question.questionType,
            questionContent: question.questionContent,
            correctAnswer: question.correctAnswer || '',
            score: parseFloat(question.score),
            analysis: question.analysis || ''
          };

          // 处理选项 - 根据后端期望格式
          if (question.questionType === 'SINGLE_CHOICE' || question.questionType === 'MULTIPLE_CHOICE') {
            if (question.options && question.options.length > 0) {
              // 过滤空选项并转换为JSON字符串
              const validOptions = question.options
                  .filter(opt => opt && opt.trim())
                  .map(opt => String(opt).trim());
              processed.questionOptions = JSON.stringify(validOptions);
            } else {
              processed.questionOptions = "null";
            }
          } else {
            // 对于非选择题，设置为 "null"
            processed.questionOptions = "null";
          }

          return processed;
        });

        // 更新总分
        this.homework.totalScore = this.calculateTotalScore();
        console.log('计算总分:', this.homework.totalScore);

        // 修改作业数据结构以匹配后端格式
        const homeworkData = {
          title: this.homework.title,
          description: this.homework.description || '',
          courseId: parseInt(this.homework.courseId),
          homeworkType: this.homework.homeworkType,
          totalScore: parseFloat(this.homework.totalScore),
          startTime: this.formatDateTimeForBackend(this.homework.startTime),
          endTime: this.formatDateTimeForBackend(this.homework.endTime),
          allowResubmit: this.homework.allowResubmit ? 1 : 0, // 转换为数字
          maxSubmitTimes: parseInt(this.homework.maxSubmitTimes) || 1,
          status: this.homework.status || 'DRAFT'
        };

        const createData = {
          homework: homeworkData,
          questions: processedQuestions
        };

        console.log('准备发送的数据:', JSON.stringify(createData, null, 2));

        console.log('调用API创建作业...');
        const response = await homeworkApi.createHomework(createData, this.getToken());
        console.log('API响应:', response);

        if (response.data.success) {
          console.log('作业创建成功，响应数据:', response.data);
          // 清除草稿
          const draftKey = `homework_create_draft_${this.homework.teacherId}`;
          localStorage.removeItem(draftKey);

          alert('作业创建成功！');
          this.$router.push(`/homework/${response.data.data}`);
        } else {
          console.error('API返回失败:', response.data);
          alert('创建作业失败: ' + (response.data.message || '未知错误'));
        }
      } catch (error) {
        console.error('创建作业失败:', error);
        console.error('错误详情:', {
          message: error.message,
          response: error.response,
          stack: error.stack
        });

        let errorMessage = '创建作业失败: ';
        if (error.response?.data?.message) {
          errorMessage += error.response.data.message;
        } else if (error.message) {
          errorMessage += error.message;
        } else {
          errorMessage += '未知错误';
        }

        alert(errorMessage);
      } finally {
        this.submitting = false;
      }
    },

// 添加时间格式转换方法
    formatDateTimeForBackend(dateTimeString) {
      if (!dateTimeString) return '';

      // 将 "2025-07-08T18:29" 转换为 "2025-07-08 18:29:00"
      const date = new Date(dateTimeString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = '00';

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
  }
};
</script>

<style scoped>
.homework-create {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #f5f9ff;
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e1e8f5;
}

.back-btn {
  padding: 8px 16px;
  background: #4a6baf;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(74, 107, 175, 0.2);
}

.back-btn:hover {
  background: #3a5a9f;
  transform: translateY(-1px);
}

.header h1 {
  margin: 0;
  color: #2c3e50;
  font-weight: 600;
}

.create-form {
  display: grid;
  gap: 30px;
}

.basic-info {
  background: white;
  padding: 24px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #e1e8f5;
}

.basic-info h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
  padding-bottom: 10px;
  border-bottom: 2px solid #4a6baf;
}

.form-group {
  margin-bottom: 18px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #4a5568;
  font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s ease;
  background-color: #f8fafc;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #4a6baf;
  box-shadow: 0 0 0 3px rgba(74, 107, 175, 0.2);
  outline: none;
  background-color: white;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.questions-section {
  background: white;
  border: 1px solid #e1e8f5;
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.questions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.questions-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
  padding-bottom: 10px;
  border-bottom: 2px solid #4a6baf;
}

.add-btn {
  padding: 10px 20px;
  background: #4a6baf;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(74, 107, 175, 0.2);
}

.add-btn:hover {
  background: #3a5a9f;
  transform: translateY(-1px);
}

.questions-list {
  display: grid;
  gap: 24px;
}

.question-item {
  border: 1px solid #e1e8f5;
  border-radius: 8px;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.question-item:hover {
  box-shadow: 0 4px 12px rgba(74, 107, 175, 0.1);
}

.question-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 18px;
}

.question-number {
  font-weight: bold;
  color: #4a6baf;
  min-width: 60px;
  font-size: 15px;
}

.question-header select {
  flex: 1;
  padding: 8px 12px;
}

.score-input {
  width: 80px;
  padding: 8px;
  text-align: center;
}

.remove-btn {
  padding: 6px 12px;
  background: #e53e3e;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
}

.remove-btn:hover {
  background: #c53030;
}

.question-content {
  margin-bottom: 18px;
}

.question-content label,
.options-section label,
.correct-answer-section label,
.analysis-section label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #4a5568;
  font-size: 14px;
}

.question-content textarea,
.analysis-section textarea {
  min-height: 80px;
}

.options-section {
  margin-bottom: 18px;
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 8px;
  border: 1px dashed #cbd5e0;
}

.options-list {
  margin: 12px 0;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.option-label {
  min-width: 25px;
  font-weight: bold;
  color: #4a6baf;
}

.option-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  background-color: white;
}

.remove-option-btn {
  width: 24px;
  height: 24px;
  background: #e53e3e;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.remove-option-btn:hover {
  background: #c53030;
}

.add-option-btn {
  padding: 6px 12px;
  background: #4a6baf;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
}

.add-option-btn:hover {
  background: #3a5a9f;
}

.correct-answer-section,
.analysis-section {
  margin-bottom: 18px;
}

.correct-answer-section {
  padding: 16px;
  background-color: #f0f7ff;
  border-radius: 8px;
  border: 1px solid #d6e4ff;
}

.checkbox-group {
  display: grid;
  gap: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.checkbox-label:hover {
  background-color: #ebf4ff;
}

.checkbox-label input[type="checkbox"] {
  accent-color: #4a6baf;
}

.empty-questions {
  text-align: center;
  padding: 40px;
  color: #718096;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px dashed #cbd5e0;
  font-size: 15px;
}

.submit-section {
  background: white;
  padding: 24px;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #e1e8f5;
}

.total-score {
  margin-bottom: 24px;
  font-size: 18px;
  color: #2c3e50;
  font-weight: 600;
}

.submit-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.save-draft-btn {
  padding: 12px 28px;
  background: #718096;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(113, 128, 150, 0.2);
}

.save-draft-btn:hover {
  background: #5a6a7e;
  transform: translateY(-1px);
}

.submit-btn {
  padding: 12px 28px;
  background: #4a6baf;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(74, 107, 175, 0.2);
}

.submit-btn:hover:not(:disabled) {
  background: #3a5a9f;
  transform: translateY(-1px);
}

.submit-btn:disabled {
  background: #a0aec0;
  cursor: not-allowed;
  transform: none;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .question-header {
    flex-wrap: wrap;
    gap: 10px;
  }

  .question-header select {
    width: 100%;
  }

  .submit-actions {
    flex-direction: column;
    gap: 12px;
  }

  .save-draft-btn,
  .submit-btn {
    width: 100%;
  }
}
</style>