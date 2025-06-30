<template>
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h2>登录</h2>
          <p>智能化在线教学支持服务平台</p>
        </div>
        
        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              size="large"
              :prefix-icon="User"
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              :prefix-icon="Lock"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="login-btn"
              :loading="loading"
              @click="handleLogin"
            >
              {{ loading ? '登录中...' : '登录' }}
            </el-button>
          </el-form-item>
        </el-form>
        
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
  import { ElMessage } from 'element-plus'
  import { User, Lock } from '@element-plus/icons-vue'
  import { login } from '../api/userApi.js'
  
  export default {
    name: 'UserLogin',
    setup() {
      const router = useRouter()
      const loginFormRef = ref()
      const loading = ref(false)
      
      const loginForm = reactive({
        username: '',
        password: ''
      })
      
      const loginRules = {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '用户名长度需在3到20字符之间', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, max: 20, message: '密码长度需在6到20字符之间', trigger: 'blur' }
        ]
      }
      
      const handleLogin = async () => {
        try {
          const valid = await loginFormRef.value.validate()
          if (!valid) return
          
          loading.value = true
          
          const response = await login(loginForm.username, loginForm.password)
          
          if (response.code === 200) {
            ElMessage.success('登录成功！')
            
            // 存储用户信息到localStorage
            localStorage.setItem('userInfo', JSON.stringify(response.data))
            
            // 跳转到主页或用户期望的页面
            const redirect = router.currentRoute.value.query.redirect || '/'
            router.push(redirect)
          }
        } catch (error) {
          console.error('登录失败:', error)
          // 错误信息已在request.js中处理
        } finally {
          loading.value = false
        }
      }
      
      const goToRegister = () => {
        router.push('/register')
      }
      
      return {
        loginFormRef,
        loginForm,
        loginRules,
        loading,
        User,
        Lock,
        handleLogin,
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
    max-width: 400px;
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
  
  .login-form {
    margin-bottom: 20px;
  }
  
  .login-form .el-form-item {
    margin-bottom: 20px;
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
  
  /* 响应式设计 */
  @media (max-width: 480px) {
    .login-card {
      padding: 30px 20px;
    }
    
    .login-header h2 {
      font-size: 24px;
    }
  }
  </style>