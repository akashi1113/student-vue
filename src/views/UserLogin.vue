<template>
  <div class="login-container">
    <!-- 背景粒子特效 -->
    <div class="particles" id="particles-js"></div>

    <!-- 登录卡片 -->
    <div class="login-card" :class="{'card-animate': cardAnimate}">
      <div class="login-header">
        <h2>登录</h2>
        <p>智能化在线教学支持服务平台</p>
      </div>

      <!-- 登录方式选项卡 -->
      <el-tabs v-model="activeTab" stretch class="login-tabs">
        <!-- 账号密码登录 -->
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
                <span v-if="!passwordLoading" class="btn-wave"></span>
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 邮箱验证码登录 -->
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
                <span v-if="!emailLoading" class="btn-wave"></span>
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 人脸识别登录 -->
        <el-tab-pane label="人脸识别登录" name="face">
          <el-form class="login-form" @submit.prevent="handleFaceLogin">
            <el-form-item prop="username">
              <el-input
                  v-model="faceForm.username"
                  placeholder="请输入用户名"
                  size="large"
                  :prefix-icon="User"
              />
            </el-form-item>

            <el-form-item label="人脸采集">
              <div class="face-capture">
                <video
                    ref="videoRef"
                    width="320"
                    height="240"
                    autoplay
                    playsinline
                    class="face-video"
                    :class="{'video-active': isCameraActive}"
                ></video>
                <canvas ref="canvasRef" style="display:none;"></canvas>

                <div class="face-actions">
                  <el-button
                      type="primary"
                      size="small"
                      @click="toggleCamera"
                      :icon="isCameraActive ? 'el-icon-video-pause' : 'el-icon-video-play'"
                  >
                    {{ isCameraActive ? '关闭摄像头' : '打开摄像头' }}
                  </el-button>

                  <el-button
                      type="success"
                      size="small"
                      @click="captureFace"
                      :disabled="!isCameraActive"
                      icon="el-icon-camera"
                  >
                    拍照
                  </el-button>

                  <el-upload
                      :show-file-list="false"
                      :before-upload="handleFaceUpload"
                      accept="image/*"
                  >
                    <el-button
                        size="small"
                        icon="el-icon-upload"
                    >
                      上传照片
                    </el-button>
                  </el-upload>
                </div>

                <div class="face-preview" v-if="faceImage">
                  <img :src="'data:image/jpeg;base64,'+faceImage" alt="人脸照片" />
                  <div class="face-tip">已采集人脸照片</div>
                </div>
              </div>
            </el-form-item>

            <el-form-item>
              <el-button
                  type="primary"
                  size="large"
                  class="login-btn"
                  :loading="faceLoading"
                  :disabled="!faceImage || !faceForm.username"
                  @click="handleFaceLogin"
              >
                {{ faceLoading ? '识别中...' : '人脸识别登录' }}
                <span v-if="!faceLoading" class="btn-wave"></span>
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <div class="login-footer">
        <span>还没有账号？</span>
        <el-link type="primary" @click="goToRegister">立即注册</el-link>
        <el-divider direction="vertical"></el-divider>
        <el-link type="info" @click="goToForget">忘记密码</el-link>
      </div>
    </div>

    <!-- 浮动气泡背景 -->
    <div class="bubbles">
      <span v-for="i in 15" :key="i" :style="bubbleStyle(i)"></span>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Message, Key } from '@element-plus/icons-vue'
import { login, loginByCode, sendVerificationCode, faceLogin } from '../api/userApi.js'
import 'particles.js'

export default {
  name: 'UserLogin',
  setup() {
    const router = useRouter()
    const activeTab = ref('password')
    const cardAnimate = ref(false)

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
    const sendingCode = ref(false)
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
    const faceForm = reactive({
      username: ''
    })
    const faceLoading = ref(false)
    const faceImage = ref('')
    const videoRef = ref(null)
    const canvasRef = ref(null)
    const isCameraActive = ref(false)
    let stream = null

    // 气泡样式
    const bubbleStyle = (i) => {
      const size = Math.random() * 10 + 10
      const duration = Math.random() * 15 + 10
      const delay = Math.random() * 5
      const left = Math.random() * 100
      return {
        width: `${size}px`,
        height: `${size}px`,
        left: `${left}%`,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`
      }
    }

    // 初始化粒子效果
    const initParticles = () => {
      if (window.particlesJS) {
        window.particlesJS('particles-js', {
          particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: "#3a86ff" },
            shape: { type: "circle" },
            opacity: { value: 0.5, random: true },
            size: { value: 3, random: true },
            line_linked: {
              enable: true,
              distance: 150,
              color: "#3a86ff",
              opacity: 0.4,
              width: 1
            },
            move: {
              enable: true,
              speed: 2,
              direction: "none",
              random: true,
              straight: false,
              out_mode: "out"
            }
          },
          interactivity: {
            detect_on: "canvas",
            events: {
              onhover: { enable: true, mode: "grab" },
              onclick: { enable: true, mode: "push" }
            }
          }
        })
      }
    }

    // 打开/关闭摄像头
    const toggleCamera = async () => {
      if (isCameraActive.value) {
        stopCamera()
      } else {
        await startCamera()
      }
    }

    // 开启摄像头
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 320,
            height: 240,
            facingMode: 'user' // 前置摄像头
          },
          audio: false
        })
        videoRef.value.srcObject = stream
        isCameraActive.value = true
        ElMessage.success('摄像头已开启，请正对摄像头')
      } catch (error) {
        console.error('摄像头开启失败:', error)
        ElMessage.error('无法访问摄像头: ' + error.message)
      }
    }

    // 关闭摄像头
    const stopCamera = () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        videoRef.value.srcObject = null
        isCameraActive.value = false
      }
    }

    // 拍照
    const captureFace = () => {
      if (!isCameraActive.value) return

      const video = videoRef.value
      const canvas = canvasRef.value
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // 转换为base64
      faceImage.value = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
      ElMessage.success('照片已采集')
    }

    // 上传人脸照片
    const handleFaceUpload = (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          faceImage.value = e.target.result.split(',')[1]
          resolve(false) // 阻止自动上传
        }
        reader.readAsDataURL(file)
      })
    }

    // 人脸识别登录
    const handleFaceLogin = async () => {
      if (!faceForm.username || !faceImage.value) {
        ElMessage.warning('请输入用户名并采集人脸照片')
        return
      }

      faceLoading.value = true
      try {
        const response = await faceLogin(faceForm.username, faceImage.value)

        if (response.code === 200) {
          loginSuccess(response.data)
        } else {
          let errorMsg = response.message || '人脸识别失败'

          // 根据不同的错误类型提供更友好的提示
          if (errorMsg.includes('得分')) {
            const score = errorMsg.match(/得分:(\d+\.?\d*)/)?.[1] || '未知'
            errorMsg = `人脸匹配度不足 (得分: ${score})，请确保正对摄像头、光线充足`
          } else if (errorMsg.includes('未找到用户')) {
            errorMsg = '用户名不存在，请检查或使用其他登录方式'
          } else if (errorMsg.includes('未注册人脸')) {
            errorMsg = '该用户未注册人脸信息，请使用其他登录方式'
          }

          ElMessage.error(errorMsg)
        }
      } catch (error) {
        console.error('人脸识别登录失败:', error)
        let errorMsg = error.message || '人脸识别服务异常'

        if (errorMsg.includes('qps')) {
          errorMsg = '识别服务繁忙，请稍后再试'
        } else if (errorMsg.includes('face is fuzzy')) {
          errorMsg = '人脸照片模糊，请调整光线后重试'
        }

        ElMessage.error(errorMsg)
      } finally {
        faceLoading.value = false
      }
    }

    // 密码登录
    const handlePasswordLogin = async () => {
      try {
        const valid = await passwordFormRef.value.validate()
        if (!valid) return

        passwordLoading.value = true
        const response = await login(passwordForm.username, passwordForm.password)

        if (response.code === 200) {
          loginSuccess(response.data)
        } else {
          ElMessage.error(response.message || '用户名或密码错误')
        }
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
        } else {
          ElMessage.error(response.message || '验证码错误或已过期')
        }
      } finally {
        emailLoading.value = false
      }
    }

    // 登录成功处理
    const loginSuccess = (userData) => {
      ElMessage.success('登录成功！')

      // 存储token和用户信息
      localStorage.setItem('token', userData.token)
      localStorage.setItem('userInfo', JSON.stringify(userData))

      // 关闭摄像头
      stopCamera()

      // 跳转到首页或管理员页面
      if (userData.role === 'admin') {
        router.push('/admin')
      } else {
        const redirect = router.currentRoute.value.query.redirect || '/'
        router.push(redirect)
      }
    }

    // 发送验证码
    const sendVerificationCodef = async () => {
      try {
        // 验证邮箱
        try {
          await emailFormRef.value.validateField('email')
        } catch (error) {
          ElMessage.warning('请输入有效的邮箱地址')
          return
        }

        // 防止重复点击
        if (sendingCode.value || countdown.value > 0) return

        sendingCode.value = true
        const response = await sendVerificationCode({
          email: emailForm.email
        })

        if (response.code === 200) {
          ElMessage.success('验证码已发送至您的邮箱，请查收')
          startCountdown()
        } else {
          ElMessage.error(response.message || '发送验证码失败')
        }
      } finally {
        sendingCode.value = false
      }
    }

    // 开始倒计时
    const startCountdown = () => {
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

    // 跳转到忘记密码页面
    const goToForget = () => {
      router.push('/forget-password')
    }

    // 组件挂载时初始化
    onMounted(() => {
      cardAnimate.value = true
      initParticles()
    })

    // 组件卸载前清理
    onBeforeUnmount(() => {
      stopCamera()
      if (countdownTimer) {
        clearInterval(countdownTimer)
      }
    })

    return {
      activeTab,
      cardAnimate,
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
      faceForm,
      faceLoading,
      faceImage,
      videoRef,
      canvasRef,
      isCameraActive,
      User,
      Lock,
      Message,
      Key,
      toggleCamera,
      captureFace,
      handleFaceUpload,
      handleFaceLogin,
      handlePasswordLogin,
      handleEmailLogin,
      sendVerificationCodef,
      goToRegister,
      goToForget,
      bubbleStyle
    }
  }
}
</script>

<style scoped>
/* 基础样式 */
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* 粒子背景 */
.particles {
  --particle-color: #93c5fd;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

/* 登录卡片 */
.login-card {
  width: 100%;
  max-width: 480px;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(147, 197, 253, 0.2);
  padding: 40px;
  position: relative;
  z-index: 1;
  transform: translateY(20px);
  opacity: 0;
  transition: all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.card-animate {
  transform: translateY(0);
  opacity: 1;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
  animation: fadeInDown 0.8s;
}

.login-header h2 {
  color: #1e40af;
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 600;
}

.login-header p {
  color: #4b5563;
  font-size: 14px;
  margin: 0;
}

.login-tabs {
  margin-bottom: 20px;
  animation: fadeIn 0.8s 0.3s both;
}

.login-form {
  margin-bottom: 20px;
  animation: fadeIn 0.8s 0.4s both;
}

.login-form .el-form-item {
  margin-bottom: 24px;
}

.code-input {
  display: flex;
  gap: 10px;
}

.code-btn {
  width: 120px;
  transition: all 0.3s;
  color: #1e40af;
  border-color: #93c5fd;
}

.code-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(58, 12, 163, 0.2);
  background: rgba(147, 197, 253, 0.1);
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  background: linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%);
  box-shadow: 0 4px 12px rgba(147, 197, 253, 0.3);
  border: none;
}

.login-btn:hover {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
}

.login-btn:disabled {
  opacity: 0.7;
  transform: none !important;
  box-shadow: none !important;
}

.btn-wave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%, -50%);
  transform-origin: 50% 50%;
}

.login-btn:hover .btn-wave {
  animation: wave 0.5s linear;
}

.login-footer {
  text-align: center;
  color: #8d99ae;
  font-size: 14px;
  animation: fadeIn 0.8s 0.5s both;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.login-footer .el-link {
  font-size: 14px;
  color: #3b82f6;
}

.login-footer .el-link:hover {
  color: #1e40af;
}

/* 标签页激活颜色 */
:deep(.el-tabs__active-bar) {
  background-color: #93c5fd;
}

:deep(.el-tabs__item.is-active) {
  color: #1e40af;
}

:deep(.el-tabs__item:hover) {
  color: #60a5fa;
}

/* 输入框焦点样式 */
:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #93c5fd inset;
}

/* 人脸识别区域 */
.face-capture {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.face-video {
  border-radius: 8px;
  background: #000;
  border: 2px solid #e2e8f0;
  transition: all 0.3s;
}

.face-video.video-active {
  border-color: #93c5fd;
  box-shadow: 0 0 10px rgba(147, 197, 253, 0.3);
}

.face-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.face-preview {
  margin-top: 12px;
  text-align: center;
}

.face-preview img {
  border-radius: 8px;
  border: 2px solid #e2e8f0;
  max-width: 160px;
}

.face-tip {
  font-size: 12px;
  color: #8d99ae;
  margin-top: 4px;
}

/* 浮动气泡 */
.bubbles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
}

.bubbles span {
  position: absolute;
  bottom: -100px;
  background: rgba(191, 219, 254, 0.3);
  border-radius: 50%;
  pointer-events: none;
  animation: bubble-up linear infinite;
}

/* 动画定义 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bubble-up {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) rotate(360deg);
    opacity: 0;
  }
}

@keyframes wave {
  0% {
    transform: scale(1, 1) translate(-50%, -50%);
    opacity: 0.5;
  }
  100% {
    transform: scale(50, 50) translate(-50%, -50%);
    opacity: 0;
  }
}

/* 响应式设计 */
@media (max-width: 576px) {
  .login-card {
    padding: 30px 20px;
    max-width: 90%;
  }

  .login-header h2 {
    font-size: 24px;
  }

  .login-btn {
    height: 44px;
  }

  .face-video {
    width: 280px;
    height: 210px;
  }

  .face-actions {
    flex-direction: column;
    align-items: center;
  }

  .face-actions .el-button {
    width: 160px;
  }
}
</style>