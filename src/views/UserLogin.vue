<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>登录</h2>
        <p>智能化在线教学支持服务平台</p>
      </div>
      
      <!-- 登录方式选项卡 -->
      <el-tabs v-model="activeTab" stretch class="login-tabs">
        <el-tab-pane label="账号密码登录" name="password">
          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            class="login-form"
            @submit.prevent="handlePasswordLogin"
          >
            <el-form-item prop="username">
              <el-input
                v-model="passwordForm.username"
                placeholder="请输入用户名"
                size="large"
                :prefix-icon="User"
              />
            </el-form-item>
            
            <el-form-item prop="password">
              <el-input
                v-model="passwordForm.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                :prefix-icon="Lock"
                show-password
                @keyup.enter="handlePasswordLogin"
              />
            </el-form-item>
            
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                class="login-btn"
                :loading="passwordLoading"
                @click="handlePasswordLogin"
              >
                {{ passwordLoading ? '登录中...' : '登录' }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="邮箱验证码登录" name="email">
          <el-form
            ref="emailFormRef"
            :model="emailForm"
            :rules="emailRules"
            class="login-form"
            @submit.prevent="handleEmailLogin"
          >
            <el-form-item prop="email">
              <el-input
                v-model="emailForm.email"
                placeholder="请输入邮箱"
                size="large"
                :prefix-icon="Message"
              />
            </el-form-item>
            
            <el-form-item prop="code">
              <div class="code-input">
                <el-input
                  v-model="emailForm.code"
                  placeholder="请输入验证码"
                  size="large"
                  :prefix-icon="Key"
                  @keyup.enter="handleEmailLogin"
                />
                <el-button
                  type="primary"
                  :disabled="countdown > 0 || sendingCode"
                  :loading="sendingCode"
                  @click="sendVerificationCodef"
                >
                  {{ countdown > 0 ? `${countdown}秒后重试` : '获取验证码' }}
                </el-button>
              </div>
            </el-form-item>
            
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                class="login-btn"
                :loading="emailLoading"
                @click="handleEmailLogin"
              >
                {{ emailLoading ? '登录中...' : '登录' }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      
      <div class="login-footer">
        <span>还没有账号？</span>
        <el-link type="primary" @click="goToRegister">立即注册</el-link>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElLoading } from 'element-plus'
import { User, Lock, Message, Key } from '@element-plus/icons-vue'
import { login, loginByCode, sendVerificationCode } from '../api/userApi.js'

export default {
  name: 'UserLogin',
  setup() {
    const router = useRouter()
    const activeTab = ref('password')
    
    // 密码登录表单
    const passwordFormRef = ref()
    const passwordLoading = ref(false)
    const passwordForm = reactive({
      username: '',
      password: ''
    })
    
    const passwordRules = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '用户名长度需在3到20字符之间', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 20, message: '密码长度需在6到20字符之间', trigger: 'blur' }
      ]
    }
    
    // 邮箱登录表单
    const emailFormRef = ref()
    const emailLoading = ref(false)
    const sendingCode = ref(false) // 发送验证码状态
    const emailForm = reactive({
      email: '',
      code: ''
    })
    
    const emailRules = {
      email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
      ],
      code: [
        { required: true, message: '请输入验证码', trigger: 'blur' },
        { len: 6, message: '验证码为6位数字', trigger: 'blur' }
      ]
    }
    
    // 验证码倒计时
    const countdown = ref(0)
    let countdownTimer = null
    
    // 密码登录
    const handlePasswordLogin = async () => {
      try {
        const valid = await passwordFormRef.value.validate()
        alert(valid)
        if (!valid) return
        
        passwordLoading.value = true
        const response = await login(passwordForm.username, passwordForm.password)
        
        if (response.code === 200) {
          loginSuccess(response.data)
        }
        console.log('提交的数据:', {
          username: passwordForm.username,
          password: passwordForm.password
        })
      } finally {
        passwordLoading.value = false
      }
    }
    
    // 邮箱登录
    const handleEmailLogin = async () => {
      try {
        const valid = await emailFormRef.value.validate()
        if (!valid) return

        emailLoading.value = true
        const response = await loginByCode(emailForm.email, emailForm.code)
        
        if (response.code === 200) {
          loginSuccess(response.data)
        }
      } finally {
        emailLoading.value = false
      }
    }
    
    // 登录成功处理
    const loginSuccess = (userData) => {
      ElMessage.success('登录成功！')
      localStorage.setItem('userInfo', JSON.stringify(userData))
      const redirect = router.currentRoute.value.query.redirect || '/';
      router.push(redirect)
      console.log('登录返回的数据:', userData)
    }
    
    // 发送验证码
    const sendVerificationCodef = async () => {
      try {
        // 验证邮箱字段
        try {
          await emailFormRef.value.validateField('email')
        } catch (error) {
          console.log('邮箱验证失败:', error)
          return
        }

        // 防止重复点击
        if (sendingCode.value) {
          console.log('操作被阻止: 倒计时中或正在发送')
          return
        }
        
        sendingCode.value = true
        console.log('准备发送验证码到:', emailForm.email)

        const loadingInstance = ElLoading.service({
          lock: true,
          text: '正在发送验证码...',
          background: 'rgba(0, 0, 0, 0.7)'
        })
        
        try {
          const response = await sendVerificationCode({
        email: emailForm.email
      })

        if (!response) {
        throw new Error('未收到有效响应')
      }
          console.log('验证码发送响应:', response)
          
          if (response.code === 200) {
            ElMessage.success('验证码已发送，请查看您的邮箱')
            startCountdown()
          } else {
            console.error('验证码发送失败:', response.message)
            ElMessage.error(response.message || '发送验证码失败')
          }
        } 
        finally {
          loadingInstance.close()
          sendingCode.value = false
        }
      } catch (error) {
        console.error('发送验证码失败:', error)
        ElMessage.error(error.response?.data?.message || '发送验证码失败')
      }
    }
    
    // 开始倒计时
    const startCountdown = () => {
  // 清除已有定时器
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
  
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}
    
    // 跳转到注册页面
    const goToRegister = () => {
      router.push('/register')
    }
    
    return {
      activeTab,
      passwordFormRef,
      passwordForm,
      passwordRules,
      passwordLoading,
      emailFormRef,
      emailForm,
      emailRules,
      emailLoading,
      sendingCode,
      countdown,
      User,
      Lock,
      Message,
      Key,
      handlePasswordLogin,
      handleEmailLogin,
      sendVerificationCodef,
      goToRegister
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 450px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  color: #333;
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 600;
}

.login-header p {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.login-tabs {
  margin-bottom: 20px;
}

.login-form {
  margin-bottom: 20px;
}

.login-form .el-form-item {
  margin-bottom: 20px;
}

.code-input {
  display: flex;
  gap: 10px;
}

.code-input .el-button {
  width: 120px;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
}

.login-footer {
  text-align: center;
  color: #666;
  font-size: 14px;
}

.login-footer .el-link {
  font-size: 14px;
  margin-left: 4px;
}

@media (max-width: 480px) {
  .login-card {
    padding: 30px 20px;
  }
  
  .login-header h2 {
    font-size: 24px;
  }
}
</style>