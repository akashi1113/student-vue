<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo-circle">
          <svg viewBox="0 0 100 100" class="logo-svg">
            <path d="M50 10 L90 50 L50 90 L10 50 Z" fill="none" stroke="#3a86ff" stroke-width="8"/>
            <circle cx="50" cy="50" r="30" fill="#3a86ff" fill-opacity="0.2"/>
          </svg>
        </div>
        <h2>欢迎登录</h2>
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
                  class="custom-input"
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
                  class="custom-input"
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
                  class="custom-input"
              />
            </el-form-item>

            <el-form-item prop="code">
              <div class="code-input">
                <el-input
                    v-model="emailForm.code"
                    placeholder="请输入验证码"
                    size="large"
                    :prefix-icon="Key"
                    class="custom-input"
                    @keyup.enter="handleEmailLogin"
                />
                <el-button
                    type="primary"
                    plain
                    :disabled="countdown > 0 || sendingCode"
                    :loading="sendingCode"
                    @click="sendVerificationCodef"
                    class="code-btn"
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

        <el-tab-pane label="人脸识别登录" name="face">
          <el-form @submit.prevent="handleFaceLogin" class="login-form">
            <el-form-item label="用户名">
              <el-input
                  v-model="faceUsername"
                  placeholder="请输入用户名"
                  size="large"
                  :prefix-icon="User"
                  class="custom-input"
              />
            </el-form-item>
            <el-form-item label="人脸照片">
              <div class="face-recognition-box">
                <video ref="videoRef" width="240" height="180" autoplay class="face-video"></video>
                <canvas ref="canvasRef" style="display:none;"></canvas>
                <div class="face-buttons">
                  <el-button @click="openCamera" size="small" class="face-btn">打开摄像头</el-button>
                  <el-upload :show-file-list="false" :before-upload="handleUpload" accept="image/*">
                    <el-button size="small" class="face-btn">上传照片</el-button>
                  </el-upload>
                </div>
                <img v-if="faceImage" :src="'data:image/jpeg;base64,'+faceImage" class="face-preview" />
              </div>
            </el-form-item>
            <el-form-item>
              <el-button
                  type="primary"
                  :disabled="!faceImage"
                  size="large"
                  class="login-btn"
                  @click="handleFaceLogin"
              >
                人脸识别登录
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <div class="login-footer">
        <span>还没有账号？</span>
        <el-link type="primary" @click="goToRegister" class="register-link">立即注册</el-link>
      </div>
    </div>

    <!-- 装饰性元素 -->
    <div class="decor-circle circle-1"></div>
    <div class="decor-circle circle-2"></div>
    <div class="decor-circle circle-3"></div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElLoading } from 'element-plus'
import { User, Lock, Message, Key } from '@element-plus/icons-vue'
import { login, loginByCode, sendVerificationCode, faceLogin } from '../api/userApi.js'

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

    // 人脸识别登录
    const faceUsername = ref('')
    const faceImage = ref('')
    const videoRef = ref(null)
    const canvasRef = ref(null)

    const openCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        videoRef.value.srcObject = stream

        // 优化：缩短等待时间为2秒
        ElMessage.info('摄像头已打开，2秒后将自动拍照并尝试登录')

        // 等待摄像头稳定，2秒后自动拍照
        setTimeout(() => {
          if (videoRef.value && videoRef.value.readyState === 4) {
            takePhoto()
            // 拍照后自动尝试登录
            if (faceUsername.value) {
              handleFaceLogin()
            } else {
              ElMessage.warning('请先输入用户名再尝试自动登录')
            }
          } else {
            ElMessage.warning('摄像头尚未准备好，请稍后手动点击重试登录')
          }
        }, 2000)  // 优化：2秒
      } catch (e) {
        ElMessage.error('无法打开摄像头，请检查权限')
      }
    }
    const takePhoto = () => {
      const video = videoRef.value
      const canvas = canvasRef.value
      // 提高分辨率
      canvas.width = 320
      canvas.height = 240
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
      faceImage.value = canvas.toDataURL('image/jpeg', 0.7).split(',')[1]
    }
    const handleUpload = (file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        faceImage.value = e.target.result.split(',')[1]
      }
      reader.readAsDataURL(file)
      return false
    }
    // 添加重试次数跟踪
    let faceLoginRetryCount = 0
    const MAX_RETRY_COUNT = 1  // 减少重试次数以避免QPS限制

    const handleFaceLogin = async (isAutoRetry = false) => {
      if (!faceUsername.value || !faceImage.value) {
        ElMessage.warning('请填写用户名并拍照或上传照片')
        return
      }
      try {
        if (!isAutoRetry) {
          faceLoginRetryCount = 0
        }
        const res = await faceLogin(faceUsername.value, faceImage.value)
        if (res.code === 200) {
          ElMessage.success('人脸登录成功')
          loginSuccess(res.data)
          faceLoginRetryCount = 0
        } else {
          // 检查是否包含得分信息，如果是得分问题，提供更友好的提示
          let scoreMessage = ''
          if (res.message && res.message.includes('得分:')) {
            const score = res.message.match(/得分:(\d+\.?\d*)/)?.[1]
            if (score) {
              scoreMessage = `人脸匹配度不够(得分:${score})，${faceLoginRetryCount < MAX_RETRY_COUNT ? '正在自动调整重试...' : '请尝试调整光线或角度'}`
              ElMessage.warning(scoreMessage)
            } else {
              ElMessage.error(res.message || '人脸登录失败')
            }
          } else {
            // 检查是否达到API请求限制
            if (res.message && res.message.includes('qps request limit')) {
              ElMessage.error('人脸识别服务繁忙，请稍后再试(API调用频率限制)')
              faceLoginRetryCount = MAX_RETRY_COUNT  // 不再自动重试
            } else {
              ElMessage.error(res.message || '人脸登录失败')
            }
          }

          // 自动重试逻辑
          if (faceLoginRetryCount < MAX_RETRY_COUNT && videoRef.value && videoRef.value.srcObject) {
            faceLoginRetryCount++
            console.log(`人脸识别失败，正在进行第${faceLoginRetryCount}次重试...`)
            setTimeout(() => {
              takePhoto()  // 重新拍照
              handleFaceLogin(true)  // 重试登录，标记为自动重试
            }, 3000)  // 增加为3秒间隔，降低请求频率
          } else if (faceLoginRetryCount >= MAX_RETRY_COUNT) {
            ElMessage.info('多次识别未成功，请手动调整后重试')
            faceLoginRetryCount = 0
          }
        }
      } catch (e) {
        console.error('人脸登录失败:', e)
        if (e.message && e.message.includes('face is fuzzy')) {
          ElMessage.error('人脸照片模糊，请调整光线、保持摄像头稳定、正对摄像头后重试。')
        } else if (e.message && e.message.includes('qps request limit')) {
          ElMessage.error('人脸识别服务繁忙，请稍后再试(API调用次数限制)')
          faceLoginRetryCount = MAX_RETRY_COUNT
          return
        } else if (e.message && e.message.includes('得分:')) {
          const score = e.message.match(/得分:(\d+\.?\d*)/)
          if (score) {
            const scoreMessage = `人脸匹配度不够(得分:${score[1]})，${faceLoginRetryCount < MAX_RETRY_COUNT ? '正在自动调整重试...' : '请尝试调整光线或角度'}`
            ElMessage.warning(scoreMessage)
            if (faceLoginRetryCount < MAX_RETRY_COUNT && videoRef.value && videoRef.value.srcObject) {
              faceLoginRetryCount++
              setTimeout(() => {
                takePhoto()
                handleFaceLogin(true)
              }, 3000)
            } else if (faceLoginRetryCount >= MAX_RETRY_COUNT) {
              ElMessage.info('多次识别未成功，请手动重试')
              faceLoginRetryCount = 0
            }
          } else {
            ElMessage.error(e.message || '人脸登录接口异常')
          }
        } else {
          ElMessage.error(e.message || '人脸登录接口异常')
        }
      }
    }

    // 密码登录
    const handlePasswordLogin = async () => {
      try {
        const valid = await passwordFormRef.value.validate()
        if (!valid) return
        passwordLoading.value = true
        try {
          const response = await login(passwordForm.username, passwordForm.password)
          if (response.code === 200) {
            loginSuccess(response.data)
          }
        } catch (err) {
          // 捕获登录失败异常并弹窗提示
          ElMessage.error(err.message || '用户名或密码错误')
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
      // 存储token，确保后续接口能自动带token
      if (userData.token) {
        localStorage.setItem('token', userData.token.trim())
      }
      // 兼容后端返回userId但没有id的情况
      if (userData.userId && !userData.id) {
        userData.id = userData.userId
      }
      localStorage.setItem('userInfo', JSON.stringify(userData))
      localStorage.setItem('role', userData.user.roleDesc)
      localStorage.setItem('username',userData.user.username)
      // 1. 检查是否为管理员
      if (userData.user.roleDesc === '管理员') {
        // 如果是管理员，直接跳转到后台管理页面，忽略任何 redirect 参数
        router.push('/admin')
        console.log('管理员登录，强制跳转到 /admin')
      }
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
      faceUsername,
      faceImage,
      videoRef,
      canvasRef,
      handlePasswordLogin,
      handleEmailLogin,
      sendVerificationCodef,
      goToRegister,
      openCamera,
      takePhoto,
      handleUpload,
      handleFaceLogin
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
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.login-card {
  width: 100%;
  max-width: 450px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(58, 134, 255, 0.15);
  padding: 40px 30px;
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;
  border: 1px solid rgba(58, 134, 255, 0.1);
}

.login-card:hover {
  box-shadow: 0 15px 50px rgba(58, 134, 255, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo-circle {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(58, 134, 255, 0.1);
  border-radius: 50%;
  animation: pulse 2s infinite alternate;
}

.logo-svg {
  width: 50px;
  height: 50px;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(58, 134, 255, 0.4);
  }
  100% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(58, 134, 255, 0);
  }
}

.login-header h2 {
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 600;
  background: linear-gradient(90deg, #3a86ff, #4361ee);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.login-header p {
  color: #7f8c8d;
  font-size: 14px;
  margin: 0;
}

.login-tabs {
  margin-bottom: 20px;
}

.login-tabs :deep(.el-tabs__item) {
  color: #7f8c8d;
  font-weight: 500;
}

.login-tabs :deep(.el-tabs__item.is-active) {
  color: #3a86ff;
}

.login-tabs :deep(.el-tabs__active-bar) {
  background-color: #3a86ff;
}

.login-form {
  margin-bottom: 20px;
}

.login-form .el-form-item {
  margin-bottom: 24px;
}

.custom-input {
  margin: 8px 0; /* 增加输入框上下边距 */
}

.custom-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  border: 1px solid #e0e0e0; /* 改为明确的border属性 */
  box-shadow: none !important; /* 移除阴影避免冲突 */
  padding: 0 15px;
  height: 48px;
  transition: all 0.3s ease;
}

.custom-input :deep(.el-input__wrapper:hover) {
  border-color: #3a86ff;
}

.custom-input :deep(.el-input__wrapper.is-focus) {
  border-color: #3a86ff;
  box-shadow: 0 0 0 1px #3a86ff !important; /* 聚焦时添加轻微阴影 */
}

.code-input {
  display: flex;
  gap: 10px;
}

.code-btn {
  width: 120px;
  border-radius: 8px;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  background: linear-gradient(90deg, #3a86ff, #4361ee);
  border: none;
  transition: all 0.3s ease;
}

.login-btn {
  margin-top: 8px;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(58, 134, 255, 0.4);
}

.login-footer {
  text-align: center;
  color: #95a5a6;
  font-size: 14px;
  margin-top: 20px;
}

.register-link {
  font-size: 14px;
  margin-left: 4px;
  font-weight: 500;
}

/* 人脸识别部分样式 */
.face-recognition-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.face-video {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid #e0e0e0;
}

.face-buttons {
  display: flex;
  gap: 10px;
}

.face-btn {
  border-radius: 6px;
}

.face-preview {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
}

/* 装饰性圆圈 */
.decor-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(58, 134, 255, 0.05);
  z-index: 1;
}

.circle-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  left: -100px;
}

.circle-2 {
  width: 200px;
  height: 200px;
  bottom: -50px;
  right: -50px;
}

.circle-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  right: 10%;
}

@media (max-width: 480px) {
  .login-card {
    padding: 30px 20px;
  }

  .login-header h2 {
    font-size: 24px;
  }

  .decor-circle {
    display: none;
  }
}
</style>