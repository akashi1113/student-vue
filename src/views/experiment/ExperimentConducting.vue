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
              class="btn-success"
              @click="completeExperiment"
          >
            完成实验
          </button>
          <button
              v-if="experimentRecord.status === 'RUNNING'"
              class="btn-warning"
              @click="saveProgress"
          >
            保存进度
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
    <div v-if="showReport" class="modal-overlay" @click="showReport = false">
      <div class="modal-content report-modal" @click.stop>
        <div class="modal-header">
          <h3>实验报告</h3>
          <button class="modal-close" @click="showReport = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="report-content" ref="reportContent">
            <!-- 报告内容将在这里动态生成 -->
          </div>
          <div class="report-actions">
            <button class="btn-primary" @click="downloadReport">
              下载报告
            </button>
            <button class="btn-secondary" @click="printReport">
              打印报告
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ProgrammingQuestion from '@/components/Programming.vue';
import experimentApi from '@/api/experiment';

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
      experimentRecord: {},
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
    // 初始化实验
    async initializeExperiment() {
      try {
        // 开始实验
        const recordResponse = await experimentApi.startExperiment(this.experimentId);
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

    // 新增：代码运行事件处理
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

        this.$message?.success('实验已完成！');

        // 自动生成报告
        setTimeout(() => {
          this.generateReport();
        }, 1000);

      } catch (error) {
        console.error('完成实验失败:', error);
        this.$message?.error('完成实验失败: ' + (error.message || '未知错误'));
      }
    },

    // 保存进度
    async saveProgress() {
      try {
        const code = this.$refs.programmingEditor?.code || this.currentCode;
        const language = this.$refs.programmingEditor?.selectedLanguage || 'java';

        await this.saveCodeHistory(code, language, 'SAVE');
        this.$message?.success('进度已保存');
      } catch (error) {
        console.error('保存进度失败:', error);
        this.$message?.error('保存进度失败');
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

    // 生成报告HTML - 添加实验步骤
    generateReportHtml(data) {
      const startTime = new Date(this.experimentRecord.startTime).toLocaleString();
      const endTime = this.experimentRecord.endTime ?
          new Date(this.experimentRecord.endTime).toLocaleString() : '未完成';

      // 从本地记录获取最终代码
      let finalCode = this.experimentRecord.finalCode;
      let finalLanguage = this.experimentRecord.finalLanguage;
      let executionResult = this.experimentRecord.executionResult;

      if (!finalCode && this.codeHistory.length > 0) {
        const submitHistory = this.codeHistory.find(h => h.actionType === 'SUBMIT');
        if (submitHistory) {
          finalCode = submitHistory.code;
          finalLanguage = submitHistory.language;
          executionResult = submitHistory.executionResult;
        } else {
          const latestHistory = this.codeHistory[this.codeHistory.length - 1];
          finalCode = latestHistory.code;
          finalLanguage = latestHistory.language;
          executionResult = latestHistory.executionResult;
        }
      }

      // 统计运行次数
      const runCount = this.codeHistory.filter(h => h.actionType === 'RUN').length;

      console.log('报告中使用的数据:', {
        finalCode: finalCode ? finalCode.substring(0, 50) + '...' : '无',
        finalLanguage,
        executionResult,
        codeVersions: this.codeHistory.length,
        runCount
      });

      return `
        <div class="report-header">
          <h1>${this.experiment.name} - 实验报告</h1>
          <div class="report-meta">
            <p><strong>实验时间:</strong> ${startTime} - ${endTime}</p>
            <p><strong>实验时长:</strong> ${data.duration || 0} 分钟</p>
            <p><strong>代码版本:</strong> ${this.codeHistory.length} 个</p>
            <p><strong>运行次数:</strong> ${runCount} 次</p>
          </div>
        </div>

        <div class="report-section">
          <h2>实验描述</h2>
          <div>${this.experiment.description || '无描述'}</div>
        </div>

        <div class="report-section">
          <h2>实验步骤</h2>
          <ol class="steps-list-report">
            ${this.experimentSteps.map((step, index) => `
              <li class="step-item-report">
                <div class="step-title-report">${step.name}</div>
                ${step.description ? `<div class="step-description-report">${step.description}</div>` : ''}
                ${step.notes ? `<div class="step-notes-report"><strong>笔记:</strong> ${step.notes}</div>` : ''}
              </li>
            `).join('')}
          </ol>
        </div>

        <div class="report-section">
          <h2>最终提交代码</h2>
          <div class="code-language">语言: ${(finalLanguage || 'JAVA').toUpperCase()}</div>
          <pre class="final-code">${finalCode || '无代码'}</pre>
        </div>

        <div class="report-section">
          <h2>执行结果</h2>
          <div class="execution-result">
            ${executionResult ?
          this.formatExecutionResult(typeof executionResult === 'string' ? JSON.parse(executionResult) : executionResult) :
          '无执行结果'}
          </div>
        </div>
      `;
    },

    // 下载报告
    downloadReport() {
      const reportContent = this.$refs.reportContent.innerHTML;
      const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${this.experiment.name} - 实验报告</title>
          <style>
            body { font-family: 'Microsoft YaHei', Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .report-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #409eff; padding-bottom: 20px; }
            .report-header h1 { color: #409eff; margin-bottom: 10px; }
            .report-meta p { margin: 5px 0; }
            .report-section { margin: 30px 0; }
            .report-section h2 { color: #303133; border-left: 4px solid #409eff; padding-left: 10px; }
            .final-code, .code-preview { background: #f5f7fa; padding: 15px; border-radius: 4px; font-family: 'Courier New', monospace; overflow-x: auto; }
            .code-language { font-weight: bold; margin-bottom: 10px; color: #409eff; }
            .steps-list-report { padding-left: 20px; }
            .step-item-report { margin-bottom: 15px; }
            .step-title-report { font-weight: bold; color: #303133; }
            .step-description-report { margin-top: 5px; color: #606266; }
            .step-notes-report { margin-top: 5px; color: #909399; font-style: italic; }
          </style>
        </head>
        <body>
          ${reportContent}
        </body>
        </html>
      `;

      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${this.experiment.name}_实验报告_${new Date().toISOString().slice(0, 10)}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.$message?.success('报告已下载');
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
.experiment-controls {
  background: white;
  padding: 20px; /* 增加内边距 */
  border-radius: 8px;
  display: flex;
  justify-content: center;
  gap: 20px; /* 增加按钮间距 */
  flex-shrink: 0;
  align-items: center;
}

.experiment-controls button {
  padding: 15px 30px; /* 大幅增加按钮内边距 */
  font-size: 16px; /* 增大字体 */
  font-weight: 500;
  min-height: 50px; /* 设置最小高度 */
  border-radius: 6px;
  transition: all 0.3s ease;
}

.btn-large {
  padding: 18px 35px; /* 特大按钮更大的内边距 */
  font-size: 18px; /* 更大的字体 */
  font-weight: 600;
  min-height: 55px; /* 更大的最小高度 */
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