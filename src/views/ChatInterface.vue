<template>
  <div class="chat-container">
    <!-- 侧边栏 -->
    <div class="sidebar">
      <div class="sidebar-header">
        <div class="user-info">
          <h3>聊天记录</h3>
          <span class="username">{{ getUserDisplayName() }}</span>
        </div>
        <div class="header-actions">
          <button @click="createNewSession" class="new-chat-btn">
            <i class="fas fa-plus"></i>
            新对话
          </button>
        </div>
      </div>

      <div class="session-list">
        <div
            v-for="session in sessions"
            :key="session.sessionId"
            :class="['session-item', { active: session.sessionId === currentSessionId }]"
            @click="selectSession(session.sessionId)"
        >
          <div class="session-title">{{ session.title }}</div>
          <div class="session-time">{{ formatTime(session.updatedAt) }}</div>
          <button @click.stop="deleteSession(session.sessionId)" class="delete-btn">
            <i class="fas fa-trash"></i>
          </button>
        </div>

        <!-- 空状态 -->
        <div v-if="sessions.length === 0" class="empty-state">
          <i class="fas fa-comments"></i>
          <p>暂无聊天记录</p>
          <p>点击"新对话"开始聊天</p>
        </div>
      </div>
    </div>

    <!-- 主聊天区域 -->
    <div class="main-chat">
      <div class="chat-header">
        <h3>{{ currentSession?.title || '智学助手' }}</h3>
        <div class="header-right">
          <span class="status" :class="{ online: isOnline }">
            <i class="fas fa-circle"></i>
            {{ isOnline ? '在线' : '离线' }}
          </span>
          <button @click="refreshSession" class="refresh-btn" title="刷新">
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      <div class="chat-messages" ref="messagesContainer">
        <!-- 欢迎消息 -->
        <div v-if="messages.length === 0" class="welcome-message">
          <div class="welcome-content">
            <div class="welcome-icon">
              <i class="fas fa-robot"></i>
            </div>
            <h4>你好！我是智学助手</h4>
            <p>我可以帮助您解答各种学习问题，包括：</p>
            <ul>
              <li><i class="fas fa-square-root-alt"></i> 数学、物理、化学等理科问题</li>
              <li><i class="fas fa-book-open"></i> 语文、英语、历史等文科问题</li>
              <li><i class="fas fa-code"></i> 编程和计算机科学相关问题</li>
              <li><i class="fas fa-lightbulb"></i> 学习方法和技巧指导</li>
            </ul>
            <p>请随时向我提问！</p>
          </div>
        </div>

        <div
            v-for="message in messages"
            :key="message.id"
            :class="['message', message.messageType.toLowerCase()]"
        >
          <div class="message-avatar">
            <div v-if="message.messageType === 'USER'" class="avatar-circle user-avatar">
              <i class="fas fa-user"></i>
            </div>
            <div v-else class="avatar-circle bot-avatar">
              <i class="fas fa-robot"></i>
            </div>
          </div>
          <div class="message-content">
            <div class="message-text" v-html="formatMessage(message.content)"></div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>

        <!-- 输入中提示 -->
        <div v-if="isTyping" class="message assistant">
          <div class="message-avatar">
            <div class="avatar-circle bot-avatar">
              <i class="fas fa-robot"></i>
            </div>
          </div>
          <div class="message-content">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div class="typing-text">智学助手正在思考...</div>
          </div>
        </div>
      </div>

      <div class="chat-input">
        <div class="input-container">
          <textarea
              v-model="currentMessage"
              @keydown.enter.exact.prevent="sendMessage"
              @keydown.enter.shift.exact="newLine"
              placeholder="请输入您的学习问题..."
              rows="1"
              ref="messageInput"
              :disabled="isTyping"
              maxlength="2000"
          ></textarea>
          <button
              @click="sendMessage"
              :disabled="!currentMessage.trim() || isTyping"
              class="send-btn"
              :title="isTyping ? '正在发送...' : '发送消息'"
          >
            <i v-if="isTyping" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-paper-plane"></i>
          </button>
        </div>
        <div class="input-tips">
          <span>按Enter发送，Shift+Enter换行</span>
          <span class="word-count" :class="{ warning: currentMessage.length > 1800 }">
            {{ currentMessage.length }}/2000
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, computed } from 'vue'
import chatApi from '@/api/chat'
import { marked } from 'marked'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'

interface ChatSession {
  id: number
  sessionId: string
  title: string
  createdAt: string
  updatedAt: string
}

interface ChatMessage {
  id: number
  sessionId: string
  messageType: 'USER' | 'ASSISTANT'
  content: string
  timestamp: string
}

// 响应式数据
const sessions = ref<ChatSession[]>([])
const messages = ref<ChatMessage[]>([])
const currentMessage = ref('')
const isTyping = ref(false)
const currentSessionId = ref('')
const messagesContainer = ref<HTMLElement>()
const messageInput = ref<HTMLTextAreaElement>()
const isOnline = ref(true)
const router = useRouter()

// Token管理
const token = ref('')

// 计算属性
const currentSession = computed(() =>
    sessions.value.find(s => s.sessionId === currentSessionId.value)
)

// 获取token和用户信息
const initAuth = () => {
  const savedToken = localStorage.getItem('token')
  if (!savedToken) {
    ElMessage.error('请先登录')
    router.push('/login')
    return false
  }

  token.value = savedToken

  return true
}

// 初始化
onMounted(async () => {
  if (!initAuth()) {
    return
  }

  await loadUserSessions()
  if (sessions.value.length === 0) {
    await createNewSession()
  } else {
    await selectSession(sessions.value[0].sessionId)
  }
  messageInput.value?.focus()
})

// 加载用户会话
const loadUserSessions = async () => {
  try {
    const response = await chatApi.getUserSessions(token.value)
    if (response.data && response.data.success) {
      sessions.value = response.data.data
    } else {
      console.warn('获取会话列表失败:', response.data?.message)
    }
  } catch (error) {
    console.error('加载会话失败:', error)
    if (error.response?.status === 401) {
      handleAuthError()
    } else {
      ElMessage.error('加载会话失败')
    }
  }
}

// 创建新会话
const createNewSession = async () => {
  try {
    const response = await chatApi.createSession(token.value)
    if (response.data && response.data.success) {
      sessions.value.unshift(response.data.data)
      await selectSession(response.data.data.sessionId)
      ElMessage.success('创建新对话成功')
    } else {
      ElMessage.error(response.data?.message || '创建会话失败')
    }
  } catch (error) {
    console.error('创建会话失败:', error)
    if (error.response?.status === 401) {
      handleAuthError()
    } else {
      ElMessage.error('创建会话失败')
    }
  }
}

// 选择会话
const selectSession = async (sessionId: string) => {
  try {
    currentSessionId.value = sessionId
    const response = await chatApi.getChatHistory(sessionId)
    if (response.data && response.data.success) {
      messages.value = response.data.data.messages || []
      await scrollToBottom()
    } else {
      ElMessage.error('加载历史记录失败')
    }
  } catch (error) {
    console.error('加载历史记录失败:', error)
    ElMessage.error('加载历史记录失败')
  }
}

// 发送消息
const sendMessage = async () => {
  if (!currentMessage.value.trim() || isTyping.value) return

  const messageText = currentMessage.value.trim()
  if (messageText.length > 2000) {
    ElMessage.error('消息长度不能超过2000字符')
    return
  }

  const userMessage: ChatMessage = {
    id: Date.now(),
    sessionId: currentSessionId.value,
    messageType: 'USER',
    content: messageText,
    timestamp: new Date().toISOString()
  }

  messages.value.push(userMessage)
  currentMessage.value = ''
  isTyping.value = true

  await scrollToBottom()

  try {
    const response = await chatApi.sendMessage({
      sessionId: currentSessionId.value,
      message: messageText
    },token.value)

    if (response.data && response.data.success) {
      const aiResponse = response.data.data
      let aiContent = ''

      if (aiResponse && aiResponse.content) {
        const contentStr = aiResponse.content
        const textContentMatch = contentStr.match(/textContent=([^,\]]+?)(?:,|\s*reasoningContent)/s)
        if (textContentMatch && textContentMatch[1]) {
          aiContent = textContentMatch[1].trim()
        } else {
          aiContent = contentStr
        }
      } else {
        aiContent = '回复内容解析失败'
      }

      const aiMessage: ChatMessage = {
        id: Date.now() + 1,
        sessionId: currentSessionId.value,
        messageType: 'ASSISTANT',
        content: aiContent,
        timestamp: aiResponse.timestamp || new Date().toISOString()
      }

      messages.value.push(aiMessage)
      await loadUserSessions()

    } else {
      ElMessage.error(response.data?.message || '发送失败')
    }

  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败，请检查网络连接')

    const errorMessage: ChatMessage = {
      id: Date.now() + 1,
      sessionId: currentSessionId.value,
      messageType: 'ASSISTANT',
      content: '抱歉，服务暂时不可用，请稍后再试。',
      timestamp: new Date().toISOString()
    }
    messages.value.push(errorMessage)

  } finally {
    isTyping.value = false
    await scrollToBottom()
    messageInput.value?.focus()
  }
}

// 删除会话
const deleteSession = async (sessionId: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个对话吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const response = await chatApi.deleteSession(sessionId)
    if (response.data && response.data.success) {
      sessions.value = sessions.value.filter(s => s.sessionId !== sessionId)

      if (sessionId === currentSessionId.value) {
        if (sessions.value.length > 0) {
          await selectSession(sessions.value[0].sessionId)
        } else {
          await createNewSession()
        }
      }

      ElMessage.success('删除成功')
    } else {
      ElMessage.error('删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除会话失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 处理认证错误
const handleAuthError = () => {
  ElMessage.error('登录已过期，请重新登录')
  localStorage.removeItem('token')
  localStorage.removeItem('userId')
  router.push('/login')
}

// 退出登录
const logout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '确认退出', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    router.push('/login')
  }).catch(() => {
    // 用户取消
  })
}

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 格式化消息（支持Markdown）
const formatMessage = (content: string) => {
  return marked(content)
}

// 格式化时间
const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 换行处理
const newLine = () => {
  currentMessage.value += '\n'
}

// 获取用户信息显示
const getUserDisplayName = () => {
  return localStorage.getItem('username') || '用户'
}

// 刷新当前会话
const refreshSession = async () => {
  if (currentSessionId.value) {
    await selectSession(currentSessionId.value)
    ElMessage.success('刷新成功')
  }
}

// 检查token有效性
const checkTokenValidity = async () => {
  try {
    await chatApi.healthCheck()
    isOnline.value = true
  } catch (error) {
    if (error.response?.status === 401) {
      handleAuthError()
    } else {
      isOnline.value = false
    }
  }
}

// 定期检查连接状态
onMounted(() => {
  setInterval(checkTokenValidity, 30000)
})
</script>

<style scoped>
/* 基础设置 */
* {
  box-sizing: border-box;
}

.chat-container {
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #faf7ff 0%, #f0f4ff 50%, #e6f3ff 100%);
  font-family: 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  color: #374151;
  overflow: hidden;
}

/* 侧边栏样式 */
.sidebar {
  width: 340px;
  background: linear-gradient(180deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%);
  color: white;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 40px rgba(139, 92, 246, 0.15);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
      radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 40%),
      radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 40%);
  pointer-events: none;
}

.sidebar-header {
  padding: 2rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(5px);
  position: relative;
  z-index: 2;
}

.user-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.username {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
  padding: 0.3rem 0.8rem;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  display: inline-block;
  margin-bottom: 1.5rem;
}

.new-chat-btn {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.8rem 1.5rem;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  width: 100%;
  justify-content: center;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.new-chat-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.new-chat-btn:hover::before {
  left: 100%;
}

.new-chat-btn:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.2) 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(37, 99, 235, 0.3);
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  position: relative;
  z-index: 2;
}

.session-list::-webkit-scrollbar {
  width: 6px;
}

.session-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.session-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.session-item {
  padding: 1.2rem;
  margin-bottom: 1rem;
  border-radius: 15px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.session-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s;
}

.session-item:hover::before {
  opacity: 1;
}

.session-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(37, 99, 235, 0.2);
}

.session-item.active {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 25px rgba(37, 99, 235, 0.25);
}

.session-item.active::after {
  content: '';
  position: absolute;
  left: 0;
  top: 20%;
  bottom: 20%;
  width: 4px;
  background: linear-gradient(180deg, #fbbf24, #f59e0b);
  border-radius: 0 2px 2px 0;
}

.session-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 1.05rem;
  color: rgba(255, 255, 255, 0.95);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;
  z-index: 2;
}

.session-time {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  position: relative;
  z-index: 2;
}

.delete-btn {
  position: absolute;
  top: 50%;
  right: 1rem;
  transform: translateY(-50%);
  background: rgba(248, 113, 113, 0.2);
  border: 1px solid rgba(248, 113, 113, 0.3);
  color: rgba(248, 113, 113, 0.8);
  cursor: pointer;
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  backdrop-filter: blur(10px);
  z-index: 3;
}

.session-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: rgba(248, 113, 113, 0.3);
  color: #f87171;
  transform: translateY(-50%) scale(1.1);
}

/* 主聊天区域 */
.main-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  position: relative;
  overflow: hidden;
}

.chat-header {
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 10;
}

.chat-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.02) 0%, rgba(59, 130, 246, 0.02) 100%);
  pointer-events: none;
}

.chat-header h3 {
  margin: 0;
  font-size: 1.4rem;
  color: #1e293b;
  font-weight: 700;
  letter-spacing: 0.3px;
  position: relative;
  z-index: 2;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  position: relative;
  z-index: 2;
}

.status {
  font-size: 0.9rem;
  padding: 0.4rem 1rem;
  border-radius: 25px;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 600;
  border: 1px solid rgba(148, 163, 184, 0.2);
  transition: all 0.3s ease;
}

.status.online {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #16a34a;
  border-color: rgba(34, 197, 94, 0.3);
}

.status i {
  font-size: 0.7rem;
  animation: pulse 2s infinite;
}

.refresh-btn {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 1px solid rgba(148, 163, 184, 0.2);
  padding: 0.6rem;
  border-radius: 50%;
  cursor: pointer;
  color: #64748b;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.refresh-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
  border-radius: 50%;
  transition: all 0.3s ease;
  transform: translate(-50%, -50%);
}

.refresh-btn:hover::before {
  width: 100%;
  height: 100%;
}

.refresh-btn:hover {
  color: #2563eb;
  border-color: #2563eb;
  transform: rotate(180deg);
}

/* 聊天消息区域 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  background:
      linear-gradient(135deg, #fefefe 0%, #f9fafb 100%),
      radial-gradient(ellipse at top left, rgba(37, 99, 235, 0.03) 0%, transparent 50%),
      radial-gradient(ellipse at bottom right, rgba(59, 130, 246, 0.03) 0%, transparent 50%);
  position: relative;
}

.chat-messages::-webkit-scrollbar {
  width: 8px;
}

.chat-messages::-webkit-scrollbar-track {
  background: rgba(148, 163, 184, 0.1);
  border-radius: 4px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
  border-radius: 4px;
}

.message {
  display: flex;
  margin-bottom: 2rem;
  animation: messageSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.message.user {
  justify-content: flex-end;
}

.message.assistant {
  justify-content: flex-start;
}

.message-avatar {
  width: 48px;
  height: 48px;
  margin: 0 1rem;
  flex-shrink: 0;
}

.avatar-circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.avatar-circle::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s;
}

.avatar-circle:hover::before {
  opacity: 1;
}

.avatar-circle:hover {
  transform: scale(1.1);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.user-avatar {
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.bot-avatar {
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.2);
  animation: gentleFloat 4s ease-in-out infinite;
}

.message-content {
  max-width: 70%;
  padding: 1.2rem 1.8rem;
  position: relative;
  line-height: 1.7;
  word-wrap: break-word;
  border-radius: 20px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.message.user .message-content {
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  color: white;
  border-radius: 20px 20px 6px 20px;
  box-shadow: 0 8px 25px rgba(37, 99, 235, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.message.assistant .message-content {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  color: #374151;
  border-radius: 20px 20px 20px 6px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.1);
}

.message-content:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.12);
}

.message-text {
  margin-bottom: 0.8rem;
  font-size: 1rem;
}

.message-text :deep(pre) {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  padding: 1rem;
  border-radius: 12px;
  overflow-x: auto;
  margin: 0.8rem 0;
  border: 1px solid rgba(148, 163, 184, 0.1);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
}

.message-text :deep(code) {
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
  font-size: 0.9rem;
  color: #4338ca;
  background: rgba(37, 99, 235, 0.1);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
}

.message-text :deep(blockquote) {
  border-left: 4px solid #2563eb;
  padding-left: 1.2rem;
  margin: 1rem 0;
  color: #6b7280;
  font-style: italic;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, transparent 100%);
  padding: 1rem 1.2rem;
  border-radius: 0 8px 8px 0;
}

.message-text :deep(ul), .message-text :deep(ol) {
  padding-left: 1.5rem;
  margin: 0.8rem 0;
}

.message-text :deep(li) {
  margin: 0.5rem 0;
  line-height: 1.6;
}

.message-time {
  font-size: 0.8rem;
  opacity: 0.7;
  margin-top: 0.8rem;
  text-align: right;
  font-weight: 500;
}

.message.user .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.message.assistant .message-time {
  color: #9ca3af;
}

/* 打字指示器 */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0.8rem 0;
}

.typing-indicator span {
  width: 10px;
  height: 10px;
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  border-radius: 50%;
  animation: typingBounce 1.6s infinite;
  box-shadow: 0 2px 4px rgba(6, 182, 212, 0.3);
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

.typing-text {
  font-size: 0.9rem;
  color: #6b7280;
  margin-top: 0.5rem;
  font-style: italic;
}

/* 输入区域 */
.chat-input {
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 10;
}

.chat-input::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.02) 0%, rgba(59, 130, 246, 0.02) 100%);
  pointer-events: none;
}

.input-container {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  position: relative;
  z-index: 2;
}

.input-container textarea {
  flex: 1;
  border: 2px solid rgba(148, 163, 184, 0.2);
  border-radius: 20px;
  padding: 1rem 1.5rem;
  resize: none;
  min-height: 54px;
  max-height: 150px;
  font-size: 1rem;
  line-height: 1.6;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
  color: #374151;
  font-family: inherit;
}

.input-container textarea::placeholder {
  color: #9ca3af;
  transition: color 0.3s ease;
}

.input-container textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
  background: #ffffff;
}

.input-container textarea:focus::placeholder {
  color: rgba(37, 99, 235, 0.6);
}

.send-btn {
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  color: white;
  border: none;
  padding: 0;
  border-radius: 50%;
  cursor: pointer;
  width: 54px;
  height: 54px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.3);
}

.send-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s;
}

.send-btn:hover::before {
  opacity: 1;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(37, 99, 235, 0.4);
}

.send-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.send-btn:disabled {
  background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.input-tips {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  font-size: 0.85rem;
  color: #6b7280;
  padding: 0 0.5rem;
  position: relative;
  z-index: 2;
}

.word-count {
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.word-count.warning {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  color: #dc2626;
  border: 1px solid rgba(220, 38, 38, 0.2);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 250px;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  padding: 2rem;
  position: relative;
  z-index: 2;
}

.empty-state i {
  font-size: 3.5rem;
  margin-bottom: 1.5rem;
  opacity: 0.6;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.empty-state p {
  margin: 0.8rem 0;
  font-size: 1rem;
  font-weight: 500;
}

/* 欢迎消息 */
.welcome-message {
  display: flex;
  justify-content: center;
  padding: 3rem 2rem;
  animation: welcomeSlideIn 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.welcome-content {
  max-width: 650px;
  text-align: center;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  padding: 3rem;
  border-radius: 25px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.1);
  position: relative;
  overflow: hidden;
}

.welcome-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
      radial-gradient(circle at 20% 20%, rgba(37, 99, 235, 0.05) 0%, transparent 40%),
      radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 40%);
  pointer-events: none;
}

.welcome-icon {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2rem;
  color: white;
  font-size: 3rem;
  box-shadow: 0 10px 30px rgba(37, 99, 235, 0.3);
  position: relative;
  z-index: 2;
  animation: gentleFloat 4s ease-in-out infinite;
}

.welcome-content h4 {
  margin: 0 0 1.5rem 0;
  color: #1e293b;
  font-size: 1.8rem;
  font-weight: 700;
  position: relative;
  z-index: 2;
}

.welcome-content p {
  color: #64748b;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
  line-height: 1.7;
  position: relative;
  z-index: 2;
}

.welcome-content ul {
  text-align: left;
  margin: 2.5rem 0;
  padding: 0;
  list-style: none;
  position: relative;
  z-index: 2;
}

.welcome-content li {
  margin: 1.2rem 0;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1rem;
  font-weight: 500;
  padding: 0.8rem 1.2rem;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, transparent 100%);
  border-radius: 12px;
  border-left: 3px solid #2563eb;
  transition: all 0.3s ease;
}

.welcome-content li:hover {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, transparent 100%);
  transform: translateX(8px);
}

.welcome-content li i {
  color: #2563eb;
  width: 1.8rem;
  font-size: 1.2rem;
  text-align: center;
}

/* 动画效果 */
@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes typingBounce {
  0%, 60%, 100% {
    transform: scale(1);
    opacity: 0.7;
  }
  30% {
    transform: scale(1.3);
    opacity: 1;
  }
}

@keyframes gentleFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@keyframes welcomeSlideIn {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .sidebar {
    width: 300px;
  }

  .message-content {
    max-width: 75%;
  }
}

@media (max-width: 768px) {
  .chat-container {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: auto;
    max-height: 45vh;
    position: relative;
  }

  .session-list {
    display: flex;
    overflow-x: auto;
    flex-wrap: nowrap;
    padding: 1rem;
  }

  .session-item {
    min-width: 220px;
    margin-right: 1rem;
    margin-bottom: 0;
    flex-shrink: 0;
  }

  .chat-header {
    padding: 1rem 1.5rem;
  }

  .chat-header h3 {
    font-size: 1.2rem;
  }

  .chat-messages {
    padding: 1.5rem;
  }

  .message-content {
    max-width: 85%;
    padding: 1rem 1.3rem;
  }

  .chat-input {
    padding: 1rem 1.5rem;
  }

  .welcome-content {
    padding: 2rem;
    margin: 0 1rem;
  }

  .welcome-icon {
    width: 80px;
    height: 80px;
    font-size: 2.5rem;
  }

  .welcome-content h4 {
    font-size: 1.5rem;
  }

  .welcome-content ul {
    margin: 2rem 0;
  }

  .welcome-content li {
    font-size: 0.9rem;
    padding: 0.6rem 1rem;
  }
}

@media (max-width: 480px) {
  .sidebar-header {
    padding: 1.5rem 1rem;
  }

  .chat-header {
    padding: 1rem;
  }

  .chat-messages {
    padding: 1rem;
  }

  .message-content {
    max-width: 90%;
    padding: 0.8rem 1rem;
  }

  .chat-input {
    padding: 1rem;
  }

  .input-container textarea {
    font-size: 0.9rem;
    padding: 0.8rem 1.2rem;
  }

  .send-btn {
    width: 48px;
    height: 48px;
  }
}
</style>