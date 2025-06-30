<template>
  <div class="homework-grade">
    <div class="header">
      <button @click="$router.go(-1)" class="back-btn">← 返回</button>
      <h1>批改作业</h1>
      <div class="student-info">
        <span>学生: {{ submission.studentName }}</span>
        <span>提交时间: {{ formatDate(submission.submitTime) }}</span>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="submission.id" class="content">
      <div class="homework-info">
        <h3>{{ submission.homeworkTitle }}</h3>
        <p>课程: {{ submission.courseTitle }}</p>
        <p>总分: {{ homework.totalScore }}</p>
      </div>

      <form @submit.prevent="submitGrade" class="grade-form">
        <div class="questions-section">
          <div
              v-for="(answer, index) in answers"
              :key="answer.id"
              class="question-item">
            <div class="question-header">
              <span class="question-number">第{{ index + 1 }}题</span>
              <span class="question-type">{{ getQuestionTypeText(answer.questionType) }}</span>
              <span class="question-score">满分: {{ answer.questionScore }}</span>
            </div>

            <div class="question-content">
              <h4>题目:</h4>
              <p>{{ answer.questionContent }}</p>
            </div>

            <div v-if="answer.correctAnswer" class="correct-answer">
              <h4>参考答案:</h4>
              <p>{{ answer.correctAnswer }}</p>
            </div>

            <div class="student-answer">
              <h4>学生答案:</h4>
              <p v-if="answer.studentAnswer" class="answer-text">{{ answer.studentAnswer }}</p>
              <p v-else class="no-answer">未作答</p>
            </div>

            <div class="grading-section">
              <div class="score-input">
                <label>得分:</label>
                <input
                    type="number"
                    v-model="answer.score"
                    :max="answer.questionScore"
                    min="0"
                    step="0.5"
                    class="score-field">
                <span class="score-max">/ {{ answer.questionScore }}</span>
              </div>

              <div class="correct-status" v-if="isObjectiveQuestion(answer.questionType)">
                <label>正确性:</label>
                <select v-model="answer.isCorrect">
                  <option :value="null">待评判</option>
                  <option :value="1">正确</option>
                  <option :value="0">错误</option>
                </select>
              </div>

              <div class="teacher-comment">
                <label>评语:</label>
                <textarea
                    v-model="answer.teacherComment"
                    placeholder="请输入评语（可选）"
                    rows="3"></textarea>
              </div>
            </div>
          </div>
        </div>

        <div class="overall-feedback">
          <h3>总体反馈</h3>
          <textarea
              v-model="overallFeedback"
              placeholder="请输入对整份作业的总体评价"
              rows="4"></textarea>
        </div>

        <div class="grade-summary">
          <div class="total-score">
            <strong>总得分: {{ calculateTotalScore() }} / {{ homework.totalScore }}</strong>
          </div>

          <div class="grade-actions">
            <button type="button" @click="autoGrade" class="auto-grade-btn">
              自动评分
            </button>
            <button type="button" @click="saveDraft" class="save-draft-btn">
              保存草稿
            </button>
            <button type="submit" :disabled="submitting" class="submit-btn">
              {{ submitting ? '提交中...' : '完成批改' }}
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
  name: 'HomeworkGrade',
  props: ['submissionId'],
  data() {
    return {
      submission: {},
      homework: {},
      answers: [],
      overallFeedback: '',
      loading: false,
      submitting: false,
      teacherId: 2 // 默认教师ID
    };
  },
  async mounted() {
    await this.loadData();
    this.loadDraft();
  },
  methods: {
    async loadData() {
      this.loading = true;
      try {
        const [submissionResponse, answersResponse] = await Promise.all([
          homeworkApi.getSubmissionById(this.submissionId),
          homeworkApi.getSubmissionAnswers(this.submissionId)
        ]);

        if (submissionResponse.data.success) {
          this.submission = submissionResponse.data.data;
          // 加载作业信息
          const homeworkResponse = await homeworkApi.getHomeworkById(this.submission.homeworkId);
          if (homeworkResponse.data.success) {
            this.homework = homeworkResponse.data.data;
          }
        }

        if (answersResponse.data.success) {
          this.answers = answersResponse.data.data.map(answer => ({
            ...answer,
            score: answer.score || 0,
            isCorrect: answer.isCorrect,
            teacherComment: answer.teacherComment || ''
          }));
        }

        this.overallFeedback = this.submission.teacherFeedback || '';
      } catch (error) {
        console.error('加载数据失败:', error);
        alert('加载数据失败');
        this.$router.go(-1);
      } finally {
        this.loading = false;
      }
    },
    loadDraft() {
      const draftKey = `grade_draft_${this.submissionId}`;
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        try {
          const draftData = JSON.parse(draft);
          if (draftData.answers) {
            this.answers.forEach((answer, index) => {
              if (draftData.answers[index]) {
                Object.assign(answer, draftData.answers[index]);
              }
            });
          }
          if (draftData.overallFeedback) {
            this.overallFeedback = draftData.overallFeedback;
          }
        } catch (error) {
          console.error('加载草稿失败:', error);
        }
      }
    },
    saveDraft() {
      const draftKey = `grade_draft_${this.submissionId}`;
      const draftData = {
        answers: this.answers.map(answer => ({
          id: answer.id,
          score: answer.score,
          isCorrect: answer.isCorrect,
          teacherComment: answer.teacherComment
        })),
        overallFeedback: this.overallFeedback
      };
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      alert('草稿保存成功');
    },
    autoGrade() {
      this.answers.forEach(answer => {
        if (this.isObjectiveQuestion(answer.questionType)) {
          if (answer.correctAnswer && answer.studentAnswer) {
            const isCorrect = this.checkAnswer(answer.correctAnswer, answer.studentAnswer, answer.questionType);
            answer.isCorrect = isCorrect ? 1 : 0;
            answer.score = isCorrect ? answer.questionScore : 0;
          } else {
            answer.isCorrect = 0;
            answer.score = 0;
          }
        }
      });
      alert('自动评分完成');
    },
    checkAnswer(correctAnswer, studentAnswer, questionType) {
      if (questionType === 'SINGLE_CHOICE') {
        return correctAnswer.trim().toUpperCase() === studentAnswer.trim().toUpperCase();
      } else if (questionType === 'MULTIPLE_CHOICE') {
        const correct = correctAnswer.split(',').map(a => a.trim()).sort();
        const student = studentAnswer.split(',').map(a => a.trim()).sort();
        return JSON.stringify(correct) === JSON.stringify(student);
      } else if (questionType === 'FILL_BLANK') {
        return correctAnswer.trim().toLowerCase() === studentAnswer.trim().toLowerCase();
      }
      return false;
    },
    calculateTotalScore() {
      return this.answers.reduce((total, answer) => {
        return total + (parseFloat(answer.score) || 0);
      }, 0);
    },
    async submitGrade() {
      // 验证评分
      for (let answer of this.answers) {
        if (answer.score < 0 || answer.score > answer.questionScore) {
          alert(`第${this.answers.indexOf(answer) + 1}题得分不能超过满分或小于0`);
          return;
        }
      }

      this.submitting = true;
      try {
        const gradeData = {
          answers: this.answers.map(answer => ({
            id: answer.id,
            score: parseFloat(answer.score) || 0,
            isCorrect: answer.isCorrect,
            teacherComment: answer.teacherComment
          })),
          feedback: this.overallFeedback,
          teacherId: this.teacherId
        };

        const response = await homeworkApi.gradeHomework(this.submissionId, gradeData);
        if (response.data.success) {
          // 清除草稿
          const draftKey = `grade_draft_${this.submissionId}`;
          localStorage.removeItem(draftKey);

          alert('批改完成！');
          this.$router.go(-1);
        }
      } catch (error) {
        console.error('提交批改失败:', error);
        alert('提交批改失败: ' + (error.response?.data?.message || error.message));
      } finally {
        this.submitting = false;
      }
    },
    isObjectiveQuestion(questionType) {
      return ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'FILL_BLANK'].includes(questionType);
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
    formatDate(dateString) {
      if (!dateString) return '';
      return new Date(dateString).toLocaleString('zh-CN');
    }
  }
};
</script>

<style scoped>
.homework-grade {
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
  flex: 1;
  margin: 0;
  color: #333;
}

.student-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 14px;
  color: #666;
}

.homework-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.homework-info h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.homework-info p {
  margin: 5px 0;
  color: #666;
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
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
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

.question-content,
.correct-answer,
.student-answer {
  margin-bottom: 15px;
}

.question-content h4,
.correct-answer h4,
.student-answer h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 14px;
}

.question-content p,
.correct-answer p {
  margin: 0;
  line-height: 1.6;
  color: #666;
}

.answer-text {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  border-left: 4px solid #007bff;
  margin: 0;
  line-height: 1.6;
  color: #333;
}

.no-answer {
  color: #dc3545;
  font-style: italic;
  margin: 0;
}

.grading-section {
  background: #fff8e1;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #ffecb3;
}

.score-input,
.correct-status,
.teacher-comment {
  margin-bottom: 15px;
}

.score-input {
  display: flex;
  align-items: center;
  gap: 10px;
}

.score-input label {
  font-weight: bold;
  color: #333;
  min-width: 50px;
}

.score-field {
  width: 80px;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
}

.score-max {
  color: #666;
}

.correct-status {
  display: flex;
  align-items: center;
  gap: 10px;
}

.correct-status label {
  font-weight: bold;
  color: #333;
  min-width: 60px;
}

.correct-status select {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.teacher-comment label {
  display: block;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.teacher-comment textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
}

.overall-feedback {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.overall-feedback h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.overall-feedback textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
}

.grade-summary {
  background: #e8f5e8;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.total-score {
  margin-bottom: 20px;
  font-size: 18px;
  color: #333;
}

.grade-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.auto-grade-btn,
.save-draft-btn,
.submit-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.auto-grade-btn {
  background: #ffc107;
  color: #212529;
}

.save-draft-btn {
  background: #6c757d;
  color: white;
}

.submit-btn {
  background: #28a745;
  color: white;
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