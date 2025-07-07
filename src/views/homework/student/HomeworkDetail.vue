<template>
  <div class="homework-detail-container">
    <!-- 头部区域 -->
    <div class="detail-header">
      <button @click="$router.go(-1)" class="back-button">
        <i class="icon-back"></i> 返回
      </button>
      <h1 class="homework-title">{{ homework.title }}</h1>
      <div class="teacher-actions" v-if="isTeacher">
        <button @click="editHomework" class="action-button edit-button">
          <i class="icon-edit"></i> 编辑
        </button>
        <button @click="viewSubmissions" class="action-button view-button">
          <i class="icon-list"></i> 查看提交
        </button>
        <button
            v-if="homework.status === 'DRAFT'"
            @click="publishHomework"
            class="action-button publish-button"
        >
          <i class="icon-send"></i> 发布
        </button>
        <button
            v-if="homework.status === 'PUBLISHED'"
            @click="closeHomework"
            class="action-button close-button"
        >
          <i class="icon-lock"></i> 关闭
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>正在加载作业详情...</p>
    </div>

    <!-- 内容区域 -->
    <div v-else-if="homework.id" class="detail-content">
      <!-- 作业基本信息卡片 -->
      <div class="info-card">
        <div class="info-grid">
          <div class="info-item">
            <label><i class="icon-book"></i> 课程:</label>
            <span>{{ homework.courseTitle }}</span>
          </div>
          <div class="info-item">
            <label><i class="icon-user"></i> 教师:</label>
            <span>{{ homework.teacherName }}</span>
          </div>
          <div class="info-item">
            <label><i class="icon-tag"></i> 类型:</label>
            <span>{{ getTypeText(homework.homeworkType) }}</span>
          </div>
          <div class="info-item">
            <label><i class="icon-star"></i> 总分:</label>
            <span>{{ homework.totalScore }}分</span>
          </div>
          <div class="info-item">
            <label><i class="icon-status"></i> 状态:</label>
            <span :class="['status-badge', homework.status.toLowerCase()]">
              {{ getStatusText(homework.status) }}
            </span>
          </div>
          <div class="info-item">
            <label><i class="icon-clock"></i> 开始时间:</label>
            <span>{{ formatDate(homework.startTime) }}</span>
          </div>
          <div class="info-item">
            <label><i class="icon-deadline"></i> 截止时间:</label>
            <span>{{ formatDate(homework.endTime) }}</span>
          </div>
          <div class="info-item">
            <label><i class="icon-resubmit"></i> 允许重提:</label>
            <span>{{ homework.allowResubmit ? '是' : '否' }}</span>
          </div>
          <div class="info-item" v-if="homework.allowResubmit">
            <label><i class="icon-repeat"></i> 最大提交次数:</label>
            <span>{{ homework.maxSubmitTimes }}</span>
          </div>
        </div>

        <!-- 作业描述 -->
        <div class="description-section">
          <h3><i class="icon-desc"></i> 作业描述</h3>
          <div class="description-content" v-html="formatDescription(homework.description)"></div>
        </div>
      </div>

      <!-- 题目列表 -->
      <div class="questions-card" v-if="homework.questions && homework.questions.length > 0">
        <div class="card-header">
          <h3><i class="icon-question"></i> 题目列表 ({{ homework.questions.length }} 题)</h3>
          <span class="total-score">总分: {{ calculateTotalScore() }}分</span>
        </div>

        <div class="questions-list">
          <div
              v-for="(question, index) in homework.questions"
              :key="question.id"
              class="question-item"
              :class="{ 'last-item': index === homework.questions.length - 1 }"
          >
            <div class="question-header">
              <span class="question-number">Q{{ index + 1 }}</span>
              <span class="question-type">{{ getQuestionTypeText(question.questionType) }}</span>
              <span class="question-score">{{ question.score }}分</span>
            </div>

            <div class="question-content">
              <div class="content-text">{{ question.questionContent }}</div>

              <!-- 选择题选项 -->
              <div v-if="question.questionOptions" class="options-container">
                <div
                    v-for="(option, optIndex) in parseOptions(question.questionOptions)"
                    :key="optIndex"
                    class="option-item"
                >
                  <span class="option-letter">{{ String.fromCharCode(65 + optIndex) }}.</span>
                  <span class="option-text">{{ option }}</span>
                </div>
              </div>

              <!-- 参考答案 -->
              <div v-if="question.correctAnswer" class="correct-answer">
                <span class="answer-label">参考答案:</span>
                <span class="answer-text">{{ question.correctAnswer }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 学生操作按钮 -->
      <div class="student-actions" v-if="!isTeacher">
        <button
            @click="startSubmit"
            :disabled="!canSubmit"
            class="submit-button"
            :class="{ disabled: !canSubmit }"
        >
          <i class="icon-upload"></i> {{ getSubmitButtonText() }}
        </button>
        <button
            @click="viewMySubmission"
            class="view-button"
        >
          <i class="icon-eye"></i> 查看我的提交
        </button>
      </div>

      <!-- 教师统计信息 -->
      <div class="stats-card" v-if="isTeacher && statistics">
        <div class="card-header">
          <h3><i class="icon-stats"></i> 作业统计</h3>
        </div>

        <div class="stats-grid">
          <div class="stat-item total-students">
            <div class="stat-value">{{ statistics.total_student_count || 0 }}</div>
            <div class="stat-label">总学生数</div>
          </div>

          <div class="stat-item submitted">
            <div class="stat-value">{{ statistics.submitted_count || 0 }}</div>
            <div class="stat-label">已提交</div>
          </div>

          <div class="stat-item avg-score">
            <div class="stat-value">{{ statistics.avg_score ? statistics.avg_score.toFixed(1) : 0 }}</div>
            <div class="stat-label">平均分</div>
          </div>

          <div class="stat-item max-score">
            <div class="stat-value">{{ statistics.max_score || 0 }}</div>
            <div class="stat-label">最高分</div>
          </div>

          <div class="stat-item min-score">
            <div class="stat-value">{{ statistics.min_score || 0 }}</div>
            <div class="stat-label">最低分</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">
        <i class="icon-empty"></i>
      </div>
      <p class="empty-text">未找到作业信息</p>
      <button @click="$router.go(-1)" class="back-button">
        <i class="icon-back"></i> 返回列表
      </button>
    </div>
  </div>
</template>

<script>
import homeworkApi from '@/api/homework';

export default {
  name: 'HomeworkDetail',
  props: ['homeworkId'],
  data() {
    return {
      homework: {},
      statistics: null,
      loading: false,
      isTeacher: false,
      canSubmit: false
    };
  },
  async mounted() {
    await this.loadHomework();
    if (this.isTeacher) {
      await this.loadStatistics();
    } else {
      await this.checkSubmitPermission();
    }
  },
  methods: {
    getToken() {
      return localStorage.getItem('token');
    },
    async loadHomework() {
      this.loading = true;
      try {
        const response = await homeworkApi.getHomeworkById(this.homeworkId);
        if (response.data.success) {
          this.homework = response.data.data;
          this.isTeacher = this.userId === this.homework.teacherId;
        }
      } catch (error) {
        console.error('加载作业详情失败:', error);
        this.$notify.error({
          title: '错误',
          message: '加载作业详情失败'
        });
      } finally {
        this.loading = false;
      }
    },

    async loadStatistics() {
      try {
        const response = await homeworkApi.getHomeworkStatistics(this.homeworkId);
        if (response.data.success) {
          this.statistics = response.data.data;
        }
      } catch (error) {
        console.error('加载统计信息失败:', error);
        this.$notify.warning({
          title: '提示',
          message: '统计信息加载失败'
        });
      }
    },

    async checkSubmitPermission() {
      const token=this.getToken();
      try {
        const [accessResponse, resubmitResponse] = await Promise.all([
          homeworkApi.checkHomeworkAccess(this.homeworkId, token),
          homeworkApi.canResubmit(this.homeworkId, token)
        ]);

        this.canSubmit = accessResponse.data.success &&
            accessResponse.data.data &&
            resubmitResponse.data.success &&
            resubmitResponse.data.data;
      } catch (error) {
        console.error('检查提交权限失败:', error);
        this.canSubmit = false;
      }
    },

    calculateTotalScore() {
      return this.homework.questions?.reduce((sum, q) => sum + (q.score || 0), 0) || 0;
    },

    editHomework() {
      this.$router.push(`/homework/${this.homeworkId}/edit`);
    },

    viewSubmissions() {
      this.$router.push(`/homework/${this.homeworkId}/submission`);
    },

    async publishHomework() {
      try {
        const { data } = await homeworkApi.publishHomework(this.homeworkId);
        if (data.success) {
          this.$notify.success({
            title: '成功',
            message: '作业已发布'
          });
          await this.loadHomework();
        }
      } catch (error) {
        console.error('发布作业失败:', error);
        this.$notify.error({
          title: '错误',
          message: '发布作业失败'
        });
      }
    },

    async closeHomework() {
      try {
        const { data } = await homeworkApi.closeHomework(this.homeworkId);
        if (data.success) {
          this.$notify.success({
            title: '成功',
            message: '作业已关闭'
          });
          await this.loadHomework();
        }
      } catch (error) {
        console.error('关闭作业失败:', error);
        this.$notify.error({
          title: '错误',
          message: '关闭作业失败'
        });
      }
    },

    startSubmit() {
      if (!this.canSubmit) return;
      this.$router.push(`/homework/${this.homeworkId}/submit`);
    },

    viewMySubmission() {
      this.$router.push(`/homework/${this.homeworkId}/submission`);
    },

    formatDescription(desc) {
      if (!desc) return '暂无描述';
      return desc.replace(/\n/g, '<br>');
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
        'CLOSED': '已关闭'
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

    getSubmitButtonText() {
      if (!this.canSubmit) {
        return this.homework.status === 'CLOSED' ? '已截止' : '无法提交';
      }
      return '提交作业';
    },

    parseOptions(optionsJson) {
      try {
        if (typeof optionsJson === 'string') {
          return JSON.parse(optionsJson);
        }
        return optionsJson || [];
      } catch {
        return [];
      }
    },

    formatDate(dateString) {
      if (!dateString) return '未设置';
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN') + ' ' +
          date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
  }
};
</script>

<style scoped>
/* 基础样式 */
.homework-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 头部样式 */
.detail-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.back-button {
  padding: 8px 16px;
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s;
}

.back-button:hover {
  background: #e0e0e0;
  color: #333;
}

.homework-title {
  flex: 1;
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
  line-height: 1.3;
}

.teacher-actions {
  display: flex;
  gap: 10px;
}

.action-button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s;
}

.edit-button {
  background: #ffc107;
  color: #212529;
}

.view-button {
  background: #17a2b8;
  color: white;
}

.publish-button {
  background: #28a745;
  color: white;
}

.close-button {
  background: #dc3545;
  color: white;
}

/* 卡片通用样式 */
.info-card,
.questions-card,
.stats-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid #f0f0f0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f5f5f5;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.total-score {
  font-size: 16px;
  font-weight: 500;
  color: #666;
}

/* 信息网格样式 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-item label {
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-item span {
  font-size: 14px;
  color: #333;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.draft {
  background: #fff8e1;
  color: #ff8f00;
}

.status-badge.published {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-badge.closed {
  background: #ffebee;
  color: #c62828;
}

/* 描述区域 */
.description-section {
  margin-top: 24px;
}

.description-content {
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
  line-height: 1.8;
  color: #444;
}

/* 题目列表样式 */
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-item {
  padding: 16px;
  border-radius: 8px;
  background: #fafafa;
  border-left: 4px solid #007bff;
}

.question-item.last-item {
  margin-bottom: 0;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #e0e0e0;
}

.question-number {
  font-weight: bold;
  color: #007bff;
  font-size: 16px;
}

.question-type {
  padding: 2px 8px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 4px;
  font-size: 12px;
}

.question-score {
  margin-left: auto;
  padding: 2px 8px;
  background: #f3e5f5;
  color: #7b1fa2;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.question-content {
  line-height: 1.6;
}

.content-text {
  margin-bottom: 12px;
  color: #333;
}

.options-container {
  margin: 12px 0 0 16px;
}

.option-item {
  display: flex;
  margin-bottom: 8px;
  line-height: 1.5;
}

.option-letter {
  font-weight: bold;
  color: #666;
  margin-right: 8px;
  min-width: 20px;
}

.option-text {
  color: #444;
}

.correct-answer {
  margin-top: 12px;
  padding: 8px;
  background: #e8f5e9;
  border-radius: 4px;
  display: flex;
  gap: 8px;
}

.answer-label {
  font-weight: bold;
  color: #2e7d32;
}

.answer-text {
  color: #333;
}

/* 统计卡片样式 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.stat-item {
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  transition: transform 0.3s;
}

.stat-item:hover {
  transform: translateY(-3px);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 6px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.total-students {
  background: rgba(0, 123, 255, 0.1);
  border: 1px solid rgba(0, 123, 255, 0.2);
}

.total-students .stat-value {
  color: #007bff;
}

.submitted {
  background: rgba(40, 167, 69, 0.1);
  border: 1px solid rgba(40, 167, 69, 0.2);
}

.submitted .stat-value {
  color: #28a745;
}

.avg-score {
  background: rgba(108, 117, 125, 0.1);
  border: 1px solid rgba(108, 117, 125, 0.2);
}

.avg-score .stat-value {
  color: #6c757d;
}

.max-score {
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.2);
}

.max-score .stat-value {
  color: #ffc107;
}

.min-score {
  background: rgba(220, 53, 69, 0.1);
  border: 1px solid rgba(220, 53, 69, 0.2);
}

.min-score .stat-value {
  color: #dc3545;
}

/* 学生操作按钮 */
.student-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
}

.submit-button,
.view-button {
  padding: 12px 28px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.submit-button {
  background: linear-gradient(135deg, #28a745, #218838);
  color: white;
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.2);
}

.submit-button:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(40, 167, 69, 0.3);
}

.submit-button.disabled {
  background: #e0e0e0;
  color: #999;
  cursor: not-allowed;
  box-shadow: none;
}

.view-button {
  background: linear-gradient(135deg, #007bff, #0062cc);
  color: white;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.2);
}

.view-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 123, 255, 0.3);
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(0, 123, 255, 0.1);
  border-radius: 50%;
  border-top-color: #007bff;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: #666;
  font-size: 16px;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  text-align: center;
}

.empty-icon {
  font-size: 60px;
  color: #ccc;
  margin-bottom: 20px;
}

.empty-text {
  font-size: 18px;
  color: #666;
  margin-bottom: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .detail-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .teacher-actions {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 8px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .student-actions {
    flex-direction: column;
    gap: 12px;
  }

  .submit-button,
  .view-button {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .homework-detail-container {
    padding: 16px 12px;
  }

  .info-card,
  .questions-card,
  .stats-card {
    padding: 16px;
  }

  .question-header {
    flex-wrap: wrap;
  }

  .question-score {
    margin-left: 0;
    width: 100%;
    margin-top: 8px;
  }
}
</style>