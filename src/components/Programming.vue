<template>
  <div class="programming-question" data-programming-editor="true">
    <!-- 题目描述 -->
    <div class="question-description">
      <div class="description-content" v-html="question.description"></div>

      <!-- 测试用例示例 -->
      <div v-if="question.examples && question.examples.length > 0" class="examples-section">
        <h4>示例</h4>
        <div v-for="(example, index) in question.examples" :key="index" class="example-item">
          <div class="example-label">示例 {{ index + 1 }}:</div>
          <div class="example-io">
            <div class="input-section">
              <strong>输入:</strong>
              <pre>{{ example.input }}</pre>
            </div>
            <div class="output-section">
              <strong>输出:</strong>
              <pre>{{ example.output }}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- 约束条件 -->
      <div v-if="question.constraints" class="constraints-section">
        <h4>约束条件</h4>
        <div class="constraints-content" v-html="question.constraints"></div>
      </div>
    </div>

    <!-- 代码编辑器区域 -->
    <div class="code-editor-section">
      <div class="editor-header">
        <div class="language-selector">
          <label>编程语言:</label>
          <select v-model="selectedLanguage" @change="onLanguageChange">
            <option value="java">Java</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
          </select>
        </div>

        <div class="editor-actions">
          <button
              class="action-btn format-btn"
              @click="formatCode"
              @mousedown.stop
              @click.stop
              type="button"
          >
            <i class="icon-format"></i>
            格式化代码
          </button>
          <button class="action-btn" @click="runCode" :disabled="isRunning" type="button">
            <i class="icon-play"></i>
            {{ isRunning ? '运行中...' : '运行代码' }}
          </button>
          <button class="action-btn" @click="submitCode" :disabled="isSubmitting" type="button">
            <i class="icon-check"></i>
            {{ isSubmitting ? '提交中...' : '提交答案' }}
          </button>
        </div>
      </div>

      <!-- 简化的代码编辑器 -->
      <div class="code-editor-container">
        <div class="editor-wrapper">
          <!-- 行号 -->
          <div class="line-numbers" ref="lineNumbers">
            <div
                v-for="n in lineCount"
                :key="n"
                class="line-number"
                :class="{ 'current-line': n === currentLine }"
            >
              {{ n }}
            </div>
          </div>

          <!-- 代码编辑区 -->
          <div class="code-editor-main">
            <textarea
                ref="codeEditor"
                v-model="code"
                @input="onCodeInput"
                @keydown="handleKeyDown"
                @keyup="updateCurrentLine"
                @click="updateCurrentLine"
                @scroll="syncScroll"
                @focus="notifyEditorFocus"
                @blur="notifyEditorBlur"
                class="code-textarea"
                data-programming-input="true"
                data-programming-editor="true"
                :placeholder="getPlaceholderText()"
                spellcheck="false"
            ></textarea>
          </div>
        </div>

        <!-- 编辑器状态栏 -->
        <div class="editor-status">
          <span class="cursor-position">行 {{ currentLine }}, 列 {{ currentColumn }}</span>
          <span class="file-info">{{ selectedLanguage.toUpperCase() }} | {{ code.length }} 字符</span>
        </div>
      </div>
    </div>

    <!-- 测试区域 -->
    <div class="test-section">
      <div class="test-tabs">
        <div
            class="tab-item"
            :class="{ active: activeTab === 'input' }"
            @click="activeTab = 'input'"
        >
          输入
        </div>
        <div
            class="tab-item"
            :class="{ active: activeTab === 'output' }"
            @click="activeTab = 'output'"
        >
          输出
        </div>
        <div
            class="tab-item"
            :class="{ active: activeTab === 'result' }"
            @click="activeTab = 'result'"
        >
          执行结果
        </div>
      </div>

      <div class="tab-content">
        <!-- 输入区 -->
        <div v-if="activeTab === 'input'" class="input-area">
          <textarea
              v-model="testInput"
              placeholder="请输入测试数据..."
              rows="6"
              data-programming-input="true"
          ></textarea>
        </div>

        <!-- 输出区 -->
        <div v-if="activeTab === 'output'" class="output-area">
          <pre v-if="executionResult.output">{{ executionResult.output }}</pre>
          <div v-else class="empty-output">暂无输出</div>
        </div>

        <!-- 执行结果 -->
        <div v-if="activeTab === 'result'" class="result-area">
          <div v-if="executionResult.status" class="result-status" :class="getStatusClass()">
            <i :class="getStatusIcon()"></i>
            <span>{{ getStatusText() }}</span>
          </div>

          <div v-if="executionResult.executionTime" class="execution-time">
            执行时间: {{ executionResult.executionTime }}ms
          </div>

          <div v-if="executionResult.error" class="error-message">
            <h4>错误信息:</h4>
            <pre>{{ executionResult.error }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import codeExecutionApi from '@/api/codeExecutionApi';

export default {
  name: 'ProgrammingQuestion',
  components: {},
  props: {
    question: {
      type: Object,
      required: true
    },
    questionIndex: {
      type: Number,
      required: true
    },
    initialCode: {
      type: [String, Object],
      default: () => ({})
    }
  },
  data() {
    return {
      // 基本状态
      selectedLanguage: 'java',
      code: '',
      testInput: '',
      activeTab: 'input',
      isRunning: false,
      isSubmitting: false,
      executionResult: {},
      autoSaveTimer: null,
      currentLine: 1,
      currentColumn: 1,

      // 状态管理
      isInitialized: false,
      userHasEditedCode: false,  // 用户是否编辑过代码
      codeInitializedFromProp: false, // 是否从 prop 初始化过

      // 问题相关
      questionId: null  // 当前问题ID
    };
  },
  computed: {
    lineCount() {
      return Math.max(this.code.split('\n').length, 20);
    }
  },
  watch: {
    // 监听问题变化 - 最重要的隔离逻辑
    'question.id': {
      handler(newQuestionId, oldQuestionId) {
        console.log(`题目ID变化: ${oldQuestionId} -> ${newQuestionId}`);

        if (newQuestionId !== oldQuestionId) {
          this.questionId = newQuestionId;
          this.resetForNewQuestion();
          this.initializeFromProp();
        }
      },
      immediate: true
    },

    // 监听 initialCode 变化
    initialCode: {
      handler(newCode) {
        console.log(`题目 ${this.questionId} 接收到 initialCode:`, newCode);

        // 只在未初始化或者是新题目时才处理
        if (!this.codeInitializedFromProp || !this.userHasEditedCode) {
          this.initializeFromProp();
        }
      },
      immediate: false // 已在 question.id 的 immediate 中处理
    },

    // 监听代码变化
    code: {
      handler(newCode, oldCode) {
        if (this.isInitialized) {
          // 检查是否为用户主动编辑
          if (this.codeInitializedFromProp && newCode !== oldCode) {
            this.userHasEditedCode = true;
          }

          this.autoSave();
          this.updateCurrentLine();
        }
      }
    }
  },
  methods: {
    // 为新题目重置状态
    resetForNewQuestion() {
      console.log(`重置题目 ${this.questionId} 的状态`);

      this.isInitialized = false;
      this.userHasEditedCode = false;
      this.codeInitializedFromProp = false;

      // 清空定时器
      if (this.autoSaveTimer) {
        clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = null;
      }

      // 重置界面状态
      this.activeTab = 'input';
      this.executionResult = {};
      this.currentLine = 1;
      this.currentColumn = 1;
      this.testInput = '';
      this.isRunning = false;
      this.isSubmitting = false;
    },

    // 从 prop 初始化
    initializeFromProp() {
      if (!this.questionId) return;

      console.log(`初始化题目 ${this.questionId}:`, this.initialCode);

      let codeToSet = '';
      let languageToSet = 'java';
      let hasValidData = false;

      // 解析 initialCode
      if (this.initialCode) {
        if (typeof this.initialCode === 'string') {
          try {
            const parsed = JSON.parse(this.initialCode);
            codeToSet = parsed.code || '';
            languageToSet = parsed.language || 'java';
            hasValidData = !!(parsed.code && parsed.code.trim());
          } catch (e) {
            codeToSet = this.initialCode;
            hasValidData = !!(this.initialCode && this.initialCode.trim());
          }
        } else if (typeof this.initialCode === 'object') {
          codeToSet = this.initialCode.code || '';
          languageToSet = this.initialCode.language || 'java';
          hasValidData = !!(this.initialCode.code && this.initialCode.code.trim());
        }
      }

      // 设置语言
      this.selectedLanguage = languageToSet;

      // 设置代码
      if (hasValidData) {
        // 有有效数据，直接使用
        this.code = codeToSet;
        this.userHasEditedCode = !this.isCodeTemplate(codeToSet);
      } else {
        // 没有数据，使用模板
        this.code = this.getCodeTemplate();
        this.userHasEditedCode = false;
      }

      this.codeInitializedFromProp = true;
      this.isInitialized = true;

      console.log(`题目 ${this.questionId} 初始化完成:`, {
        language: this.selectedLanguage,
        codeLength: this.code.length,
        hasValidData,
        userHasEditedCode: this.userHasEditedCode
      });
    },

    // 检查是否为模板代码
    isCodeTemplate(code) {
      if (!code) return false;

      const templates = this.getAllTemplates();
      const codeToCheck = code.trim();

      return Object.values(templates).some(template =>
          template.trim() === codeToCheck
      );
    },

    // 获取所有模板
    getAllTemplates() {
      return {
        java: this.getTemplateForLanguage('java'),
        python: this.getTemplateForLanguage('python'),
        cpp: this.getTemplateForLanguage('cpp')
      };
    },

    // 获取指定语言的模板
    getTemplateForLanguage(language) {
      const templates = {
        java: `public class Solution {
    public static void main(String[] args) {
        // 在这里编写您的Java代码
        Scanner scanner = new Scanner(System.in);

        // 示例：读取输入
        // int n = scanner.nextInt();
        // String str = scanner.nextLine();

        // 您的解决方案

        scanner.close();
    }
}`,

        python: `# 在这里编写您的Python代码
def main():
    # 示例：读取输入
    # n = int(input())
    # arr = list(map(int, input().split()))
    # line = input().strip()

    # 您的解决方案
    pass

if __name__ == "__main__":
    main()`,

        cpp: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

int main() {
    // 在这里编写您的C++代码

    // 示例：读取输入
    // int n;
    // cin >> n;
    // vector<int> arr(n);
    // for(int i = 0; i < n; i++) {
    //     cin >> arr[i];
    // }

    // 您的解决方案

    return 0;
}`
      };

      return templates[language] || templates.java;
    },

    // 获取代码模板
    getCodeTemplate() {
      return this.getTemplateForLanguage(this.selectedLanguage);
    },

    // 语言切换处理
    onLanguageChange() {
      const oldLanguage = this.selectedLanguage;
      console.log(`题目 ${this.questionId} 语言切换: ${oldLanguage} -> ${this.selectedLanguage}`);

      const newTemplate = this.getCodeTemplate();

      // 如果是模板代码或用户没有编辑过，直接切换
      if (!this.userHasEditedCode || this.isCodeTemplate(this.code)) {
        this.code = newTemplate;
        this.userHasEditedCode = false;
        console.log(`已切换到 ${this.getLanguageName()} 模板`);
      } else {
        // 用户有自定义代码，询问是否替换
        const shouldReplace = confirm(`检测到您已编写代码，是否要替换为 ${this.getLanguageName()} 模板？`);
        if (shouldReplace) {
          this.code = newTemplate;
          this.userHasEditedCode = false;
          console.log(`已切换到 ${this.getLanguageName()} 模板`);
        } else {
          // 用户选择不替换，保持原代码但更新语言
          console.log(`保持原代码，仅更新语言为 ${this.getLanguageName()}`);
        }
      }

      // 保存语言变更
      this.onCodeChange();
    },

    // 获取语言显示名称
    getLanguageName() {
      const languageNames = {
        java: 'Java',
        python: 'Python',
        cpp: 'C++'
      };
      return languageNames[this.selectedLanguage] || this.selectedLanguage.toUpperCase();
    },

    // 代码变更保存
    onCodeChange() {
      if (!this.isInitialized || !this.questionId) return;

      console.log(`题目 ${this.questionId} 代码变更，保存中...`);

      this.$emit('save', {
        questionId: this.questionId,
        code: this.code,
        language: this.selectedLanguage,
        isSubmitted: false
      });
    },

    // 代码输入处理
    onCodeInput() {
      if (this.isInitialized) {
        this.userHasEditedCode = true;
        this.onCodeChange();
      }
    },

    // 清空代码
    clearCode() {
      this.code = '';
      this.userHasEditedCode = true;
      this.onCodeChange();
    },

    // 处理键盘事件
    handleKeyDown(event) {
      // Ctrl+K 清空代码
      if (event.ctrlKey && event.key === 'k') {
        event.preventDefault();
        this.clearCode();
        return;
      }

      // Tab键处理
      if (event.key === 'Tab') {
        event.preventDefault();
        if (event.shiftKey) {
          this.unindentLines();
        } else {
          this.indentLines();
        }
        return;
      }

      // Enter键处理 - 自动缩进
      if (event.key === 'Enter') {
        event.preventDefault();
        const textarea = event.target;
        const start = textarea.selectionStart;
        const value = textarea.value;

        const currentLineStart = value.lastIndexOf('\n', start - 1) + 1;
        const currentLine = value.substring(currentLineStart, start);
        const indent = currentLine.match(/^\s*/)[0];

        const needsExtraIndent = /[{:]$/.test(currentLine.trim());
        const extraIndent = needsExtraIndent ? '    ' : '';

        const newText = '\n' + indent + extraIndent;
        this.insertText(newText);
        return;
      }

      // 括号自动配对
      const pairs = {
        '(': ')',
        '[': ']',
        '{': '}',
        '"': '"',
        "'": "'"
      };

      if (pairs[event.key]) {
        const textarea = event.target;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        if (start === end) {
          event.preventDefault();
          const pair = pairs[event.key];
          this.insertText(event.key + pair);
          textarea.selectionStart = textarea.selectionEnd = start + 1;
          return;
        }
      }

      // Ctrl+/ 注释切换
      if (event.ctrlKey && event.key === '/') {
        event.preventDefault();
        this.toggleComment();
        return;
      }
    },

    // 插入文本
    insertText(text) {
      const textarea = this.$refs.codeEditor;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      this.code = this.code.substring(0, start) + text + this.code.substring(end);

      this.$nextTick(() => {
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        this.updateCurrentLine();
      });
    },

    // 缩进处理
    indentLines() {
      const textarea = this.$refs.codeEditor;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      const beforeSelection = value.substring(0, start);
      const afterSelection = value.substring(end);

      const lineStart = beforeSelection.lastIndexOf('\n') + 1;
      const lineEnd = end + afterSelection.indexOf('\n');

      const lines = value.substring(lineStart, lineEnd === end - 1 ? value.length : lineEnd).split('\n');
      const indentedLines = lines.map(line => '    ' + line);

      const newValue = value.substring(0, lineStart) + indentedLines.join('\n') + value.substring(lineEnd === end - 1 ? value.length : lineEnd);

      this.code = newValue;

      this.$nextTick(() => {
        textarea.selectionStart = start + 4;
        textarea.selectionEnd = end + (indentedLines.length * 4);
      });
    },

    // 取消缩进
    unindentLines() {
      const textarea = this.$refs.codeEditor;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      const beforeSelection = value.substring(0, start);
      const afterSelection = value.substring(end);

      const lineStart = beforeSelection.lastIndexOf('\n') + 1;
      const lineEnd = end + afterSelection.indexOf('\n');

      const lines = value.substring(lineStart, lineEnd === end - 1 ? value.length : lineEnd).split('\n');
      const unindentedLines = lines.map(line => line.startsWith('    ') ? line.substring(4) : line);

      const newValue = value.substring(0, lineStart) + unindentedLines.join('\n') + value.substring(lineEnd === end - 1 ? value.length : lineEnd);

      this.code = newValue;
    },

    // 切换注释
    toggleComment() {
      const textarea = this.$refs.codeEditor;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      const commentPrefix = this.getCommentPrefix();

      const beforeSelection = value.substring(0, start);
      const lineStart = beforeSelection.lastIndexOf('\n') + 1;
      const lineEnd = end + value.substring(end).indexOf('\n');

      const line = value.substring(lineStart, lineEnd === end - 1 ? value.length : lineEnd);

      let newLine;
      if (line.trim().startsWith(commentPrefix)) {
        newLine = line.replace(new RegExp(`^(\\s*)${commentPrefix}\\s?`), '$1');
      } else {
        const indent = line.match(/^\s*/)[0];
        newLine = indent + commentPrefix + ' ' + line.trim();
      }

      const newValue = value.substring(0, lineStart) + newLine + value.substring(lineEnd === end - 1 ? value.length : lineEnd);
      this.code = newValue;
    },

    // 获取注释前缀
    getCommentPrefix() {
      const prefixes = {
        java: '//',
        cpp: '//',
        python: '#'
      };
      return prefixes[this.selectedLanguage] || '//';
    },

    // 格式化代码
    formatCode(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      try {
        const originalCode = this.code;
        this.code = this.formatCodeByLanguage(this.code, this.selectedLanguage);

        if (originalCode !== this.code) {
          console.log('代码格式化完成');
        }
      } catch (error) {
        console.error('格式化失败:', error);
      }

      this.$nextTick(() => {
        this.$refs.codeEditor?.focus();
      });
    },

    // 根据语言格式化代码
    formatCodeByLanguage(code, language) {
      if (language === 'java' || language === 'cpp') {
        return this.formatJavaCode(code);
      } else if (language === 'python') {
        return this.formatPythonCode(code);
      }
      return code;
    },

    // 格式化Java/C++代码
    formatJavaCode(code) {
      let formatted = '';
      let indentLevel = 0;
      const lines = code.split('\n');

      for (let line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          formatted += '\n';
          continue;
        }

        if (trimmed.startsWith('}')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }

        formatted += '    '.repeat(indentLevel) + trimmed + '\n';

        if (trimmed.endsWith('{')) {
          indentLevel++;
        }
      }

      return formatted.trim();
    },

    // 格式化Python代码
    formatPythonCode(code) {
      let formatted = '';
      let indentLevel = 0;
      const lines = code.split('\n');

      for (let line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          formatted += '\n';
          continue;
        }

        if (trimmed.startsWith('except') || trimmed.startsWith('elif') ||
            trimmed.startsWith('else') || trimmed.startsWith('finally')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }

        formatted += '    '.repeat(indentLevel) + trimmed + '\n';

        if (trimmed.endsWith(':')) {
          indentLevel++;
        }
      }

      return formatted.trim();
    },

    // 更新当前行列信息
    updateCurrentLine() {
      const textarea = this.$refs.codeEditor;
      if (!textarea) return;

      const pos = textarea.selectionStart;
      const text = textarea.value;

      const lines = text.substring(0, pos).split('\n');
      this.currentLine = lines.length;
      this.currentColumn = lines[lines.length - 1].length + 1;
    },

    // 同步滚动
    syncScroll() {
      const textarea = this.$refs.codeEditor;
      const lineNumbers = this.$refs.lineNumbers;

      if (textarea && lineNumbers) {
        lineNumbers.scrollTop = textarea.scrollTop;
      }
    },

    // 运行代码
    async runCode() {
      if (!this.code.trim()) {
        this.$message?.warning('请先编写代码');
        return;
      }

      this.isRunning = true;
      this.activeTab = 'result';

      try {
        const response = await codeExecutionApi.executeCode({
          code: this.code,
          language: this.selectedLanguage,
          input: this.testInput,
          className: this.getClassName()
        });

        this.executionResult = response.data;

        this.$emit('run', {
          questionId: this.questionId,
          code: this.code,
          language: this.selectedLanguage,
          input: this.testInput,
          executionResult: this.executionResult
        });

        if (this.executionResult.status === 'SUCCESS') {
          this.activeTab = 'output';
        }

        return this.executionResult;

      } catch (error) {
        this.executionResult = {
          status: 'ERROR',
          error: error.message || '执行失败'
        };

        return this.executionResult;

      } finally {
        this.isRunning = false;
      }
    },

    // 提交代码
    async submitCode() {
      if (!this.code.trim()) {
        this.$message?.warning('请先编写代码');
        return;
      }

      this.isSubmitting = true;

      try {
        this.$emit('save', {
          questionId: this.questionId,
          code: this.code,
          language: this.selectedLanguage,
          isSubmitted: true
        });

        this.$message?.success('代码已提交');
      } catch (error) {
        this.$message?.error('提交失败: ' + error.message);
      } finally {
        this.isSubmitting = false;
      }
    },

    // 获取类名
    getClassName() {
      if (this.selectedLanguage === 'java') {
        const classMatch = this.code.match(/public\s+class\s+(\w+)/);
        return classMatch ? classMatch[1] : 'Solution';
      }
      return 'Solution';
    },

    // 获取状态相关方法
    getStatusClass() {
      const statusMap = {
        'SUCCESS': 'success',
        'COMPILE_ERROR': 'error',
        'RUNTIME_ERROR': 'error',
        'TIMEOUT': 'warning',
        'ERROR': 'error'
      };
      return statusMap[this.executionResult.status] || '';
    },

    // 编辑器获得焦点时的通知
    notifyEditorFocus() {
      console.log(`题目 ${this.questionId} 编辑器获得焦点`);
      // 可以在这里添加焦点获得时的逻辑，比如：
      // - 更新UI状态
      // - 通知父组件
      // - 记录用户行为等
      this.$emit('editor-focus', {
        questionId: this.questionId,
        language: this.selectedLanguage
      });
    },

    // 编辑器失去焦点时的通知
    notifyEditorBlur() {
      console.log(`题目 ${this.questionId} 编辑器失去焦点`);
      this.$emit('editor-blur', {
        questionId: this.questionId,
        language: this.selectedLanguage,
        codeLength: this.code.length
      });

      // 失去焦点时触发保存
      this.onCodeChange();
    },

    // 获取占位符文本
    getPlaceholderText() {
      // 如果用户已经编辑过代码，显示编辑提示
      if (this.userHasEditedCode) {
        return '继续编写您的代码...';
      }

      // 如果代码为空，显示开始提示
      if (!this.code || this.code.trim() === '') {
        return '请在这里编写您的代码...';
      }

      // 如果是模板代码，显示模板提示
      if (this.isCodeTemplate(this.code)) {
        return '您可以修改此模板代码...';
      }

      // 默认情况
      return '';
    },

    getStatusIcon() {
      const iconMap = {
        'SUCCESS': 'icon-check-circle',
        'COMPILE_ERROR': 'icon-x-circle',
        'RUNTIME_ERROR': 'icon-x-circle',
        'TIMEOUT': 'icon-clock',
        'ERROR': 'icon-x-circle'
      };
      return iconMap[this.executionResult.status] || 'icon-info';
    },

    getStatusText() {
      const textMap = {
        'SUCCESS': '执行成功',
        'COMPILE_ERROR': '编译错误',
        'RUNTIME_ERROR': '运行时错误',
        'TIMEOUT': '执行超时',
        'ERROR': '执行失败'
      };
      return textMap[this.executionResult.status] || '未知状态';
    },

    // 自动保存
    autoSave() {
      if (!this.isInitialized) return;

      if (this.autoSaveTimer) {
        clearTimeout(this.autoSaveTimer);
      }

      this.autoSaveTimer = setTimeout(() => {
        this.onCodeChange();
      }, 1000);
    },

    // 提供给外部的方法
    getCurrentCode() {
      return this.code;
    },

    getSelectedLanguage() {
      return this.selectedLanguage;
    },

    updateCode(newCode) {
      this.code = newCode;
      this.userHasEditedCode = true;
    }
  },

  mounted() {
    console.log(`编程题组件挂载，题目ID: ${this.questionId}`);

    this.$nextTick(() => {
      const textarea = this.$refs.codeEditor;
      if (textarea) {
        textarea.addEventListener('scroll', this.syncScroll);
      }
    });
  },

  beforeUnmount() {
    console.log(`编程题组件卸载，题目ID: ${this.questionId}`);

    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }

    const textarea = this.$refs.codeEditor;
    if (textarea) {
      textarea.removeEventListener('scroll', this.syncScroll);
    }
  }
};
</script>

<style scoped>
.programming-question {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

/* 题目描述区域 */
.question-description {
  padding: 20px;
  background-color: #fafafa;
  border-bottom: 1px solid #e4e7ed;
}

.description-content {
  line-height: 1.6;
  margin-bottom: 15px;
}

.examples-section, .constraints-section {
  margin-top: 15px;
}

.examples-section h4, .constraints-section h4 {
  margin: 0 0 10px 0;
  color: #409eff;
  font-size: 14px;
}

.example-item {
  margin-bottom: 15px;
  padding: 15px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.example-label {
  font-weight: bold;
  margin-bottom: 8px;
  color: #606266;
}

.example-io {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.input-section, .output-section {
  font-size: 13px;
}

.input-section strong, .output-section strong {
  display: block;
  margin-bottom: 5px;
  color: #303133;
}

.input-section pre, .output-section pre {
  background: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.constraints-content {
  font-size: 13px;
  color: #606266;
}

/* 代码编辑器区域 */
.code-editor-section {
  padding: 20px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.language-selector label {
  margin-right: 8px;
  font-weight: 500;
  color: #606266;
}

.language-selector select {
  padding: 5px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: white;
}

.editor-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  padding: 8px 16px;
  border: 1px solid #409eff;
  background: white;
  color: #409eff;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;
  font-size: 13px;
}

.action-btn:hover:not(:disabled) {
  background: #409eff;
  color: white;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.format-btn {
  border-color: #67c23a;
  color: #67c23a;
}

.format-btn:hover:not(:disabled) {
  background: #67c23a;
  color: white;
}

/* 简化的代码编辑器容器 */
.code-editor-container {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
}

.editor-wrapper {
  display: flex;
  position: relative;
  min-height: 400px;
}

/* 行号样式 */
.line-numbers {
  width: 60px;
  background: #f8f9fa;
  border-right: 1px solid #e4e7ed;
  padding: 15px 5px;
  font-family: 'Courier New', 'Menlo', 'Monaco', monospace;
  font-size: 13px;
  line-height: 20px;
  color: #909399;
  text-align: right;
  user-select: none;
  overflow: hidden;
  box-sizing: border-box;
}

.line-number {
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  transition: all 0.2s;
}

.line-number.current-line {
  background: #e6f7ff;
  color: #409eff;
  font-weight: bold;
}

/* 代码编辑器主体 */
.code-editor-main {
  flex: 1;
  position: relative;
}

.code-textarea {
  width: 100%;
  height: 400px;
  padding: 15px;
  border: none;
  outline: none;
  font-family: 'Courier New', 'Menlo', 'Monaco', monospace;
  font-size: 14px;
  line-height: 20px;
  resize: none;
  background: #ffffff;
  color: #2c3e50;
  tab-size: 4;
  white-space: pre;
  overflow-x: auto;
  overflow-y: auto;
  box-sizing: border-box;
}

.code-textarea:focus {
  background: #fafafa;
}

/* 编辑器状态栏 */
.editor-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 15px;
  background: #f5f7fa;
  border-top: 1px solid #e4e7ed;
  font-size: 12px;
  color: #909399;
}

.cursor-position {
  font-family: 'Courier New', monospace;
}

.file-info {
  display: flex;
  gap: 15px;
}

/* 测试区域 */
.test-section {
  border-top: 1px solid #e4e7ed;
}

.test-tabs {
  display: flex;
  background: #f5f7fa;
}

.tab-item {
  padding: 12px 20px;
  cursor: pointer;
  border-right: 1px solid #e4e7ed;
  transition: all 0.2s;
  color: #606266;
  font-size: 14px;
}

.tab-item:hover {
  background: #ecf5ff;
  color: #409eff;
}

.tab-item.active {
  background: white;
  color: #409eff;
  border-bottom: 2px solid #409eff;
  font-weight: 500;
}

.tab-content {
  min-height: 200px;
}

.input-area textarea {
  width: 100%;
  height: 180px;
  padding: 15px;
  border: none;
  outline: none;
  resize: none;
  font-family: 'Courier New', monospace;
  background: #fafafa;
  font-size: 13px;
  line-height: 1.5;
}

.output-area, .result-area {
  padding: 15px;
  min-height: 165px;
}

.output-area pre {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  margin: 0;
  font-family: 'Courier New', monospace;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 13px;
  line-height: 1.4;
}

.empty-output {
  color: #909399;
  font-style: italic;
  text-align: center;
  padding: 50px;
}

/* 执行结果样式 */
.result-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-weight: 500;
}

.result-status.success {
  background: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}

.result-status.error {
  background: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fde2e2;
}

.result-status.warning {
  background: #fdf6ec;
  color: #e6a23c;
  border: 1px solid #faecd8;
}

.execution-time {
  color: #909399;
  font-size: 13px;
  margin-bottom: 15px;
}

.error-message h4 {
  margin: 0 0 10px 0;
  color: #f56c6c;
}

.error-message pre {
  background: #fef0f0;
  color: #f56c6c;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #fde2e2;
  margin: 0;
  font-family: 'Courier New', monospace;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 13px;
  line-height: 1.4;
}

.clear-btn {
  border-color: #f56c6c;
  color: #f56c6c;
}

.clear-btn:hover:not(:disabled) {
  background: #f56c6c;
  color: white;
}

.icon-clear::before {
  content: "🗑";
}

/* 图标样式 */
.icon-play::before { content: "▶"; }
.icon-check::before { content: "✓"; }
.icon-format::before { content: "{}"; }

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .editor-actions {
    justify-content: center;
    flex-wrap: wrap;
  }

  .example-io {
    grid-template-columns: 1fr;
  }

  .code-textarea {
    height: 300px;
    font-size: 13px;
  }

  .line-numbers {
    width: 50px;
    font-size: 12px;
  }

  .action-btn {
    font-size: 12px;
    padding: 6px 12px;
  }
}
</style>