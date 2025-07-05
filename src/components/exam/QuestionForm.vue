<template>
  <div class="question-form">
    <el-form :model="localQuestion" label-width="100px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="题目类型" required>
            <el-select
                v-model="localQuestion.type"
                placeholder="请选择题目类型"
                style="width: 100%"
                @change="handleTypeChange"
            >
              <el-option label="单选题" value="SINGLE" />
              <el-option label="多选题" value="MULTIPLE" />
              <el-option label="判断题" value="JUDGE" />
              <el-option label="简答题" value="TEXT" />
              <el-option label="填空题" value="FILL" />
              <el-option label="编程题" value="PROGRAMMING" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="分值" required>
            <el-input-number
                v-model="localQuestion.score"
                :min="1"
                :max="100"
                style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="难度">
            <el-select v-model="localQuestion.difficulty" style="width: 100%">
              <el-option label="简单" value="EASY" />
              <el-option label="中等" value="MEDIUM" />
              <el-option label="困难" value="HARD" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="题目内容" required>
        <el-input
            v-model="localQuestion.content"
            type="textarea"
            :rows="4"
            placeholder="请输入题目内容"
        />
      </el-form-item>

      <!-- 选择题选项 -->
      <div v-if="isChoiceQuestion" class="options-section">
        <el-form-item label="选项设置">
          <div class="options-list">
            <div
                v-for="(option, index) in localQuestion.options"
                :key="index"
                class="option-item"
            >
              <el-checkbox
                  v-if="localQuestion.type === 'MULTIPLE'"
                  v-model="option.isCorrect"
                  class="option-checkbox"
              />
              <el-radio
                  v-else-if="localQuestion.type === 'SINGLE'"
                  v-model="correctOptionIndex"
                  :label="index"
                  class="option-radio"
              />
              <el-input
                  v-model="option.content"
                  :placeholder="`选项 ${option.optionLabel}`"
                  class="option-input"
              />
              <el-button
                  type="danger"
                  text
                  @click="removeOption(index)"
                  :disabled="localQuestion.options.length <= 2"
              >
                删除
              </el-button>
            </div>
            <el-button
                type="primary"
                text
                @click="addOption"
                v-if="localQuestion.options.length < 6"
            >
              + 添加选项
            </el-button>
          </div>
        </el-form-item>
      </div>

      <!-- 判断题选项 -->
      <div v-if="localQuestion.type === 'JUDGE'" class="judge-section">
        <el-form-item label="正确答案" required>
          <el-radio-group v-model="judgeAnswer">
            <el-radio :label="true">正确</el-radio>
            <el-radio :label="false">错误</el-radio>
          </el-radio-group>
        </el-form-item>
      </div>

      <el-form-item label="解析说明">
        <el-input
            v-model="localQuestion.analysis"
            type="textarea"
            :rows="3"
            placeholder="请输入题目解析（可选）"
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  questionNumber: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['update:modelValue'])

// 本地数据
const localQuestion = reactive({
  type: 'SINGLE',
  content: '',
  score: 5,
  difficulty: 'MEDIUM',
  analysis: '',
  options: [],
  ...props.modelValue
})

const correctOptionIndex = ref(0)
const judgeAnswer = ref(true)

// 计算属性
const isChoiceQuestion = computed(() => {
  return ['SINGLE', 'MULTIPLE'].includes(localQuestion.type)
})

// 监听器
watch(localQuestion, (newVal) => {
  emit('update:modelValue', { ...newVal })
}, { deep: true })

watch(() => props.modelValue, (newVal) => {
  Object.assign(localQuestion, newVal)
}, { deep: true })

watch(correctOptionIndex, (newIndex) => {
  if (localQuestion.type === 'SINGLE' && localQuestion.options.length > 0) {
    localQuestion.options.forEach((option, index) => {
      option.isCorrect = index === newIndex
    })
  }
})

watch(judgeAnswer, (answer) => {
  if (localQuestion.type === 'JUDGE') {
    localQuestion.options = [
      { optionLabel: 'A', content: '正确', isCorrect: answer === true },
      { optionLabel: 'B', content: '错误', isCorrect: answer === false }
    ]
  }
})

// 方法
const handleTypeChange = (type) => {
  localQuestion.options = []

  if (type === 'SINGLE') {
    initSingleChoiceOptions()
  } else if (type === 'MULTIPLE') {
    initMultipleChoiceOptions()
  } else if (type === 'JUDGE') {
    initJudgeOptions()
  }
}

const initSingleChoiceOptions = () => {
  localQuestion.options = [
    { optionLabel: 'A', content: '', isCorrect: true },
    { optionLabel: 'B', content: '', isCorrect: false },
    { optionLabel: 'C', content: '', isCorrect: false },
    { optionLabel: 'D', content: '', isCorrect: false }
  ]
  correctOptionIndex.value = 0
}

const initMultipleChoiceOptions = () => {
  localQuestion.options = [
    { optionLabel: 'A', content: '', isCorrect: false },
    { optionLabel: 'B', content: '', isCorrect: false },
    { optionLabel: 'C', content: '', isCorrect: false },
    { optionLabel: 'D', content: '', isCorrect: false }
  ]
}

const initJudgeOptions = () => {
  localQuestion.options = [
    { optionLabel: 'A', content: '正确', isCorrect: true },
    { optionLabel: 'B', content: '错误', isCorrect: false }
  ]
  judgeAnswer.value = true
}

const addOption = () => {
  const labels = ['A', 'B', 'C', 'D', 'E', 'F']
  const newLabel = labels[localQuestion.options.length]
  localQuestion.options.push({
    optionLabel: newLabel,
    content: '',
    isCorrect: false
  })
}

const removeOption = (index) => {
  if (localQuestion.options.length > 2) {
    localQuestion.options.splice(index, 1)
    // 重新分配标签
    localQuestion.options.forEach((option, idx) => {
      option.optionLabel = ['A', 'B', 'C', 'D', 'E', 'F'][idx]
    })
  }
}

// 初始化
if (!localQuestion.options.length && isChoiceQuestion.value) {
  handleTypeChange(localQuestion.type)
} else if (localQuestion.type === 'JUDGE' && !localQuestion.options.length) {
  initJudgeOptions()
}
</script>

<style scoped>
.question-form {
  background-color: #fafafa;
  padding: 20px;
  border-radius: 6px;
}

.options-section {
  margin-top: 20px;
}

.options-list {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 15px;
  background-color: white;
}

.option-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  gap: 10px;
}

.option-item:last-child {
  margin-bottom: 0;
}

.option-checkbox,
.option-radio {
  flex-shrink: 0;
}

.option-input {
  flex: 1;
}

.judge-section {
  margin-top: 20px;
}
</style>