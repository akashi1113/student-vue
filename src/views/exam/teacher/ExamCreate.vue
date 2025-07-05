<template>
  <div class="exam-create-container">
    <el-card class="exam-create-card">
      <template #header>
        <div class="card-header">
          <h2>创建考试</h2>
          <el-button @click="$router.back()" text>
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
        </div>
      </template>

      <el-form
          ref="examFormRef"
          :model="examForm"
          :rules="examRules"
          label-width="120px"
          class="exam-form"
          @submit.prevent="submitForm"
      >
        <!-- 基本信息 -->
        <el-card class="form-section" shadow="never">
          <template #header>
            <h3>基本信息</h3>
          </template>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="考试标题" prop="title" required>
                <el-input
                    v-model="examForm.title"
                    placeholder="请输入考试标题"
                    maxlength="100"
                    show-word-limit
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="所属课程" prop="courseId">
                <el-select
                    v-model="examForm.courseId"
                    placeholder="请选择课程"
                    style="width: 100%"
                    filterable
                >
                  <el-option
                      v-for="course in courseList"
                      :key="course.id"
                      :label="course.name"
                      :value="course.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="考试描述" prop="description">
            <el-input
                v-model="examForm.description"
                type="textarea"
                :rows="3"
                placeholder="请输入考试描述"
                maxlength="500"
                show-word-limit
            />
          </el-form-item>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="考试时长" prop="duration" required>
                <el-input-number
                    v-model="examForm.duration"
                    :min="5"
                    :max="300"
                    style="width: 100%"
                    placeholder="分钟"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="考试模式" prop="examMode" required>
                <el-select
                    v-model="examForm.examMode"
                    placeholder="请选择考试模式"
                    style="width: 100%"
                    @change="handleExamModeChange"
                >
                  <el-option label="线上考试" value="ONLINE" />
                  <el-option label="线下考试" value="OFFLINE" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="考试类型" prop="type">
                <el-select
                    v-model="examForm.type"
                    placeholder="请选择考试类型"
                    style="width: 100%"
                >
                  <el-option label="期中考试" value="MIDTERM" />
                  <el-option label="期末考试" value="FINAL" />
                  <el-option label="平时测验" value="QUIZ" />
                  <el-option label="补考" value="MAKEUP" />
                  <el-option label="其他" value="OTHER" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="及格分数" prop="passingScore">
                <el-input-number
                    v-model="examForm.passingScore"
                    :min="0"
                    :max="100"
                    style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="最大尝试次数" prop="maxAttempts">
                <el-input-number
                    v-model="examForm.maxAttempts"
                    :min="1"
                    :max="5"
                    style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8" v-if="examForm.examMode === 'OFFLINE'">
              <el-form-item label="总分" prop="totalScore">
                <el-input-number
                    v-model="examForm.totalScore"
                    :min="0"
                    :max="1000"
                    style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <!-- 题目设置（仅线上考试） -->
        <el-card v-if="examForm.examMode === 'ONLINE'" class="form-section" shadow="never">
          <template #header>
            <div class="question-header">
              <h3>题目设置</h3>
              <el-button type="primary" @click="addQuestion" :icon="Plus">
                添加题目
              </el-button>
            </div>
          </template>

          <div v-if="examForm.questions.length === 0" class="no-questions">
            <el-empty description="暂无题目，请添加题目" />
          </div>

          <div v-else class="questions-list">
            <el-collapse v-model="activeQuestions">
              <el-collapse-item
                  v-for="(question, index) in examForm.questions"
                  :key="index"
                  :name="index"
                  class="question-item"
              >
                <template #title>
                  <div class="question-title">
                    <span>第{{ index + 1 }}题 ({{ getQuestionTypeLabel(question.type) }}, {{ question.score }}分)</span>
                    <el-button
                        type="danger"
                        size="small"
                        text
                        @click.stop="removeQuestion(index)"
                        :icon="Delete"
                    >
                      删除
                    </el-button>
                  </div>
                </template>

                <QuestionForm
                    :model-value="question"
                    @update:model-value="updateQuestion(index, $event)"
                    :question-number="index + 1"
                />
              </el-collapse-item>
            </el-collapse>
          </div>

          <div v-if="examForm.questions.length > 0" class="questions-summary">
            <el-divider />
            <div class="summary-info">
              <span>总题数: {{ examForm.questions.length }}</span>
              <span>总分: {{ totalScore }}</span>
            </div>
          </div>
        </el-card>

        <!-- 操作按钮 -->
        <div class="form-actions">
          <el-button size="large" @click="$router.back()">取消</el-button>
          <el-button
              type="primary"
              size="large"
              :loading="submitting"
              @click="submitForm('draft')"
          >
            保存草稿
          </el-button>
          <el-button
              type="success"
              size="large"
              :loading="submitting"
              @click="submitForm('publish')"
          >
            创建并发布
          </el-button>
        </div>
      </el-form>
    </el-card>

    <!-- 添加题目对话框 -->
    <QuestionDialog
        v-model="questionDialogVisible"
        @confirm="handleQuestionAdded"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Plus, Delete } from '@element-plus/icons-vue'
import examAPI from '@/api/exam'
import QuestionForm from '@/components/exam/QuestionForm.vue'
import QuestionDialog from '@/components/exam/QuestionDialog.vue'

const router = useRouter()
const examFormRef = ref()
const submitting = ref(false)
const questionDialogVisible = ref(false)
const activeQuestions = ref([])
const courseList = ref([])

// 表单数据
const examForm = reactive({
  title: '',
  description: '',
  duration: 120,
  examMode: 'ONLINE',
  type: 'QUIZ',
  passingScore: 60,
  maxAttempts: 1,
  totalScore: 100,
  courseId: null,
  questions: []
})

// 表单验证规则
const examRules = {
  title: [
    { required: true, message: '请输入考试标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  duration: [
    { required: true, message: '请输入考试时长', trigger: 'blur' },
    { type: 'number', min: 5, max: 300, message: '考试时长在 5 到 300 分钟之间', trigger: 'blur' }
  ],
  examMode: [
    { required: true, message: '请选择考试模式', trigger: 'change' }
  ]
}

// 计算属性
const totalScore = computed(() => {
  return examForm.questions.reduce((sum, question) => sum + (question.score || 0), 0)
})

// 生命周期
onMounted(() => {
  loadCourseList()
})

// 方法
const loadCourseList = async () => {
  try {
    // const response = await courseAPI.getCourseList()
    // courseList.value = response.data

    // 模拟数据
    courseList.value = [
      { id: 1, name: '高等数学' },
      { id: 2, name: '计算机网络' },
      { id: 3, name: '数据结构' },
      { id: 4, name: '操作系统' }
    ]
  } catch (error) {
    console.error('加载课程列表失败:', error)
  }
}

const handleExamModeChange = (mode) => {
  if (mode === 'OFFLINE') {
    examForm.questions = []
  }
}

const addQuestion = () => {
  questionDialogVisible.value = true
}

const handleQuestionAdded = (questionData) => {
  examForm.questions.push({
    ...questionData,
    id: Date.now() // 临时ID
  })
  activeQuestions.value.push(examForm.questions.length - 1)
}

const removeQuestion = (index) => {
  examForm.questions.splice(index, 1)
  // 更新活跃的问题索引
  activeQuestions.value = activeQuestions.value
      .filter(i => i !== index)
      .map(i => i > index ? i - 1 : i)
}

const updateQuestion = (index, questionData) => {
  examForm.questions[index] = questionData
}

const getQuestionTypeLabel = (type) => {
  const typeMap = {
    'SINGLE': '单选题',
    'MULTIPLE': '多选题',
    'JUDGE': '判断题',
    'TEXT': '简答题',
    'FILL': '填空题',
    'PROGRAMMING': '编程题'
  }
  return typeMap[type] || type
}

const validateForm = async () => {
  try {
    await examFormRef.value.validate()

    // 线上考试必须有题目
    if (examForm.examMode === 'ONLINE' && examForm.questions.length === 0) {
      ElMessage.error('线上考试必须添加题目')
      return false
    }

    return true
  } catch (error) {
    return false
  }
}

const submitForm = async (action) => {
  if (!(await validateForm())) {
    return
  }

  submitting.value = true

  try {
    const submitData = {
      ...examForm,
      // 线上考试时自动计算总分
      totalScore: examForm.examMode === 'ONLINE' ? totalScore.value : examForm.totalScore
    }

    const response = await examAPI.createExam(submitData)

    if (response.data.success) {
      ElMessage.success('考试创建成功')

      // 如果选择发布，则立即发布
      if (action === 'publish') {
        try {
          await examAPI.publishExam(response.data.data.id)
          ElMessage.success('考试已发布')
        } catch (error) {
          ElMessage.warning('考试创建成功，但发布失败，请手动发布')
        }
      }

      router.push('/teacher/exams')
    } else {
      ElMessage.error(response.data.message || '创建失败')
    }
  } catch (error) {
    console.error('创建考试失败:', error)
    ElMessage.error('创建考试失败: ' + (error.response?.data?.message || error.message))
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.exam-create-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.exam-create-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  color: #303133;
}

.exam-form {
  margin-top: 20px;
}

.form-section {
  margin-bottom: 20px;
  border: 1px solid #e4e7ed;
}

.form-section :deep(.el-card__header) {
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.form-section h3 {
  margin: 0;
  color: #606266;
  font-size: 16px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.no-questions {
  text-align: center;
  padding: 40px;
}

.questions-list {
  margin-top: 20px;
}

.question-item {
  margin-bottom: 10px;
}

.question-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  font-weight: 500;
}

.questions-summary {
  margin-top: 20px;
}

.summary-info {
  display: flex;
  gap: 30px;
  font-size: 14px;
  color: #606266;
}

.form-actions {
  text-align: center;
  margin-top: 30px;
  padding: 20px 0;
  border-top: 1px solid #e4e7ed;
}

.form-actions .el-button {
  margin: 0 10px;
  min-width: 120px;
}

:deep(.el-collapse-item__header) {
  padding-left: 20px;
  padding-right: 20px;
}

:deep(.el-collapse-item__content) {
  padding: 20px;
}
</style>