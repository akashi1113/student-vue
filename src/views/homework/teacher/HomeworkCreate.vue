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
          <select v-model="homework.courseId" required @change="loadCourseStudents">
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
      // 验证数据
      if (!this.homework.title || !this.homework.courseId) {
        alert('请填写必填信息');
        return;
      }

      if (this.questions.length === 0) {
        alert('请至少添加一道题目');
        return;
      }

      // 验证题目
      for (let i = 0; i < this.questions.length; i++) {
        const question = this.questions[i];
        if (!question.questionContent) {
          alert(`第${i + 1}题的题目内容不能为空`);
          return;
        }
        if (!question.score || question.score <= 0) {
          alert(`第${i + 1}题的分值必须大于0`);
          return;
        }
      }

      this.submitting = true;
      try {
        // 处理题目数据
        const processedQuestions = this.questions.map(question => {
          const processed = { ...question };

          // 处理选项
          if (question.options && question.options.length > 0) {
            processed.questionOptions = JSON.stringify(question.options.filter(opt => opt.trim()));
          }

          // 移除临时字段
          delete processed.options;

          return processed;
        });

        // 更新总分
        this.homework.totalScore = this.calculateTotalScore();

        const createData = {
          homework: this.homework,
          questions: processedQuestions
        };

        const response = await homeworkApi.createHomework(createData,this.getToken());
        if (response.data.success) {
          // 清除草稿
          const draftKey = `homework_create_draft_${this.homework.teacherId}`;
          localStorage.removeItem(draftKey);

          alert('作业创建成功！');
          this.$router.push(`/homework/${response.data.data}`);
        }
      } catch (error) {
        console.error('创建作业失败:', error);
        alert('创建作业失败: ' + (error.response?.data?.message || error.message));
      } finally {
        this.submitting = false;
      }
    }
  }
};
</script>

<style scoped>
.homework-create {
  padding: 20px;
  max-width: 1200px;
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
  margin: 0;
  color: #333;
}

.create-form {
  display: grid;
  gap: 30px;
}

.basic-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.basic-info h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.form-group {
  margin-bottom: 15px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group textarea {
  resize: vertical;
}

.questions-section {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
}

.questions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.questions-header h3 {
  margin: 0;
  color: #333;
}

.add-btn {
  padding: 8px 16px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.questions-list {
  display: grid;
  gap: 20px;
}

.question-item {
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 20px;
  background: #fafafa;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.question-number {
  font-weight: bold;
  color: #007bff;
  min-width: 60px;
}

.question-header select {
  flex: 1;
}

.score-input {
  width: 80px;
}

.remove-btn {
  padding: 4px 8px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.question-content {
  margin-bottom: 15px;
}

.options-section {
  margin-bottom: 15px;
}

.options-list {
  margin: 10px 0;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.option-label {
  min-width: 25px;
  font-weight: bold;
}

.option-input {
  flex: 1;
}

.remove-option-btn {
  width: 24px;
  height: 24px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-option-btn {
  padding: 4px 8px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.correct-answer-section,
.analysis-section {
  margin-bottom: 15px;
}

.checkbox-group {
  display: grid;
  gap: 5px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.empty-questions {
  text-align: center;
  padding: 40px;
  color: #666;
  background: #f8f9fa;
  border-radius: 6px;
}

.submit-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.total-score {
  margin-bottom: 20px;
  font-size: 18px;
  color: #333;
}

.submit-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.save-draft-btn {
  padding: 12px 24px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.submit-btn {
  padding: 12px 24px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.submit-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}
</style>