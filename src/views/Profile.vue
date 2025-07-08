<template>
  <div class="profile-container">
    <div class="background-decoration">
      <div class="floating-circle circle-1"></div>
      <div class="floating-circle circle-2"></div>
      <div class="floating-circle circle-3"></div>
    </div>
    
    <el-card class="profile-card">
      <div class="card-glow"></div>
      
      <div class="profile-header">
        <div class="avatar-container">
          <div class="avatar-ring"></div>
          <el-avatar :size="100" :src="user.avatar" class="profile-avatar">
            <span class="avatar-fallback">{{ user.username?.charAt(0) || 'U' }}</span>
          </el-avatar>
          <div class="status-indicator"></div>
        </div>
        
        <div class="profile-info">
          <h2 class="username">{{ user.username || '用户名' }}</h2>
          <div class="role-badge">
            <span class="role-icon">✨</span>
            <span class="role-text">{{ user.roleDesc || '普通用户' }}</span>
          </div>
        </div>
      </div>

      <div class="profile-details">
        <div class="detail-item" v-for="(item, index) in profileDetails" :key="index">
          <div class="detail-icon">
            <i :class="item.icon"></i>
          </div>
          <div class="detail-content">
            <span class="detail-label">{{ item.label }}</span>
            <span class="detail-value">{{ item.value }}</span>
          </div>
        </div>
      </div>

      <div class="profile-actions">
        <el-button class="action-btn primary" @click="logout">
          <i class="el-icon-switch-button"></i>
          退出登录
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref(JSON.parse(localStorage.getItem('userInfo'))?.user || {})

const profileDetails = computed(() => [
  {
    label: '邮箱地址',
    value: user.value.email || 'user@example.com',
    icon: 'el-icon-message'
  },
  {
    label: '账户状态',
    value: user.value.statusDesc || '正常',
    icon: 'el-icon-circle-check'
  },
  {
    label: '注册时间',
    value: user.value.createTime || '2024-01-01',
    icon: 'el-icon-calendar'
  }
])

const editProfile = () => {
  // 编辑资料逻辑
  console.log('编辑资料')
}

const logout = () => {
  localStorage.clear()
  router.push('/login')
}
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  padding: 40px 20px;
  position: relative;
  overflow: hidden;
}

.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.floating-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 200px;
  height: 200px;
  top: 10%;
  left: -5%;
  animation-delay: 0s;
}

.circle-2 {
  width: 300px;
  height: 300px;
  top: 60%;
  right: -10%;
  animation-delay: 2s;
}

.circle-3 {
  width: 150px;
  height: 150px;
  top: 30%;
  right: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-20px) rotate(120deg); }
  66% { transform: translateY(10px) rotate(240deg); }
}

.profile-card {
  max-width: 500px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 10px 20px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  padding: 40px 32px;
  transition: all 0.3s ease;
  overflow: hidden;
}

.profile-card:hover {
  transform: translateY(-5px);
  box-shadow: 
    0 30px 60px rgba(0, 0, 0, 0.15),
    0 15px 30px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.card-glow {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #1e40af, #2563eb, #1d4ed8, #1e3a8a);
  border-radius: 26px;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
  animation: rotate 4s linear infinite;
}

.profile-card:hover .card-glow {
  opacity: 0.3;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.profile-header {
  display: flex;
  align-items: center;
  margin-bottom: 40px;
  gap: 24px;
}

.avatar-container {
  position: relative;
  flex-shrink: 0;
}

.avatar-ring {
  position: absolute;
  top: -8px;
  left: -8px;
  right: -8px;
  bottom: -8px;
  border-radius: 50%;
  background: linear-gradient(45deg, #1e40af, #2563eb);
  opacity: 0.6;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.05); opacity: 0.8; }
}

.profile-avatar {
  position: relative;
  z-index: 1;
  transition: transform 0.3s ease;
  border: 4px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.profile-avatar:hover {
  transform: scale(1.05);
}

.avatar-fallback {
  font-size: 36px;
  font-weight: bold;
  color: #1e40af;
}

.status-indicator {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 16px;
  height: 16px;
  background: #52c41a;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.username {
  margin: 0 0 12px 0;
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
  transition: transform 0.2s ease;
}

.role-badge:hover {
  transform: translateY(-2px);
}

.role-icon {
  font-size: 16px;
}

.profile-details {
  margin-bottom: 40px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item:hover {
  background: rgba(30, 64, 175, 0.05);
  margin: 0 -16px;
  padding: 16px;
  border-radius: 12px;
}

.detail-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  flex-shrink: 0;
}

.detail-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: #8c8c8c;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 16px;
  color: #262626;
  font-weight: 600;
}

.profile-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.action-btn {
  padding: 12px 24px;
  border-radius: 16px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  border: none;
  position: relative;
  overflow: hidden;
  min-width: 120px;
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.action-btn:hover::before {
  left: 100%;
}

.action-btn.secondary {
  background: rgba(30, 64, 175, 0.1);
  color: #1e40af;
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.15);
}

.action-btn.secondary:hover {
  background: rgba(30, 64, 175, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(30, 64, 175, 0.25);
}

.action-btn.primary {
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3);
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(30, 58, 138, 0.4);
}

.action-btn i {
  margin-right: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-container {
    padding: 20px 16px;
  }
  
  .profile-card {
    padding: 32px 24px;
  }
  
  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  
  .username {
    font-size: 28px;
  }
  
  .profile-actions {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .profile-card {
    background: rgba(26, 26, 26, 0.95);
    color: #ffffff;
  }
  
  .detail-value {
    color: #ffffff;
  }
  
  .detail-label {
    color: #a0a0a0;
  }
  
  .detail-item:hover {
    background: rgba(30, 64, 175, 0.1);
  }
}
</style>