<template>
  <div class="student-submission-detail">
    <div class="header">
      <button @click="$router.go(-1)" class="back-btn">← 返回</button>
      <h1>提交详情</h1>
      <div class="submission-info">
        <span v-if="currentSubmission.studentName">学生: {{ currentSubmission.studentName }}</span>
        <span v-if="currentSubmission.submitTime">提交时间: {{ formatDate(currentSubmission.submitTime) }}</span>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="allSubmissions.length > 0" class="content">
      <!-- 提交次数选择器 -->
      <div class="submission-selector">
        <h3>选择查看提交记录</h3>
        <div class="selector-container">
          <label for="submission-select">提交次数:</label>
          <select
              id="submission-select"
              v-model="selectedSubmissionIndex"
              @change="onSubmissionChange"
              class="submission-select">
            <option
                v-for="(submission, index) in allSubmissions"
                :key="submission.id"
                :value="index">
              第{{ index + 1 }}次提交
              ({{ formatDate(submission.submitTime) }})
              <span v-if="submission.totalScore !== null"> - {{ submission.totalScore }}分</span>
              <span v-else> - 待批改</span>
            </option>
          </select>
          <div class="submission-summary">
            <span class="total-submissions">共 {{ allSubmissions.length }} 次提交</span>
            <span
                v-if="latestSubmission && latestSubmission.totalScore !== null"
                class="latest-score">
              最新得分: {{ latestSubmission.totalScore }}分
            </span>
          </div>
        </div>
      </div>

      <!-- 当前选中提交的详细信息 -->
      <div class="current-submission-detail">
        <!-- 作业基本信息 -->
        <div class="homework-info">
          <h3>{{ currentSubmission.homeworkTitle }}</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">课程:</span>
              <span>{{ currentSubmission.courseTitle }}</span>
            </div>
            <div class="info-item">
              <span class="label">作业总分:</span>
              <span>{{ homework.totalScore }}</span>
            </div>
            <div class="info-item">
              <span class="label">当前提交得分:</span>
              <span v-if="currentSubmission.totalScore !== null" class="score">
                {{ currentSubmission.totalScore }} 分
              </span>
              <span v-else class="pending">待批改</span>
            </div>
            <div class="info-item">
              <span class="label">提交状态:</span>
              <span :class="['status', currentSubmission.status.toLowerCase()]">
                {{ getStatusText(currentSubmission.status) }}
              </span>
            </div>
            <div class="info-item">
              <span class="label">提交时间:</span>
              <span>{{ formatDate(currentSubmission.submitTime) }}</span>
            </div>
            <div class="info-item">
              <span class="label">是否最新:</span>
              <span :class="['latest-indicator', isLatestSubmission ? 'latest' : 'old']">
                {{ isLatestSubmission ? '最新提交' : '历史提交' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 提交对比信息 -->
        <div v-if="allSubmissions.length > 1" class="submission-comparison">
          <h3>提交记录对比</h3>
          <div class="comparison-grid">
            <div class="comparison-item">
              <span class="label">最高分:</span>
              <span class="value">{{ getHighestScore() }}分</span>
            </div>
            <div class="comparison-item">
              <span class="label">最低分:</span>
              <span class="value">{{ getLowestScore() }}分</span>
            </div>
            <div class="comparison-item">
              <span class="label">平均分:</span>
              <span class="value">{{ getAverageScore() }}分</span>
            </div>
            <div class="comparison-item">
              <span class="label">改进情况:</span>
              <span :class="['improvement', getImprovementClass()]">
                {{ getImprovementText() }}
              </span>
            </div>
          </div>
        </div>

        <!-- 答题详情 -->
        <div class="answers-section">
          <h3>第{{ selectedSubmissionIndex + 1 }}次提交 - 答题详情</h3>
          <div class="answers-list">
            <div
                v-for="(answer, index) in currentAnswers"
                :key="answer.id"
                class="answer-item">
              <div class="question-header">
                <span class="question-number">第{{ index + 1 }}题</span>
                <span class="question-type">{{ getQuestionTypeText(answer.questionType) }}</span>
                <span class="question-score">{{ answer.questionScore }}分</span>
                <span v-if="answer.score !== null" class="earned-score">
                  得分: {{ answer.score }}
                </span>
              </div>

              <div class="question-content">
                <h4>题目:</h4>
                <p>{{ answer.questionContent }}</p>
              </div>

              <!-- 选择题选项 -->
              <div v-if="answer.questionOptions" class="question-options">
                <h4>选项:</h4>
                <div class="options-list">
                  <div
                      v-for="(option, optIndex) in parseOptions(answer.questionOptions)"
                      :key="optIndex"
                      :class="['option', {
                      'selected': isOptionSelected(answer.studentAnswer, optIndex),
                      'correct': isCorrectOption(answer.correctAnswer, optIndex)
                    }]">
                    {{ String.fromCharCode(65 + optIndex) }}. {{ option }}
                    <span v-if="isOptionSelected(answer.studentAnswer, optIndex)" class="selected-mark">✓ 已选</span>
                    <span v-if="isCorrectOption(answer.correctAnswer, optIndex)" class="correct-mark">✓ 正确</span>
                  </div>
                </div>
              </div>

              <!-- 参考答案 -->
              <div v-if="answer.correctAnswer" class="correct-answer">
                <h4>参考答案:</h4>
                <p class="answer-text">{{ answer.correctAnswer }}</p>
              </div>

              <!-- 学生答案 -->
              <div class="student-answer">
                <h4>我的答案:</h4>
                <p v-if="answer.studentAnswer" class="answer-text">
                  {{ answer.studentAnswer }}
                </p>
                <p v-else class="no-answer">未作答</p>
              </div>

              <!-- 正确性标识 -->
              <div v-if="answer.isCorrect !== null" class="correctness">
                <span :class="['correct-indicator', answer.isCorrect ? 'correct' : 'incorrect']">
                  {{ answer.isCorrect ? '✓ 正确' : '✗ 错误' }}
                </span>
              </div>

              <!-- 教师评语 -->
              <div v-if="answer.teacherComment" class="teacher-comment">
                <h4>教师评语:</h4>
                <p>{{ answer.teacherComment }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 教师总体反馈 -->
        <div v-if="currentSubmission.teacherFeedback" class="overall-feedback">
          <h3>教师总体反馈</h3>
          <div class="feedback-content">
            <p>{{ currentSubmission.teacherFeedback }}</p>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="actions">
          <button @click="viewHomework" class="view-homework-btn">
            查看作业详情
          </button>
          <button
              v-if="canResubmit"
              @click="resubmit"
              class="resubmit-btn">
            重新提交
          </button>
          <button @click="downloadSubmission" class="download-btn">
            下载当前提交
          </button>
          <button @click="downloadAllSubmissions" class="download-all-btn">
            下载所有提交
          </button>
        </div>
      </div>
    </div>

    <div v-else class="no-submission">
      <h3>暂无提交记录</h3>
      <p>您还没有提交过这份作业</p>
      <button @click="startSubmit" class="start-submit-btn">
        开始作业
      </button>
    </div>
  </div>
</template>

<script>
import homeworkApi from '@/api/homework';

export default {
  name: 'StudentSubmissionDetail',
  props: {
    homeworkId: {
      type: [String, Number],
      required: true
    }
  },
  data() {
    return {
      allSubmissions: [], // 所有提交记录
      currentSubmission: {}, // 当前选中的提交
      currentAnswers: [], // 当前提交的答案
      homework: {},
      loading: false,
      canResubmit: false,
      selectedSubmissionIndex: 0 // 当前选中的提交索引（默认最新一次）
    };
  },
  computed: {
    latestSubmission() {
      return this.allSubmissions.length > 0 ? this.allSubmissions[0] : null;
    },
    isLatestSubmission() {
      return this.selectedSubmissionIndex === 0;
    }
  },
  async mounted() {
    console.log('StudentSubmissionDetail mounted:', {
      homeworkId: this.homeworkId,
    });

    if (!this.homeworkId) {
      console.error('Missing required props:', {
        homeworkId: this.homeworkId,
      });
      alert('参数错误，请重试');
      this.$router.go(-1);
      return;
    }

    await this.loadData();
    await this.checkResubmitPermission();
  },
  methods: {
    getToken() {
      return localStorage.getItem('token');
    },
    async loadData() {
      const token=this.getToken();
      this.loading = true;
      try {
        // 获取所有提交记录
        const submissionsResponse = await homeworkApi.getStudentSubmission(
            this.homeworkId,
            token
        );

        if (submissionsResponse.data.success && submissionsResponse.data.data.length > 0) {
          this.allSubmissions = submissionsResponse.data.data;
          // 按提交次数倒序排列
          this.allSubmissions.sort((a, b) => new Date(a.submitTimes) - new Date(b.submitTimes));

          // 默认选择最新一次提交
          this.selectedSubmissionIndex = 0;
          await this.loadSubmissionDetail(0);
        }

        // 获取作业基本信息
        const homeworkResponse = await homeworkApi.getHomeworkById(this.homeworkId);
        if (homeworkResponse.data.success) {
          this.homework = homeworkResponse.data.data;
        }

      } catch (error) {
        console.error('加载提交详情失败:', error);
        if (error.response?.status === 404) {
          // 没有提交记录，这是正常情况
          this.allSubmissions = [];
        } else {
          alert('加载提交详情失败');
        }
      } finally {
        this.loading = false;
      }
    },

    async loadSubmissionDetail(index) {
      if (index >= 0 && index < this.allSubmissions.length) {
        this.currentSubmission = this.allSubmissions[index];

        try {
          // 获取当前提交的答案详情
          const answersResponse = await homeworkApi.getSubmissionAnswers(this.currentSubmission.id);
          if (answersResponse.data.success) {
            this.currentAnswers = answersResponse.data.data;
          }
        } catch (error) {
          console.error('加载答案详情失败:', error);
          this.currentAnswers = [];
        }
      }
    },

    async onSubmissionChange() {
      await this.loadSubmissionDetail(this.selectedSubmissionIndex);
    },

    async checkResubmitPermission() {
      const token=this.getToken();
      if (this.allSubmissions.length === 0) {
        this.canResubmit = false;
        return;
      }

      try {
        const response = await homeworkApi.canResubmit(this.homeworkId,token);
        this.canResubmit = response.data.success && response.data.data;
      } catch (error) {
        console.error('检查重提权限失败:', error);
        this.canResubmit = false;
      }
    },

    // 统计方法
    getHighestScore() {
      const scores = this.allSubmissions
          .filter(s => s.totalScore !== null)
          .map(s => s.totalScore);
      return scores.length > 0 ? Math.max(...scores) : 0;
    },

    getLowestScore() {
      const scores = this.allSubmissions
          .filter(s => s.totalScore !== null)
          .map(s => s.totalScore);
      return scores.length > 0 ? Math.min(...scores) : 0;
    },

    getAverageScore() {
      const scores = this.allSubmissions
          .filter(s => s.totalScore !== null)
          .map(s => s.totalScore);
      if (scores.length === 0) return 0;
      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      return Math.round(average * 10) / 10; // 保留一位小数
    },

    getImprovementClass() {
      if (this.allSubmissions.length < 2) return 'neutral';
      const firstScore = this.allSubmissions[this.allSubmissions.length - 1].totalScore;
      const lastScore = this.allSubmissions[0].totalScore;
      if (firstScore === null || lastScore === null) return 'neutral';
      if (lastScore > firstScore) return 'improved';
      if (lastScore < firstScore) return 'declined';
      return 'neutral';
    },

    getImprovementText() {
      if (this.allSubmissions.length < 2) return '首次提交';
      const firstScore = this.allSubmissions[this.allSubmissions.length - 1].totalScore;
      const lastScore = this.allSubmissions[0].totalScore;
      if (firstScore === null || lastScore === null) return '待批改';
      const diff = lastScore - firstScore;
      if (diff > 0) return `提高了 ${diff} 分`;
      if (diff < 0) return `下降了 ${Math.abs(diff)} 分`;
      return '成绩持平';
    },

    // 选项相关方法
    isOptionSelected(studentAnswer, optionIndex) {
      if (!studentAnswer) return false;
      const selectedChar = String.fromCharCode(65 + optionIndex);
      return studentAnswer.includes(selectedChar);
    },

    isCorrectOption(correctAnswer, optionIndex) {
      if (!correctAnswer) return false;
      const correctChar = String.fromCharCode(65 + optionIndex);
      return correctAnswer.includes(correctChar);
    },

    viewHomework() {
      this.$router.push(`/homework/${this.homeworkId}`);
    },

    resubmit() {
      this.$router.push(`/homework/${this.homeworkId}/submit`);
    },

    startSubmit() {
      this.$router.push(`/homework/${this.homeworkId}/submit`);
    },

    downloadSubmission() {
      const content = this.generateDownloadContent(this.currentSubmission, this.currentAnswers);
      this.downloadFile(content, `${this.currentSubmission.homeworkTitle}_第${this.selectedSubmissionIndex + 1}次提交.txt`);
    },

    downloadAllSubmissions() {
      let content = `作业所有提交记录\n`;
      content += `================\n\n`;
      content += `作业标题: ${this.homework.title}\n`;
      content += `学生: ${this.currentSubmission.studentName}\n`;
      content += `总提交次数: ${this.allSubmissions.length}\n\n`;

      // 统计信息
      content += `统计信息:\n`;
      content += `最高分: ${this.getHighestScore()}分\n`;
      content += `最低分: ${this.getLowestScore()}分\n`;
      content += `平均分: ${this.getAverageScore()}分\n`;
      content += `改进情况: ${this.getImprovementText()}\n\n`;

      // 每次提交的详细记录
      this.allSubmissions.forEach((submission, index) => {
        content += `第${this.allSubmissions.length - index}次提交\n`;
        content += `================\n`;
        content += `提交时间: ${this.formatDate(submission.submitTime)}\n`;
        content += `得分: ${submission.totalScore !== null ? submission.totalScore + '分' : '待批改'}\n`;
        content += `状态: ${this.getStatusText(submission.status)}\n\n`;
      });

      this.downloadFile(content, `${this.homework.title}_所有提交记录.txt`);
    },

    downloadFile(content, filename) {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    generateDownloadContent(submission, answers) {
      let content = `作业提交记录\n`;
      content += `================\n\n`;
      content += `作业标题: ${submission.homeworkTitle}\n`;
      content += `课程: ${submission.courseTitle}\n`;
      content += `学生: ${submission.studentName}\n`;
      content += `提交时间: ${this.formatDate(submission.submitTime)}\n`;
      content += `得分: ${submission.totalScore !== null ? submission.totalScore + '分' : '待批改'}\n`;
      content += `状态: ${this.getStatusText(submission.status)}\n\n`;

      content += `答题详情:\n`;
      content += `================\n\n`;

      answers.forEach((answer, index) => {
        content += `第${index + 1}题 (${this.getQuestionTypeText(answer.questionType)}, ${answer.questionScore}分)\n`;
        content += `题目: ${answer.questionContent}\n`;

        if (answer.questionOptions) {
          content += `选项:\n`;
          const options = this.parseOptions(answer.questionOptions);
          options.forEach((option, optIndex) => {
            content += `${String.fromCharCode(65 + optIndex)}. ${option}\n`;
          });
        }

        content += `我的答案: ${answer.studentAnswer || '未作答'}\n`;

        if (answer.correctAnswer) {
          content += `参考答案: ${answer.correctAnswer}\n`;
        }

        if (answer.score !== null) {
          content += `得分: ${answer.score}分\n`;
        }

        if (answer.isCorrect !== null) {
          content += `正确性: ${answer.isCorrect ? '正确' : '错误'}\n`;
        }

        if (answer.teacherComment) {
          content += `教师评语: ${answer.teacherComment}\n`;
        }

        content += `\n`;
      });

      if (submission.teacherFeedback) {
        content += `教师总体反馈:\n`;
        content += `================\n`;
        content += `${submission.teacherFeedback}\n`;
      }

      return content;
    },

    getStatusText(status) {
      const statuses = {
        'SUBMITTED': '已提交',
        'GRADED': '已批改',
        'RETURNED': '已返回'
      };
      return statuses[status] || status;
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
        if (typeof optionsJson === 'string') {
          return JSON.parse(optionsJson);
        } else if (Array.isArray(optionsJson)) {
          return optionsJson;
        }
        return [];
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
/* 保持原有样式并添加新样式 */
.student-submission-detail {
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

.submission-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 14px;
  color: #666;
}

/* 新增：提交选择器样式 */
.submission-selector {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  border: 2px solid #007bff;
}

.submission-selector h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.selector-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.submission-select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  background: white;
}

.submission-summary {
  display: flex;
  gap: 20px;
  font-size: 14px;
}

.total-submissions {
  color: #007bff;
  font-weight: bold;
}

.latest-score {
  color: #28a745;
  font-weight: bold;
}

/* 新增：提交对比信息样式 */
.submission-comparison {
  background: #e3f2fd;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.submission-comparison h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.comparison-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background: white;
  border-radius: 6px;
  border: 1px solid #ddd;
}

.comparison-item .label {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.comparison-item .value {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.improvement.improved {
  color: #28a745;
  font-weight: bold;
}

.improvement.declined {
  color: #dc3545;
  font-weight: bold;
}

.improvement.neutral {
  color: #6c757d;
  font-weight: bold;
}

/* 修改后的基本信息样式 */
.homework-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.homework-info h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
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

.latest-indicator.latest {
  color: #28a745;
  font-weight: bold;
}

.latest-indicator.old {
  color: #6c757d;
  font-style: italic;
}

.status.submitted {
  color: #1976d2;
}

.status.graded {
  color: #388e3c;
}

.status.returned {
  color: #7b1fa2;
}

/* 新增：选项高亮样式 */
.option.selected {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  padding-left: 10px;
}

.option.correct {
  background: #d4edda;
  border-left: 4px solid #28a745;
  padding-left: 10px;
}

.selected-mark {
  color: #ffc107;
  font-weight: bold;
  margin-left: 10px;
}

.correct-mark {
  color: #28a745;
  font-weight: bold;
  margin-left: 10px;
}

/* 答题详情样式保持不变 */
.answers-section {
  margin-bottom: 30px;
}

.answers-section h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.answers-list {
  display: grid;
  gap: 25px;
}

.answer-item {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
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

.earned-score {
  background: #e8f5e8;
  color: #388e3c;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.question-content,
.question-options,
.correct-answer,
.student-answer,
.teacher-comment {
  margin-bottom: 15px;
}

.question-content h4,
.question-options h4,
.correct-answer h4,
.student-answer h4,
.teacher-comment h4 {
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

.options-list {
  margin-left: 10px;
}

.option {
  margin: 5px 0;
  color: #666;
  padding: 5px;
  border-radius: 4px;
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

.correctness {
  margin-bottom: 15px;
}

.correct-indicator {
  padding: 6px 12px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 14px;
}

.correct-indicator.correct {
  background: #d4edda;
  color: #155724;
}

.correct-indicator.incorrect {
  background: #f8d7da;
  color: #721c24;
}

.teacher-comment {
  background: #fff8e1;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #ffecb3;
}

.teacher-comment p {
  margin: 0;
  line-height: 1.6;
  color: #333;
}

.overall-feedback {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.overall-feedback h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.feedback-content p {
  margin: 0;
  line-height: 1.6;
  color: #666;
}

/* 修改后的操作按钮样式 */
.actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  padding: 20px;
  flex-wrap: wrap;
}

.view-homework-btn,
.resubmit-btn,
.download-btn,
.download-all-btn,
.start-submit-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.view-homework-btn {
  background: #007bff;
  color: white;
}

.resubmit-btn {
  background: #ffc107;
  color: #212529;
}

.download-btn {
  background: #6c757d;
  color: white;
}

.download-all-btn {
  background: #17a2b8;
  color: white;
}

.start-submit-btn {
  background: #28a745;
  color: white;
}

.no-submission {
  text-align: center;
  padding: 60px 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.no-submission h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.no-submission p {
  margin: 0 0 20px 0;
  color: #666;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}
</style>