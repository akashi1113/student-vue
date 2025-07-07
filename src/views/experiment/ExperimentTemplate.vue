<template>
  <div class="template-container">
    <el-page-header @back="goBack" class="page-header">
      <template #content>
        <div class="page-header-content">
          <el-icon><arrow-left /></el-icon>
          <span>实验模板管理</span>
        </div>
      </template>
    </el-page-header>
    
    <el-card class="template-card">
      <el-form :model="form" label-width="120px">
        <el-form-item label="实验名称">
          <el-input v-model="experiment.name" disabled />
        </el-form-item>
        
        <el-form-item label="实验目的" required>
          <el-input 
            v-model="form.purpose" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入实验目的"
          />
        </el-form-item>
        
        <el-form-item label="实验内容" required>
          <el-input 
            v-model="form.content" 
            type="textarea" 
            :rows="5" 
            placeholder="请输入实验内容"
          />
        </el-form-item>
        
        <el-form-item label="实验方法" required>
          <el-input 
            v-model="form.method" 
            type="textarea" 
            :rows="5" 
            placeholder="请输入实验方法"
          />
        </el-form-item>
        
        <el-form-item label="实验步骤" required>
          <div class="step-editor">
            <div v-for="(step, index) in form.steps" :key="index" class="step-item">
              <el-input 
                v-model="step.title" 
                placeholder="步骤标题"
                class="step-title"
              />
              <el-input 
                v-model="step.content" 
                type="textarea" 
                :rows="2" 
                placeholder="步骤内容"
                class="step-content"
              />
              <el-button 
                type="danger" 
                icon="delete" 
                circle 
                @click="removeStep(index)"
              />
            </div>
            <el-button type="primary" @click="addStep">
              <el-icon><plus /></el-icon> 添加步骤
            </el-button>
          </div>
        </el-form-item>
        
        <el-form-item label="结论指导">
          <el-input 
            v-model="form.conclusion_guide" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入结论指导（可选）"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm">保存模板</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Plus, Delete } from '@element-plus/icons-vue'
import { getExperimentById } from '@/store/experiment'
import { getExperimentTemplate, createExperimentTemplate, updateExperimentTemplate } from '@/api/teacher_experiment'

const route = useRoute()
const router = useRouter()
const experiment = ref({})
const form = ref({
  purpose: '',
  content: '',
  method: '',
  steps: [{ title: '', content: '' }],
  conclusion_guide: ''
})

// 获取实验详情
const fetchExperiment = async () => {
  const id = route.params.id
  if (!id) return
  
  try {
    experiment.value = await getExperimentById(id)
    fetchTemplate(id)
  } catch (error) {
    console.error('获取实验详情失败:', error)
  }
}

// 获取实验模板
const fetchTemplate = async (experimentId) => {
  try {
    const res = await getExperimentTemplate(experimentId)
    // 检查响应结构是否符合预期
    if (res && res.data && res.data.id) {
      form.value = {
        id: res.data.id, // 确保保存id字段用于后续更新
        purpose: res.data.purpose || '',
        content: res.data.content || '',
        method: res.data.method || '',
        steps: res.data.steps ? JSON.parse(res.data.steps) : [{ title: '', content: '' }],
        conclusion_guide: res.data.conclusionGuide || res.data.conclusion_guide || ''
      }
    } else {
      // 初始化空表单
      form.value = {
        purpose: '',
        content: '',
        method: '',
        steps: [{ title: '', content: '' }],
        conclusion_guide: ''
      }
    }
  } catch (error) {
    console.error('获取模板失败:', error)
    // 初始化空表单
    form.value = {
      purpose: '',
      content: '',
      method: '',
      steps: [{ title: '', content: '' }],
      conclusion_guide: ''
    }
    // 仅显示非404错误的提示
    if (!error.message.includes('404')) {
      ElMessage.error('获取模板失败，已初始化空模板')
    }
  }
}

// 添加步骤
const addStep = () => {
  form.value.steps.push({ title: '', content: '' })
}

// 删除步骤
const removeStep = (index) => {
  if (form.value.steps.length > 1) {
    form.value.steps.splice(index, 1)
  }
}

// 提交表单
const submitForm = async () => {
  try {
    const templateData = {
      experimentId: experiment.value.id,
      purpose: form.value.purpose,
      content: form.value.content,
      method: form.value.method,
      steps: JSON.stringify(form.value.steps),
      conclusionGuide: form.value.conclusion_guide
    }

    let response;
    try {
      if (form.value.id) {
        response = await updateExperimentTemplate(form.value.id, templateData)
      } else {
        // 先尝试获取现有模板
        const existingRes = await getExperimentTemplate(experiment.value.id)
        if (existingRes?.data?.id) {
          response = await updateExperimentTemplate(existingRes.data.id, templateData)
        } else {
          response = await createExperimentTemplate(templateData)
        }
      }
      
      // 检查响应是否有效
      if (!response) {
        throw new Error('服务器返回了空响应')
      }
      
      ElMessage.success('模板保存成功')
      goBack()
    } catch (error) {
      // 处理404错误（模板不存在）
      if (error.message.includes('404')) {
        response = await createExperimentTemplate(templateData)
        if (!response) {
          throw new Error('创建模板时服务器返回了空响应')
        }
        ElMessage.success('模板创建成功')
        goBack()
      } else {
        throw error
      }
    }
  } catch (error) {
    console.error('保存失败:', error)
    let errorMsg = error.message
    if (errorMsg.includes('Failed to execute \'json\' on \'Response\'')) {
      errorMsg = '服务器返回了无效响应，请检查服务端日志'
    } else if (errorMsg.includes('Duplicate entry')) {
      errorMsg = '该实验已存在模板，请直接编辑现有模板'
    }
    ElMessage.error(`保存失败: ${errorMsg}`)
  }
}

// 重置表单
const resetForm = () => {
  form.value = {
    purpose: '',
    content: '',
    method: '',
    steps: [{ title: '', content: '' }],
    conclusion_guide: ''
  }
}

// 返回
const goBack = () => {
  router.push('/teacher/experimentList')
}

onMounted(fetchExperiment)
</script>

<style scoped>
.template-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.template-card {
  margin-top: 20px;
  padding: 20px;
}

.step-editor {
  width: 100%;
}

.step-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 15px;
  gap: 10px;
}

.step-title {
  width: 200px;
}

.step-content {
  flex: 1;
}
</style>