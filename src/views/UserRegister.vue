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
      
      const handleRegister = async () => {
        try {
          const valid = await registerFormRef.value.validate()
          if (!valid) return
          
          loading.value = true
          
          // 构造注册数据
          const userData = {
            username: registerForm.username,
            email: registerForm.email,
            password: registerForm.password
          }
          
          const response = await register(userData)
          
          if (response.code === 200) {
            ElMessage.success('注册成功！请登录')
            // 跳转到登录页面
            router.push('/login')
          }
        } catch (error) {
          console.error('注册失败:', error)
          // 错误信息已在request.js中处理
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
        goToLogin
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