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

      <!-- 计时器 -->
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
<!--    <transition name="fade">-->
<!--      <div v-if="violationCount > 0" class="violation-warning">-->
<!--        <i class="icon-warning"></i>-->
<!--        <span>检测到违规行为! 违规次数: {{ violationCount }}/3</span>-->
<!--        <span v-if="violationCount >= 2" class="warning-tip">(超过3次将自动提交)</span>-->
<!--      </div>-->
<!--    </transition>-->

    <!-- 监考异常全屏警告 -->
    <div v-if="monitorError" class="monitor-error-overlay">
      <div class="error-content">
        <h3>监考系统异常</h3>
        <p>{{ monitorError }}</p>
        <div class="error-actions">
          <button @click="retryMonitor" class="btn btn-primary">重试</button>
          <button @click="continueWithoutMonitor" class="btn btn-secondary">继续考试</button>
        </div>
      </div>
    </div>

    <!-- 违规警告 - 增强版 -->
    <transition name="fade">
      <div v-if="violationCount > 0 || monitorViolations > 0" class="violation-warning enhanced">
        <div class="violation-left">
          <i class="icon-warning"></i>
          <span>检测到异常行为!</span>
        </div>
        <div class="violation-stats">
          <span>违规次数: {{ violationCount }}/3</span>
          <span>监考异常: {{ monitorViolations }}</span>
        </div>
        <div class="violation-tip" v-if="violationCount >= 2">
          <span class="warning-text">超过3次将自动提交!</span>
        </div>
      </div>
    </transition>


    <!-- 主内容区域 -->
    <div class="exam-main-content">
      <!-- 题目区域（只显示当前题目） -->
      <div class="questions-container">
        <form @submit.prevent="confirmSubmit">
          <div
              class="question-card"
              :id="'question-' + currentQuestion.id"
          >
            <div class="question-header">
              <div class="question-index">题目 {{ currentQuestionIndex + 1 }}</div>
              <div class="question-score">{{ currentQuestion.score }}分</div>
            </div>

            <div class="question-content">
              <p>{{ currentQuestion.content }}</p>
            </div>

            <!-- 单选题 -->
            <div v-if="currentQuestion.type === 'SINGLE'" class="options-container">
              <div
                  v-for="option in currentQuestion.options"
                  :key="option.id"
                  class="option-item"
                  :class="{ 'selected': answers[currentQuestion.id] === option.id }"
                  @click="answers[currentQuestion.id] = option.id"
              >
                <div class="option-radio">
                  <div class="radio-dot" v-show="answers[currentQuestion.id] === option.id"></div>
                </div>
                <label>
                  <span class="option-label">{{ option.optionLabel }}.</span>
                  <span class="option-text">{{ option.content }}</span>
                </label>
              </div>
            </div>

            <!-- 多选题 -->
            <div v-else-if="currentQuestion.type === 'MULTIPLE'" class="options-container">
              <div
                  v-for="option in currentQuestion.options"
                  :key="option.id"
                  class="option-item"
                  :class="{ 'selected': isOptionSelected(currentQuestion.id, option.id) }"
                  @click="toggleMultiOption(currentQuestion.id, option.id)"
              >
                <div class="option-checkbox">
                  <i
                      class="icon-check"
                      v-show="isOptionSelected(currentQuestion.id, option.id)"
                  ></i>
                </div>
                <label>
                  <span class="option-label">{{ option.optionLabel }}.</span>
                  <span class="option-text">{{ option.content }}</span>
                </label>
              </div>
            </div>

            <!-- 判断题 -->
            <div v-else-if="currentQuestion.type === 'JUDGE'" class="judge-container">
              <div
                  class="judge-option"
                  :class="{ 'selected': answers[currentQuestion.id] === 'true' }"
                  @click="answers[currentQuestion.id] = 'true'"
              >
                <div class="judge-radio">
                  <div class="radio-dot" v-show="answers[currentQuestion.id] === 'true'"></div>
                </div>
                <label>正确</label>
              </div>
              <div
                  class="judge-option"
                  :class="{ 'selected': answers[currentQuestion.id] === 'false' }"
                  @click="answers[currentQuestion.id] = 'false'"
              >
                <div class="judge-radio">
                  <div class="radio-dot" v-show="answers[currentQuestion.id] === 'false'"></div>
                </div>
                <label>错误</label>
              </div>
            </div>

            <!-- 简答题 -->
            <div v-else-if="currentQuestion.type === 'TEXT'" class="text-answer-container">
              <textarea
                  v-model="answers[currentQuestion.id]"
                  placeholder="请输入您的答案..."
                  rows="4"
              ></textarea>
            </div>

            <!-- 编程题 -->
            <div v-if="currentQuestion.type === 'PROGRAMMING'" class="programming-container">
              <ProgrammingQuestion
                  :key="`programming-${currentQuestion.id}`"
                  :question="currentQuestion"
                  :questionIndex="currentQuestionIndex"
                  :initialCode="getProgrammingCode(currentQuestion.id)"
                  @save="saveProgrammingAnswer"
                  @run="onProgrammingRun"
              />
            </div>
          </div>

          <!-- 导航按钮 -->
          <div class="question-navigation">
            <button
                type="button"
                class="nav-btn prev-btn"
                :disabled="currentQuestionIndex === 0"
                @click="goToQuestion(currentQuestionIndex - 1)"
            >
              <i class="icon-arrow-left"></i> 上一题
            </button>
            <button
                type="button"
                class="nav-btn next-btn"
                :disabled="currentQuestionIndex === questions.length - 1"
                @click="goToQuestion(currentQuestionIndex + 1)"
            >
              下一题 <i class="icon-arrow-right"></i>
            </button>
          </div>

          <!-- 提交按钮 -->
          <div class="submit-section">
            <button
                type="submit"
                class="submit-btn"
            >
              <i class="icon-upload"></i>
              提交试卷
            </button>
          </div>
        </form>
      </div>

      <!-- 题目导航侧边栏 -->
      <div class="question-sidebar">
        <div class="sidebar-header">
          <h3>题目导航</h3>
          <div class="answered-count">
            已答: {{ answeredCount }}/{{ questions.length }}
          </div>
        </div>
        <div class="question-list">
          <div
              v-for="(question, index) in questions"
              :key="question.id"
              class="question-item"
              :class="{
              'current': currentQuestionIndex === index,
              'answered': isQuestionAnswered(question.id),
              'marked': markedQuestions.includes(question.id)
            }"
              @click="goToQuestion(index)"
          >
            {{ index + 1 }}
          </div>
        </div>
        <div class="sidebar-footer">
          <button
              class="mark-btn"
              @click="toggleMarkQuestion(currentQuestion.id)"
          >
            <i class="icon-mark"></i>
            {{ markedQuestions.includes(currentQuestion.id) ? '取消标记' : '标记本题' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 监考组件 -->
    <div class="monitor-container">
      <ExamMonitor
          :exam-id="examId"
          :is-enabled="monitorEnabled"
          :show-stats="true"
          :capture-interval="monitorInterval"
          :auto-start="true"
          @camera-ready="onCameraReady"
          @camera-error="onCameraError"
          @monitor-started="onMonitorStarted"
          @monitor-stopped="onMonitorStopped"
          @upload-success="onUploadSuccess"
          @upload-error="onUploadError"
          @alert="onMonitorAlert"
          @stats-updated="onStatsUpdated"
      />
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

    <!-- 在确认对话框后添加等待提示 -->
    <div v-if="isSubmitting" class="submitting-mask">
      <div class="submitting-container">
        <div class="loading-spinner"></div>
        <h3>试卷提交中，请稍候...</h3>
        <p>请不要关闭页面或刷新浏览器</p>
      </div>
    </div>

    <div v-if="isAiGrading" class="ai-grading-mask">
      <div class="ai-grading-container">
        <div class="ai-processing-animation">
          <div class="ai-icon">
            <svg viewBox="0 0 24 24">
              <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"></path>
            </svg>
          </div>
          <div class="ai-dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        </div>
        <h3>AI正在判卷中</h3>
        <p>这可能需要一些时间，请耐心等待...</p>
        <div class="progress-text" v-if="gradingProgress">{{ gradingProgress }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import examApi from '../../../api/exam';
import questionApi from '../../../api/question';
import ProgrammingQuestion from '@/components/Programming.vue';
import ExamMonitor from '@/components/ExamMonitor.vue'; // 添加监考组件
import monitorApi from '@/api/monitor'; // 添加监考API

export default {
  name: 'ExamTaking',
  components: {
    ProgrammingQuestion,
    ExamMonitor
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
      violationDebounce: 1000,
      isInProgrammingEditor: false,
      currentQuestionIndex: 0,
      markedQuestions: [],
      isSubmitting: false,
      isAiGrading: false,
      gradingProgress: '',
      progressInterval: null,

      // 监考相关数据
      monitorEnabled: true,
      monitorInterval: 5000,
      monitorError: null,
      monitorStats: {},
      monitorViolations: 0,
      monitorAlerts: []
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
    },
    // 当前显示的题目
    currentQuestion() {
      return this.questions[this.currentQuestionIndex] || {};
    },
    // 已答题数量
    answeredCount() {
      return this.questions.filter(q => this.isQuestionAnswered(q.id)).length;
    }
  },
  methods: {
    // 获取token的统一方法
    getToken() {
      return localStorage.getItem('token');
    },

    // 统一处理API响应的方法
    extractData(response) {
      console.log('API Response:', response);

      // 如果response直接是数据
      if (response && typeof response === 'object' && !response.data) {
        return response;
      }

      // 如果response有data属性
      if (response && response.data) {
        // 如果是{success: true, data: {...}}格式
        if (response.data.success && response.data.data) {
          return response.data.data;
        }
        // 如果data直接是对象
        if (typeof response.data === 'object') {
          return response.data;
        }
        return response.data;
      }

      // 兜底返回原始response
      return response;
    },

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

    // 监考相关事件处理方法
    onCameraReady() {
      console.log('监考摄像头准备就绪')
      this.monitorError = null
      this.addMonitorAlert('监考系统已启动', 'success')
    },

    onCameraError(error) {
      console.error('监考摄像头错误:', error)
      this.monitorError = '摄像头访问失败，请检查设备权限和浏览器设置'
      this.addMonitorAlert('摄像头访问失败', 'error')
    },

    onMonitorStarted() {
      console.log('监考已开始')
      this.addMonitorAlert('监考已开始', 'info')
    },

    onMonitorStopped() {
      console.log('监考已停止')
      this.addMonitorAlert('监考已停止', 'warning')
    },

    onUploadSuccess(imagePath) {
      console.log('监考图片上传成功:', imagePath)
    },

    onUploadError(error) {
      console.error('监考图片上传失败:', error)
      this.monitorError = '监考系统连接异常，请检查网络连接'
      this.addMonitorAlert('监考图片上传失败', 'error')
    },

    onMonitorAlert(alert) {
      console.log('监考警告:', alert)
      this.addMonitorAlert(alert.message, alert.type)

      // 根据警告类型处理
      if (alert.type === 'error') {
        this.monitorError = alert.message
      }
    },

    onStatsUpdated(stats) {
      this.monitorStats = stats
      this.monitorViolations = stats.abnormalCount || 0

      // 检查异常率
      if (stats.totalCount > 0) {
        const abnormalRate = stats.abnormalCount / stats.totalCount
        if (abnormalRate > 0.3) {
          this.addMonitorAlert('监考异常率过高，请注意行为规范', 'warning')
        }
      }
    },

    addMonitorAlert(message, type = 'info') {
      const alert = {
        id: Date.now() + Math.random(),
        message: message,
        type: type,
        timestamp: new Date()
      }

      this.monitorAlerts.unshift(alert)

      // 限制警告数量
      if (this.monitorAlerts.length > 10) {
        this.monitorAlerts = this.monitorAlerts.slice(0, 10)
      }

      // 显示系统通知
      if (type === 'error') {
        this.$message.error('监考异常: ' + message)
      } else if (type === 'warning') {
        this.$message.warning('监考警告: ' + message)
      }

      // 自动移除警告
      setTimeout(() => {
        this.monitorAlerts = this.monitorAlerts.filter(a => a.id !== alert.id)
      }, 10000)
    },

    retryMonitor() {
      this.monitorError = null
      this.monitorViolations = 0
      // 重新初始化监考组件
      this.$nextTick(() => {
        // 触发监考组件重新初始化
        this.monitorEnabled = false
        this.$nextTick(() => {
          this.monitorEnabled = true
        })
      })
    },

    continueWithoutMonitor() {
      this.monitorEnabled = false
      this.monitorError = null
      this.addMonitorAlert('已关闭监考系统，继续考试', 'warning')
    },

    // 修改现有的提交考试方法，加入监考检查
    async submitExam() {
      this.showConfirmDialog = false;
      this.isSubmitting = true;
      this.cleanupViolationDetection();

      try {
        const token = this.getToken();
        if (!token) {
          throw new Error('未找到认证信息，请重新登录');
        }

        // 检查监考状态
        if (this.monitorEnabled && !this.monitorError) {
          await this.checkMonitorStatus();
        }

        const answers = this.prepareAnswersForSubmit();
        console.log('Submitting exam with answers:', answers);

        const response = await examApi.submitExam(this.examId, answers, token);
        console.log('Submit exam response:', response);

        this.isSubmitting = false;
        this.isAiGrading = true;
        this.startProgressSimulation();

        const result = this.extractData(response);
        await this.waitForGradingCompletion(result.recordId || result.id);

        this.$router.push(`/exams/${this.examId}/result`);
      } catch (error) {
        console.error('提交考试失败:', error);
        this.isSubmitting = false;
        this.isAiGrading = false;
        this.$message.error('提交考试失败：' + (error.message || '请重试'));
      }
    },

    // 检查监考状态
    async checkMonitorStatus() {
      // eslint-disable-next-line no-useless-catch
      try {
        const response = await monitorApi.getMonitorStatus(this.examId);
        if (response.data.success) {
          const { abnormalCount, totalCount } = response.data.data;

          if (totalCount === 0) {
            throw new Error('监考记录为空，请确保监考系统正常运行');
          }

          if (abnormalCount / totalCount > 0.5) {
            throw new Error('监考异常率过高，无法提交考试');
          }

          // 更新监考统计
          this.monitorStats = response.data.data;
          this.monitorViolations = abnormalCount;
        }
      } catch (error) {
        throw error;
      }
    },

    // 修改现有的违规检测方法，集成监考数据
    async recordViolation(type, description) {
      try {
        const now = Date.now();
        if (now - this.lastViolationTime < this.violationDebounce) {
          return console.warn('防抖：忽略短时间内重复违规');
        }
        this.lastViolationTime = now;

        const token = this.getToken();
        if (!token) {
          console.warn('No token found for violation recording');
          return;
        }

        const answers = this.prepareAnswersForSubmit();
        const payload = {
          type: type,
          description: description,
          answers: answers,
          monitorStats: this.monitorStats // 添加监考统计信息
        };

        console.log('Recording violation:', payload);
        const response = await examApi.recordViolation(
            this.examId,
            JSON.stringify(payload),
            token
        );
        console.log('Violation response:', response);

        const result = this.extractData(response);
        this.violationCount = result?.violationCount || this.violationCount + 1;

        // 记录监考违规
        this.addMonitorAlert(`检测到违规行为: ${description}`, 'error');

        // 自动提交逻辑
        if (this.violationCount >= 3) {
          alert('违规次数过多，系统将自动提交考试！');
          await this.forceSubmitExam('VIOLATION');
        }
      } catch (error) {
        console.error('记录违规失败:', error);
      }
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

    // 跳转到指定题目
    goToQuestion(index) {
      if (index >= 0 && index < this.questions.length) {
        this.currentQuestionIndex = index;
        // 滚动到题目顶部
        const element = document.getElementById(`question-${this.currentQuestion.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    },

    // 标记/取消标记题目
    toggleMarkQuestion(questionId) {
      const index = this.markedQuestions.indexOf(questionId);
      if (index === -1) {
        this.markedQuestions.push(questionId);
      } else {
        this.markedQuestions.splice(index, 1);
      }
    },

    // 初始化答案结构
    initializeAnswers() {
      const answers = {};
      this.questions.forEach(question => {
        if (question.type === 'MULTIPLE') {
          answers[question.id] = [];
        } else if (question.type === 'PROGRAMMING') {
          answers[question.id] = {
            code: '',
            language: 'java',
          };
        } else {
          answers[question.id] = null;
        }
      });
      this.answers = answers;
      console.log('答案结构初始化完成:', this.answers);
    },

    // 保存编程题答案
    saveProgrammingAnswer({ questionId, code, language, isSubmitted }) {
      console.log(`保存编程题 ${questionId} 答案:`, {
        codeLength: code?.length,
        language,
        isSubmitted
      });

      // 确保每次都创建新的对象，避免引用共享
      this.answers = {
        ...this.answers,
        [questionId]: {
          code: String(code || ''),
          language: String(language || 'java'),
        }
      };

      console.log(`题目 ${questionId} 答案已保存`);
    },

    // 获取编程题代码
    getProgrammingCode(questionId) {
      const answer = this.answers[questionId];

      console.log(`获取题目 ${questionId} 的答案:`, answer);

      if (answer && typeof answer === 'object' && !Array.isArray(answer)) {
        // 返回深拷贝，避免引用共享
        return {
          code: answer.code || '',
          language: answer.language || 'java',
          isSubmitted: answer.isSubmitted || false
        };
      }

      // 返回默认值
      return {
        code: '',
        language: 'java',
        isSubmitted: false
      };
    },

    // 检查题目是否已回答
    isQuestionAnswered(questionId) {
      const answer = this.answers[questionId];

      if (!answer) return false;

      // 编程题检查
      if (typeof answer === 'object' && !Array.isArray(answer)) {
        const hasCode = answer.code && String(answer.code).trim() !== '';
        const hasLanguageChoice = answer.language && answer.language !== 'java';
        return hasCode || hasLanguageChoice;
      }

      // 多选题检查
      if (Array.isArray(answer)) {
        return answer.length > 0;
      }

      // 其他题型检查
      return String(answer).trim() !== '';
    },

    // 加载考试数据
    async loadExamData() {
      try {
        const token = this.getToken();
        if (!token) {
          this.$message.error('未找到认证信息，请重新登录');
          this.$router.push('/login');
          return;
        }

        console.log('Loading exam data for exam ID:', this.examId);

        // 获取考试详情
        const examResponse = await examApi.getExamById(this.examId);
        console.log('Exam response:', examResponse);
        this.exam = this.extractData(examResponse);
        this.timeLeft = this.exam.duration * 60;

        // 获取题目列表
        const questionsResponse = await questionApi.getQuestionsByExamId(this.examId);
        console.log('Questions response:', questionsResponse);
        this.questions = this.extractData(questionsResponse) || [];
        this.initializeAnswers();

        // 开始考试
        const recordResponse = await examApi.startExam(this.examId, token);
        console.log('Start exam response:', recordResponse);

        const recordData = this.extractData(recordResponse);

        if (recordData && recordData.message === "您已经完成该考试，无法再次开始") {
          this.$message.warning('您已经完成该考试，正在跳转到结果页面...');
          this.$router.push(`/exams/${this.examId}/result`);
          return;
        }

        this.examRecord = recordData;
        this.violationCount = this.examRecord?.violationCount || 0;

        console.log('Exam data loaded successfully');
      } catch (error) {
        console.error('加载考试数据失败:', error);

        if (error.message && error.message.includes('认证')) {
          this.$message.error('认证失败，请重新登录');
          this.$router.push('/login');
        } else {
          this.$message.error('加载考试数据失败：' + (error.message || '请稍后重试'));
        }
      }
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

    // 显示确认对话框
    confirmSubmit() {
      this.showConfirmDialog = true;
    },

    startProgressSimulation() {
      let progress = 0;
      const messages = [
        "正在分析选择题答案...",
        "检查编程题代码结构...",
        "评估简答题内容...",
        "进行最终评分计算...",
        "即将完成..."
      ];

      this.progressInterval = setInterval(() => {
        progress += 20;
        if (progress > 100) progress = 100;

        const messageIndex = Math.min(
            Math.floor(progress / 20),
            messages.length - 1
        );
        this.gradingProgress = messages[messageIndex];

        if (progress >= 100) {
          clearInterval(this.progressInterval);
        }
      }, 1500);
    },

    async waitForGradingCompletion(recordId) {
      // 实际实现中，这里应该轮询服务器获取判卷状态
      // 这里使用setTimeout模拟等待
      return new Promise(resolve => {
        setTimeout(() => {
          clearInterval(this.progressInterval);
          resolve();
        }, 8000);
      });
    },

    prepareAnswersForSubmit() {
      const answers = this.questions.map(question => {
        let answer = this.answers[question.id];

        if (question.type === 'PROGRAMMING') {
          // 编程题特殊处理
          if (typeof answer === 'object' && answer !== null) {
            answer = JSON.stringify(answer);
          }
        } else if (question.type === 'MULTIPLE' && Array.isArray(answer)) {
          // 多选题处理
          answer = answer.length > 0 ? answer.join(',') : null;
        }

        return {
          questionId: question.id,
          answer: answer || null // 确保空答案为null而不是undefined
        };
      });

      console.log('Prepared answers for submission:', answers);
      return answers;
    },

    async handleTimeout() {
      alert('考试时间已到，系统将自动提交！');
      try {
        const token = this.getToken();
        if (!token) {
          throw new Error('未找到认证信息');
        }

        const response = await examApi.handleTimeout(this.examId, token);
        const result = this.extractData(response);

        this.$router.push({
          name: 'ExamResult',
          params: { examId: this.examId },
          query: {
            recordId: result.examRecordId || result.id,
            timeout: true
          }
        });
      } catch (error) {
        console.error('处理考试超时失败:', error);
        this.$message.error('处理考试超时失败：' + (error.message || '请稍后重试'));
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
      // 安全检查：确保事件对象和 target 存在
      if (!e || !e.target) {
        return;
      }

      // 确保 target 是 DOM 元素
      if (!(e.target instanceof Element)) {
        return;
      }

      try {
        // 检查是否在编程题相关区域
        const isProgrammingArea = this.checkIfInProgrammingArea(e.target);

        // 检查是否在其他可编辑区域
        const isEditableArea = this.checkIfInEditableArea(e.target);

        // 如果在允许的区域内，不阻止选择
        if (isProgrammingArea || isEditableArea) {
          return;
        }

        // 阻止文本选择
        e.preventDefault();
      } catch (error) {
        // 静默处理错误
        console.warn('Text selection prevention error:', error);
      }
    },

    // 辅助方法：检查是否在编程题区域
    checkIfInProgrammingArea(target) {
      const programmingSelectors = [
        '[data-programming-editor]',
        '[data-programming-input]',
        '.programming-question',
        '.code-editor',
        '.code-textarea',
        '.test-input',
        '.test-panel'
      ];

      return programmingSelectors.some(selector => {
        try {
          return target.closest(selector) !== null;
        } catch {
          return false;
        }
      }) || target.hasAttribute('data-programming-input');
    },

    // 辅助方法：检查是否在可编辑区域
    checkIfInEditableArea(target) {
      const editableSelectors = [
        'input',
        'textarea',
        'select',
        '[contenteditable="true"]',
        '.editable'
      ];

      return editableSelectors.some(selector => {
        try {
          return target.closest(selector) !== null;
        } catch {
          return false;
        }
      });
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

    async forceSubmitExam(reason) {
      try {
        const token = this.getToken();
        if (!token) {
          throw new Error('未找到认证信息');
        }

        const answers = this.prepareAnswersForSubmit();
        console.log('自动提交数据:', answers); // 调试用

        // 修改：对于强制提交，可能需要额外的参数，但答案仍然是数组
        const submitData = {
          answers: answers,
          submitType: 'AUTO',
          reason: reason
        };

        const response = await examApi.submitExam(this.examId, submitData, token);
        const result = this.extractData(response);

        // 确保跳转前请求完成
        this.$router.push({
          name: 'ExamResult',
          params: {
            examId: this.examId,
            recordId: result.recordId || result.id
          },
          query: {
            autoSubmitted: true,
            violationCount: this.violationCount
          }
        });
      } catch (error) {
        console.error('强制提交失败:', error);
        this.$message.error('系统即将强制结束考试');
        window.location.href = `/exams/${this.examId}/result?force=1`; // 后备方案
      }
    }
  },
  watch: {
    currentQuestionIndex(newIndex) {
      // 可以在这里添加滚动到题目的逻辑
      this.goToQuestion(newIndex);
    }
  },

  created() {
    this.loadExamData();
    this.setupExamTimer();
    this.setupViolationDetection();
  },

  beforeUnmount() {
    // 清除定时器
    if (this.timer) {
      clearInterval(this.timer);
    }
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
    // 清理违规检测
    this.cleanupViolationDetection();
  }
};
</script>

<style scoped>
/* 基础样式 */
.exam-taking-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  color: #333;
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
  font-weight: 600;
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

/* 主内容区域布局 */
.exam-main-content {
  display: flex;
  gap: 20px;
}

/* 题目区域 - 修改为单题视图 */
.questions-container {
  flex: 1;
  min-width: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 25px;
}

/* 题目卡片 - 单题样式 */
.question-card {
  width: 100%;
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
  font-size: 18px;
  font-weight: 600;
  color: #409EFF;
}

.question-score {
  background: #409EFF;
  color: white;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 14px;
}

.question-content p {
  margin: 0 0 20px 0;
  line-height: 1.6;
  font-size: 16px;
}

/* 选项样式 */
.options-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin: 20px 0;
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
  font-size: 15px;
}

.option-text {
  color: #606266;
  font-size: 15px;
}

/* 判断题样式 */
.judge-container {
  display: flex;
  gap: 20px;
  margin: 20px 0;
}

.judge-option {
  display: flex;
  align-items: center;
  padding: 12px 25px;
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
  margin: 20px 0;
}

.text-answer-container textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 15px;
  line-height: 1.5;
  resize: vertical;
  min-height: 150px;
  transition: border-color 0.3s;
}

.text-answer-container textarea:focus {
  outline: none;
  border-color: #409EFF;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

/* 题目导航侧边栏 */
.question-sidebar {
  width: 250px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 15px;
  position: sticky;
  top: 20px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.answered-count {
  font-size: 14px;
  color: #409EFF;
  font-weight: bold;
}

.question-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 10px;
  margin-bottom: 15px;
}

.question-item {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #f5f7fa;
  color: #606266;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
}

.question-item:hover {
  background-color: #e4e7ed;
}

.question-item.current {
  background-color: #409EFF;
  color: white;
  transform: scale(1.1);
}

.question-item.answered {
  background-color: #67C23A;
  color: white;
}

.question-item.marked {
  position: relative;
}

.question-item.marked::after {
  content: '';
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background-color: #E6A23C;
  border-radius: 50%;
  border: 2px solid white;
}

.sidebar-footer {
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.mark-btn {
  width: 100%;
  padding: 8px;
  background-color: #fdf6ec;
  color: #E6A23C;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  transition: all 0.3s;
  font-size: 14px;
}

.mark-btn:hover {
  background-color: #faecd8;
}

/* 导航按钮 */
.question-navigation {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
}

.nav-btn {
  padding: 12px 30px;
  border-radius: 6px;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  outline: none;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.prev-btn {
  background-color: #f5f7fa;
  border: 1px solid #dcdfe6;
  color: #606266;
}

.prev-btn:not(:disabled):hover {
  color: #409EFF;
  border-color: #c6e2ff;
}

.next-btn {
  background-color: #409EFF;
  color: white;
  border: none;
}

.next-btn:not(:disabled):hover {
  background-color: #66b1ff;
}

.icon-arrow-left, .icon-arrow-right {
  display: inline-block;
  width: 14px;
  height: 14px;
}

.icon-arrow-left {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z' fill='%23606266'/%3E%3C/svg%3E") no-repeat center;
}

.next-btn .icon-arrow-right {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z' fill='white'/%3E%3C/svg%3E") no-repeat center;
}

.prev-btn:hover .icon-arrow-left {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z' fill='%23409EFF'/%3E%3C/svg%3E") no-repeat center;
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

/* 图标样式 */
.icon-clock, .icon-warning, .icon-check, .icon-upload, .icon-mark {
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

.icon-mark {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z' fill='%23E6A23C'/%3E%3C/svg%3E") no-repeat center;
}

/* 过渡动画 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

/* 提交中遮罩 */
.submitting-mask, .ai-grading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  flex-direction: column;
}

.submitting-container, .ai-grading-container {
  text-align: center;
  max-width: 500px;
  padding: 30px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

/* 加载动画 */
.loading-spinner {
  width: 60px;
  height: 60px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #409EFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* AI判卷动画 */
.ai-processing-animation {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 25px;
}

.ai-icon svg {
  width: 60px;
  height: 60px;
  fill: #409EFF;
  animation: pulse 1.5s infinite;
}

.ai-dots {
  display: flex;
  align-items: center;
  margin-left: 15px;
}

.dot {
  width: 12px;
  height: 12px;
  background: #409EFF;
  border-radius: 50%;
  margin: 0 4px;
  opacity: 0.6;
}

.dot:nth-child(1) {
  animation: dotPulse 1.5s infinite;
}
.dot:nth-child(2) {
  animation: dotPulse 1.5s infinite 0.2s;
}
.dot:nth-child(3) {
  animation: dotPulse 1.5s infinite 0.4s;
}

@keyframes dotPulse {
  0%, 100% {
    transform: translateY(0);
    opacity: 0.6;
  }
  50% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

.progress-text {
  margin-top: 20px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 6px;
  color: #606266;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .exam-main-content {
    flex-direction: column;
  }

  .question-sidebar {
    width: 100%;
    position: static;
    order: -1;
    margin-bottom: 20px;
  }
}

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

  .question-navigation {
    margin: 20px 0;
  }

  .nav-btn {
    padding: 10px 20px;
  }

  .question-list {
    grid-template-columns: repeat(auto-fill, minmax(35px, 1fr));
  }

  .question-item {
    width: 35px;
    height: 35px;
    font-size: 14px;
  }

  .submit-btn {
    padding: 10px 30px;
    font-size: 15px;
  }

  .questions-container {
    padding: 15px;
  }
}

@media (max-width: 480px) {
  .question-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .question-navigation {
    flex-direction: column;
    gap: 10px;
  }

  .nav-btn {
    width: 100%;
    justify-content: center;
  }

  .question-item {
    width: 30px;
    height: 30px;
    font-size: 13px;
  }
}

/* 监考错误遮罩 */
.monitor-error-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.error-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.error-content h3 {
  color: #f5222d;
  margin-bottom: 15px;
}

.error-content p {
  color: #666;
  margin-bottom: 20px;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.error-actions .btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.error-actions .btn-primary {
  background: #409EFF;
  color: white;
}

.error-actions .btn-secondary {
  background: #f5f7fa;
  color: #606266;
  border: 1px solid #dcdfe6;
}

/* 增强版违规警告 */
.violation-warning.enhanced {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  margin-bottom: 20px;
}
</style>