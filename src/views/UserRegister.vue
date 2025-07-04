<template>
    <div class="register-container">
      <div class="register-card">
        <div class="register-header">
          <h2>注册</h2>
          <p>加入智能化在线教学支持服务平台</p>
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
            />
          </el-form-item>
          
          <el-form-item prop="email">
            <el-input
              v-model="registerForm.email"
              placeholder="请输入邮箱"
              size="large"
              :prefix-icon="Message"
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
              @keyup.enter="handleRegister"
            />
          </el-form-item>
          
          <el-form-item label="人脸照片" required>
            <video ref="videoRef" width="240" height="180" autoplay style="border-radius:8px;"></video>
            <canvas ref="canvasRef" style="display:none;"></canvas>
            <el-button @click="openCamera" size="small" style="margin:8px 8px 0 0;">打开摄像头</el-button>
            <el-button @click="takePhoto" size="small" style="margin:8px 8px 0 0;">拍照</el-button>
            <el-upload :show-file-list="false" :before-upload="handleUpload" accept="image/*">
              <el-button size="small">上传照片</el-button>
            </el-upload>
            <img v-if="faceImage" :src="'data:image/jpeg;base64,'+faceImage" width="120" style="margin-top:8px;" />
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="register-btn"
              :loading="loading"
              @click="handleRegister"
            >
              {{ loading ? '注册中...' : '注册' }}
            </el-button>
          </el-form-item>
        </el-form>
        
        <div class="register-footer">
          <span>已有账号？</span>
          <el-link type="primary" @click="goToLogin">立即登录</el-link>
        </div>
      </div>
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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
  }
  
  .register-card {
    width: 100%;
    max-width: 400px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    padding: 40px;
  }
  
  .register-header {
    text-align: center;
    margin-bottom: 30px;
  }
  
  .register-header h2 {
    color: #333;
    margin-bottom: 8px;
    font-size: 28px;
    font-weight: 600;
  }
  
  .register-header p {
    color: #666;
    font-size: 14px;
    margin: 0;
  }
  
  .register-form {
    margin-bottom: 20px;
  }
  
  .register-form .el-form-item {
    margin-bottom: 20px;
  }
  
  .register-btn {
    width: 100%;
    height: 44px;
    font-size: 16px;
    font-weight: 500;
  }
  
  .register-footer {
    text-align: center;
    color: #666;
    font-size: 14px;
  }
  
  .register-footer .el-link {
    font-size: 14px;
    margin-left: 4px;
  }
  
  /* 响应式设计 */
  @media (max-width: 480px) {
    .register-card {
      padding: 30px 20px;
    }
    
    .register-header h2 {
      font-size: 24px;
    }
  }
  </style>