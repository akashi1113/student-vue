<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <div class="logo-circle">
          <svg viewBox="0 0 100 100" class="logo-svg">
            <path d="M50 10 L90 50 L50 90 L10 50 Z" fill="none" stroke="#3a86ff" stroke-width="8"/>
            <circle cx="50" cy="50" r="30" fill="#3a86ff" fill-opacity="0.2"/>
          </svg>
        </div>
        <h2>加入我们</h2>
        <p>智能化在线教学支持服务平台</p>
      </div>

      <el-form
          ref="registerFormRef"
          :model="registerForm"
          :rules="registerRules"
          class="register-form"
          @submit.prevent="handleRegister"
      >
        <el-form-item prop="username">
          <el-input
              v-model="registerForm.username"
              placeholder="请输入用户名"
              size="large"
              :prefix-icon="User"
              class="custom-input"
          />
        </el-form-item>

        <el-form-item prop="email">
          <el-input
              v-model="registerForm.email"
              placeholder="请输入邮箱"
              size="large"
              :prefix-icon="Message"
              class="custom-input"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              :prefix-icon="Lock"
              show-password
              class="custom-input"
          />
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="请确认密码"
              size="large"
              :prefix-icon="Lock"
              show-password
              class="custom-input"
              @keyup.enter="handleRegister"
          />
        </el-form-item>

        <el-form-item label="人脸照片" required>
          <div class="face-recognition-box">
            <video ref="videoRef" width="240" height="180" autoplay class="face-video"></video>
            <canvas ref="canvasRef" style="display:none;"></canvas>
            <div class="face-buttons">
              <el-button @click="openCamera" size="small" class="face-btn">打开摄像头</el-button>
              <el-button @click="takePhoto" size="small" class="face-btn">拍照</el-button>
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
              size="large"
              class="register-btn"
              :loading="loading"
              @click="handleRegister"
          >
            {{ loading ? '注册中...' : '立即注册' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="register-footer">
        <span>已有账号？</span>
        <el-link type="primary" @click="goToLogin" class="login-link">立即登录</el-link>
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
  import { ElMessage } from 'element-plus'
  import { User, Lock, Message } from '@element-plus/icons-vue'
  import { register } from '../api/userApi.js'
  
  export default {
    name: 'UserRegister',
    setup() {
      const router = useRouter()
      const registerFormRef = ref()
      const loading = ref(false)
      
      const registerForm = reactive({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      })
      
      const faceImage = ref('')
      const videoRef = ref(null)
      const canvasRef = ref(null)
      
      // 自定义验证规则
      const validateConfirmPassword = (rule, value, callback) => {
        if (value === '') {
          callback(new Error('请确认密码'))
        } else if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      }
      
      const registerRules = {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '用户名长度需在3到20字符之间', trigger: 'blur' }
        ],
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, max: 20, message: '密码长度需在6到20字符之间', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, validator: validateConfirmPassword, trigger: 'blur' }
        ]
      }
      
      const openCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true })
          videoRef.value.srcObject = stream
        } catch (e) {
          ElMessage.error('无法打开摄像头，请检查权限')
        }
      }
      const takePhoto = () => {
        const video = videoRef.value
        const canvas = canvasRef.value
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext('2d').drawImage(video, 0, 0)
        faceImage.value = canvas.toDataURL('image/jpeg').split(',')[1]
      }
      const handleUpload = (file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          faceImage.value = e.target.result.split(',')[1]
        }
        reader.readAsDataURL(file)
        return false
      }
      
      const handleRegister = async () => {
        try {
          const valid = await registerFormRef.value.validate()
          if (!valid || !faceImage.value) {
            ElMessage.warning('请完善所有信息并拍照/上传人脸照片')
            return
          }
          loading.value = true
          // 直接用对象传递参数，JSON格式
          const params = {
            username: registerForm.username,
            email: registerForm.email,
            password: registerForm.password,
            faceImage: faceImage.value
          }
          const response = await register(params)
          if (response.code === 200) {
            ElMessage.success('注册成功！请登录')
            router.push('/login')
          }
        } catch (error) {
          console.error('注册失败:', error)
        } finally {
          loading.value = false
        }
      }
      
      const goToLogin = () => {
        router.push('/login')
      }
      
      return {
        registerFormRef,
        registerForm,
        registerRules,
        loading,
        User,
        Lock,
        Message,
        handleRegister,
        goToLogin,
        faceImage,
        videoRef,
        canvasRef,
        openCamera,
        takePhoto,
        handleUpload
      }
    }
  }
  </script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.register-card {
  width: 100%;
  max-width: 450px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(58, 134, 255, 0.15);
  padding: 40px;
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;
  border: 1px solid rgba(58, 134, 255, 0.1);
}

.register-card:hover {
  box-shadow: 0 15px 50px rgba(58, 134, 255, 0.2);
}

.register-header {
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

.register-header h2 {
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 600;
  background: linear-gradient(90deg, #3a86ff, #4361ee);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.register-header p {
  color: #7f8c8d;
  font-size: 14px;
  margin: 0;
}

.register-form {
  margin-bottom: 20px;
}

.custom-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #e0e0e0;
  transition: all 0.3s ease;
}

.custom-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #3a86ff;
}

.custom-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #3a86ff;
}

.register-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  background: linear-gradient(90deg, #3a86ff, #4361ee);
  border: none;
  transition: all 0.3s ease;
}

.register-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(58, 134, 255, 0.4);
}

.register-footer {
  text-align: center;
  color: #95a5a6;
  font-size: 14px;
  margin-top: 20px;
}

.login-link {
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
  flex-wrap: wrap;
  justify-content: center;
}

.face-btn {
  border-radius: 6px;
}

.face-preview {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  max-width: 120px;
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
  .register-card {
    padding: 30px 20px;
  }

  .register-header h2 {
    font-size: 24px;
  }

  .decor-circle {
    display: none;
  }

  .face-buttons {
    flex-direction: column;
    align-items: center;
  }

  .face-btn {
    width: 100%;
  }
}
</style>