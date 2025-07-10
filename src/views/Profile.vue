<template>
  <div class="profile-container">
    <div class="background-decoration">
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
      <div class="floating-shape shape-3"></div>
      <div class="particles"></div>
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
import { ref, computed, onMounted } from 'vue'
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

const logout = () => {
  localStorage.clear()
  router.push('/login')
}

// 粒子效果
onMounted(() => {
  if (typeof window !== 'undefined') {
    const particles = document.querySelector('.particles')
    if (particles) {
      for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div')
        particle.className = 'particle'
        particle.style.left = `${Math.random() * 100}%`
        particle.style.top = `${Math.random() * 100}%`
        particle.style.width = `${Math.random() * 5 + 2}px`
        particle.style.height = particle.style.width
        particle.style.animationDelay = `${Math.random() * 5}s`
        particles.appendChild(particle)
      }
    }
  }
})
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #e6f0ff 0%, #c9e1ff 100%);
  padding: 40px 20px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
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

.floating-shape {
  position: absolute;
  background: rgba(37, 99, 235, 0.08);
  backdrop-filter: blur(10px);
  animation: float 15s ease-in-out infinite;
  border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
}

.shape-1 {
  width: 300px;
  height: 300px;
  top: 10%;
  left: -5%;
  animation-delay: 0s;
  background: rgba(37, 99, 235, 0.1);
}

.shape-2 {
  width: 400px;
  height: 400px;
  top: 60%;
  right: -10%;
  animation-delay: 5s;
  background: rgba(30, 64, 175, 0.05);
}

.shape-3 {
  width: 200px;
  height: 200px;
  top: 30%;
  right: 20%;
  animation-delay: 10s;
  background: rgba(37, 99, 235, 0.07);
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(20px, 20px) rotate(5deg); }
  50% { transform: translate(0, 20px) rotate(0deg); }
  75% { transform: translate(20px, 0) rotate(-5deg); }
}

.particles {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.particle {
  position: absolute;
  background: rgba(37, 99, 235, 0.4);
  border-radius: 50%;
  animation: particle-float 15s linear infinite;
  opacity: 0.6;
}

@keyframes particle-float {
  0% { transform: translateY(0) translateX(0); opacity: 0.6; }
  50% { transform: translateY(-100px) translateX(20px); opacity: 0.8; }
  100% { transform: translateY(-200px) translateX(0); opacity: 0; }
}

.profile-card {
  max-width: 500px;
  width: 100%;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow:
      0 20px 40px rgba(0, 0, 0, 0.05),
      0 10px 20px rgba(0, 0, 0, 0.02),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
  padding: 40px 32px;
  transition: all 0.3s ease;
  overflow: hidden;
}

.profile-card:hover {
  transform: translateY(-5px);
  box-shadow:
      0 30px 60px rgba(0, 0, 0, 0.08),
      0 15px 30px rgba(0, 0, 0, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.card-glow {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #3b82f6, #60a5fa, #93c5fd, #bfdbfe);
  border-radius: 26px;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
  animation: rotate 8s linear infinite;
}

.profile-card:hover .card-glow {
  opacity: 0.2;
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
  background: linear-gradient(45deg, #3b82f6, #60a5fa);
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
  border: 4px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
  background: linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%);
}

.profile-avatar:hover {
  transform: scale(1.05);
}

.avatar-fallback {
  font-size: 36px;
  font-weight: bold;
  color: #3b82f6;
}

.status-indicator {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 16px;
  height: 16px;
  background: #10b981;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.username {
  margin: 0 0 12px 0;
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
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
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item:hover {
  background: rgba(59, 130, 246, 0.05);
  margin: 0 -16px;
  padding: 16px;
  border-radius: 12px;
}

.detail-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
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
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 16px;
  color: #1f2937;
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

.action-btn.primary {
  background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
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
  .profile-container {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  }

  .profile-card {
    background: rgba(15, 23, 42, 0.95);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .detail-value {
    color: #ffffff;
  }

  .detail-label {
    color: #94a3b8;
  }

  .detail-item:hover {
    background: rgba(59, 130, 246, 0.1);
  }

  .floating-shape {
    background: rgba(59, 130, 246, 0.05);
  }

  .particle {
    background: rgba(59, 130, 246, 0.3);
  }
}
</style>