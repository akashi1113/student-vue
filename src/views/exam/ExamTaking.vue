<template>
  <div class="exam-taking-container">
    <!-- 考试头部信息 -->
    <div class="exam-header">
      <div class="exam-title">
        <h1>{{ exam.name }}</h1>
        <span class="status-tag" :class="getStatusClass(exam.status)">
          {{ formatStatus(exam.status) }}
        </span>
      </div>

      <!-- 优化后的计时器 -->
      <div class="timer-container">
        <div class="time-remaining">
          <i class="icon-clock"></i>
          <span class="time-text">{{ minutes }}:{{ seconds < 10 ? '0' + seconds : seconds }}</span>
        </div>
        <div class="progress-bar" :style="progressStyle"></div>
        <div class="time-label">
          <span>剩余时间</span>
          <span>{{ Math.floor(exam.duration) }}分钟考试</span>
        </div>
      </div>
    </div>

    <!-- 违规警告 -->
    <transition name="fade">
      <div v-if="violationCount > 0" class="violation-warning">
        <i class="icon-warning"></i>
        <span>检测到违规行为! 违规次数: {{ violationCount }}/3</span>
        <span v-if="violationCount >= 2" class="warning-tip">(超过3次将自动提交)</span>
      </div>
    </transition>

    <!-- 题目区域 -->
    <div class="questions-container">
      <form @submit.prevent="submitExam">
        <div v-for="(question, index) in questions" :key="question.id" class="question-card">
          <div class="question-header">
            <div class="question-index">题目 {{ index + 1 }}</div>
            <div class="question-score">{{ question.score }}分</div>
          </div>

          <div class="question-content">
            <p>{{ question.content }}</p>
          </div>

          <!-- 单选题 -->
          <div v-if="question.type === 'SINGLE'" class="options-container">
            <div
                v-for="option in question.options"
                :key="option.id"
                class="option-item"
                :class="{ 'selected': answers[question.id] === option.id }"
                @click="answers[question.id] = option.id"
            >
              <div class="option-radio">
                <div class="radio-dot" v-show="answers[question.id] === option.id"></div>
              </div>
              <label>
                <span class="option-label">{{ option.optionLabel }}.</span>
                <span class="option-text">{{ option.content }}</span>
              </label>
            </div>
          </div>

          <!-- 多选题 -->
          <div v-else-if="question.type === 'MULTIPLE'" class="options-container">
            <div
                v-for="option in question.options"
                :key="option.id"
                class="option-item"
                :class="{ 'selected': isOptionSelected(question.id, option.id) }"
                @click="toggleMultiOption(question.id, option.id)"
            >
              <div class="option-checkbox">
                <i
                    class="icon-check"
                    v-show="isOptionSelected(question.id, option.id)"
                ></i>
              </div>
              <label>
                <span class="option-label">{{ option.optionLabel }}.</span>
                <span class="option-text">{{ option.content }}</span>
              </label>
            </div>
          </div>

          <!-- 判断题 -->
          <div v-else-if="question.type === 'JUDGE'" class="judge-container">
            <div
                class="judge-option"
                :class="{ 'selected': answers[question.id] === 'true' }"
                @click="answers[question.id] = 'true'"
            >
              <div class="judge-radio">
                <div class="radio-dot" v-show="answers[question.id] === 'true'"></div>
              </div>
              <label>正确</label>
            </div>
            <div
                class="judge-option"
                :class="{ 'selected': answers[question.id] === 'false' }"
                @click="answers[question.id] = 'false'"
            >
              <div class="judge-radio">
                <div class="radio-dot" v-show="answers[question.id] === 'false'"></div>
              </div>
              <label>错误</label>
            </div>
          </div>

          <!-- 简答题 -->
          <div v-else-if="question.type === 'TEXT'" class="text-answer-container">
            <textarea
                v-model="answers[question.id]"
                placeholder="请输入您的答案..."
                rows="4"
            ></textarea>
          </div>

          <!-- 编程题 -->
          <div v-if="question.type === 'PROGRAMMING'" class="question-card">
            <ProgrammingQuestion
                :question="question"
                :questionIndex="index"
                :initialCode="answers[question.id] || ''"
                @save="saveProgrammingAnswer"
            />
          </div>
        </div>

        <!-- 提交按钮 -->
        <div class="submit-section">
          <button
              type="submit"
              class="submit-btn"
              @click.prevent="confirmSubmit"
          >
            <i class="icon-upload"></i>
            提交试卷
          </button>
        </div>
      </form>
    </div>

    <!-- 确认对话框 -->
    <div v-if="showConfirmDialog" class="confirm-dialog-mask">
      <div class="confirm-dialog">
        <h3>确认要提交试卷吗?</h3>
        <p>提交后将无法继续答题</p>
        <div class="dialog-buttons">
          <button class="cancel-btn" @click="showConfirmDialog = false">再检查一下</button>
          <button class="confirm-btn" @click="submitExam">确定提交</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import examApi from '../../api/exam';
import questionApi from '../../api/question';
import ProgrammingQuestion from '@/components/Programming.vue';

export default {
  name: 'ExamTaking',
  components: {
    ProgrammingQuestion
  },
  props: {
    examId: {
      type: [String, Number],
      required: true
    }
  },
  data() {
    return {
      exam: {},
      questions: [],
      answers: {},
      timeLeft: 0,
      timer: null,
      violationCount: 0,
      examRecord: null,
      showConfirmDialog: false,
      lastViolationTime: 0,
      violationDebounce: 1000, // 1秒内不重复记录同类型违规
      isInProgrammingEditor: false // 新增：标记是否在编程编辑器中
    };
  },
  computed: {
    minutes() {
      return Math.floor(this.timeLeft / 60);
    },
    seconds() {
      return this.timeLeft % 60;
    },
    timePercentage() {
      return (this.timeLeft / (this.exam.duration * 60)) * 100;
    },
    progressStyle() {
      let color;
      if (this.timePercentage > 50) color = '#67C23A';
      else if (this.timePercentage > 20) color = '#E6A23C';
      else color = '#F56C6C';

      return {
        width: `${this.timePercentage}%`,
        backgroundColor: color
      };
    }
  },
  methods: {
    // 格式化状态显示
    formatStatus(status) {
      const statusMap = {
        'DRAFT': '草稿',
        'PUBLISHED': '进行中',
        'ENDED': '已结束',
        'CANCELLED': '已取消'
      }
      return statusMap[status] || status;
    },

    // 状态标签样式
    getStatusClass(status) {
      const classMap = {
        'DRAFT': 'draft',
        'PUBLISHED': 'published',
        'ENDED': 'ended',
        'CANCELLED': 'cancelled'
      }
      return classMap[status] || '';
    },

    // 检查选项是否被选中（多选题用）
    isOptionSelected(questionId, optionId) {
      const selectedOptions = this.answers[questionId];
      return Array.isArray(selectedOptions) && selectedOptions.includes(optionId);
    },

    // 切换多选题选项
    toggleMultiOption(questionId, optionId) {
      const currentAnswers = this.answers[questionId] || [];
      const index = currentAnswers.indexOf(optionId);

      if (index === -1) {
        this.answers[questionId] = [...currentAnswers, optionId];
      } else {
        this.answers[questionId] = currentAnswers.filter(id => id !== optionId);
      }
    },

    saveProgrammingAnswer({ questionId, code, language, isSubmitted }) {
      // 保存编程题答案
      this.answers[questionId] = {
        code: code,
        language: language,
        isSubmitted: isSubmitted || false
      };

      // 如果是最终提交，可以在这里做额外处理
      if (isSubmitted) {
        console.log(`编程题 ${questionId} 已提交`, { code, language });
      }
    },

    confirmSubmit() {
      this.showConfirmDialog = true;
    },

    async loadExamData() {
      try {
        const examResponse = await examApi.getExamById(this.examId);
        this.exam = examResponse.data.data;
        this.timeLeft = this.exam.duration * 60;

        const questionsResponse = await questionApi.getQuestionsByExamId(this.examId);
        this.questions = questionsResponse.data.data;
        this.initializeAnswers();

        const recordResponse = await examApi.startExam(this.examId);
        if (recordResponse.data.message === "您已经完成该考试，无法再次开始") {
          // 已经完成考试，跳转到结果页面
          this.$message.warning('您已经完成该考试，正在跳转到结果页面...');
          this.$router.push(`/exams/${this.examId}/result`);
          return;
        }
        this.examRecord = recordResponse.data.data;
        this.violationCount = this.examRecord.violationCount || 0;
      } catch (error) {
        console.error('加载考试数据失败:', error);
        alert('加载考试数据失败，请刷新页面重试');
      }
    },

    initializeAnswers() {
      const answers = {};
      this.questions.forEach(question => {
        if (question.type === 'MULTIPLE') {
          answers[question.id] = [];
        } else {
          answers[question.id] = null;
        }
      });
      this.answers = answers;
    },

    setupExamTimer() {
      this.timer = setInterval(() => {
        this.timeLeft--;

        if (this.timeLeft === 300) {
          alert('注意：考试剩余时间不足5分钟！');
        } else if (this.timeLeft === 60) {
          alert('注意：考试剩余时间不足1分钟！');
        }

        if (this.timeLeft <= 0) {
          clearInterval(this.timer);
          this.handleTimeout();
        }
      }, 1000);
    },

    async submitExam() {
      this.showConfirmDialog = false;
      try {
        const answers = this.prepareAnswersForSubmit();
        await examApi.submitExam(this.examId, answers);
        this.$router.push(`/exams/${this.examId}/result`);
      } catch (error) {
        console.error('提交考试失败:', error);
        alert('提交考试失败，请重试');
      }
    },

    prepareAnswersForSubmit() {
      return this.questions.map(question => {
        let answer = this.answers[question.id];

        if (question.type === 'PROGRAMMING') {
          // 编程题特殊处理
          answer = typeof answer === 'object' ? JSON.stringify(answer) : answer;
        } else if (question.type === 'MULTIPLE' && Array.isArray(answer)) {
          answer = answer.length > 0 ? answer.join(',') : null;
        }

        return {
          questionId: question.id,
          answer: answer
        };
      });
    },

    async handleTimeout() {
      alert('考试时间已到，系统将自动提交！');
      try {
        const response = await examApi.handleTimeout(this.examId);
        this.$router.push({
          name: 'ExamResult',
          params: { examId: this.examId },
          query: {
            recordId: response.data.data.examRecordId,
            timeout: true
          }
        });
      } catch (error) {
        console.error('处理考试超时失败:', error);
        alert('处理考试超时失败');
      }
    },

    // 违规检测
    setupViolationDetection() {
      window.addEventListener('blur', this.handleWindowBlur);
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      document.addEventListener('contextmenu', this.preventContextMenu);
      document.addEventListener('keydown', this.handleKeyDown);
      document.addEventListener('selectstart', this.preventSelection);
      document.addEventListener('copy', this.preventCopy);

      // 监听编程编辑器的焦点状态
      document.addEventListener('focusin', this.handleFocusIn);
      document.addEventListener('focusout', this.handleFocusOut);
    },

    cleanupViolationDetection() {
      window.removeEventListener('blur', this.handleWindowBlur);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      document.removeEventListener('contextmenu', this.preventContextMenu);
      document.removeEventListener('keydown', this.handleKeyDown);
      document.removeEventListener('selectstart', this.preventSelection);
      document.removeEventListener('copy', this.preventCopy);
      document.removeEventListener('focusin', this.handleFocusIn);
      document.removeEventListener('focusout', this.handleFocusOut);
    },

    // 处理焦点进入
    handleFocusIn(e) {
      // 检查是否在编程编辑器内
      const programmingEditor = e.target.closest('.programming-question');
      this.isInProgrammingEditor = !!programmingEditor;
    },

    // 处理焦点离开
    handleFocusOut(e) {
      // 延迟检查，确保焦点真正离开了编程编辑器区域
      setTimeout(() => {
        const activeElement = document.activeElement;
        const programmingEditor = activeElement?.closest('.programming-question');
        this.isInProgrammingEditor = !!programmingEditor;
      }, 100);
    },

    async handleWindowBlur() {
      // 如果在编程编辑器中，不记录违规
      if (this.isInProgrammingEditor) {
        console.log('在编程编辑器中，忽略窗口失焦违规检测');
        return;
      }
      await this.recordViolation('WINDOW_BLUR', '窗口失去焦点');
    },

    handleVisibilityChange() {
      if (document.hidden) {
        // 如果在编程编辑器中，不记录违规
        if (this.isInProgrammingEditor) {
          console.log('在编程编辑器中，忽略标签页切换违规检测');
          return;
        }
        this.recordViolation('TAB_SWITCH', '切换到其他标签页');
      }
    },

// 在 ExamTaking 组件的 methods 中修改
    handleKeyDown(e) {
      // 检查是否在编程编辑器相关元素中
      const target = e.target;
      const isProgrammingEditor = target.closest('[data-programming-editor]') ||
          target.hasAttribute('data-programming-input') ||
          target.closest('.programming-question');

      // 如果在编程编辑器中，允许大部分操作
      if (isProgrammingEditor) {
        // 在编程编辑器中，只禁止F12开发者工具
        if (e.key === 'F12') {
          e.preventDefault();
          this.recordViolation('DEVTOOLS_ATTEMPT', '尝试打开开发者工具');
        }
        return; // 其他按键操作都允许
      }

      // 其他区域的严格检测
      if (e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.key === 'u')) {
        e.preventDefault();
        this.recordViolation('DEVTOOLS_ATTEMPT', '尝试打开开发者工具');
      }

      if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
        e.preventDefault();
        this.recordViolation('COPY_PASTE', '尝试复制或粘贴');
      }
    },

    preventContextMenu(e) {
      // 检查是否在编程编辑器中
      const isProgrammingEditor = e.target.closest('[data-programming-editor]') ||
          e.target.hasAttribute('data-programming-input') ||
          e.target.closest('.programming-question');

      if (isProgrammingEditor) {
        return; // 允许右键菜单
      }

      e.preventDefault();
      this.recordViolation('RIGHT_CLICK', '尝试打开右键菜单');
    },

    preventSelection(e) {
      // 检查是否在编程编辑器中
      const isProgrammingEditor = e.target.closest('[data-programming-editor]') ||
          e.target.hasAttribute('data-programming-input') ||
          e.target.closest('.programming-question');

      if (isProgrammingEditor) {
        return; // 允许选择文本
      }

      e.preventDefault();
    },

    preventCopy(e) {
      // 检查是否在编程编辑器中
      const isProgrammingEditor = e.target.closest('[data-programming-editor]') ||
          e.target.hasAttribute('data-programming-input') ||
          e.target.closest('.programming-question');

      if (isProgrammingEditor) {
        return; // 允许复制
      }

      e.preventDefault();
      this.recordViolation('COPY_PASTE', '尝试复制内容');
    },

    async recordViolation(type, description) {
      try {
        // 防抖检查
        const now = Date.now();
        if (now - this.lastViolationTime < this.violationDebounce) {
          return console.warn('防抖：忽略短时间内重复违规');
        }
        this.lastViolationTime = now;

        const answers = this.prepareAnswersForSubmit();
        const payload = {
          type: type,
          description: description,
          answers: answers
        };

        const response = await examApi.recordViolation(
            this.examId,
            JSON.stringify(payload),
            { headers: { 'Content-Type': 'application/json' } }
        );

        // 从响应或重新获取最新状态
        this.violationCount = response.data?.data?.violationCount ||
            response.data?.violationCount ||
            this.violationCount + 1;

        // 自动提交逻辑
        if (this.violationCount >= 3) {
          alert('违规次数过多，系统将自动提交考试！');
          await this.forceSubmitExam('VIOLATION');
        }
      } catch (error) {
        console.error('记录违规失败:', error);
      }
    },

    async forceSubmitExam(reason) {
      try {
        const answers = this.prepareAnswersForSubmit();
        console.log('自动提交数据:', { answers }); // 调试用

        const response = await examApi.submitExam(this.examId, {
          answers,
          submitType: 'AUTO',
          reason
        });

        // 确保跳转前请求完成
        this.$router.push({
          name: 'ExamResult',
          params: {
            examId: this.examId,
            recordId: response.data.recordId
          },
          query: {
            autoSubmitted: true,
            violationCount: this.violationCount
          }
        });
      } catch (error) {
        console.error('强制提交失败:', error);
        alert('系统即将强制结束考试');
        window.location.href = `/exams/${this.examId}/result?force=1`; // 后备方案
      }
    }
  },

  created() {
    this.loadExamData();
    this.setupExamTimer();
    this.setupViolationDetection();
  },

  beforeUnmount() {
    clearInterval(this.timer);
    this.cleanupViolationDetection();
  }
};
</script>

<style scoped>
/* 基础样式 */
.exam-taking-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

/* 图标样式 */
.icon-clock, .icon-warning, .icon-check, .icon-upload {
  display: inline-block;
  width: 1em;
  height: 1em;
  vertical-align: middle;
  fill: currentColor;
}

.icon-clock {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z'/%3E%3C/svg%3E") no-repeat center;
}

.icon-warning {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2L1 21h22L12 2zm0 3.5L19.5 19h-15L12 5.5zM12 16c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm-1-4V8h2v4h-2z'/%3E%3C/svg%3E") no-repeat center;
}

.icon-check {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z'/%3E%3C/svg%3E") no-repeat center;
}

.icon-upload {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z'/%3E%3C/svg%3E") no-repeat center;
}

/* 考试头部样式 */
.exam-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.exam-title {
  display: flex;
  align-items: center;
  gap: 15px;
}

.exam-title h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.status-tag {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.status-tag.draft {
  background-color: #f4f4f5;
  color: #909399;
}

.status-tag.published {
  background-color: #f0f9eb;
  color: #67c23a;
}

.status-tag.ended {
  background-color: #fef0f0;
  color: #f56c6c;
}

.status-tag.cancelled {
  background-color: #fdf6ec;
  color: #e6a23c;
}

/* 计时器样式 */
.timer-container {
  width: 200px;
  text-align: right;
}

.time-remaining {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 5px;
}

.time-remaining .icon-clock {
  width: 18px;
  height: 18px;
  color: #909399;
}

.time-text {
  font-size: 22px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  color: #303133;
}

.progress-bar {
  height: 8px;
  border-radius: 4px;
  transition: all 1s linear;
}

.time-label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

/* 违规警告 */
.violation-warning {
  padding: 12px 15px;
  margin-bottom: 20px;
  background-color: #fef0f0;
  color: #f56c6c;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
  animation: pulse 1.5s infinite;
}

.violation-warning .icon-warning {
  width: 18px;
  height: 18px;
}

.warning-tip {
  margin-left: auto;
  font-size: 12px;
  color: #f78989;
}

@keyframes pulse {
  0% { opacity: 0.9; }
  50% { opacity: 0.6; }
  100% { opacity: 0.9; }
}

/* 题目卡片 */
.question-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 25px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #ebeef5;
}

.question-index {
  font-size: 16px;
  font-weight: 600;
  color: #409EFF;
}

.question-score {
  background: #409EFF;
  color: white;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 12px;
}

.question-content p {
  margin: 0 0 15px 0;
  line-height: 1.6;
  font-size: 15px;
}

/* 选项样式 */
.options-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #dcdfe6;
}

.option-item:hover {
  border-color: #c0c4cc;
  background-color: #f5f7fa;
}

.option-item.selected {
  border-color: #409EFF;
  background-color: #ecf5ff;
}

.option-radio, .option-checkbox {
  width: 18px;
  height: 18px;
  border: 1px solid #dcdfe6;
  border-radius: 50%;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.option-item.selected .option-radio {
  border-color: #409EFF;
}

.radio-dot {
  width: 10px;
  height: 10px;
  background: #409EFF;
  border-radius: 50%;
}

.option-checkbox {
  border-radius: 4px;
}

.option-item.selected .option-checkbox {
  background: #409EFF;
  border-color: #409EFF;
}

.option-item.selected .option-checkbox .icon-check {
  width: 12px;
  height: 12px;
  color: white;
}

.option-label {
  font-weight: bold;
  margin-right: 5px;
  color: #409EFF;
}

.option-text {
  color: #606266;
}

/* 判断题样式 */
.judge-container {
  display: flex;
  gap: 20px;
  margin-top: 10px;
}

.judge-option {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid #dcdfe6;
  transition: all 0.2s;
}

.judge-option:hover {
  border-color: #c0c4cc;
}

.judge-option.selected {
  border-color: #409EFF;
  background-color: #ecf5ff;
}

.judge-radio {
  width: 16px;
  height: 16px;
  border: 1px solid #dcdfe6;
  border-radius: 50%;
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.judge-option.selected .judge-radio {
  border-color: #409EFF;
}

/* 简答题样式 */
.text-answer-container {
  margin-top: 15px;
}

.text-answer-container textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.3s;
}

.text-answer-container textarea:focus {
  outline: none;
  border-color: #409EFF;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

/* 提交按钮 */
.submit-section {
  text-align: center;
  margin-top: 40px;
}

.submit-btn {
  padding: 12px 40px;
  font-size: 16px;
  letter-spacing: 1px;
  background-color: #409EFF;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 12px 0 rgba(64, 158, 255, 0.3);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.submit-btn:hover {
  background-color: #66b1ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.4);
}

.submit-btn:active {
  transform: translateY(0);
}

.submit-btn .icon-upload {
  width: 16px;
  height: 16px;
  color: white;
}

/* 确认对话框 */
.confirm-dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.confirm-dialog {
  background: white;
  border-radius: 8px;
  padding: 20px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.confirm-dialog h3 {
  margin-top: 0;
  color: #303133;
  font-size: 18px;
}

.confirm-dialog p {
  color: #606266;
  margin: 10px 0 20px;
}

.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-btn, .confirm-btn {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: white;
  border: 1px solid #dcdfe6;
  color: #606266;
}

.cancel-btn:hover {
  color: #409EFF;
  border-color: #c6e2ff;
}

.confirm-btn {
  background: #409EFF;
  color: white;
  border: none;
}

.confirm-btn:hover {
  background: #66b1ff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .exam-header {
    flex-direction: column;
    gap: 15px;
  }

  .timer-container {
    width: 100%;
    text-align: left;
  }

  .time-remaining {
    justify-content: flex-start;
  }

  .judge-container {
    flex-direction: column;
    gap: 10px;
  }
}

/* 过渡动画 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>