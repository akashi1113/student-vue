<template>
  <el-dialog
      v-model="visible"
      title="添加题目"
      width="800px"
      :close-on-click-modal="false"
      @close="handleClose"
  >
    <QuestionForm
        v-model="questionData"
        ref="questionFormRef"
    />

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import QuestionForm from './QuestionForm.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const visible = ref(props.modelValue)
const questionFormRef = ref()

const questionData = reactive({
  type: 'SINGLE',
  content: '',
  score: 5,
  difficulty: 'MEDIUM',
  analysis: '',
  options: []
})

watch(() => props.modelValue, (val) => {
  visible.value = val
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const handleClose = () => {
  visible.value = false
  resetForm()
}

const handleConfirm = () => {
  if (validateQuestion()) {
    emit('confirm', { ...questionData })
    handleClose()
  }
}

const validateQuestion = () => {
  if (!questionData.content.trim()) {
    ElMessage.error('请输入题目内容')
    return false
  }

  if (!questionData.score || questionData.score <= 0) {
    ElMessage.error('请设置正确的分值')
    return false
  }

  // 验证选择题选项
  if (['SINGLE', 'MULTIPLE'].includes(questionData.type)) {
    if (questionData.options.length < 2) {
      ElMessage.error('选择题至少需要2个选项')
      return false
    }

    const hasCorrectAnswer = questionData.options.some(option => option.isCorrect)
    if (!hasCorrectAnswer) {
      ElMessage.error('请设置正确答案')
      return false
    }

    const hasContent = questionData.options.every(option => option.content.trim())
    if (!hasContent) {
      ElMessage.error('请填写所有选项内容')
      return false
    }
  }

  return true
}

const resetForm = () => {
  Object.assign(questionData, {
    type: 'SINGLE',
    content: '',
    score: 5,
    difficulty: 'MEDIUM',
    analysis: '',
    options: []
  })
}
</script>

<style scoped>
.dialog-footer {
  text-align: right;
}
</style>