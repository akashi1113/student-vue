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
              type="button"
          >
            <i class="icon-format"></i>
            格式化
          </button>
          <button class="action-btn run-btn" @click="runCode" :disabled="isRunning" type="button">
            <i class="icon-play"></i>
            {{ isRunning ? '运行中...' : '运行' }}
          </button>
          <button class="action-btn submit-btn" @click="submitCode" :disabled="isSubmitting" type="button">
            <i class="icon-check"></i>
            {{ isSubmitting ? '提交中...' : '提交' }}
          </button>
          <button
              class="action-btn syntax-btn"
              @click="toggleSyntaxHighlighting"
              type="button"
              :class="{ active: syntaxHighlightEnabled }"
          >
            <i class="icon-highlight"></i>
            {{ syntaxHighlightEnabled ? '高亮开' : '高亮关' }}
          </button>
        </div>
      </div>

      <!-- 代码编辑器 -->
      <div class="code-editor-container">
        <div class="editor-wrapper">
          <!-- 行号 -->
          <div class="line-numbers" ref="lineNumbers">
            <div
                v-for="n in lineCount"
                :key="n"
                class="line-number"
                :class="{
                  'current-line': n === currentLine
                }"
            >
              {{ n }}
            </div>
          </div>

          <!-- 代码编辑区 -->
          <div class="code-editor-main">
            <!-- 语法高亮背景层 -->
            <pre
                v-if="syntaxHighlightEnabled"
                class="syntax-highlight-layer"
                ref="highlightLayer"
                v-html="highlightedCode"
            ></pre>

            <!-- 代码输入框 -->
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
                :class="{ 'syntax-enabled': syntaxHighlightEnabled }"
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
      selectedLanguage: localStorage.getItem('code-editor-language') || 'java',
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
      userHasEditedCode: false,
      codeInitializedFromProp: false,
      questionId: null,

      // 语法高亮
      syntaxHighlightEnabled: false, // 默认关闭
      highlightedCode: ''
    };
  },
  computed: {
    lineCount() {
      return Math.max(this.code.split('\n').length, 20);
    }
  },
  watch: {
    // 监听问题变化
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
        if (!this.codeInitializedFromProp || !this.userHasEditedCode) {
          this.initializeFromProp();
        }
      },
      immediate: false
    },

    // 监听代码变化
    code: {
      handler(newCode, oldCode) {
        if (this.isInitialized) {
          if (this.codeInitializedFromProp && newCode !== oldCode) {
            this.userHasEditedCode = true;
          }
          this.autoSave();
          this.updateCurrentLine();
          // 实时语法高亮
          if (this.syntaxHighlightEnabled) {
            this.applySyntaxHighlighting();
          }
        }
      }
    },

    // 监听语法高亮开关
    syntaxHighlightEnabled: {
      handler(enabled) {
        this.saveUserPreferences();
        if (enabled) {
          this.$nextTick(() => {
            this.applySyntaxHighlighting();
          });
        } else {
          this.highlightedCode = '';
        }
      }
    }
  },
  methods: {
    // 保持原有的初始化和重置方法...
    resetForNewQuestion() {
      console.log(`重置题目 ${this.questionId} 的状态`);

      this.isInitialized = false;
      this.userHasEditedCode = false;
      this.codeInitializedFromProp = false;

      if (this.autoSaveTimer) {
        clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = null;
      }

      this.activeTab = 'input';
      this.executionResult = {};
      this.currentLine = 1;
      this.currentColumn = 1;
      this.testInput = '';
      this.isRunning = false;
      this.isSubmitting = false;
      this.highlightedCode = '';
    },

    initializeFromProp() {
      if (!this.questionId) return;

      console.log(`初始化题目 ${this.questionId}:`, this.initialCode);

      let codeToSet = '';
      let languageToSet = localStorage.getItem('code-editor-language') || 'java'; // 从localStorage加载语言
      let hasValidData = false;

      if (this.initialCode) {
        if (typeof this.initialCode === 'string') {
          try {
            const parsed = JSON.parse(this.initialCode);
            codeToSet = parsed.code || '';
            hasValidData = !!(parsed.code && parsed.code.trim());
          } catch (e) {
            codeToSet = this.initialCode;
            hasValidData = !!(this.initialCode && this.initialCode.trim());
          }
        } else if (typeof this.initialCode === 'object') {
          codeToSet = this.initialCode.code || '';
          hasValidData = !!(this.initialCode.code && this.initialCode.code.trim());
        }
      }

      this.selectedLanguage = languageToSet;

      if (hasValidData) {
        this.code = codeToSet;
        this.userHasEditedCode = !this.isCodeTemplate(codeToSet);
      } else {
        this.code = this.getCodeTemplate();
        this.userHasEditedCode = false;
      }

      this.codeInitializedFromProp = true;
      this.isInitialized = true;

      // 初始化后应用语法高亮
      this.$nextTick(() => {
        if (this.syntaxHighlightEnabled) {
          this.applySyntaxHighlighting();
        }
      });

      console.log(`题目 ${this.questionId} 初始化完成`);
    },

    // 用户偏好设置
    loadUserPreferences() {
      try {
        const savedHighlight = localStorage.getItem('code-editor-syntax-highlight');
        if (savedHighlight !== null) {
          this.syntaxHighlightEnabled = savedHighlight === 'true';
        }
      } catch (error) {
        console.warn('加载用户偏好设置失败:', error);
      }
    },

    saveUserPreferences() {
      try {
        localStorage.setItem('code-editor-syntax-highlight', this.syntaxHighlightEnabled.toString());
      } catch (error) {
        console.warn('保存用户偏好设置失败:', error);
      }
    },

    // 语法高亮核心方法
    toggleSyntaxHighlighting() {
      this.syntaxHighlightEnabled = !this.syntaxHighlightEnabled;
      console.log('语法高亮状态:', this.syntaxHighlightEnabled);
    },

    applySyntaxHighlighting() {
      if (!this.syntaxHighlightEnabled || !this.code) {
        this.highlightedCode = '';
        return;
      }

      try {
        this.highlightedCode = this.highlightSyntax(this.code, this.selectedLanguage);
        this.$nextTick(() => {
          this.syncHighlightScroll();
        });
      } catch (error) {
        console.error('语法高亮失败:', error);
        this.highlightedCode = this.escapeHtml(this.code);
      }
    },

    // 语法高亮
    highlightSyntax(code, language) {
      if (!code) return '';

      console.log('===== 开始语法高亮处理 =====');
      console.log('原始代码:', code);

      // 先转义HTML特殊字符
      let escapedCode = this.escapeHtml(code);
      console.log('转义后的代码:', escapedCode);

      // 获取所有语法模式
      const patterns = this.getSyntaxPatterns(language);
      console.log(`使用 ${language} 的语法模式:`, patterns);

      // 收集所有匹配位置
      const allMatches = [];
      console.log('\n===== 开始模式匹配 =====');

      patterns.forEach((pattern, patternIndex) => {
        console.log(`\n应用模式 ${patternIndex + 1}: ${pattern.className}`);
        console.log('正则表达式:', pattern.regex);

        let match;
        pattern.regex.lastIndex = 0;
        let matchCount = 0;

        while ((match = pattern.regex.exec(escapedCode)) !== null) {
          matchCount++;
          const matchObj = {
            start: match.index,
            end: match.index + match[0].length,
            text: match[0],
            className: pattern.className
          };
          allMatches.push(matchObj);

          console.log(`  匹配到 ${matchCount}:`, matchObj);

          // 避免无限循环
          if (!pattern.regex.global) break;
        }

        console.log(`此模式共匹配 ${matchCount} 处`);
      });

      console.log('\n===== 所有匹配结果 =====');
      console.log('匹配总数:', allMatches.length);
      console.log('原始匹配顺序:', allMatches);

      // 按位置排序
      allMatches.sort((a, b) => a.start - b.start);
      console.log('\n排序后的匹配:', allMatches);

      // 移除重叠的匹配（保留第一个匹配）
      const filteredMatches = [];
      console.log('\n===== 处理重叠匹配 =====');

      for (let i = 0; i < allMatches.length; i++) {
        const current = allMatches[i];
        let isOverlapping = false;

        for (let j = 0; j < filteredMatches.length; j++) {
          const existing = filteredMatches[j];
          if ((current.start >= existing.start && current.start < existing.end) ||
              (current.end > existing.start && current.end <= existing.end) ||
              (current.start <= existing.start && current.end >= existing.end)) {
            isOverlapping = true;
            console.log(`  匹配 ${i} 与 ${j} 重叠:`, {
              current,
              existing,
              overlapType: current.start >= existing.start && current.start < existing.end ? '右重叠' :
                  current.end > existing.start && current.end <= existing.end ? '左重叠' : '完全包含'
            });
            break;
          }
        }

        if (!isOverlapping) {
          console.log(`  保留匹配 ${i}:`, current);
          filteredMatches.push(current);
        }
      }

      console.log('\n过滤后的匹配:', filteredMatches);
      console.log('剩余匹配数:', filteredMatches.length);

      // 从后往前替换，避免位置偏移
      filteredMatches.reverse();
      console.log('\n反转后的匹配顺序:', filteredMatches);

      let result = escapedCode;
      console.log('\n===== 开始替换 =====');
      console.log('初始字符串:', result);

      filteredMatches.forEach((match, index) => {
        const highlighted = `<span class="syntax-${match.className}">${match.text}</span>`;
        const before = result.substring(0, match.start);
        const after = result.substring(match.end);

        result = before + highlighted + after;

        console.log(`\n替换 ${index + 1}:`);
        console.log('匹配位置:', `${match.start}-${match.end}`);
        console.log('匹配文本:', match.text);
        console.log('替换为:', highlighted);
        console.log('当前结果:', result);
      });

      console.log('\n===== 最终高亮结果 =====');
      console.log(result);
      return result;
    },

    // 语法模式
    getSyntaxPatterns(language) {
      const patterns = {
        java: [
          // 字符串 (最高优先级)
          { regex: /"(?:[^"\\]|\\.)*"/g, className: 'string' },
          { regex: /'(?:[^'\\]|\\.)*'/g, className: 'string' },
          // 注释
          { regex: /\/\/[^\n\r]*/g, className: 'comment' },
          { regex: /\/\*[\s\S]*?\*\//g, className: 'comment' },
          // 关键词
          { regex: /\b(?:public|private|protected|static|final|class|interface|return|if|else|for|while|do|switch|case|default|break|continue|try|catch|finally|import|package|void|new|this|super|null|true|false)\b/g, className: 'keyword' },
          // 数据类型
          { regex: /\b(?:int|long|short|byte|double|float|boolean|char|String|Object|List|ArrayList|Map|HashMap|Set|HashSet)\b/g, className: 'type' },
          // 数字
          { regex: /\b\d+(?:\.\d+)?[fFdD]?\b/g, className: 'number' }
        ],

        python: [
          // 三引号字符串
          { regex: /"""[\s\S]*?"""/g, className: 'string' },
          { regex: /'''[\s\S]*?'''/g, className: 'string' },
          // 普通字符串
          { regex: /"(?:[^"\\]|\\.)*"/g, className: 'string' },
          { regex: /'(?:[^'\\]|\\.)*'/g, className: 'string' },
          // 注释
          { regex: /#[^\n\r]*/g, className: 'comment' },
          // 关键词
          { regex: /\b(?:def|class|if|elif|else|for|while|try|except|finally|with|as|import|from|return|yield|pass|break|continue|lambda|and|or|not|in|is|None|True|False)\b/g, className: 'keyword' },
          // 内置类型
          { regex: /\b(?:int|float|str|bool|list|dict|tuple|set)\b/g, className: 'type' },
          // 数字
          { regex: /\b\d+(?:\.\d+)?\b/g, className: 'number' }
        ],

        cpp: [
          // 字符串
          { regex: /"(?:[^"\\]|\\.)*"/g, className: 'string' },
          { regex: /'(?:[^'\\]|\\.)*'/g, className: 'string' },
          // 注释
          { regex: /\/\/[^\n\r]*/g, className: 'comment' },
          { regex: /\/\*[\s\S]*?\*\//g, className: 'comment' },
          // 预处理器指令
          { regex: /#\s*(?:include|define|ifdef|ifndef|endif|if|else|elif|pragma)\b[^\n\r]*/g, className: 'preprocessor' },
          // 关键词
          { regex: /\b(?:int|float|double|char|bool|void|long|short|const|static|class|struct|if|else|for|while|do|switch|case|default|break|continue|return|using|namespace)\b/g, className: 'keyword' },
          // 标准库
          { regex: /\b(?:std|string|vector|map|set|list|cout|cin|endl)\b/g, className: 'type' },
          // 数字
          { regex: /\b\d+(?:\.\d+)?[fFdDlL]?\b/g, className: 'number' }
        ]
      };

      return patterns[language] || patterns.java;
    },

    // HTML转义方法
    escapeHtml(text) {
      return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
    },

    syncHighlightScroll() {
      const textarea = this.$refs.codeEditor;
      const highlightLayer = this.$refs.highlightLayer;

      if (textarea && highlightLayer) {
        highlightLayer.scrollTop = textarea.scrollTop;
        highlightLayer.scrollLeft = textarea.scrollLeft;
      }
    },

    // ==================== 错误检查 ====================

    // 语法检查
    performSyntaxCheck() {
      if (!this.code.trim()) {
        this.syntaxErrors = [];
        this.syntaxWarnings = [];
        return;
      }

      const errors = [];
      const warnings = [];
      const lines = this.code.split('\n');

      lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const trimmed = line.trim();

        if (!trimmed) return;

        // 检查括号匹配
        const openBrackets = (line.match(/[({[]/g) || []).length;
        const closeBrackets = (line.match(/[)}]/g) || []).length;

        if (openBrackets > closeBrackets) {
          warnings.push({
            line: lineNumber,
            column: line.length,
            message: '可能缺少闭合括号',
            severity: 'warning',
            type: 'syntax'
          });
        }

        // Java语法检查
        if (this.selectedLanguage === 'java') {
          // 检查分号
          if (line.includes('=') && !line.includes('==') && !line.includes('!=') &&
              !line.trim().endsWith(';') && !line.trim().endsWith('{') &&
              !line.trim().endsWith('}') && !line.trim().startsWith('//')) {
            errors.push({
              line: lineNumber,
              column: line.length,
              message: '语句可能缺少分号',
              severity: 'error',
              type: 'syntax'
            });
          }
        }

        // Python语法检查
        if (this.selectedLanguage === 'python') {
          // 检查缩进
          const indentLevel = line.match(/^\s*/)[0].length;
          if (indentLevel % 4 !== 0 && trimmed) {
            warnings.push({
              line: lineNumber,
              column: 1,
              message: '建议使用4个空格缩进',
              severity: 'warning',
              type: 'style'
            });
          }
        }
      });

      this.syntaxErrors = errors;
      this.syntaxWarnings = warnings;
    },

    // 检查行是否有错误
    hasErrorOnLine(lineNumber) {
      return this.syntaxErrors.some(error => error.line === lineNumber);
    },

    // 检查行是否有警告
    hasWarningOnLine(lineNumber) {
      return this.syntaxWarnings.some(warning => warning.line === lineNumber);
    },

    // 获取行错误信息
    getErrorMessage(lineNumber) {
      const error = this.syntaxErrors.find(error => error.line === lineNumber);
      const warning = this.syntaxWarnings.find(warning => warning.line === lineNumber);

      if (error) return error.message;
      if (warning) return warning.message;
      return '';
    },

    // 检查是否为模板代码
    isCodeTemplate(code) {
      if (!code) return false;
      const templates = this.getAllTemplates();
      const codeToCheck = code.trim();
      return Object.values(templates).some(template => template.trim() === codeToCheck);
    },

    getAllTemplates() {
      return {
        java: this.getTemplateForLanguage('java'),
        python: this.getTemplateForLanguage('python'),
        cpp: this.getTemplateForLanguage('cpp')
      };
    },

    getTemplateForLanguage(language) {
      const templates = {
        java: `public class Solution {
    public static void main(String[] args) {
        // 在这里编写您的Java代码
        // 您的解决方案
    }
}`,
        python: `# 在这里编写您的Python代码
def main():
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
    // 您的解决方案

    return 0;
}`
      };
      return templates[language] || templates.java;
    },

    getCodeTemplate() {
      return this.getTemplateForLanguage(this.selectedLanguage);
    },

    onLanguageChange() {
      const oldLanguage = this.selectedLanguage;
      console.log(`题目 ${this.questionId} 语言切换: ${oldLanguage} -> ${this.selectedLanguage}`);
      localStorage.setItem('code-editor-language', this.selectedLanguage);

      const newTemplate = this.getCodeTemplate();

      if (!this.userHasEditedCode || this.isCodeTemplate(this.code)) {
        this.code = newTemplate;
        this.userHasEditedCode = false;
        console.log(`已切换到 ${this.getLanguageName()} 模板`);
      } else {
        const shouldReplace = confirm(`检测到您已编写代码，是否要替换为 ${this.getLanguageName()} 模板？`);
        if (shouldReplace) {
          this.code = newTemplate;
          this.userHasEditedCode = false;
          console.log(`已切换到 ${this.getLanguageName()} 模板`);
        } else {
          console.log(`保持原代码，仅更新语言为 ${this.getLanguageName()}`);
        }
      }

      this.onCodeChange();
    },

    getLanguageName() {
      const languageNames = {
        java: 'Java',
        python: 'Python',
        cpp: 'C++'
      };
      return languageNames[this.selectedLanguage] || this.selectedLanguage.toUpperCase();
    },

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

    onCodeInput() {
      if (this.isInitialized) {
        this.userHasEditedCode = true;
        this.onCodeChange();
      }
    },

    formatCode() {
      try {
        const originalCode = this.code;
        this.code = this.formatCodeByLanguage(this.code, this.selectedLanguage);
        if (originalCode !== this.code) {
          console.log('代码格式化完成');
        }
      } catch (error) {
        console.error('格式化失败:', error);
      }
    },

    formatCodeByLanguage(code, language) {
      if (language === 'java' || language === 'cpp') {
        return this.formatJavaCode(code);
      } else if (language === 'python') {
        return this.formatPythonCode(code);
      }
      return code;
    },

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

    handleKeyDown(event) {
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
    },

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

    updateCurrentLine() {
      const textarea = this.$refs.codeEditor;
      if (!textarea) return;

      const pos = textarea.selectionStart;
      const text = textarea.value;

      const lines = text.substring(0, pos).split('\n');
      this.currentLine = lines.length;
      this.currentColumn = lines[lines.length - 1].length + 1;
    },

    syncScroll() {
      const textarea = this.$refs.codeEditor;
      const lineNumbers = this.$refs.lineNumbers;

      if (textarea && lineNumbers) {
        lineNumbers.scrollTop = textarea.scrollTop;
      }

      // 同步语法高亮层滚动
      this.syncHighlightScroll();
    },

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

    getClassName() {
      if (this.selectedLanguage === 'java') {
        const classMatch = this.code.match(/public\s+class\s+(\w+)/);
        return classMatch ? classMatch[1] : 'Solution';
      }
      return 'Solution';
    },

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

    notifyEditorFocus() {
      console.log(`题目 ${this.questionId} 编辑器获得焦点`);
      this.$emit('editor-focus', {
        questionId: this.questionId,
        language: this.selectedLanguage
      });
    },

    notifyEditorBlur() {
      console.log(`题目 ${this.questionId} 编辑器失去焦点`);
      this.$emit('editor-blur', {
        questionId: this.questionId,
        language: this.selectedLanguage,
        codeLength: this.code.length
      });

      this.onCodeChange();
    },

    getPlaceholderText() {
      if (this.userHasEditedCode) {
        return '继续编写您的代码...';
      }

      if (!this.code || this.code.trim() === '') {
        return '请在这里编写您的代码...';
      }

      if (this.isCodeTemplate(this.code)) {
        return '您可以修改此模板代码...';
      }

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

    autoSave() {
      if (!this.isInitialized) return;

      if (this.autoSaveTimer) {
        clearTimeout(this.autoSaveTimer);
      }

      this.autoSaveTimer = setTimeout(() => {
        this.onCodeChange();
      }, 1000);
    },

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

    // 加载用户偏好设置
    this.loadUserPreferences();

    const savedLanguage = localStorage.getItem('code-editor-language');
    if (savedLanguage) {
      this.selectedLanguage = savedLanguage;
    }

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

/* ==================== 题目描述区域 ==================== */
.question-description {
  padding: 20px;
  background-color: #fafafa;
  border-bottom: 1px solid #e4e7ed;
}

.description-content {
  line-height: 1.6;
  margin-bottom: 15px;
  color: #333;
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
  color: #333;
}

.constraints-content {
  font-size: 13px;
  color: #606266;
}

/* ==================== 代码编辑器区域 ==================== */
.code-editor-section {
  padding: 20px;
  background-color: white;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.language-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.language-selector label {
  font-weight: 500;
  color: #606266;
  font-size: 14px;
}

.language-selector select {
  padding: 6px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: white;
  color: #333;
  font-size: 13px;
  min-width: 120px;
}

.editor-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  font-size: 13px;
  font-weight: 500;
  min-width: 80px;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.action-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.action-btn i {
  font-size: 14px;
}

/* 格式化按钮样式 */
.format-btn {
  background: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}

.format-btn:hover:not(:disabled) {
  background: #67c23a;
  color: white;
}

/* 运行按钮样式 */
.run-btn {
  background: #ecf5ff;
  color: #409eff;
  border: 1px solid #d9ecff;
}

.run-btn:hover:not(:disabled) {
  background: #409eff;
  color: white;
}

/* 提交按钮样式 */
.submit-btn {
  background: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fde2e2;
}

.submit-btn:hover:not(:disabled) {
  background: #f56c6c;
  color: white;
}

/* 语法高亮按钮样式 */
.syntax-btn {
  background: #fdf6ec;
  color: #e6a23c;
  border: 1px solid #faecd8;
}

.syntax-btn:hover:not(:disabled) {
  background: #e6a23c;
  color: white;
}

.syntax-btn.active {
  background: #e6a23c;
  color: white;
}

/* 加载动画效果 */
.action-btn:disabled::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.3);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* ==================== 代码编辑器容器 ==================== */
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

/* ==================== 行号样式 ==================== */
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
  position: relative;
}

.line-number.current-line {
  background: #e6f7ff;
  color: #409eff;
  font-weight: bold;
}

/* ==================== 代码编辑器主体 ==================== */
.code-editor-main {
  flex: 1;
  position: relative;
  display: grid;
}

.syntax-highlight-layer,
.code-textarea {
  grid-area: 1 / 1;
  padding: 15px;
  font-family: 'Courier New', 'Menlo', 'Monaco', monospace;
  font-size: 14px;
  line-height: 20px;
  white-space: pre;
  overflow: auto;
  box-sizing: border-box;
  margin: 0;
  border: none;
  outline: none;
}

.syntax-highlight-layer :deep(.syntax-keyword) {
  color: #0070f3 !important;
  font-weight: bold !important;
}

.syntax-highlight-layer :deep(.syntax-type) {
  color: #22863a !important;
  font-weight: 500 !important;
}

.syntax-highlight-layer :deep(.syntax-string) {
  color: #d73a49 !important;
  font-weight: normal !important;
}

.syntax-highlight-layer :deep(.syntax-comment) {
  color: #6a737d !important;
  font-style: italic !important;
  font-weight: normal !important;
}

.syntax-highlight-layer :deep(.syntax-number) {
  color: #005cc5 !important;
  font-weight: normal !important;
}

.syntax-highlight-layer :deep(.syntax-function) {
  color: #6f42c1 !important;
  font-weight: normal !important;
}

.syntax-highlight-layer :deep(.syntax-preprocessor) {
  color: #e36209 !important;
  font-weight: bold !important;
}

/* 确保语法高亮层样式正确 */
.syntax-highlight-layer {
  background: transparent !important;
  pointer-events: none;
  z-index: 1;
  color: #333;
  font-weight: normal;
  white-space: pre;
  overflow: auto;
  padding: 15px;
  font-family: 'Courier New', 'Menlo', 'Monaco', monospace;
  font-size: 14px;
  line-height: 20px;
  margin: 0;
  border: none;
  outline: none;
  box-sizing: border-box;
}

.code-textarea.syntax-enabled {
  color: transparent !important;
  caret-color: #333 !important;
  background: transparent !important;
}

/* ==================== 编辑器状态栏 ==================== */
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

/* ==================== 测试区域 ==================== */
.test-section {
  border-top: 1px solid #e4e7ed;
  background: white;
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
  color: #333;
  font-size: 13px;
  line-height: 1.5;
}

.output-area, .result-area {
  padding: 15px;
  min-height: 165px;
  background: white;
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
  color: #333;
  border: 1px solid #e4e7ed;
}

.empty-output {
  color: #909399;
  font-style: italic;
  text-align: center;
  padding: 50px;
}

/* ==================== 执行结果样式 ==================== */
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

/* ==================== 图标样式 ==================== */
.icon-play::before { content: "▶"; }
.icon-check::before { content: "✓"; }
.icon-format::before { content: "{}"; }
.icon-highlight::before { content: "🎨"; }
.icon-check-circle::before { content: "✅"; }
.icon-x-circle::before { content: "❌"; }
.icon-clock::before { content: "⏰"; }
.icon-info::before { content: "ℹ️"; }

/* ==================== 滚动条样式 ==================== */
.code-textarea::-webkit-scrollbar,
.syntax-highlight-layer::-webkit-scrollbar,
.line-numbers::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.code-textarea::-webkit-scrollbar-track,
.syntax-highlight-layer::-webkit-scrollbar-track,
.line-numbers::-webkit-scrollbar-track {
  background: #f5f7fa;
}

.code-textarea::-webkit-scrollbar-thumb,
.syntax-highlight-layer::-webkit-scrollbar-thumb,
.line-numbers::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.code-textarea::-webkit-scrollbar-thumb:hover,
.syntax-highlight-layer::-webkit-scrollbar-thumb:hover,
.line-numbers::-webkit-scrollbar-thumb:hover {
  background: #909399;
}
</style>