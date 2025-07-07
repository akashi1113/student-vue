<template>
  <div class="homework-submit">
    <div class="header">
      <button @click="$router.go(-1)" class="back-btn">← 返回</button>
      <h1>{{ homework.title }} - 作业提交</h1>
      <div class="time-info" v-if="homework.endTime">
        <span :class="{ 'time-warning': isNearDeadline }">
          截止时间: {{ formatDate(homework.endTime) }}
        </span>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="homework.id" class="content">
      <div class="homework-info">
        <p><strong>课程:</strong> {{ homework.courseTitle }}</p>
        <p><strong>总分:</strong> {{ homework.totalScore }}</p>
        <p><strong>类型:</strong> {{ getTypeText(homework.homeworkType) }}</p>
        <p v-if="homework.description"><strong>说明:</strong> {{ homework.description }}</p>
      </div>

      <form @submit.prevent="submitHomework" class="submit-form">
        <div class="questions-section">
          <div
              v-for="(question, index) in homework.questions"
              :key="question.id"
              class="question-item">
            <div class="question-header">
              <span class="question-number">第{{ index + 1 }}题</span>
              <span class="question-type">{{ getQuestionTypeText(question.questionType) }}</span>
              <span class="question-score">{{ question.score }}分</span>
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
                  {{ String.fromCharCode(65 + optIndex) }}. {{ option }}
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
                  {{ String.fromCharCode(65 + optIndex) }}. {{ option }}
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
            </div>
          </div>
        </div>

        <div class="submit-section">
          <div class="submit-info">
            <p v-if="homework.allowResubmit">
              允许重新提交，最多 {{ homework.maxSubmitTimes }} 次
            </p>
            <p v-else>
              仅允许提交一次，请仔细检查后提交
            </p>
          </div>

          <div class="submit-actions">
            <button type="button" @click="saveDraft" class="save-btn">
              保存草稿
            </button>
            <button type="submit" :disabled="submitting" class="submit-btn">
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
  props: ['homeworkId'],
  data() {
    return {
      homework: {},
      answers: {},
      loading: false,
      submitting: false,
      userId: 2, // 默认学生ID
      isNearDeadline: false
    };
  },
  async mounted() {
    await this.loadHomework();
    this.checkDeadline();
    this.loadDraft();
  },
  methods: {
    checkDeadline() {
      if (this.homework.endTime) {
        const endTime = new Date(this.homework.endTime);
        const now = new Date();
        const timeDiff = endTime - now;
        // 如果距离截止时间少于1小时，显示警告
        this.isNearDeadline = timeDiff < 60 * 60 * 1000 && timeDiff > 0;
      }
    },
    saveDraft() {
      // 保存草稿到localStorage
      const draftKey = `homework_draft_${this.homeworkId}_${this.userId}`;
      localStorage.setItem(draftKey, JSON.stringify(this.answers));
      alert('草稿保存成功');
    },
    // 确保多选题初始化正确
    async loadHomework() {
      this.loading = true;
      try {
        const response = await homeworkApi.getHomeworkById(this.homeworkId);
        if (response.data.success) {
          this.homework = response.data.data;
          // 初始化答案对象
          const initialAnswers = {};
          this.homework.questions.forEach(question => {
            if (question.questionType === 'MULTIPLE_CHOICE') {
              initialAnswers[question.id] = ''; // 改为空字符串而不是数组
            } else {
              initialAnswers[question.id] = '';
            }
          });
          this.answers = initialAnswers;
        }
      } catch (error) {
        console.error('加载作业失败:', error);
        alert('加载作业失败');
        this.$router.go(-1);
      } finally {
        this.loading = false;
      }
    },
    // 确保草稿加载时多选题格式正确
    loadDraft() {
      // 从localStorage加载草稿
      const draftKey = `homework_draft_${this.homeworkId}_${this.userId}`;
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        try {
          const draftAnswers = JSON.parse(draft);
          // 处理多选题的格式
          Object.keys(draftAnswers).forEach(questionId => {
            const question = this.homework.questions.find(q => q.id == questionId);
            if (question && question.questionType === 'MULTIPLE_CHOICE') {
              // 确保多选题答案格式正确
              if (Array.isArray(draftAnswers[questionId])) {
                draftAnswers[questionId] = draftAnswers[questionId].join(',');
              } else if (typeof draftAnswers[questionId] === 'string') {
                // 清理可能存在的多余逗号
                draftAnswers[questionId] = draftAnswers[questionId]
                    .split(',')
                    .filter(item => item.trim() !== '')
                    .join(',');
              }
            }
          });
          this.answers = { ...this.answers, ...draftAnswers };
        } catch (error) {
          console.error('加载草稿失败:', error);
        }
      }
    },
    async submitHomework() {
      // 修复：检查是否所有题目都已回答
      const unansweredQuestions = this.homework.questions.filter(question => {
        const answer = this.answers[question.id];
        // 统一检查：空字符串、null、undefined都认为是未作答
        return !answer || answer.toString().trim() === '';
      });

      if (unansweredQuestions.length > 0) {
        const questionNumbers = unansweredQuestions.map((_, index) => {
          // 找到未作答题目在整个题目列表中的序号
          const questionIndex = this.homework.questions.findIndex(q => q.id === unansweredQuestions[index].id);
          return questionIndex + 1;
        });

        const confirm = window.confirm(
            `第 ${questionNumbers.join(', ')} 题未作答，确定要提交吗？`
        );
        if (!confirm) return;
      }

      this.submitting = true;
      try {
        // 准备提交数据
        const submitData = {
          studentId: this.userId,
          answers: this.homework.questions.map(question => ({
            questionId: question.id,
            studentAnswer: this.answers[question.id] || ''
          }))
        };

        console.log('提交数据:', submitData); // 调试用，可以看到实际提交的答案

        const response = await homeworkApi.submitHomework(this.homeworkId, submitData);
        if (response.data.success) {
          // 清除草稿
          const draftKey = `homework_draft_${this.homeworkId}_${this.userId}`;
          localStorage.removeItem(draftKey);

          alert('作业提交成功！');
          this.$router.push(`/homework/${this.homeworkId}`);
        }
      } catch (error) {
        console.error('提交作业失败:', error);
        alert('提交作业失败: ' + (error.response?.data?.message || error.message));
      } finally {
        this.submitting = false;
      }
    },

    // 优化：添加调试方法来查看当前答案状态
    debugAnswers() {
      console.log('当前所有答案:', this.answers);
      this.homework.questions.forEach((question, index) => {
        const answer = this.answers[question.id];
        console.log(`第${index + 1}题 (${question.questionType}):`, answer);
      });
    },

    // 优化：改进多选题处理逻辑
    updateMultipleChoice(questionId, option, event) {
      console.log('多选题更新:', { questionId, option, checked: event.target.checked }); // 调试用

      // 获取当前答案
      let currentAnswer = this.answers[questionId] || '';
      let selectedOptions = [];

      // 如果当前答案不为空，则分割为数组
      if (currentAnswer && currentAnswer.trim() !== '') {
        selectedOptions = currentAnswer.split(',').filter(item => item.trim() !== '');
      }

      if (event.target.checked) {
        // 添加选项（确保不重复）
        if (!selectedOptions.includes(option)) {
          selectedOptions.push(option);
        }
      } else {
        // 移除选项
        selectedOptions = selectedOptions.filter(item => item !== option);
      }

      // 排序并转换为字符串
      const newAnswer = selectedOptions.length > 0 ? selectedOptions.sort().join(',') : '';

      this.answers[questionId] = newAnswer;

      console.log('更新后答案:', newAnswer); // 调试用
    },

    // 优化：改进选中状态检查
    isMultipleChoiceSelected(questionId, option) {
      const answer = this.answers[questionId];
      if (!answer || answer.trim() === '') return false;

      const selectedOptions = answer.split(',').filter(item => item.trim() !== '');
      return selectedOptions.includes(option);
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
    parseOptions(optionsJson) {
      try {
        return JSON.parse(optionsJson);
      } catch {
        return [];
      }
    },
    formatDate(dateString) {
      if (!dateString) return '';
      return new Date(dateString).toLocaleString('zh-CN');
    }
  }
};
</script>

<style scoped>
.homework-submit {
  padding: 20px;
  max-width: 1000px;
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

.time-info {
  font-size: 14px;
  color: #666;
}

.time-warning {
  color: #dc3545 !important;
  font-weight: bold;
}

.homework-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.homework-info p {
  margin: 5px 0;
  color: #333;
}

.questions-section {
  margin-bottom: 30px;
}

.question-item {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.question-header {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 15px;
}

.question-number {
  font-weight: bold;
  color: #007bff;
  font-size: 16px;
}

.question-type {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.question-score {
  background: #f3e5f5;
  color: #7b1fa2;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.question-content {
  margin-bottom: 15px;
  line-height: 1.6;
  color: #333;
  font-size: 16px;
}

.answer-section {
  margin-top: 15px;
}

.option {
  margin: 8px 0;
}

.option label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.option label:hover {
  background-color: #f8f9fa;
}

.text-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.textarea-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  min-height: 120px;
}

.submit-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.submit-info {
  margin-bottom: 20px;
  color: #666;
}

.submit-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.save-btn {
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
  background: #28a745;
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

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}
</style>