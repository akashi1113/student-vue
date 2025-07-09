<template>
  <div class="note-app">
    <div class="app-header">
      <h1 class="app-title">
        <el-icon><Notebook /></el-icon>
        智慧学习笔记
      </h1>
      <el-button 
        type="primary" 
        icon="el-icon-plus" 
        @click="createNewNote"
        class="new-note-btn"
      >
        新建笔记
      </el-button>
    </div>
    
    <div class="app-container">
      <!-- 笔记列表侧边栏 -->
      <div class="note-sidebar">
        <div class="search-container">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索笔记..."
            clearable
            class="search-input"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        
         <div class="note-list-container">
          <div 
            v-for="note in filteredNotes" 
            :key="note.id"
            :class="['note-card', { active: activeNoteId === note.id }]"
            @click="selectNote(note)"
          >
            <div class="note-card-header">
              <h3 class="note-title">{{ note.title || '未命名笔记' }}</h3>
              <el-button 
                type="danger" 
                icon="el-icon-delete" 
                circle 
                size="small"
                @click.stop="deleteNote(note.id)" 
              />
            </div>
            <div class="note-meta">
              <span class="note-date">
                <el-icon><Calendar /></el-icon>
                {{ formatDate(note.createTime) }}
              </span>
            </div>
            <div class="note-preview">
              <template v-if="note.drawingData">
                <img :src="note.drawingData" class="drawing-preview" />
              </template>
              <template v-else>
                {{ stripHtml(note.content)?.substring(0, 50) || '暂无内容' }}...
              </template>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 笔记编辑器区域 -->
      <div class="note-editor">
        <div v-if="activeNote" class="editor-container">
          <!-- 标题区域 -->
          <el-input 
            v-model="activeNote.title" 
            placeholder="输入笔记标题" 
            class="editor-title"
            size="large"
          />
          
          <!-- 工具栏 -->
          <div class="toolbar">
            <div class="format-tools">
              <el-button-group class="format-buttons">
                <!-- 加粗按钮 -->
                <el-tooltip content="加粗" placement="bottom">
                  <el-button 
                    type="primary" 
                    class="format-button"
                    @click="formatText('bold')"
                  >
                    <span class="bold-text">B</span>
                  </el-button>
                </el-tooltip>
                
                <!-- 斜体按钮 -->
                <el-tooltip content="斜体" placement="bottom">
                  <el-button 
                    type="primary" 
                    class="format-button"
                    @click="formatText('italic')"
                  >
                    <span class="italic-text">I</span>
                  </el-button>
                </el-tooltip>
                
                <!-- 下划线按钮 -->
                <el-tooltip content="下划线" placement="bottom">
                  <el-button 
                    type="primary" 
                    class="format-button"
                    @click="formatText('underline')"
                  >
                    <span class="underline-text">U</span>
                  </el-button>
                </el-tooltip>
              </el-button-group>
            </div>
            
            <div class="drawing-tools">
              <el-button-group>
                <el-button 
                  type="primary" 
                  :icon="isDrawingMode ? 'el-icon-close' : 'el-icon-edit'" 
                  @click="toggleDrawingMode"
                  size="small"
                >
                  {{ isDrawingMode ? '退出绘图' : '绘图模式' }}
                </el-button>
                <el-tooltip content="清除画布" placement="bottom">
                  <el-button 
                    type="primary" 
                    icon="el-icon-delete" 
                    @click="clearCanvas"
                    size="small"
                  />
                </el-tooltip>
              </el-button-group>
            </div>
          </div>
          
          <!-- 编辑区域 -->
          <div class="edit-area">
            <div v-if="!isDrawingMode" class="text-editor">
              <div 
                ref="editor"
                class="content-editor"
                contenteditable="true"
                @input="updateContent"
                v-html="activeNote.content"
                placeholder="开始输入笔记内容..."
              ></div>
            </div>
            
            <div v-else class="drawing-area">
              <DrawingCanvas 
                ref="drawingCanvas"
                :width="800" 
                :height="500"
                @canvas-updated="handleCanvasUpdate"
              />
            </div>
          </div>
          
          <!-- 底部操作栏 -->
          <div class="editor-footer">
            <el-button 
              type="success" 
              icon="el-icon-check" 
              @click="saveNote"
              class="save-btn"
            >
              保存笔记
            </el-button>
            <!-- <el-button 
              type="info" 
              icon="el-icon-download" 
              @click="exportNote"
              class="export-btn"
            >
              导出PDF
            </el-button> -->
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-else class="empty-editor">
          <el-empty description="请选择或创建笔记">
            <el-button 
              type="primary" 
              @click="createNewNote"
              class="create-btn"
            >
              <el-icon><Plus /></el-icon>
              新建笔记
            </el-button>
          </el-empty>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'
import { ref, computed, onMounted, nextTick } from 'vue';
import {
  Notebook,
  Search,
  Calendar,
  Plus
} from '@element-plus/icons-vue'
import DrawingCanvas from '@/components/DrawingCanvas.vue'
import noteApi from '@/api/note'

export default {
  components: {
    DrawingCanvas,
    Notebook,
    Search,
    Calendar,
    Plus
  },
  setup() {
    // 状态定义
    const notes = ref([])
    const activeNoteId = ref(null)
    const activeNote = ref(null)
    const searchKeyword = ref('')
    const isDrawingMode = ref(false)
    const drawingCanvas = ref(null)
    const editor = ref(null)

    // 辅助方法：去除HTML标签
    const stripHtml = (html) => {
      if (!html) return ''
      const tmp = document.createElement('div')
      tmp.innerHTML = html
      return tmp.textContent || tmp.innerText || ''
    }

    // API错误处理
    const handleApiError = (message, error) => {
      ElMessage.error({
        message: `${message}: ${error.message}`,
        offset: 80
      })
      console.error('API Error:', error)
      if (error.response?.status === 431) {
        localStorage.removeItem('token')
      }
    }

    // 方法定义
    const selectNote = (note) => {
      activeNoteId.value = note.id
      activeNote.value = { ...note }
      isDrawingMode.value = false
    }


    const fetchNotes = async () => {
      try {
        const response = await noteApi.getUserNotes()
        notes.value = response.data.data
        
        if (notes.value.length > 0 && !activeNoteId.value) {
          selectNote(notes.value[0])
        }
      } catch (error) {
        handleApiError('获取笔记失败', error)
      }
    }

    const createNewNote = () => {
      const newNote = {
        title: '未命名笔记',
        content: '',
        drawingData: null,
      }
      notes.value.unshift(newNote)
      selectNote(newNote)
    }

    const updateContent = () => {
      if (editor.value && activeNote.value) {
        activeNote.value.content = editor.value.innerHTML
      }
    }

    const saveNote = async () => {
      try {
        // 1. 检查是否有活动笔记
        if (!activeNote.value) {
          ElMessage.warning('没有活动的笔记可保存')
          return false
        }

        // 2. 确保获取最新的编辑器内容
        if (editor.value && !isDrawingMode.value) {
          activeNote.value.content = editor.value.innerHTML
        }

        // 3. 准备请求数据
        const payload = {
          title: activeNote.value.title || '未命名笔记',
          content: activeNote.value.content || '',
          drawingData: isDrawingMode.value ? drawingCanvas.value?.getCanvasData() : null,
        }

        // 4. 调试输出
        console.log('保存请求数据:', payload)

        // 5. 确定是创建还是更新
        let response
        const isNewNote = !activeNote.value.id || activeNote.value.id.toString().startsWith('temp_')

        if (isNewNote) {
          // 创建新笔记
          response = await noteApi.createNote(payload)
        } else {
          // 更新现有笔记
          payload.id = activeNote.value.id
          response = await noteApi.updateNote(activeNote.value.id, payload)
        }

        // 6. 处理响应
        if (response.data && (response.data.code === 200 || response.data.success)) {
          const savedNote = response.data.data || response.data.result

          // 更新本地状态
          const index = notes.value.findIndex(n =>
              n.id === activeNote.value.id ||
              (isNewNote && n.id.toString().startsWith('temp_'))
          )

          if (index !== -1) {
            notes.value.splice(index, 1, savedNote)
          } else {
            notes.value.unshift(savedNote)
          }

          // 更新活动笔记
          activeNote.value = { ...savedNote }
          activeNoteId.value = savedNote.id

          ElMessage.success('笔记保存成功')
          return true
        } else {
          throw new Error(response.data?.message || '保存失败')
        }
      } catch (error) {
        console.error('保存笔记错误:', error)
        let errorMsg = error.message
        if (error.response?.data) {
          errorMsg = error.response.data.message || JSON.stringify(error.response.data)
        }
        ElMessage.error(`保存失败: ${errorMsg}`)
        return false
      }
    }

    const deleteNote = async (id) => {
      try {
        await ElMessageBox.confirm('确定删除此笔记吗？删除后不可恢复', '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
          center: true
        })
        await noteApi.deleteNote(id)
        ElMessage.success({
          message: '笔记已删除',
          offset: 80
        })
        
        if (activeNoteId.value === id) {
          activeNoteId.value = null
          activeNote.value = null
        }
        
        await fetchNotes()
      } catch (error) {
        if (error !== 'cancel') {
          handleApiError('删除笔记失败', error)
        }
      }
    }

    // 绘图相关方法
    const toggleDrawingMode = () => {
      isDrawingMode.value = !isDrawingMode.value
    }

    const clearCanvas = () => {
      drawingCanvas.value?.clearCanvas()
    }

    const handleCanvasUpdate = (dataUrl) => {
      if (activeNote.value) {
        activeNote.value.drawingData = dataUrl
      }
    }

    // 富文本格式化方法
    const formatText = (format) => {
      if (!editor.value) return
      
      const selection = window.getSelection()
      if (!selection.toString()) {
        ElMessage.warning('请先选择要格式化的文本')
        return
      }
      
      const range = selection.getRangeAt(0)
      const selectedText = range.toString()
      
      const span = document.createElement('span')
      
      switch(format) {
        case 'bold':
          span.style.fontWeight = 'bold'
          break
        case 'italic':
          span.style.fontStyle = 'italic'
          break
        case 'underline':
          span.style.textDecoration = 'underline'
          break
      }
      
      range.deleteContents()
      span.appendChild(document.createTextNode(selectedText))
      range.insertNode(span)
      
      updateContent()
      selection.removeAllRanges()
      selection.addRange(range)
    }

    // 导出方法
    const exportNote = () => {
      ElMessage.info({
        message: '导出功能开发中，敬请期待',
        offset: 80
      })
    }

    // 日期格式化
    const formatDate = (dateString) => {
      if (!dateString) return '无日期'
      
      let date
      if (typeof dateString === 'string' && dateString.includes('T')) {
        date = new Date(dateString)
      } else {
        date = new Date(dateString.replace(' ', 'T') + 'Z')
      }
      
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).replace(/\//g, '-')
    }

    // 计算属性
    const filteredNotes = computed(() => {
      if (!searchKeyword.value) return notes.value
      const keyword = searchKeyword.value.toLowerCase()
      return notes.value.filter(note => {
        const titleMatch = note.title?.toLowerCase().includes(keyword) || false
        const contentMatch = stripHtml(note.content || '').toLowerCase().includes(keyword)
        return titleMatch || contentMatch
      })
    })

    // 初始化
    onMounted(() => {
      fetchNotes()
    })

    return {
      notes,
      activeNoteId,
      activeNote,
      searchKeyword,
      isDrawingMode,
      drawingCanvas,
      editor,
      filteredNotes,
      stripHtml,
      handleApiError,
      createNewNote,
      selectNote,
      saveNote,
      deleteNote,
      toggleDrawingMode,
      clearCanvas,
      handleCanvasUpdate,
      formatText,
      exportNote,
      formatDate
    }
  }
}
</script>

<style lang="scss" scoped>
.note-app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 60px;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  z-index: 10;
  
  .app-title {
    display: flex;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    
    .el-icon {
      margin-right: 8px;
      font-size: 20px;
      color: #409eff;
    }
  }
  
  .new-note-btn {
    font-weight: 500;
  }
}

.app-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.note-sidebar {
  width: 320px;
  background-color: #fff;
  border-right: 1px solid #e6e6e6;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  .search-container {
    padding: 16px;
    border-bottom: 1px solid #e6e6e6;
    
    .search-input {
      :deep(.el-input__inner) {
        background-color: #f5f7fa;
        border: none;
      }
    }
  }
  
  .note-list-container {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }
}

.note-card {
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #ebeef5;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: #c0c4cc;
  }
  
  &.active {
    border-color: #409eff;
    background-color: #f0f7ff;
  }
  
  .note-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    
    .note-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }
    
    .el-button {
      opacity: 0;
      transition: opacity 0.2s;
    }
  }
  
  &:hover .note-card-header .el-button {
    opacity: 1;
  }
  
  .note-meta {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    font-size: 12px;
    color: #909399;
    
    .el-icon {
      margin-right: 4px;
      font-size: 14px;
    }
  }
  
  .note-preview {
    font-size: 14px;
    color: #606266;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;

    .drawing-preview {
      max-width: 100%;
      max-height: 60px;
      object-fit: contain;
      display: block;
      margin: 0 auto;
    }
  }
}

.note-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  overflow: hidden;
  
  .editor-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .empty-editor {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    background-color: #f5f7fa;
    
    .create-btn {
      padding: 10px 24px;
      
      .el-icon {
        margin-right: 6px;
      }
    }
  }
}

.editor-title {
  padding: 16px 24px;
  
  :deep(.el-input__inner) {
    font-size: 20px;
    font-weight: 600;
    border: none;
    border-bottom: 1px solid #e6e6e6;
    border-radius: 0;
    padding: 0;
    height: 40px;
    
    &:focus {
      border-bottom-color: #409eff;
    }
  }
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 24px;
  border-bottom: 1px solid #e6e6e6;
  
  .format-tools, .drawing-tools {
    display: flex;
    gap: 8px;
  }
}

.edit-area {
  flex: 1;
  padding: 16px 24px;
  overflow-y: auto;
  
  .text-editor {
    height: 100%;
    
    .content-editor {
      border: none;
      resize: none;
      font-size: 15px;
      line-height: 1.7;
      padding: 0;
      min-height: calc(100vh - 280px);
      outline: none;
      
      &:empty:before {
        content: attr(placeholder);
        color: #c0c4cc;
      }
      
      &:focus {
        box-shadow: none;
      }
    }
  }
  
  .drawing-area {
    display: flex;
    justify-content: center;
    padding: 16px 0;
  }
}

.editor-footer {
  padding: 12px 24px;
  border-top: 1px solid #e6e6e6;
  text-align: right;
  
  .save-btn, .export-btn {
    padding: 10px 20px;
  }
  
  .save-btn {
    margin-right: 12px;
  }
}

/* 响应式设计 */
@media (max-width: 992px) {
  .app-container {
    flex-direction: column;
  }
  
  .note-sidebar {
    width: 100%;
    height: 300px;
    border-right: none;
    border-bottom: 1px solid #e6e6e6;
  }
}

.format-buttons {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.format-button {
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-right: 1px solid #dcdfe6;
}

.format-button:last-child {
  border-right: none;
}

.bold-text {
  font-weight: bold;
  font-size: 14px;
}

.italic-text {
  font-style: italic;
  font-size: 14px;
}

.underline-text {
  text-decoration: underline;
  font-size: 14px;
}
</style>