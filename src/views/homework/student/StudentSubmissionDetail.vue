<template>
  <div class="student-submission-detail">
    <div class="header">
      <button @click="$router.go(-1)" class="back-btn">
        <i class="el-icon-arrow-left"></i> 返回
      </button>
      <h1>提交详情</h1>
      <div class="submission-info">
        <span v-if="currentSubmission.studentName" class="info-item">
          <i class="el-icon-user"></i> 学生: {{ currentSubmission.studentName }}
        </span>
        <span v-if="currentSubmission.submitTime" class="info-item">
          <i class="el-icon-time"></i> 提交时间: {{ formatDate(currentSubmission.submitTime) }}
        </span>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <i class="el-icon-loading"></i>
      <span>加载中...</span>
    </div>

    <div v-else-if="allSubmissions.length > 0" class="content">
      <!-- 提交次数选择器 -->
      <div class="submission-selector card">
        <h3><i class="el-icon-notebook-2"></i> 提交记录</h3>
        <div class="selector-container">
          <div class="select-wrapper">
            <label for="submission-select">提交次数:</label>
            <el-select
                id="submission-select"
                v-model="selectedSubmissionIndex"
                @change="onSubmissionChange"
                class="submission-select"
                placeholder="请选择提交记录">
              <el-option
                  v-for="(submission, index) in allSubmissions"
                  :key="submission.id"
                  :label="`第${index + 1}次提交 (${formatDate(submission.submitTime)})${submission.totalScore !== null ? ' - ' + submission.totalScore + '分' : ' - 待批改'}`"
                  :value="index">
              </el-option>
            </el-select>
          </div>
          <div class="summary-stats">
            <div class="stat-item">
              <span class="stat-label">提交总数</span>
              <span class="stat-value">{{ allSubmissions.length }}</span>
            </div>
            <div class="stat-item" v-if="latestSubmission && latestSubmission.totalScore !== null">
              <span class="stat-label">最新得分</span>
              <span class="stat-value score">{{ latestSubmission.totalScore }}分</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 当前选中提交的详细信息 -->
      <div class="current-submission-detail">
        <!-- 作业基本信息 -->
        <div class="homework-info card">
          <h3><i class="el-icon-document"></i> {{ currentSubmission.homeworkTitle }}</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label"><i class="el-icon-collection"></i> 课程:</span>
              <span>{{ currentSubmission.courseTitle }}</span>
            </div>
            <div class="info-item">
              <span class="label"><i class="el-icon-medal"></i> 作业总分:</span>
              <span>{{ homework.totalScore }}分</span>
            </div>
            <div class="info-item">
              <span class="label"><i class="el-icon-star-off"></i> 当前得分:</span>
              <span v-if="currentSubmission.totalScore !== null" class="score-value">
                {{ currentSubmission.totalScore }}分
              </span>
              <span v-else class="pending">待批改</span>
            </div>
            <div class="info-item">
              <span class="label"><i class="el-icon-s-flag"></i> 提交状态:</span>
              <span :class="['status', currentSubmission.status.toLowerCase()]">
                {{ getStatusText(currentSubmission.status) }}
              </span>
            </div>
            <div class="info-item">
              <span class="label"><i class="el-icon-time"></i> 提交时间:</span>
              <span>{{ formatDate(currentSubmission.submitTime) }}</span>
            </div>
            <div class="info-item">
              <span class="label"><i class="el-icon-s-data"></i> 提交状态:</span>
              <span :class="['latest-indicator', isLatestSubmission ? 'latest' : 'old']">
                {{ isLatestSubmission ? '最新提交' : '历史提交' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 提交对比信息 -->
        <div v-if="allSubmissions.length > 1" class="submission-comparison card">
          <h3><i class="el-icon-trend-charts"></i> 成绩分析</h3>
          <div class="comparison-grid">
            <div class="comparison-item">
              <div class="stat-icon">
                <i class="el-icon-top"></i>
              </div>
              <div class="stat-content">
                <span class="label">最高分</span>
                <span class="value">{{ getHighestScore() }}分</span>
              </div>
            </div>
            <div class="comparison-item">
              <div class="stat-icon">
                <i class="el-icon-bottom"></i>
              </div>
              <div class="stat-content">
                <span class="label">最低分</span>
                <span class="value">{{ getLowestScore() }}分</span>
              </div>
            </div>
            <div class="comparison-item">
              <div class="stat-icon">
                <i class="el-icon-s-data"></i>
              </div>
              <div class="stat-content">
                <span class="label">平均分</span>
                <span class="value">{{ getAverageScore() }}分</span>
              </div>
            </div>
            <div class="comparison-item">
              <div class="stat-icon">
                <i :class="getImprovementIcon()"></i>
              </div>
              <div class="stat-content">
                <span class="label">进步情况</span>
                <span :class="['improvement', getImprovementClass()]">
                  {{ getImprovementText() }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 答题详情 -->
        <div class="answers-section card">
          <div class="section-header">
            <h3><i class="el-icon-edit-outline"></i> 答题详情</h3>
            <span class="submission-count">第{{ selectedSubmissionIndex + 1 }}次提交</span>
          </div>
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
                  <i class="el-icon-star-on"></i> 得分: {{ answer.score }}
                </span>
              </div>

              <div class="question-content">
                <h4><i class="el-icon-question"></i> 题目</h4>
                <p>{{ answer.questionContent }}</p>
              </div>

              <!-- 选择题选项 -->
              <div v-if="answer.questionOptions" class="question-options">
                <h4><i class="el-icon-circle-check"></i> 选项</h4>
                <div class="options-list">
                  <div
                      v-for="(option, optIndex) in parseOptions(answer.questionOptions)"
                      :key="optIndex"
                      :class="['option', {
                      'selected': isOptionSelected(answer.studentAnswer, optIndex),
                      'correct': isCorrectOption(answer.correctAnswer, optIndex)
                    }]">
                    {{ String.fromCharCode(65 + optIndex) }}. {{ option }}
                    <span v-if="isOptionSelected(answer.studentAnswer, optIndex)" class="selected-mark">
                      <i class="el-icon-check"></i> 已选
                    </span>
                    <span v-if="isCorrectOption(answer.correctAnswer, optIndex)" class="correct-mark">
                      <i class="el-icon-success"></i> 正确
                    </span>
                  </div>
                </div>
              </div>

              <!-- 参考答案 -->
              <div v-if="answer.correctAnswer" class="correct-answer">
                <h4><i class="el-icon-lightbulb"></i> 参考答案</h4>
                <p class="answer-text">{{ answer.correctAnswer }}</p>
              </div>

              <!-- 学生答案 -->
              <div class="student-answer">
                <h4><i class="el-icon-user"></i> 我的答案</h4>
                <p v-if="answer.studentAnswer" class="answer-text">
                  {{ answer.studentAnswer }}
                </p>
                <p v-else class="no-answer">未作答</p>
              </div>

              <!-- 正确性标识 -->
              <div v-if="answer.isCorrect !== null" class="correctness">
                <span :class="['correct-indicator', answer.isCorrect ? 'correct' : 'incorrect']">
                  <i :class="answer.isCorrect ? 'el-icon-success' : 'el-icon-error'"></i>
                  {{ answer.isCorrect ? '正确' : '错误' }}
                </span>
              </div>

              <!-- 教师评语 -->
              <div v-if="answer.teacherComment" class="teacher-comment">
                <h4><i class="el-icon-chat-line-round"></i> 教师评语</h4>
                <p>{{ answer.teacherComment }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 教师总体反馈 -->
        <div v-if="currentSubmission.teacherFeedback" class="overall-feedback card">
          <h3><i class="el-icon-chat-line-square"></i> 教师总体反馈</h3>
          <div class="feedback-content">
            <p>{{ currentSubmission.teacherFeedback }}</p>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="actions">
          <el-button @click="viewHomework" type="primary" plain>
            <i class="el-icon-document"></i> 查看作业详情
          </el-button>
          <el-button
              v-if="canResubmit"
              @click="resubmit"
              type="warning" plain>
            <i class="el-icon-refresh-right"></i> 重新提交
          </el-button>
          <el-button @click="downloadSubmission" type="info" plain>
            <i class="el-icon-download"></i> 下载当前提交
          </el-button>
          <el-button @click="downloadAllSubmissions" type="info" plain>
            <i class="el-icon-download"></i> 下载所有提交
          </el-button>
        </div>
      </div>
    </div>

    <div v-else class="no-submission card">
      <div class="empty-state">
        <i class="el-icon-document-delete"></i>
        <h3>暂无提交记录</h3>
        <p>您还没有提交过这份作业</p>
        <el-button @click="startSubmit" type="primary">
          <i class="el-icon-edit"></i> 开始作业
        </el-button>
      </div>
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

    getImprovementIcon() {
      const improvementClass = this.getImprovementClass();
      switch (improvementClass) {
        case 'improved': return 'el-icon-top';
        case 'declined': return 'el-icon-bottom';
        default: return 'el-icon-right';
      }
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

<style scoped lang="scss">
.student-submission-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

/* 卡片通用样式 */
.card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  padding: 24px;
  margin-bottom: 20px;
  border: 1px solid #ebeef5;
}

/* 头部样式 */
.header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e6e6e6;

  h1 {
    flex: 1;
    margin: 0;
    color: #303133;
    font-size: 24px;
    font-weight: 500;
    min-width: 200px;
  }
}

.back-btn {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: #66b1ff;
  }

  i {
    margin-right: 5px;
  }
}

.submission-info {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  font-size: 14px;
  color: #606266;
  width: 100%;

  .info-item {
    display: inline-flex;
    align-items: center;

    i {
      margin-right: 5px;
      color: #909399;
    }
  }
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #909399;

  i {
    font-size: 32px;
    margin-bottom: 15px;
    animation: rotating 2s linear infinite;
  }

  span {
    font-size: 16px;
  }
}

@keyframes rotating {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 提交选择器 */
.submission-selector {
  h3 {
    margin: 0 0 20px 0;
    color: #303133;
    font-size: 18px;
    font-weight: 500;

    i {
      color: #409eff;
      margin-right: 8px;
    }
  }
}

.selector-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
}

.select-wrapper {
  flex: 1;
  min-width: 300px;

  label {
    display: block;
    margin-bottom: 8px;
    color: #606266;
    font-size: 14px;
  }
}

.summary-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 15px;
  background: #f5f7fa;
  border-radius: 4px;

  .stat-label {
    font-size: 12px;
    color: #909399;
    margin-bottom: 5px;
  }

  .stat-value {
    font-size: 16px;
    font-weight: 500;
    color: #303133;

    &.score {
      color: #67c23a;
    }
  }
}

/* 作业信息 */
.homework-info {
  h3 {
    margin: 0 0 20px 0;
    color: #303133;
    font-size: 18px;
    font-weight: 500;

    i {
      color: #409eff;
      margin-right: 8px;
    }
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  font-size: 14px;
  line-height: 1.5;

  .label {
    color: #909399;
    margin-right: 8px;
    display: inline-flex;
    align-items: center;

    i {
      margin-right: 5px;
    }
  }

  span:not(.label) {
    color: #303133;
  }

  .score-value {
    color: #67c23a;
    font-weight: 500;
  }

  .pending {
    color: #e6a23c;
    font-style: italic;
  }

  .status {
    &.submitted {
      color: #409eff;
    }
    &.graded {
      color: #67c23a;
    }
    &.returned {
      color: #f56c6c;
    }
  }

  .latest-indicator {
    &.latest {
      color: #67c23a;
    }
    &.old {
      color: #909399;
    }
  }
}

/* 提交对比信息 */
.submission-comparison {
  h3 {
    margin: 0 0 20px 0;
    color: #303133;
    font-size: 18px;
    font-weight: 500;

    i {
      color: #409eff;
      margin-right: 8px;
    }
  }
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.comparison-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;

  .stat-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #409eff;
    color: white;
    border-radius: 50%;
    margin-right: 15px;
    font-size: 18px;
  }

  .stat-content {
    display: flex;
    flex-direction: column;

    .label {
      font-size: 12px;
      color: #909399;
      margin-bottom: 5px;
    }

    .value {
      font-size: 16px;
      font-weight: 500;
      color: #303133;
    }

    .improvement {
      font-weight: 500;

      &.improved {
        color: #67c23a;
      }
      &.declined {
        color: #f56c6c;
      }
      &.neutral {
        color: #909399;
      }
    }
  }
}

/* 答题详情 */
.answers-section {
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;

    h3 {
      margin: 0;
      color: #303133;
      font-size: 18px;
      font-weight: 500;

      i {
        color: #409eff;
        margin-right: 8px;
      }
    }

    .submission-count {
      color: #909399;
      font-size: 14px;
    }
  }
}

.answers-list {
  display: grid;
  gap: 20px;
}

.answer-item {
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafafa;

  &:hover {
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  }
}

.question-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #dcdfe6;

  .question-number {
    font-weight: 500;
    color: #409eff;
    font-size: 16px;
  }

  .question-type {
    background: #ecf5ff;
    color: #409eff;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
  }

  .question-score {
    background: #f0f9eb;
    color: #67c23a;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
  }

  .earned-score {
    background: #fdf6ec;
    color: #e6a23c;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    display: inline-flex;
    align-items: center;

    i {
      margin-right: 3px;
    }
  }
}

.question-content,
.question-options,
.correct-answer,
.student-answer,
.teacher-comment {
  margin-bottom: 15px;

  h4 {
    margin: 0 0 10px 0;
    color: #606266;
    font-size: 15px;
    font-weight: 500;
    display: flex;
    align-items: center;

    i {
      margin-right: 5px;
      color: #409eff;
    }
  }

  p {
    margin: 0;
    line-height: 1.6;
    color: #606266;
  }
}

.options-list {
  margin-left: 10px;
}

.option {
  margin: 8px 0;
  padding: 8px 12px;
  border-radius: 4px;
  background: #fff;
  border: 1px solid #dcdfe6;
  transition: all 0.3s;
  position: relative;

  &.selected {
    background: #fff3e0;
    border-color: #ffb74d;

    .selected-mark {
      color: #ff9800;
      position: absolute;
      right: 10px;
      top: 8px;
      font-size: 12px;
      display: inline-flex;
      align-items: center;

      i {
        margin-right: 3px;
      }
    }
  }

  &.correct {
    background: #f0f9eb;
    border-color: #c2e7b0;

    .correct-mark {
      color: #67c23a;
      position: absolute;
      right: 10px;
      top: 8px;
      font-size: 12px;
      display: inline-flex;
      align-items: center;

      i {
        margin-right: 3px;
      }
    }
  }
}

.answer-text {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  border-left: 4px solid #409eff;
  margin: 0;
  line-height: 1.6;
  color: #303133;
}

.no-answer {
  color: #f56c6c;
  font-style: italic;
  margin: 0;
}

.correctness {
  margin: 15px 0;

  .correct-indicator {
    padding: 8px 15px;
    border-radius: 4px;
    font-weight: 500;
    display: inline-flex;
    align-items: center;

    i {
      margin-right: 5px;
    }

    &.correct {
      background: #f0f9eb;
      color: #67c23a;
    }

    &.incorrect {
      background: #fef0f0;
      color: #f56c6c;
    }
  }
}

.teacher-comment {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid #e6a23c;

  p {
    color: #303133;
  }
}

/* 教师总体反馈 */
.overall-feedback {
  h3 {
    margin: 0 0 15px 0;
    color: #303133;
    font-size: 18px;
    font-weight: 500;
    display: flex;
    align-items: center;

    i {
      color: #409eff;
      margin-right: 8px;
    }
  }

  .feedback-content {
    p {
      margin: 0;
      line-height: 1.6;
      color: #606266;
      padding: 12px;
      background: #f5f7fa;
      border-radius: 4px;
    }
  }
}

/* 操作按钮 */
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: center;
  padding: 20px 0;
}

/* 无提交状态 */
.no-submission {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;

  .empty-state {
    text-align: center;
    max-width: 400px;

    i {
      font-size: 60px;
      color: #c0c4cc;
      margin-bottom: 20px;
    }

    h3 {
      margin: 0 0 10px 0;
      color: #303133;
      font-size: 20px;
    }

    p {
      margin: 0 0 20px 0;
      color: #909399;
      font-size: 14px;
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;

    h1 {
      font-size: 20px;
    }
  }

  .info-grid,
  .comparison-grid {
    grid-template-columns: 1fr;
  }

  .selector-container {
    flex-direction: column;
  }

  .select-wrapper {
    width: 100%;
    min-width: auto;
  }

  .summary-stats {
    width: 100%;
    justify-content: space-between;
  }

  .actions {
    flex-direction: column;

    .el-button {
      width: 100%;
    }
  }
}

@media (max-width: 480px) {
  .student-submission-detail {
    padding: 15px;
  }

  .card {
    padding: 15px;
  }

  .question-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>