<template>
  <div class="report-generator">
    <div class="report-header">
      <h2>实验报告生成</h2>
      <div class="actions">
        <el-button type="primary" @click="generateReport">生成报告</el-button>
        <el-dropdown @command="handleExport">
          <el-button type="success">
            导出报告<el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="pdf">PDF格式</el-dropdown-item>
              <el-dropdown-item command="docx">Word格式</el-dropdown-item>
              <el-dropdown-item command="html">HTML格式</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-upload
          action="#"
          :show-file-list="false"
          :before-upload="beforeDataUpload"
        >
          <el-button type="info">导入实验数据</el-button>
        </el-upload>
      </div>
    </div>

    <div class="report-container">
      <div class="template-selector">
        <h3>报告模板</h3>
        <div class="template-grid">
          <div 
            v-for="template in templates" 
            :key="template.id"
            :class="['template-card', { 'active': selectedTemplate === template.id }]"
            @click="selectTemplate(template)"
          >
            <div class="template-preview">
              <img :src="template.preview" alt="模板预览" />
            </div>
            <div class="template-name">{{ template.name }}</div>
          </div>
        </div>
      </div>

      <div class="editor-container">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="可视化编辑" name="visual">
            <div class="editor-toolbar">
              <el-button-group>
                <el-button @click="formatText('bold')"><b>B</b></el-button>
                <el-button @click="formatText('italic')"><i>I</i></el-button>
                <el-button @click="formatText('underline')"><u>U</u></el-button>
              </el-button-group>
              <el-select v-model="headingLevel" placeholder="标题样式">
                <el-option label="正文" value="p" />
                <el-option label="标题1" value="h1" />
                <el-option label="标题2" value="h2" />
                <el-option label="标题3" value="h3" />
              </el-select>
              <el-button @click="insertDataField">插入数据字段</el-button>
            </div>
            <div 
              ref="editor" 
              class="editor-content" 
              contenteditable="true"
              @input="updateContent"
              v-html="reportContent"
            ></div>
          </el-tab-pane>
          <el-tab-pane label="HTML源码" name="html">
            <el-input
              v-model="reportContent"
              type="textarea"
              :rows="20"
              resize="none"
            />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue'
import { useExperimentStore } from '@/store/experiment'
import { ArrowDown } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  components: {
    ArrowDown
  },
  props: {
    recordId: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    const experimentStore = useExperimentStore()
    const activeTab = ref('visual')
    const reportContent = ref('')
    const selectedTemplate = ref(null)
    const editor = ref(null)
    const headingLevel = ref('p')
    
    const templates = ref([
      {
        id: 1,
        name: '标准实验报告',
        preview: '/template-previews/standard.jpg'
      },
      {
        id: 2,
        name: '学术论文格式',
        preview: '/template-previews/academic.jpg'
      },
      {
        id: 3,
        name: '工程实验报告',
        preview: '/template-previews/engineering.jpg'
      },
      {
        id: 4,
        name: '教学实验报告',
        preview: '/template-previews/educational.jpg'
      }
    ])
    
    const dataFields = ref([
      { label: '实验名称', value: 'experiment.name' },
      { label: '实验日期', value: 'record.startTime' },
      { label: '实验步骤', value: 'record.stepData' },
      { label: '参数设置', value: 'record.parameters' },
      { label: '实验结果', value: 'record.resultData' },
      { label: '实验结论', value: 'record.conclusion' }
    ])

    onMounted(async () => {
      // 加载实验记录
      const record = await experimentStore.getRecord(props.recordId)
      
      // 初始化报告内容
      if (record.report && record.report.content) {
        reportContent.value = record.report.content
      } else {
        reportContent.value = `
          <h1>实验报告</h1>
          <h2>实验名称: {{experiment.name}}</h2>
          <p>实验日期: {{record.startTime}}</p>
          <h3>实验目的</h3>
          <p>请在此填写实验目的...</p>
          <h3>实验步骤</h3>
          <p>{{record.stepData}}</p>
          <h3>实验结果</h3>
          <p>{{record.resultData}}</p>
          <h3>实验结论</h3>
          <p>请在此填写实验结论...</p>
        `
      }
    })

    const selectTemplate = (template) => {
      selectedTemplate.value = template.id
      // 这里应加载模板内容
      ElMessage.info(`已选择模板: ${template.name}`)
    }

    const generateReport = async () => {
      if (!reportContent.value) {
        ElMessage.warning('报告内容不能为空')
        return
      }
      
      const reportData = {
        recordId: props.recordId,
        templateId: selectedTemplate.value,
        content: reportContent.value
      }
      
      try {
        await experimentStore.generateReport(reportData)
        ElMessage.success('实验报告生成成功')
      } catch (error) {
        ElMessage.error(`报告生成失败: ${error.message}`)
      }
    }

    const handleExport = (format) => {
      experimentStore.exportReport(props.recordId, format)
        .then(path => {
          ElMessage.success(`报告已导出为${format.toUpperCase()}格式`)
          // 这里应触发文件下载
        })
        .catch(error => {
          ElMessage.error(`导出失败: ${error.message}`)
        })
    }

    const beforeDataUpload = (file) => {
      experimentStore.importExperimentData(props.recordId, file)
        .then(() => {
          ElMessage.success('实验数据导入成功')
        })
        .catch(error => {
          ElMessage.error(`导入失败: ${error.message}`)
        })
      return false
    }

    const updateContent = () => {
      if (editor.value) {
        reportContent.value = editor.value.innerHTML
      }
    }

    const formatText = (format) => {
      if (!editor.value) return
      
      const selection = window.getSelection()
      if (!selection.toString()) {
        ElMessage.warning('请先选择要格式化的文本')
        return
      }
      
      const range = selection.getRangeAt(0)
      const selectedText = range.toString()
      
      let formattedText = ''
      switch(format) {
        case 'bold':
          formattedText = `<strong>${selectedText}</strong>`
          break
        case 'italic':
          formattedText = `<em>${selectedText}</em>`
          break
        case 'underline':
          formattedText = `<u>${selectedText}</u>`
          break
      }
      
      range.deleteContents()
      const newNode = document.createElement('div')
      newNode.innerHTML = formattedText
      const frag = document.createDocumentFragment()
      let child
      while ((child = newNode.firstChild)) {
        frag.appendChild(child)
      }
      range.insertNode(frag)
      
      // 更新内容并恢复选区
      updateContent()
      selection.removeAllRanges()
      selection.addRange(range)
      editor.value.focus()
    }

    const insertDataField = () => {
      if (!editor.value) return
      
      ElMessageBox({
        title: '插入数据字段',
        message: '选择要插入的数据字段',
        showCancelButton: true,
        confirmButtonText: '插入',
        cancelButtonText: '取消',
        showClose: false,
        beforeClose: (action, instance, done) => {
          if (action === 'confirm') {
            const field = instance.selectedValue
            if (field) {
              const fieldElement = document.createElement('span')
              fieldElement.className = 'data-field'
              fieldElement.contentEditable = false
              fieldElement.textContent = `{{${field}}}`
              
              const selection = window.getSelection()
              if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0)
                range.insertNode(fieldElement)
                
                // 移动光标到字段后
                const newRange = document.createRange()
                newRange.setStartAfter(fieldElement)
                newRange.collapse(true)
                selection.removeAllRanges()
                selection.addRange(newRange)
              }
              
              updateContent()
            }
            done()
          } else {
            done()
          }
        }
      })
    }

    return {
      activeTab,
      reportContent,
      selectedTemplate,
      editor,
      headingLevel,
      templates,
      dataFields,
      selectTemplate,
      generateReport,
      handleExport,
      beforeDataUpload,
      updateContent,
      formatText,
      insertDataField
    }
  }
}
</script>

<style scoped>
.report-generator {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.report-header h2 {
  margin: 0;
  color: #2c3e50;
}

.actions {
  display: flex;
  gap: 15px;
}

.report-container {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 30px;
  height: calc(100vh - 180px);
}

.template-selector {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow-y: auto;
}

.template-selector h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #2c3e50;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
}

.template-card {
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.template-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.template-card.active {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3);
}

.template-preview {
  height: 140px;
  overflow: hidden;
}

.template-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.template-name {
  padding: 8px;
  text-align: center;
  font-size: 13px;
  color: #606266;
}

.editor-container {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.editor-toolbar {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.editor-content {
  flex: 1;
  padding: 15px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow-y: auto;
  min-height: 400px;
  outline: none;
}

.editor-content:focus {
  border-color: #409eff;
}

.data-field {
  background-color: #f0f7ff;
  border: 1px dashed #409eff;
  padding: 2px 5px;
  border-radius: 3px;
  color: #409eff;
  margin: 0 2px;
}

@media (max-width: 1200px) {
  .report-container {
    grid-template-columns: 1fr;
    height: auto;
  }
  
  .template-selector {
    height: 300px;
  }
}
</style>