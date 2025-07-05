<template>
  <div class="homework-list">
    <div class="header">
      <h1>作业管理</h1>
      <div class="controls">
        <select v-model="userRole" @change="onRoleChange" class="role-select">
          <option value="student">学生视图</option>
          <option value="teacher">教师视图</option>
        </select>
        <input
            v-model="userId"
            placeholder="用户ID"
            @change="loadHomework"
            class="user-input"
            type="number"
        />
        <button
            v-if="userRole === 'teacher'"
            @click="$router.push('/homework/create')"
            class="create-btn"
        >
          <span class="icon">+</span> 创建作业
        </button>
      </div>
    </div>

    <div class="homework-tabs" v-if="userRole === 'student'">
      <button
          :class="{ active: activeTab === 'available' }"
          @click="activeTab = 'available'; loadHomework()"
      >
        <span class="tab-icon">📚</span> 可用作业
      </button>
      <button
          :class="{ active: activeTab === 'all' }"
          @click="activeTab = 'all'; loadHomework()"
      >
        <span class="tab-icon">📋</span> 所有作业
      </button>
    </div>

    <div class="homework-grid">
      <div
          v-for="homework in homeworkList"
          :key="homework.id"
          class="homework-card"
          @click="viewHomework(homework.id)"
      >
        <div class="card-header">
          <h3>{{ homework.title }}</h3>
          <span :class="['status', homework.status.toLowerCase()]">
            {{ getStatusText(homework.status) }}
          </span>
        </div>

        <p class="course">
          <span class="icon">🏫</span> {{ homework.courseTitle }}
        </p>
        <p class="teacher">
          <span class="icon">👨‍🏫</span> {{ homework.teacherName }}
        </p>

        <div class="divider"></div>

        <p class="description">{{ homework.description || '暂无描述' }}</p>

        <div class="homework-meta">
          <span class="type">{{ getTypeText(homework.homeworkType) }}</span>
          <span class="score">
            <span class="icon">💯</span> {{ homework.totalScore }}分
          </span>
        </div>

        <div class="homework-time">
          <p>
            <span class="icon">⏱️</span>
            <span class="time-label">开始:</span>
            {{ formatDate(homework.startTime) }}
          </p>
          <p>
            <span class="icon">⏰</span>
            <span class="time-label">截止:</span>
            {{ formatDate(homework.endTime) }}
          </p>
        </div>

        <div class="homework-actions" @click.stop>
          <button
              v-if="userRole === 'student'"
              @click="submitHomework(homework.id)"
              class="submit-btn"
          >
            <span class="icon">📤</span> 提交作业
          </button>
          <button
              v-if="userRole === 'teacher'"
              @click="manageHomework(homework.id)"
              class="manage-btn"
          >
            <span class="icon">👀</span> 管理作业
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>
    <div v-if="!loading && homeworkList.length === 0" class="empty">
      <p>🎯 暂无作业数据</p>
      <button
          v-if="userRole === 'teacher'"
          @click="$router.push('/homework/create')"
          class="empty-create-btn"
      >
        创建第一个作业
      </button>
    </div>
  </div>
</template>

<script>
import homeworkApi from '@/api/homework';

export default {
  name: 'HomeworkList',
  data() {
    return {
      homeworkList: [],
      loading: false,
      userRole: 'student',
      userId: 2,
      activeTab: 'available'
    };
  },
  mounted() {
    this.loadHomework();
  },
  methods: {
    async loadHomework() {
      this.loading = true;
      this.homeworkList = [];

      try {
        let response;
        if (this.userRole === 'student') {
          if (this.activeTab === 'available') {
            response = await homeworkApi.getAvailableHomework(this.userId);
          } else {
            response = await homeworkApi.getHomeworkByStudent(this.userId);
          }
        } else {
          response = await homeworkApi.getHomeworkByTeacher(this.userId);
        }

        if (response.data.success) {
          this.homeworkList = response.data.data;
        }
      } catch (error) {
        console.error('加载作业失败:', error);
        this.$message.error('加载作业失败，请稍后重试');
      } finally {
        this.loading = false;
      }
    },

    onRoleChange() {
      this.userId = this.userRole === 'student' ? 2 : 5;
      this.loadHomework();
    },

    viewHomework(homeworkId) {
      this.$router.push(`/homework/${homeworkId}`);
    },

    submitHomework(homeworkId) {
      this.$router.push(`/homework/${homeworkId}/submit`);
    },

    manageHomework(homeworkId) {
      this.$router.push(`/homework/${homeworkId}/submissions`);
    },

    getTypeText(type) {
      const types = {
        'SUBJECTIVE': '📝 主观题',
        'OBJECTIVE': '🔘 客观题',
        'MIXED': '📚 混合题'
      };
      return types[type] || type;
    },

    getStatusText(status) {
      const statuses = {
        'DRAFT': '草稿',
        'PUBLISHED': '已发布',
        'CLOSED': '已截止'
      };
      return statuses[status] || status;
    },

    formatDate(dateString) {
      if (!dateString) return '未设置';
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit'});
    }
  }
};
</script>

<style scoped>
.homework-list {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px 20px;
  background: #f8f9fa;
  min-height: calc(100vh - 48px);
}

.header {
  background: white;
  padding: 20px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  margin-bottom: 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
}

.header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
  background: linear-gradient(90deg, #007bff, #00b4ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.controls {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.role-select, .user-input {
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  min-width: 140px;
  transition: all 0.3s;
  font-size: 14px;
}

.role-select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;
  padding-right: 32px;
}

.user-input {
  width: 100px;
}

.role-select:focus,
.user-input:focus {
  border-color: #007bff;
  outline: none;
  box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
}

.create-btn {
  padding: 10px 16px;
  background: linear-gradient(135deg, #007bff, #0062cc);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,123,255,0.2);
}

.create-btn:active {
  transform: scale(0.98);
}

.icon {
  margin-right: 4px;
}

.homework-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: white;
  padding: 8px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.homework-tabs button {
  padding: 10px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s;
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
}

.homework-tabs button.active {
  background: rgba(0,123,255,0.1);
  color: #007bff;
}

.homework-tabs button.active:after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 20%;
  width: 60%;
  height: 3px;
  background: #007bff;
  border-radius: 3px;
}

.homework-tabs button:hover {
  background: rgba(0,123,255,0.05);
}

.homework-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.homework-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  border: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.homework-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
  border-color: #e0e0e0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.card-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  flex: 1;
}

.status {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  margin-left: 8px;
  white-space: nowrap;
}

.status.draft {
  background: #fff8e1;
  color: #ff8f00;
}

.status.published {
  background: #e8f5e9;
  color: #2e7d32;
}

.status.closed {
  background: #ffebee;
  color: #c62828;
}

.course, .teacher {
  margin: 6px 0;
  color: #666;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.divider {
  height: 1px;
  background: #f0f0f0;
  margin: 12px 0;
}

.description {
  margin: 12px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  flex-grow: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.homework-meta {
  display: flex;
  gap: 8px;
  margin: 16px 0;
  flex-wrap: wrap;
}

.type, .score {
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.type {
  background: #e3f2fd;
  color: #1976d2;
}

.score {
  background: #f3e5f5;
  color: #7b1fa2;
}

.homework-time {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  margin: 16px 0;
  font-size: 13px;
}

.homework-time p {
  margin: 6px 0;
  display: flex;
  align-items: center;
}

.time-label {
  margin: 0 6px;
  color: #888;
  width: 40px;
}

.homework-actions {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
}

.submit-btn, .manage-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.submit-btn {
  background: linear-gradient(135deg, #28a745, #218838);
  color: white;
}

.manage-btn {
  background: linear-gradient(135deg, #6c757d, #5a6268);
  color: white;
}

.submit-btn:hover, .manage-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.submit-btn:active, .manage-btn:active {
  transform: scale(0.96);
}

.loading, .empty {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  margin-top: 20px;
  grid-column: 1 / -1;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 16px;
  border: 4px solid rgba(0,123,255,0.1);
  border-radius: 50%;
  border-top-color: #007bff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty p {
  font-size: 16px;
  color: #666;
  margin-bottom: 16px;
}

.empty-create-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #007bff, #0062cc);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.empty-create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,123,255,0.2);
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .controls {
    width: 100%;
  }

  .role-select, .user-input {
    width: 100%;
  }

  .homework-grid {
    grid-template-columns: 1fr;
  }

  .homework-tabs {
    overflow-x: auto;
    padding-bottom: 8px;
  }

  .homework-tabs button {
    white-space: nowrap;
  }
}

@media (max-width: 480px) {
  .homework-list {
    padding: 16px 12px;
  }

  .header {
    padding: 16px;
  }

  .homework-card {
    padding: 16px;
  }
}
</style>