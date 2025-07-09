<template>
  <div class="exam-monitor" v-if="isEnabled">
    <div class="monitor-header">
      <h4>监考系统</h4>
      <div class="monitor-controls">
        <button @click="toggleMonitor" :class="['btn', isActive ? 'btn-danger' : 'btn-success']">
          {{ isActive ? '停止监考' : '开始监考' }}
        </button>
      </div>
    </div>

    <div class="video-container">
      <video ref="videoElement" autoplay muted playsinline></video>
      <canvas ref="canvasElement" style="display: none;"></canvas>

      <!-- 监考状态指示器 -->
      <div class="status-overlay">
        <div :class="['status-indicator', statusClass]"></div>
        <span class="status-text">{{ statusText }}</span>
      </div>
    </div>

    <!-- 监考统计信息 -->
    <div class="monitor-stats" v-if="showStats">
      <div class="stat-item">
        <span class="label">监考次数:</span>
        <span class="value">{{ stats.totalCount || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="label">异常次数:</span>
        <span class="value text-danger">{{ stats.abnormalCount || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="label">正常率:</span>
        <span class="value">{{ normalRate }}%</span>
      </div>
    </div>

    <!-- 监考警告 -->
    <div class="monitor-alerts" v-if="alerts.length > 0">
      <div v-for="alert in alerts" :key="alert.id" class="alert" :class="'alert-' + alert.type">
        <span class="alert-time">{{ formatTime(alert.timestamp) }}</span>
        <span class="alert-message">{{ alert.message }}</span>
        <button @click="dismissAlert(alert.id)" class="alert-close">×</button>
      </div>
    </div>
  </div>
</template>

<script>
import monitorApi from '@/api/monitor'

export default {
  name: 'ExamMonitor',
  props: {
    examId: {
      type: [Number, String],
      required: true
    },
    isEnabled: {
      type: Boolean,
      default: true
    },
    showStats: {
      type: Boolean,
      default: true
    },
    captureInterval: {
      type: Number,
      default: 5000
    },
    autoStart: {
      type: Boolean,
      default: true
    }
  },

  data() {
    return {
      stream: null,
      isActive: false,
      captureTimer: null,
      status: 'normal',
      alerts: [],
      stats: {
        totalCount: 0,
        abnormalCount: 0,
        normalCount: 0
      },
      retryCount: 0,
      maxRetries: 3,
      isInitialized: false
    }
  },

  computed: {
    statusClass() {
      return {
        'status-normal': this.status === 'normal',
        'status-warning': this.status === 'warning',
        'status-error': this.status === 'error'
      }
    },

    statusText() {
      const statusMap = {
        normal: '监考正常',
        warning: '监考警告',
        error: '监考异常'
      }
      return statusMap[this.status] || '未知状态'
    },

    normalRate() {
      if (this.stats.totalCount === 0) return 100
      return Math.round((this.stats.normalCount / this.stats.totalCount) * 100)
    }
  },

  watch: {
    isEnabled(newVal) {
      if (newVal && !this.isInitialized) {
        this.initCamera()
      } else if (!newVal && this.isActive) {
        this.stopMonitor()
      }
    }
  },

  mounted() {
    if (this.isEnabled) {
      this.initCamera()
    }
  },

  beforeUnmount() {
    this.cleanup()
  },

  methods: {
    async initCamera() {
      if (this.isInitialized) return

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('浏览器不支持摄像头访问')
        }

        this.stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          },
          audio: false
        })

        this.$refs.videoElement.srcObject = this.stream
        this.status = 'normal'
        this.retryCount = 0
        this.isInitialized = true

        await new Promise((resolve) => {
          this.$refs.videoElement.onloadedmetadata = resolve
        })

        this.loadMonitorStats()

        if (this.autoStart) {
          this.startMonitor()
        }

        this.$emit('camera-ready')

      } catch (error) {
        console.error('摄像头访问失败:', error)
        this.status = 'error'
        this.addAlert('摄像头访问失败: ' + error.message, 'error')
        this.$emit('camera-error', error)
      }
    },

    startMonitor() {
      if (!this.stream || this.isActive || !this.isInitialized) return

      this.isActive = true
      this.captureTimer = setInterval(() => {
        this.captureAndUpload()
      }, this.captureInterval)

      this.addAlert('监考已开始', 'info')
      this.$emit('monitor-started')
    },

    stopMonitor() {
      if (!this.isActive) return

      this.isActive = false
      if (this.captureTimer) {
        clearInterval(this.captureTimer)
        this.captureTimer = null
      }

      this.addAlert('监考已停止', 'info')
      this.$emit('monitor-stopped')
    },

    toggleMonitor() {
      if (this.isActive) {
        this.stopMonitor()
      } else {
        this.startMonitor()
      }
    },

    captureAndUpload() {
      if (!this.stream || !this.isActive || !this.isInitialized) return

      const canvas = this.$refs.canvasElement
      const video = this.$refs.videoElement

      if (!video.videoWidth || !video.videoHeight) {
        return
      }

      try {
        const ctx = canvas.getContext('2d')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        ctx.drawImage(video, 0, 0)

        canvas.toBlob((blob) => {
          if (blob) {
            this.uploadImage(blob)
          }
        }, 'image/jpeg', 0.8)
      } catch (error) {
        console.error('截图失败:', error)
        this.addAlert('截图失败', 'warning')
      }
    },

    async uploadImage(blob) {
      try {
        const formData = new FormData()
        formData.append('image', blob, 'monitor.jpg')
        formData.append('examId', this.examId)
        formData.append('timestamp', Date.now())

        const response = await monitorApi.uploadImage(formData)

        if (response.data.success) {
          this.status = 'normal'
          this.retryCount = 0
          this.loadMonitorStats()
          this.$emit('upload-success', response.data.data)
        } else {
          this.handleUploadError(response.data.message)
        }

      } catch (error) {
        console.error('上传监考图片失败:', error)
        this.handleUploadError('网络连接异常')
      }
    },

    handleUploadError(message) {
      this.retryCount++
      if (this.retryCount >= this.maxRetries) {
        this.status = 'error'
        this.addAlert('监考系统连接失败，已停止监考', 'error')
        this.stopMonitor()
        this.$emit('upload-error', message)
      } else {
        this.status = 'warning'
        this.addAlert(`上传失败，正在重试 (${this.retryCount}/${this.maxRetries})`, 'warning')
      }
    },

    async loadMonitorStats() {
      if (!this.examId) return

      try {
        const response = await monitorApi.getMonitorStatus(this.examId)
        console.log(response)
        if (response.data.success) {
          this.stats = response.data.data
          this.$emit('stats-updated', this.stats)
        }
      } catch (error) {
        console.error('加载监考统计失败:', error)
      }
    },

    addAlert(message, type = 'info') {
      const alert = {
        id: Date.now() + Math.random(),
        message: message,
        type: type,
        timestamp: new Date()
      }

      this.alerts.unshift(alert)

      if (this.alerts.length > 5) {
        this.alerts = this.alerts.slice(0, 5)
      }

      if (type !== 'error') {
        setTimeout(() => {
          this.dismissAlert(alert.id)
        }, 5000)
      }

      this.$emit('alert', alert)
    },

    dismissAlert(alertId) {
      this.alerts = this.alerts.filter(a => a.id !== alertId)
    },

    formatTime(date) {
      return date.toLocaleTimeString()
    },

    cleanup() {
      this.stopMonitor()
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop())
        this.stream = null
      }
      this.isInitialized = false
    },

    refreshStats() {
      this.loadMonitorStats()
    }
  }
}
</script>

<style scoped>
.exam-monitor {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 300px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
  font-size: 12px;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
}

.monitor-header h4 {
  margin: 0;
  font-size: 14px;
  color: #333;
}

.video-container {
  position: relative;
  width: 100%;
  height: 150px;
  background: #000;
}

video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-overlay {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  align-items: center;
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
}

.status-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 4px;
}

.status-normal {
  background-color: #52c41a;
}

.status-warning {
  background-color: #faad14;
}

.status-error {
  background-color: #f5222d;
}

.monitor-stats {
  padding: 8px;
  border-bottom: 1px solid #eee;
  background: #fafafa;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 10px;
}

.label {
  color: #666;
}

.value {
  font-weight: 600;
}

.text-danger {
  color: #f5222d;
}

.monitor-alerts {
  max-height: 100px;
  overflow-y: auto;
}

.alert {
  position: relative;
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border-bottom: 1px solid #eee;
  font-size: 10px;
}

.alert-info {
  background-color: #e6f7ff;
  color: #1890ff;
}

.alert-warning {
  background-color: #fff7e6;
  color: #fa8c16;
}

.alert-error {
  background-color: #fff1f0;
  color: #f5222d;
}

.alert-time {
  margin-right: 6px;
  opacity: 0.8;
}

.alert-message {
  flex: 1;
}

.alert-close {
  margin-left: 6px;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  opacity: 0.6;
}

.alert-close:hover {
  opacity: 1;
}

.btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
  font-weight: 500;
}

.btn-success {
  background-color: #52c41a;
  color: white;
}

.btn-danger {
  background-color: #f5222d;
  color: white;
}
</style>