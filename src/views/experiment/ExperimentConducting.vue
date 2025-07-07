<template>
  <div class="experiment-interface">
    <!-- 实验头部信息 -->
    <div class="experiment-header">
      <div class="experiment-info">
        <h2>{{ experiment.name }}</h2>
        <div class="experiment-meta">
          <span class="subject">{{ experiment.subject }}</span>
          <span class="duration">预计时长: {{ experiment.duration }}分钟</span>
          <span class="status" :class="experimentRecord?.status?.toLowerCase() || 'running'">
            {{ getStatusText() }}
          </span>
        </div>
      </div>

      <div class="experiment-actions">
        <button
            class="btn-secondary"
            @click="showHistory = true"
            :disabled="codeHistory.length === 0"
        >
          代码历史 ({{ codeHistory.length }})
        </button>
        <button
            class="btn-primary"
            @click="generateReport"
            :disabled="experimentRecord.status !== 'COMPLETED'"
        >
          生成报告
        </button>
      </div>
    </div>

    <!-- 实验内容区域 -->
    <div class="experiment-content">
      <!-- 左侧：实验描述和步骤 -->
      <div class="experiment-sidebar">
        <!-- 实验描述 -->
        <div class="description-section">
          <h3>实验描述</h3>
          <div class="description-content" v-html="experiment.description"></div>
        </div>

        <!-- 实验步骤 -->
        <div class="steps-section">
          <h3>实验步骤</h3>
          <div class="steps-list">
            <div
                v-for="(step, index) in experimentSteps"
                :key="index"
                class="step-item"
                :class="{ completed: step.completed }"
            >
              <div class="step-header" @click="toggleStep(index)">
                <div class="step-number">{{ index + 1 }}</div>
                <div class="step-title">{{ step.name }}</div>
                <div class="step-status">
                  <span v-if="step.completed">✓</span>
                  <span v-else>○</span>
                </div>
              </div>
              <div v-if="step.description" class="step-description">
                {{ step.description }}
              </div>
              <div v-if="step.expanded" class="step-notes">
                <textarea
                    v-model="step.notes"
                    placeholder="添加步骤笔记..."
                    @blur="saveStepNotes(index)"
                    rows="3"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：编程题卡片 -->
      <div class="experiment-main">
        <div class="programming-container">
          <ProgrammingQuestion
              :question="programmingQuestion"
              :question-index="0"
              :initial-code="currentCode"
              @save="onCodeSave"
              @run="onCodeRun"
              @editor-focus="onEditorFocus"
              @editor-blur="onEditorBlur"
              ref="programmingEditor"
          />
        </div>

        <!-- 实验控制按钮 -->
        <div class="experiment-controls">
          <button
              v-if="experimentRecord.status === 'RUNNING'"
              class="btn btn-save"
              @click="saveProgress"
              :disabled="isSaving"
          >
            <i class="el-icon-upload"></i>
            保存进度
          </button>

          <button
              v-if="experimentRecord.status === 'RUNNING'"
              class="btn btn-complete"
              @click="completeExperiment"
          >
            <i class="el-icon-check"></i>
            完成实验
          </button>
        </div>
      </div>
    </div>

    <!-- 代码历史对话框 -->
    <div v-if="showHistory" class="modal-overlay" @click="showHistory = false">
      <div class="modal-content code-history-modal" @click.stop>
        <div class="modal-header">
          <h3>代码历史记录</h3>
          <button class="modal-close" @click="showHistory = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="history-list">
            <div
                v-for="(history) in codeHistory"
                :key="history.id"
                class="history-item"
                :class="{ active: selectedHistory?.id === history.id }"
                @click="selectHistory(history)"
            >
              <div class="history-header">
                <span class="history-action" :class="history.actionType.toLowerCase()">
                  {{ getActionText(history.actionType) }}
                </span>
                <span class="history-language">{{ history.language.toUpperCase() }}</span>
                <span class="history-time">{{ formatTime(history.createdAt) }}</span>
              </div>
              <div v-if="history.executionResult" class="history-result">
                执行结果: {{ getExecutionStatus(history.executionResult) }}
              </div>
            </div>
          </div>
          <div v-if="selectedHistory" class="history-detail">
            <div class="history-detail-header">
              <h4>代码内容</h4>
              <button class="btn-secondary" @click="restoreCode(selectedHistory)">
                恢复此版本
              </button>
            </div>
            <pre class="code-preview">{{ selectedHistory.code }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- 实验报告对话框 -->
    <div v-if="showReport" class="modal-overlay report-overlay" @click="showReport = false">
      <div class="modal-content report-modal" @click.stop>
        <div class="modal-header report-header">
          <div class="header-content">
            <div class="report-title">
              <h3>{{ experiment.name }} - 实验报告</h3>
              <div class="report-subtitle">实验编号: {{ experimentRecord.id }}</div>
            </div>
            <div class="report-meta">
              <div class="meta-item">
                <i class="el-icon-time"></i>
                <span>{{ formatDate(experimentRecord.startTime) }} - {{ experimentRecord.endTime ? formatDate(experimentRecord.endTime) : '进行中' }}</span>
              </div>
              <div class="meta-item">
                <i class="el-icon-timer"></i>
                <span>耗时: {{ calculateDuration() }}</span>
              </div>
              <div class="meta-item status-badge" :class="experimentRecord.status.toLowerCase()">
                <i :class="statusIcon"></i>
                <span>{{ getStatusText() }}</span>
              </div>
            </div>
          </div>
          <button class="modal-close" @click="showReport = false">&times;</button>
        </div>
        <div class="modal-body report-body">
          <div class="report-content" ref="reportContent">
            <!-- 报告内容将在这里动态生成 -->
          </div>
        </div>
        <div class="modal-footer report-footer">
          <div class="footer-actions">
            <button class="btn btn-primary" @click="downloadReport">
              <i class="el-icon-download"></i> 下载报告
            </button>
            <button class="btn btn-print" @click="printReport">
              <i class="el-icon-printer"></i> 打印报告
            </button>
          </div>
          <div class="footer-note">
            报告生成时间: {{ new Date().toLocaleString() }}
          </div>
        </div>
      </div>
    </div>

    <div class="report-download" ref="reportDownload" v-show="false">
      <div class="download-container">
        <header class="download-header">
          <h1>{{ experiment.name }} - 实验报告</h1>
          <div class="report-meta">
            <div class="meta-row">
              <span><strong>实验编号：</strong>{{ experimentRecord.id }}</span>
              <span><strong>生成时间：</strong>{{ new Date().toLocaleString() }}</span>
            </div>
            <div class="meta-row">
              <span><strong>实验状态：</strong>{{ getStatusText() }}</span>
              <span><strong>实验时长：</strong>{{ calculateDuration() }}</span>
            </div>
          </div>
        </header>

        <main class="download-content">
          <!-- 动态生成的报告内容会插入到这里 -->
        </main>

        <footer class="download-footer">
          <p>{{ experiment.subject }} · {{ experiment.department || '计算机学院' }}</p>
        </footer>
      </div>
    </div>
  </div>
</template>


<script>
import ProgrammingQuestion from '@/components/Programming.vue';
import experimentApi from '@/api/experiment';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default {
  name: 'ExperimentInterface',
  components: {
    ProgrammingQuestion
  },
  props: {
    experimentId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      experiment: {},
      experimentRecord: {
        status: 'RUNNING', // 默认状态
      },
      experimentSteps: [],
      programmingQuestion: {},
      currentCode: '',
      codeHistory: [],
      selectedHistory: null,
      showHistory: false,
      showReport: false,
      reportData: null,
      autoSaveTimer: null,
      isEditorFocused: false
    };
  },
  async mounted() {
    await this.initializeExperiment();
    this.setupAutoSave();
  },
  beforeUnmount() {
    this.clearAutoSave();
  },
  methods: {
    getToken() {
      return localStorage.getItem('token')
    },
    // 初始化实验
    async initializeExperiment() {
      const token=this.getToken();
      try {
        // 开始实验
        const recordResponse = await experimentApi.startExperiment(this.experimentId, token);
        this.experimentRecord = recordResponse.data;

        // 获取实验详情
        const detailResponse = await experimentApi.getExperimentDetail(this.experimentRecord.id);
        const detail = detailResponse.data;

        this.experiment = detail.experiment;
        this.experimentSteps = this.parseSteps(detail.stepRecords);
        this.codeHistory = detail.codeHistory || [];

        // 设置编程题
        this.setupProgrammingQuestion();

        // 如果有代码历史，恢复最新的代码
        if (this.codeHistory.length > 0) {
          const latestCode = this.codeHistory[this.codeHistory.length - 1];
          this.currentCode = latestCode.code;
        }

      } catch (error) {
        console.error('初始化实验失败:', error);
        this.$message?.error('初始化实验失败');
      }
    },

    // 设置编程题
    setupProgrammingQuestion() {
      this.programmingQuestion = {
        id: `experiment_${this.experimentId}`,
        description: this.experiment.description || '请根据实验要求完成编程任务',
        examples: [],
        constraints: '请参考实验步骤中的具体要求'
      };
    },

    // 解析实验步骤
    parseSteps(stepRecords) {
      try {
        const stepsConfig = JSON.parse(this.experiment.steps || '[]');
        return stepsConfig.map((stepConfig, index) => {
          const record = stepRecords.find(r => r.stepIndex === index);
          return {
            name: stepConfig.title || `步骤${index + 1}`,
            description: stepConfig.content || '',
            completed: record?.completed || false,
            notes: record?.notes || '',
            expanded: false
          };
        });
      } catch (error) {
        console.error('解析实验步骤失败:', error);
        return [];
      }
    },

    // 代码保存事件
    async onCodeSave(data) {
      console.log('代码保存事件:', data);

      if (data && data.code) {
        this.currentCode = data.code;

        // 延迟保存，避免频繁请求
        this.scheduleAutoSave(() => {
          this.saveCodeHistory(data.code, data.language || 'java', 'SAVE');
        });
      }
    },

    // 代码运行事件处理
    async onCodeRun(data) {
      console.log('代码运行事件:', data);

      if (data && data.code) {
        this.currentCode = data.code;

        // 立即保存运行记录
        await this.saveCodeHistory(
            data.code,
            data.language || 'java',
            'RUN',
            data.executionResult || null
        );
      }
    },

    // 编辑器焦点事件
    onEditorFocus() {
      this.isEditorFocused = true;
    },

    onEditorBlur() {
      this.isEditorFocused = false;
    },

    // 保存代码历史
    async saveCodeHistory(code, language, actionType, executionResult = null) {
      try {
        console.log('保存代码历史:', {
          code: code.substring(0, 50) + '...',
          language,
          actionType,
          executionResult
        });

        await experimentApi.saveCodeHistory({
          experimentRecordId: this.experimentRecord.id,
          code: code,
          language: language,
          actionType: actionType,
          executionResult: executionResult
        });

        // 刷新代码历史
        await this.refreshCodeHistory();
      } catch (error) {
        console.error('保存代码历史失败:', error);
      }
    },

    // 刷新代码历史
    async refreshCodeHistory() {
      try {
        const response = await experimentApi.getCodeHistory(this.experimentRecord.id);
        this.codeHistory = response.data;
        console.log('刷新后的代码历史:', this.codeHistory.length, '条记录');
      } catch (error) {
        console.error('获取代码历史失败:', error);
      }
    },

    // 切换步骤状态
    async toggleStep(index) {
      const step = this.experimentSteps[index];
      step.expanded = !step.expanded;

      if (!step.expanded && step.completed !== this.experimentSteps[index].completed) {
        await this.saveStepStatus(index);
      }
    },

    // 保存步骤状态
    async saveStepStatus(index) {
      try {
        const step = this.experimentSteps[index];
        await experimentApi.updateStepRecord({
          experimentRecordId: this.experimentRecord.id,
          stepIndex: index,
          completed: step.completed,
          notes: step.notes
        });
      } catch (error) {
        console.error('保存步骤状态失败:', error);
      }
    },

    // 保存步骤笔记
    async saveStepNotes(index) {
      await this.saveStepStatus(index);
    },

    // 完成实验
    async completeExperiment() {
      const confirmed = confirm('确认完成实验？完成后将无法继续修改代码。');
      if (!confirmed) return;

      try {
        // 先确保获取到最新的代码
        let finalCode = '';
        let finalLanguage = 'java';
        let executionResult = null;

        // 多种方式尝试获取代码
        if (this.$refs.programmingEditor) {
          finalCode = this.$refs.programmingEditor.getCurrentCode?.() ||
              this.$refs.programmingEditor.code ||
              this.currentCode;
          finalLanguage = this.$refs.programmingEditor.getSelectedLanguage?.() ||
              this.$refs.programmingEditor.selectedLanguage ||
              'java';
        } else {
          finalCode = this.currentCode;
        }

        // 如果还是没有代码，尝试从最新的代码历史获取
        if (!finalCode && this.codeHistory.length > 0) {
          const latestHistory = this.codeHistory[this.codeHistory.length - 1];
          finalCode = latestHistory.code;
          finalLanguage = latestHistory.language;
        }

        // 在提交前先保存一次当前代码
        if (finalCode) {
          await this.saveCodeHistory(finalCode, finalLanguage, 'SAVE');
        }

        // 尝试运行代码获取执行结果
        if (this.$refs.programmingEditor && finalCode) {
          try {
            const runResult = await this.$refs.programmingEditor.runCode?.();
            executionResult = runResult;
          } catch (error) {
            console.warn('运行代码失败:', error);
          }
        }

        // 完成实验
        await experimentApi.completeExperiment({
          experimentRecordId: this.experimentRecord.id,
          finalCode: finalCode,
          finalLanguage: finalLanguage,
          executionResult: executionResult
        });

        // 保存最终代码历史
        await this.saveCodeHistory(finalCode, finalLanguage, 'SUBMIT', executionResult);

        // 更新本地实验记录
        this.experimentRecord.status = 'COMPLETED';
        this.experimentRecord.finalCode = finalCode;
        this.experimentRecord.finalLanguage = finalLanguage;
        this.experimentRecord.executionResult = executionResult ? JSON.stringify(executionResult) : null;
        this.experimentRecord.endTime = new Date().toISOString();

        await this.$message.success('实验已完成！');

        // 自动生成报告
        setTimeout(() => {
          this.generateReport();
        }, 1000);

      } catch (error) {
        console.error('完成实验失败:', error);
        this.$message.error('完成实验失败');
      }
    },

    // 保存进度
    async saveProgress() {
      try {
        const code = this.$refs.programmingEditor?.code || this.currentCode;
        const language = this.$refs.programmingEditor?.selectedLanguage || 'java';

        await this.saveCodeHistory(code, language, 'SAVE');
        await this.$message.success('进度保存成功');
      } catch (error) {
        console.error('保存进度失败:', error);
        this.$message.error('保存进度失败');
      }
    },

    // 选择历史记录
    selectHistory(history) {
      this.selectedHistory = history;
    },

    // 恢复代码
    restoreCode(history) {
      if (this.$refs.programmingEditor) {
        this.$refs.programmingEditor.code = history.code;
        this.$refs.programmingEditor.selectedLanguage = history.language;
      }
      this.currentCode = history.code;
      this.showHistory = false;
      this.$message?.success('代码已恢复');
    },

    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '未记录';
      const date = new Date(dateString);
      return date.toLocaleString();
    },

    // 计算实验时长
    calculateDuration() {
      if (!this.experimentRecord.startTime) return "0 分钟";

      const start = new Date(this.experimentRecord.startTime);
      const end = this.experimentRecord.endTime ?
          new Date(this.experimentRecord.endTime) : new Date();

      // 确保时间有效
      if (isNaN(start.getTime())) return "时间无效";

      const diffInSeconds = Math.floor((end - start) / 1000);

      // 处理不足1分钟的情况
      if (diffInSeconds < 60) {
        return `${diffInSeconds} 秒`;
      }

      const diffInMinutes = Math.floor(diffInSeconds / 60);

      // 小于1小时显示分钟
      if (diffInMinutes < 60) {
        return `${diffInMinutes} 分钟`;
      }

      // 大于1小时显示小时和分钟
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;

      // 只显示有值的部分
      if (minutes === 0) {
        return `${hours} 小时`;
      }
      return `${hours} 小时 ${minutes} 分钟`;
    },

    // 获取状态图标
    get statusIcon() {
      if (!this.experimentRecord || !this.experimentRecord.status) {
        return 'el-icon-question';
      }

      const icons = {
        'RUNNING': 'el-icon-refresh',
        'COMPLETED': 'el-icon-success',
        'CANCELLED': 'el-icon-error'
      };
      return icons[this.experimentRecord.status] || 'el-icon-question';
    },

    // 生成报告
    async generateReport() {
      try {
        const response = await experimentApi.generateReport(this.experimentRecord.id);
        this.reportData = response.data;
        this.showReport = true;

        // 渲染报告内容
        this.$nextTick(() => {
          this.renderReport();
        });
      } catch (error) {
        console.error('生成报告失败:', error);
        this.$message?.error('生成报告失败');
      }
    },

    // 渲染报告
    renderReport() {
      if (!this.reportData || !this.$refs.reportContent) return;

      const reportHtml = this.generateReportHtml(this.reportData);
      this.$refs.reportContent.innerHTML = reportHtml;
    },

    generateReportHtml(data) {
      // 使用更专业的报告模板
      return `
      <div class="report-cover">
        <h1>${this.experiment.name}</h1>
        <h2>实验报告</h2>
        <div class="report-meta">
          <p>实验编号: ${this.experimentRecord.id}</p>
          <p>生成时间: ${new Date().toLocaleString()}</p>
        </div>
      </div>

      <div class="report-section">
        <div class="section-header">
          <i class="el-icon-document"></i>
          <h4>实验概览</h4>
        </div>
        <div class="section-content">
          <div class="experiment-info-grid">
            <div class="info-item">
              <span class="info-label">课程科目:</span>
              <span class="info-value">${this.experiment.subject || '未指定'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">开始时间:</span>
              <span class="info-value">${this.formatDate(this.experimentRecord.startTime)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">实验状态:</span>
              <span class="info-value">${this.getStatusText()}</span>
            </div>
            <div class="info-item">
              <span class="info-label">结束时间:</span>
              <span class="info-value">${this.formatDate(this.experimentRecord.endTime)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">实验时长:</span>
              <span class="info-value">${this.calculateDuration()}</span>
            </div>
            <div class="info-item">
              <span class="info-label">代码版本:</span>
              <span class="info-value">${this.codeHistory.length} 个</span>
            </div>
          </div>
        </div>
      </div>

      <div class="report-section">
        <div class="section-header">
          <i class="el-icon-notebook-2"></i>
          <h4>实验描述</h4>
        </div>
        <div class="section-content">
          <div class="experiment-description">
            ${this.experiment.description || '无实验描述'}
          </div>
        </div>
      </div>

      <div class="report-section">
        <div class="section-header">
          <i class="el-icon-set-up"></i>
          <h4>实验步骤</h4>
        </div>
        <div class="section-content">
          <ol class="steps-list-report">
            ${this.experimentSteps.map((step, index) => `
              <li class="step-item-report">
                <div class="step-header-report">
                  <span class="step-number">${index + 1}</span>
                  <span class="step-title-report">${step.name}</span>
                  ${step.completed ? '<span class="step-status">已完成</span>' : ''}
                </div>
                ${step.description ? `
                  <div class="step-description-report">
                    ${step.description}
                  </div>
                ` : ''}
                ${step.notes ? `
                  <div class="step-notes-report">
                    ${step.notes}
                  </div>
                ` : ''}
              </li>
            `).join('')}
          </ol>
        </div>
      </div>

      <div class="report-section">
        <div class="section-header">
          <i class="el-icon-cpu"></i>
          <h4>编程成果</h4>
        </div>
        <div class="section-content">
          <div class="code-section">
            <div class="code-header">
              <span class="code-language">
                <i class="el-icon-data-line"></i>
                ${(this.experimentRecord.finalLanguage || 'JAVA').toUpperCase()}
              </span>
            </div>
            <div class="code-block">
              <pre class="final-code">${this.experimentRecord.finalCode || '无提交代码'}</pre>
            </div>
          </div>

          ${this.experimentRecord.executionResult ? `
            <div class="execution-result">
              <div class="result-header">
                <span class="result-status ${this.getExecutionStatus(this.experimentRecord.executionResult) === '成功' ? 'success' : 'error'}">
                  ${this.getExecutionStatus(this.experimentRecord.executionResult)}
                </span>
                ${this.parseExecutionTime(this.experimentRecord.executionResult) ? `
                  <span class="result-time">
                    执行时间: ${this.parseExecutionTime(this.experimentRecord.executionResult)}ms
                  </span>
                ` : ''}
              </div>
              ${this.parseExecutionOutput(this.experimentRecord.executionResult) ? `
                <div class="result-output">
                  ${this.parseExecutionOutput(this.experimentRecord.executionResult)}
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </div>

      ${this.codeHistory.length > 0 ? `
        <div class="report-section">
          <div class="section-header">
            <i class="el-icon-time"></i>
            <h4>实验时间线</h4>
          </div>
          <div class="section-content">
            <div class="timeline-section">
              ${this.codeHistory.slice().reverse().map(history => `
                <div class="timeline-item">
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <span class="timeline-time">${this.formatTime(history.createdAt)}</span>
                      <span class="timeline-action ${history.actionType.toLowerCase()}">
                        ${this.getActionText(history.actionType)}
                      </span>
                      <span class="timeline-language">${history.language.toUpperCase()}</span>
                    </div>
                    <div class="timeline-code-preview">
                      ${history.code.substring(0, 100)}${history.code.length > 100 ? '...' : ''}
                    </div>
                    ${history.executionResult ? `
                      <div class="timeline-result">
                        <span class="result-status ${this.getExecutionStatus(history.executionResult) === '成功' ? 'success' : 'error'}">
                          ${this.getExecutionStatus(history.executionResult)}
                        </span>
                      </div>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      ` : ''}
    `;
    },

    // 生成下载报告内容
    generateDownloadContent() {
      const content = `
      <div class="section-download">
        <h2 class="section-title">实验概览</h2>
        <div class="section-content">
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
            <div><strong>课程科目：</strong>${this.experiment.subject || '未指定'}</div>
            <div><strong>开始时间：</strong>${this.formatDate(this.experimentRecord.startTime)}</div>
            <div><strong>实验状态：</strong>${this.getStatusText()}</div>
            <div><strong>结束时间：</strong>${this.formatDate(this.experimentRecord.endTime)}</div>
            <div><strong>实验时长：</strong>${this.calculateDuration()}</div>
            <div><strong>代码版本：</strong>${this.codeHistory.length} 个</div>
          </div>
        </div>
      </div>

      <div class="section-download">
        <h2 class="section-title">实验描述</h2>
        <div class="section-content">
          ${this.experiment.description || '无实验描述'}
        </div>
      </div>

      <div class="section-download">
        <h2 class="section-title">实验步骤</h2>
        <ol class="steps-list-download">
          ${this.experimentSteps.map((step, index) => `
            <li class="step-item-download">
              <div class="step-number-download">${index + 1}</div>
              <div class="step-title-download">${step.name}</div>
              ${step.description ? `
                <div class="step-desc-download">${step.description}</div>
              ` : ''}
              ${step.notes ? `
                <div class="step-notes-download">${step.notes}</div>
              ` : ''}
            </li>
          `).join('')}
        </ol>
      </div>

      <div class="section-download">
        <h2 class="section-title">编程成果</h2>
        <div class="code-block-download">
          <div class="code-header-download">
            <span class="code-language-download">${(this.experimentRecord.finalLanguage || 'JAVA').toUpperCase()}</span>
          </div>
          <pre class="code-content-download">${this.experimentRecord.finalCode || '无提交代码'}</pre>
        </div>

        ${this.experimentRecord.executionResult ? `
          <div class="execution-result-download">
            <div class="result-status-download ${this.getExecutionStatus(this.experimentRecord.executionResult) === '成功' ? 'success' : 'error'}">
              ${this.getExecutionStatus(this.experimentRecord.executionResult)}
            </div>
            ${this.parseExecutionOutput(this.experimentRecord.executionResult) ? `
              <pre class="result-output-download">${this.parseExecutionOutput(this.experimentRecord.executionResult)}</pre>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;

      return content;
    },

    // 下载报告方法
    async downloadReport() {
      try {
        // 生成报告内容
        const content = this.generateDownloadContent();

        // 设置到下载容器
        const downloadContainer = this.$refs.reportDownload.querySelector('.download-content');
        downloadContainer.innerHTML = content;

        // 使用html2canvas和jsPDF生成PDF
        const element = this.$refs.reportDownload;

        // 临时显示元素
        element.style.display = 'block';

        const canvas = await html2canvas(element);
        const pdf = new jsPDF();

        // 隐藏元素
        element.style.display = 'none';

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 190; // A4页面宽度
        const pageHeight = 277; // A4页面高度
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = 10; // 顶部边距

        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // 如果需要分页
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // 保存PDF
        pdf.save(`${this.experiment.name}_实验报告_${new Date().toISOString().slice(0, 10)}.pdf`);

      } catch (error) {
        console.error('生成报告失败:', error);
        this.$message.error('生成报告失败');

        // 回退方案：生成HTML文件
        const content = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${this.experiment.name} - 实验报告</title>
          <style>
            ${document.querySelector('style.report-download-style')?.innerHTML || ''}
          </style>
        </head>
        <body>
          <div class="download-container">
            ${this.$refs.reportDownload.querySelector('.download-header').outerHTML}
            ${content}
            ${this.$refs.reportDownload.querySelector('.download-footer').outerHTML}
          </div>
        </body>
        </html>
      `;

        const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.experiment.name}_实验报告_${new Date().toISOString().slice(0, 10)}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },

    // 解析执行时间
    parseExecutionTime(resultJson) {
      try {
        const result = typeof resultJson === 'string' ? JSON.parse(resultJson) : resultJson;
        return result.executionTime || null;
      } catch {
        return null;
      }
    },

    // 解析执行输出
    parseExecutionOutput(resultJson) {
      try {
        const result = typeof resultJson === 'string' ? JSON.parse(resultJson) : resultJson;
        return result.output || null;
      } catch {
        return null;
      }
    },

    // 打印报告
    printReport() {
      const reportContent = this.$refs.reportContent.innerHTML;
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
        <head>
          <title>实验报告打印</title>
          <style>
            body { font-family: 'Microsoft YaHei', Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .report-header { text-align: center; margin-bottom: 30px; }
            .report-section { margin: 20px 0; break-inside: avoid; }
            .final-code { background: #f5f7fa; padding: 10px; font-family: 'Courier New', monospace; font-size: 12px; }
            .steps-list-report { padding-left: 20px; }
            .step-item-report { margin-bottom: 10px; }
            .step-title-report { font-weight: bold; }
            .step-description-report { margin-top: 3px; font-size: 14px; }
            .step-notes-report { margin-top: 3px; font-size: 12px; color: #666; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>${reportContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    },

    // 设置自动保存
    setupAutoSave() {
      this.autoSaveTimer = setInterval(() => {
        if (this.isEditorFocused && this.experimentRecord.status === 'RUNNING') {
          this.saveProgress();
        }
      }, 60000); // 每分钟自动保存
    },

    // 清除自动保存
    clearAutoSave() {
      if (this.autoSaveTimer) {
        clearInterval(this.autoSaveTimer);
      }
    },

    // 延迟保存
    scheduleAutoSave(callback) {
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }
      this.saveTimeout = setTimeout(callback, 2000); // 2秒延迟
    },

    // 辅助方法
    getStatusText() {
      const statusMap = {
        'RUNNING': '进行中',
        'COMPLETED': '已完成',
        'CANCELLED': '已取消'
      };
      return statusMap[this.experimentRecord.status] || '未知';
    },

    getActionText(actionType) {
      const actionMap = {
        'SAVE': '保存',
        'RUN': '运行',
        'SUBMIT': '提交'
      };
      return actionMap[actionType] || actionType;
    },

    formatTime(timeString) {
      return new Date(timeString).toLocaleString();
    },

    getExecutionStatus(resultJson) {
      try {
        const result = JSON.parse(resultJson);
        return result.status === 'SUCCESS' ? '成功' : '失败';
      } catch {
        return '未知';
      }
    },

    formatExecutionResult(result) {
      if (!result) return '无结果';

      return `
        <div class="execution-status status-${result.status?.toLowerCase()}">
          状态: ${result.status || '未知'}
        </div>
        ${result.output ? `<div class="execution-output"><strong>输出:</strong><pre>${result.output}</pre></div>` : ''}
        ${result.executionTime ? `<div class="execution-time">执行时间: ${result.executionTime}ms</div>` : ''}
      `;
    }
  }
};
</script>

<style scoped>
/* 原有样式保持不变，新增报告中步骤的样式 */
.steps-list-report {
  padding-left: 20px;
}

.step-item-report {
  margin-bottom: 15px;
}

.step-title-report {
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.step-description-report {
  margin-top: 5px;
  color: #606266;
  line-height: 1.6;
}

.step-notes-report {
  margin-top: 5px;
  color: #909399;
  font-style: italic;
  font-size: 14px;
}

/* ================= 布局优化 ================= */
.experiment-interface {
  height: 1200px;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.experiment-header {
  background: white;
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.experiment-info h2 {
  margin: 0 0 10px 0;
  color: #303133;
}

.experiment-meta {
  display: flex;
  gap: 20px;
  color: #606266;
  font-size: 14px;
}

.experiment-meta .status {
  padding: 4px 12px;
  border-radius: 4px;
  font-weight: 500;
}

.status.running {
  background: #e6f7ff;
  color: #409eff;
}

.status.completed {
  background: #f0f9eb;
  color: #67c23a;
}

/* ================= 修复：头部按钮间距 ================= */
.experiment-actions {
  display: flex;
  gap: 15px; /* 增加按钮之间的间距 */
}

.experiment-actions button {
  padding: 10px 16px; /* 稍微增加按钮内边距 */
  font-size: 14px;
}

.experiment-content {
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 20px;
  height: calc(100vh - 120px);
  min-height: 0;
}

.experiment-sidebar {
  width: 350px;
  background: white;
  border-radius: 8px;
  padding: 20px;
  overflow-y: auto;
  flex-shrink: 0;
  height: 100%;
}

.experiment-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
  min-height: 0;
  height: 100%;
  overflow: hidden; /* 添加溢出控制 */
}

.programming-container {
  flex: 1;
  min-height: 800px;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

/* 报告模态框样式 */
.report-overlay {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(3px);
}

.report-modal {
  width: 900px;
  max-width: 95vw;
  height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  border: none;
}

.report-header {
  background: linear-gradient(135deg, #2196F3, #1976D2); /* 蓝色渐变 */
  color: white;
  padding: 25px;
  border-radius: 8px 8px 0 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

/* 添加一些装饰元素 */
.report-header::after {
  content: "";
  position: absolute;
  top: -50px;
  right: -50px;
  width: 150px;
  height: 150px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.report-title h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  position: relative;
  z-index: 1;
  color: white !important;
}

.report-subtitle {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 8px;
  position: relative;
  z-index: 1;
}

/* 更新元信息样式 */
.report-meta {
  display: flex;
  gap: 15px;
  margin-top: 20px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.15);
  padding: 6px 12px;
  border-radius: 20px;
  backdrop-filter: blur(5px);
}

.meta-item i {
  font-size: 16px;
}

/* 状态标签更新 */
.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.status-badge.running {
  background: rgba(255, 255, 255, 0.3);
  color: white;
}

.status-badge.completed {
  background: rgba(76, 175, 80, 0.8);
}

.status-badge i {
  margin-right: 5px;
}

.modal-close {
  color: rgba(255, 255, 255, 0.7);
  font-size: 26px;
  transition: all 0.2s;
}

.modal-close:hover {
  color: white;
  transform: scale(1.1);
}

.report-body {
  padding: 0;
  flex: 1;
  overflow: hidden;
  background: #f9fafc;
}

.report-content {
  height: 100%;
  padding: 25px;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.report-footer {
  padding: 15px 25px;
  border-top: 1px solid #e6e9f0;
  background: white;
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

.footer-note {
  font-size: 12px;
  color: #909399;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn i {
  font-size: 14px;
}

.btn-primary {
  background: #409eff;
  color: white;
}

.btn-primary:hover {
  background: #66b1ff;
}

.btn-print {
  background: white;
  color: #606266;
  border-color: #dcdfe6;
}

.btn-print:hover {
  color: #409eff;
  border-color: #c6e2ff;
  background: #ecf5ff;
}

/* 报告内容样式 */
.report-section {
  margin-bottom: 30px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.section-header {
  padding: 15px 20px;
  background: #f5f7fa;
  border-bottom: 1px solid #e6e9f0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-header h4 {
  margin: 0;
  font-size: 16px;
  color: #2c3e50;
  font-weight: 600;
}

.section-header i {
  color: #409eff;
  font-size: 18px;
}

.section-content {
  padding: 20px;
}

/* 实验信息部分 */
.experiment-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.info-item {
  display: flex;
  gap: 10px;
}

.info-label {
  font-weight: 500;
  color: #606266;
  min-width: 80px;
}

.info-value {
  color: #303133;
}

/* 实验步骤样式 */
.steps-list-report {
  padding-left: 0;
  list-style: none;
}

.step-item-report {
  padding: 15px 0;
  border-bottom: 1px dashed #eaecef;
  position: relative;
}

.step-item-report:last-child {
  border-bottom: none;
}

.step-header-report {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.step-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
}

.step-title-report {
  font-weight: 500;
  color: #303133;
}

.step-status {
  margin-left: auto;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  background: #f0f9eb;
  color: #67c23a;
}

.step-description-report {
  color: #606266;
  line-height: 1.6;
  margin-left: 34px;
  font-size: 14px;
}

.step-notes-report {
  margin-top: 10px;
  margin-left: 34px;
  padding: 10px;
  background: #f8f9fa;
  border-left: 3px solid #409eff;
  border-radius: 0 4px 4px 0;
  font-size: 13px;
  color: #555;
}

.step-notes-report::before {
  content: "笔记:";
  font-weight: 500;
  color: #409eff;
  margin-right: 5px;
}

/* 代码展示样式 */
.code-section {
  margin-top: 5px;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.code-language {
  font-family: monospace;
  font-size: 13px;
  color: #409eff;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.code-language i {
  font-size: 16px;
}

.code-block {
  position: relative;
}

.code-toolbar {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 8px;
  z-index: 1;
}

.code-toolbar button {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #dcdfe6;
  border-radius: 3px;
  padding: 3px 8px;
  font-size: 12px;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s;
}

.code-toolbar button:hover {
  color: #409eff;
  border-color: #409eff;
}

.code-toolbar button i {
  font-size: 12px;
}

.final-code {
  background: #f6f8fa;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #dfe2e5;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre;
  overflow-x: auto;
  position: relative;
}

/* 执行结果样式 */
.execution-result {
  margin-top: 20px;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.result-status {
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 3px;
  font-size: 13px;
}

.result-status.success {
  background: #f0f9eb;
  color: #67c23a;
}

.result-status.error {
  background: #fef0f0;
  color: #f56c6c;
}

.result-time {
  font-size: 12px;
  color: #909399;
}

.result-output {
  background: #f6f8fa;
  padding: 12px;
  border-radius: 4px;
  border-left: 3px solid #409eff;
  font-family: monospace;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 时间线样式 */
.timeline-section {
  margin-top: 20px;
}

.timeline-item {
  position: relative;
  padding-left: 25px;
  margin-bottom: 20px;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 5px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #409eff;
  border: 2px solid white;
  box-shadow: 0 0 0 2px #409eff;
  z-index: 1;
}

.timeline-item::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 17px;
  bottom: -20px;
  width: 2px;
  background: #e4e7ed;
}

.timeline-item:last-child::after {
  display: none;
}

.timeline-content {
  background: white;
  border: 1px solid #e6e9f0;
  border-radius: 6px;
  padding: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.timeline-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.timeline-time {
  font-size: 12px;
  color: #909399;
  margin-right: 10px;
}

.timeline-action {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 10px;
  margin-right: 10px;
}

.timeline-action.save {
  background: #e6f7ff;
  color: #409eff;
}

.timeline-action.run {
  background: #fdf6ec;
  color: #e6a23c;
}

.timeline-action.submit {
  background: #f0f9eb;
  color: #67c23a;
}

.timeline-language {
  font-family: monospace;
  font-size: 12px;
  color: #606266;
}

.timeline-code-preview {
  margin-top: 10px;
  font-family: monospace;
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 下载报告专用样式 */
.report-download {
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
}

.download-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px;
}

.download-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #1976D2;
}

.download-header h1 {
  color: #1976D2;
  font-size: 24px;
  margin-bottom: 15px;
}

.report-meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 14px;
}

.meta-row {
  display: flex;
  justify-content: center;
  gap: 30px;
}

.meta-row strong {
  color: #555;
}

.download-content {
  margin: 30px 0;
}

/* 报告内容区域样式 */
.section-download {
  margin-bottom: 30px;
  page-break-inside: avoid;
}

.section-title {
  color: #1976D2;
  font-size: 18px;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
  margin-bottom: 15px;
}

/* 实验步骤样式 */
.steps-list-download {
  padding-left: 20px;
}

.step-item-download {
  margin-bottom: 15px;
  position: relative;
}

.step-number-download {
  position: absolute;
  left: -25px;
  top: 0;
  width: 20px;
  height: 20px;
  background: #1976D2;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.step-title-download {
  font-weight: bold;
  margin-bottom: 5px;
}

.step-desc-download {
  color: #555;
  margin-bottom: 8px;
}

.step-notes-download {
  background: #f9f9f9;
  padding: 8px 12px;
  border-left: 3px solid #1976D2;
  font-size: 14px;
  color: #666;
}

/* 代码块样式 */
.code-block-download {
  margin: 15px 0;
  position: relative;
}

.code-header-download {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.code-language-download {
  font-family: monospace;
  color: #1976D2;
  font-weight: bold;
}

.code-content-download {
  background: #f5f7fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-x: auto;
}

/* 执行结果样式 */
.execution-result-download {
  margin-top: 20px;
}

.result-status-download {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 3px;
  font-weight: bold;
  margin-bottom: 8px;
}

.result-status-download.success {
  background: #e8f5e9;
  color: #2e7d32;
}

.result-status-download.error {
  background: #ffebee;
  color: #c62828;
}

.result-output-download {
  background: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 13px;
  white-space: pre-wrap;
}

/* 页脚样式 */
.download-footer {
  text-align: center;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  color: #777;
  font-size: 14px;
}

/* 打印优化 */
@media print {
  @page {
    size: A4;
    margin: 1.5cm;
  }

  body {
    font-size: 12pt;
    line-height: 1.5;
  }

  .download-container {
    padding: 0;
  }

  .section-download {
    margin-bottom: 20pt;
  }

  .code-content-download {
    font-size: 10pt;
  }

  .download-footer {
    margin-top: 30pt;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .report-modal {
    width: 100%;
    height: 100vh;
    max-height: 100vh;
    max-width: 100%;
    border-radius: 0;
  }

  .report-header {
    padding: 15px;
  }

  .report-content {
    padding: 15px;
  }

  .experiment-info-grid {
    grid-template-columns: 1fr;
  }

  .footer-actions {
    flex-direction: column;
    width: 100%;
  }

  .footer-actions .btn {
    width: 100%;
    justify-content: center;
  }
}

/* ================= 编程卡片深度样式 ================= */
:deep(.programming-question) {
  height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  border: none !important;
  border-radius: 0 !important;
}

:deep(.question-description) {
  flex-shrink: 0 !important;
  max-height: 200px !important;
  overflow-y: auto !important;
}

:deep(.code-editor-section) {
  flex: 1 !important;
  min-height: 400px !important;
  display: flex !important;
  flex-direction: column !important;
}

:deep(.code-editor-container) {
  flex: 1 !important;
  min-height: 300px !important;
  display: flex !important;
  flex-direction: column !important;
}

:deep(.editor-wrapper) {
  flex: 1 !important;
  min-height: 250px !important;
}

:deep(.code-textarea) {
  height: 100% !important;
  min-height: 250px !important;
}

/* 测试区域固定高度 */
:deep(.test-section) {
  height: 250px !important; /* 固定输出区域高度 */
  min-height: 250px !important;
  flex-shrink: 0; /* 禁止收缩 */
  overflow: auto; /* 允许内容滚动 */
}

:deep(.test-tabs) {
  flex-shrink: 0 !important;
}

:deep(.tab-content) {
  flex: 1 !important;
  min-height: 200px !important;
  overflow-y: auto !important;
}

:deep(.input-area textarea) {
  height: 180px !important;
}

/* 输出区域高度调整 */
:deep(.output-area),
:deep(.result-area) {
  height: calc(100% - 40px) !important; /* 减去标题栏高度 */
  overflow-y: auto;
}

/* ================= 修复：底部按钮优化 ================= */
/* 实验控制按钮容器 */
.experiment-controls {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 20px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 基础按钮样式 */
.btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  outline: none;
  position: relative;
  overflow: hidden;
}

/* 淡绿色完成按钮 */
.btn-complete {
  background: linear-gradient(135deg, #81C784, #66BB6A); /* 更淡的绿色渐变 */
  color: white;
  box-shadow: 0 2px 8px rgba(129, 199, 132, 0.3); /* 更柔和的阴影 */
  border: 1px solid rgba(255, 255, 255, 0.2); /* 添加白色边框增强质感 */
}

.btn-complete:hover:not(:disabled) {
  background: linear-gradient(135deg, #A5D6A7, #81C784);
  transform: translateY(-1px); /* 更温和的上浮效果 */
  box-shadow: 0 3px 10px rgba(129, 199, 132, 0.4);
}

/* 淡蓝色保存按钮 */
.btn-save {
  background: linear-gradient(135deg, #64B5F6, #42A5F5); /* 更淡的蓝色渐变 */
  color: white;
  box-shadow: 0 2px 8px rgba(100, 181, 246, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-save:hover:not(:disabled) {
  background: linear-gradient(135deg, #90CAF9, #64B5F6);
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(100, 181, 246, 0.4);
}

/* 禁用状态优化 */
.btn:disabled {
  opacity: 0.5;
  background: linear-gradient(135deg, #E0E0E0, #BDBDBD) !important;
  color: #757575 !important;
  box-shadow: none !important;
  cursor: not-allowed;
}

/* 更柔和的水波纹效果 */
.btn::after {
  background: rgba(255, 255, 255, 0.3); /* 更透明的波纹 */
}

/* 按钮图标微调 */
.btn i {
  margin-right: 8px;
  font-size: 16px;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1); /* 添加轻微文字阴影增强可读性 */
}

.btn:active:not(:disabled)::after {
  animation: ripple 0.6s ease-out;
}

@keyframes ripple {
  0% {
    transform: scale(0, 0);
    opacity: 0.5;
  }
  100% {
    transform: scale(20, 20);
    opacity: 0;
  }
}

/* ================= 侧边栏样式 ================= */
.description-section,
.steps-section {
  margin-bottom: 30px;
}

.description-section h3,
.steps-section h3 {
  margin: 0 0 15px 0;
  color: #409eff;
  font-size: 16px;
}

.description-content {
  line-height: 1.6;
  color: #606266;
  max-height: 150px;
  overflow-y: auto;
}

.steps-list {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  overflow: hidden;
}

.step-item {
  border-bottom: 1px solid #e4e7ed;
}

.step-item:last-child {
  border-bottom: none;
}

.step-item.completed {
  background: #f0f9eb;
}

.step-header {
  display: flex;
  align-items: center;
  padding: 15px;
  cursor: pointer;
  transition: background 0.2s;
}

.step-header:hover {
  background: #f5f7fa;
}

.step-number {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #e4e7ed;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 15px;
}

.step-item.completed .step-number {
  background: #67c23a;
}

.step-title {
  flex: 1;
  font-weight: 500;
}

.step-description,
.step-notes {
  padding: 0 15px 15px 60px;
  color: #606266;
  font-size: 14px;
}

.step-notes textarea {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 8px;
  resize: vertical;
  font-family: inherit;
}

/* ================= 模态框样式 ================= */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.code-history-modal {
  width: 1200px;
  height: 80vh;
}

.report-modal {
  width: 1000px;
  height: 80vh;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  color: #303133;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #909399;
}

.modal-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  min-height: 0;
}

/* 代码历史样式 */
.history-list {
  width: 300px;
  border-right: 1px solid #e4e7ed;
  overflow-y: auto;
  flex-shrink: 0;
}

.history-item {
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.history-item:hover {
  background: #f5f7fa;
}

.history-item.active {
  background: #e6f7ff;
  border-right: 3px solid #409eff;
}

.history-header {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.history-action {
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 12px;
  align-self: flex-start;
}

.history-action.save {
  background: #e6f7ff;
  color: #409eff;
}

.history-action.run {
  background: #fdf6ec;
  color: #e6a23c;
}

.history-action.submit {
  background: #f0f9eb;
  color: #67c23a;
}

.history-language {
  font-family: monospace;
  color: #909399;
  font-size: 12px;
}

.history-time {
  color: #c0c4cc;
  font-size: 11px;
}

.history-result {
  margin-top: 5px;
  font-size: 12px;
  color: #606266;
}

.history-detail {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  min-width: 0;
}

.history-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.history-detail-header h4 {
  margin: 0;
  color: #303133;
}

.code-preview {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 60vh;
  overflow-y: auto;
}

/* 报告样式 */
.report-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.report-actions {
  padding: 20px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-shrink: 0;
}

.report-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #409eff;
}

.report-header h1 {
  color: #409eff;
  margin: 0 0 15px 0;
}

.report-meta p {
  margin: 5px 0;
  color: #606266;
}

.report-section {
  margin: 30px 0;
}

.report-section h2 {
  color: #303133;
  border-left: 4px solid #409eff;
  padding-left: 15px;
  margin-bottom: 15px;
}

.final-code {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 400px;
  overflow-y: auto;
}

.code-language {
  font-weight: bold;
  margin-bottom: 10px;
  color: #409eff;
}

.execution-result {
  padding: 15px;
  background: #f9f9f9;
  border-radius: 4px;
  border-left: 4px solid #409eff;
}

.execution-status {
  font-weight: bold;
  margin-bottom: 10px;
}

.execution-status.status-success {
  color: #67c23a;
}

.execution-status.status-error {
  color: #f56c6c;
}

.execution-output pre {
  background: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.execution-time {
  color: #909399;
  font-size: 13px;
}

.code-timeline {
  border-left: 2px solid #e4e7ed;
  padding-left: 20px;
}

.timeline-item {
  display: flex;
  gap: 15px;
  padding: 10px 0;
  position: relative;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -25px;
  top: 15px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #409eff;
}

.timeline-time {
  font-family: 'Courier New', monospace;
  color: #909399;
  min-width: 150px;
}

.timeline-action {
  font-weight: bold;
  min-width: 60px;
}

.timeline-language {
  color: #606266;
}

/* 通用按钮样式 */
.btn-primary {
  background: #409eff;
  color: white;
  border: 1px solid #409eff;
}

.btn-primary:hover:not(:disabled) {
  background: #66b1ff;
  border-color: #66b1ff;
}

.btn-secondary {
  background: white;
  color: #606266;
  border: 1px solid #dcdfe6;
}

.btn-secondary:hover:not(:disabled) {
  color: #409eff;
  border-color: #409eff;
}

.btn-success {
  background: #67c23a;
  color: white;
  border: 1px solid #67c23a;
}

.btn-success:hover:not(:disabled) {
  background: #85ce61;
  border-color: #85ce61;
}

.btn-warning {
  background: #e6a23c;
  color: white;
  border: 1px solid #e6a23c;
}

.btn-warning:hover:not(:disabled) {
  background: #ebb563;
  border-color: #ebb563;
}

button {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .experiment-sidebar {
    width: 300px;
  }
}

@media (max-width: 1200px) {
  .experiment-content {
    flex-direction: column;
    height: auto;
    max-height: calc(100vh - 120px);
    overflow-y: auto;
  }

  .experiment-sidebar {
    width: 100%;
    max-height: 40vh;
    order: 2;
  }

  .experiment-main {
    order: 1;
    min-height: 60vh;
  }

  .programming-container {
    min-height: 55vh;
  }

  :deep(.test-section) {
    height: 200px !important;
    min-height: 200px !important;
  }

  .modal-content {
    width: 95vw;
    height: 95vh;
  }

  .code-history-modal .modal-body {
    flex-direction: column;
  }

  .history-list {
    width: 100%;
    max-height: 200px;
    border-right: none;
    border-bottom: 1px solid #e4e7ed;
  }
}

@media (max-width: 768px) {
  .experiment-header {
    padding: 15px;
  }

  .experiment-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .experiment-meta {
    flex-wrap: wrap;
    gap: 10px;
  }

  .experiment-actions {
    flex-wrap: wrap;
  }

  .experiment-content {
    padding: 10px;
    gap: 10px;
  }

  .programming-container {
    min-height: 50vh;
  }

  :deep(.code-textarea) {
    min-height: 200px !important;
  }

  :deep(.test-section) {
    height: 180px !important;
    min-height: 180px !important;
  }
}
</style>