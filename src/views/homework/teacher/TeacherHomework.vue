<template>
  <div class="homework-list">
    <div class="header">
      <h1>作业管理</h1>
      <div class="controls">
        <div class="user-info">
          <span class="user-label">教师:</span>
          <span class="user-name">{{ userName || '未登录' }}</span>
        </div>
        <button
            @click="$router.push('/homework/create')"
            class="create-btn"
        >
          <span class="icon">➕</span> 创建作业
        </button>
      </div>
    </div>

    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon">📝</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.totalHomework }}</div>
          <div class="stat-label">总作业数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.publishedHomework }}</div>
          <div class="stat-label">已发布</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.totalSubmissions }}</div>
          <div class="stat-label">提交总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⏰</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.pendingGrade }}</div>
          <div class="stat-label">待批改</div>
        </div>
      </div>
    </div>

    <div class="homework-tabs">
      <button
          :class="{ active: statusFilter === 'all' }"
          @click="filterByStatus('all')"
      >
        <span class="tab-icon">📋</span> 全部作业
      </button>
      <button
          :class="{ active: statusFilter === 'DRAFT' }"
          @click="filterByStatus('DRAFT')"
      >
        <span class="tab-icon">📝</span> 草稿
      </button>
      <button
          :class="{ active: statusFilter === 'PUBLISHED' }"
          @click="filterByStatus('PUBLISHED')"
      >
        <span class="tab-icon">📤</span> 已发布
      </button>
      <button
          :class="{ active: statusFilter === 'CLOSED' }"
          @click="filterByStatus('CLOSED')"
      >
        <span class="tab-icon">🔒</span> 已截止
      </button>
    </div>

    <div class="homework-grid">
      <div
          v-for="homework in filteredHomeworkList"
          :key="homework.id"
          class="homework-card"
          @click="viewHomework(homework.id)"
      >
        <div class="card-header">
          <h3>{{ homework.title }}</h3>
          <div class="card-actions" @click.stop>
            <button
                v-if="homework.status === 'DRAFT'"
                @click="publishHomework(homework.id)"
                class="action-btn publish-btn"
                title="发布作业"
            >
              📤
            </button>
            <button
                v-if="homework.status === 'PUBLISHED'"
                @click="closeHomework(homework.id)"
                class="action-btn close-btn"
                title="关闭作业"
            >
              🔒
            </button>
            <button
                @click="editHomework(homework.id)"
                class="action-btn edit-btn"
                title="编辑作业"
            >
              ✏️
            </button>
            <button
                @click="deleteHomework(homework.id)"
                class="action-btn delete-btn"
                title="删除作业"
            >
              🗑️
            </button>
          </div>
        </div>

        <div class="status-badge">
          <span :class="['status', homework.status.toLowerCase()]">
            {{ getStatusText(homework.status) }}
          </span>
        </div>

        <p class="course">
          <span class="icon">📚</span>
          {{ homework.courseTitle || '未指定课程' }}
        </p>

        <div class="divider"></div>

        <p class="description">{{ homework.description || '暂无描述' }}</p>

        <div class="homework-meta">
          <span class="type">{{ getTypeText(homework.homeworkType) }}</span>
          <span class="score">
            <span class="icon">🎯</span>
            {{ homework.totalScore }}分
          </span>
        </div>

        <div class="homework-time">
          <p>
            <span class="icon">🕒</span>
            <span class="time-label">开始:</span>
            {{ formatDate(homework.startTime) }}
          </p>
          <p>
            <span class="time-label">截止:</span>
            {{ formatDate(homework.endTime) }}
          </p>
        </div>

        <div class="homework-stats">
          <div class="stat-item">
            <span class="stat-number">{{ homework.submissionCount || 0 }}</span>
            <span class="stat-text">提交数</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ homework.gradedCount || 0 }}</span>
            <span class="stat-text">已批改</span>
          </div>
        </div>

        <div class="homework-actions" @click.stop>
          <button
              @click="manageSubmissions(homework.id)"
              class="manage-btn"
          >
            <span class="icon">📊</span>
            管理提交
          </button>
          <button
              v-if="homework.status === 'PUBLISHED'"
              @click="viewStatistics(homework.id)"
              class="stats-btn"
          >
            <span class="icon">📈</span>
            查看统计
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-if="!loading && filteredHomeworkList.length === 0" class="empty">
      <div class="empty-icon">📝</div>
      <p>{{ getEmptyMessage() }}</p>
      <button
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
  name: 'TeacherHomework',
  data() {
    return {
      homeworkList: [],
      loading: false,
      statusFilter: 'all',
      userName: '',
      stats: {
        totalHomework: 0,
        publishedHomework: 0,
        totalSubmissions: 0,
        pendingGrade: 0
      }
    };
  },
  computed: {
    filteredHomeworkList() {
      if (this.statusFilter === 'all') {
        return this.homeworkList;
      }
      return this.homeworkList.filter(homework => homework.status === this.statusFilter);
    }
  },
  mounted() {
    this.initUserInfo();
    this.loadHomework();
  },
  methods: {
    getToken() {
      return localStorage.getItem('token');
    },

    initUserInfo() {
      this.userName = localStorage.getItem('userName') || localStorage.getItem('username') || '教师';
    },

    checkAuth() {
      const token = this.getToken();
      if (!token) {
        this.$message.error('请先登录');
        this.$router.push('/login');
        return false;
      }
      return true;
    },

    filterByStatus(status) {
      this.statusFilter = status;
    },

    async loadHomework() {
      if (!this.checkAuth()) return;

      this.loading = true;
      this.homeworkList = [];

      try {
        const token = this.getToken();
        const response = await homeworkApi.getHomeworkByTeacher(token);

        if (response && response.data && response.data.success) {
          this.homeworkList = response.data.data || [];
          this.calculateStats();
        } else {
          throw new Error('数据格式错误');
        }
      } catch (error) {
        console.error('加载作业失败:', error);
        this.$message.error('加载作业失败，请稍后重试');

        if (error.response?.status === 401) {
          this.$message.error('登录已过期，请重新登录');
          this.$router.push('/login');
        }
      } finally {
        this.loading = false;
      }
    },

    calculateStats() {
      this.stats = {
        totalHomework: this.homeworkList.length,
        publishedHomework: this.homeworkList.filter(h => h.status === 'PUBLISHED').length,
        totalSubmissions: this.homeworkList.reduce((sum, h) => sum + (h.submissionCount || 0), 0),
        pendingGrade: this.homeworkList.reduce((sum, h) => sum + ((h.submissionCount || 0) - (h.gradedCount || 0)), 0)
      };
    },

    viewHomework(homeworkId) {
      this.$router.push(`/homework/${homeworkId}`);
    },

    editHomework(homeworkId) {
      this.$router.push(`/homework/${homeworkId}/edit`);
    },

    manageSubmissions(homeworkId) {
      this.$router.push(`/homework/${homeworkId}/submissions`);
    },

    viewStatistics(homeworkId) {
      this.$router.push(`/homework/${homeworkId}/statistics`);
    },

    async publishHomework(homeworkId) {
      try {
        await homeworkApi.publishHomework(homeworkId);
        this.$message.success('作业发布成功');
        this.loadHomework(); // 重新加载数据
      } catch (error) {
        console.error('发布作业失败:', error);
        this.$message.error('发布作业失败：' + (error.message || '请稍后重试'));
      }
    },

    async closeHomework(homeworkId) {
      try {
        await this.$confirm('确定要关闭这个作业吗？关闭后学生将无法继续提交。', '确认关闭', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });

        await homeworkApi.closeHomework(homeworkId);
        this.$message.success('作业关闭成功');
        this.loadHomework(); // 重新加载数据
      } catch (error) {
        if (error === 'cancel') return;
        console.error('关闭作业失败:', error);
        this.$message.error('关闭作业失败：' + (error.message || '请稍后重试'));
      }
    },

    async deleteHomework(homeworkId) {
      try {
        await this.$confirm('确定要删除这个作业吗？此操作不可恢复。', '确认删除', {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning'
        });

        const token = this.getToken();
        await homeworkApi.deleteHomework(homeworkId, token);
        this.$message.success('作业删除成功');
        this.loadHomework(); // 重新加载数据
      } catch (error) {
        if (error === 'cancel') return;
        console.error('删除作业失败:', error);
        this.$message.error('删除作业失败：' + (error.message || '请稍后重试'));
      }
    },

    getEmptyMessage() {
      const messages = {
        'all': '暂无作业',
        'DRAFT': '暂无草稿作业',
        'PUBLISHED': '暂无已发布的作业',
        'CLOSED': '暂无已截止的作业'
      };
      return messages[this.statusFilter] || '暂无数据';
    },

    getTypeText(type) {
      const types = {
        'SUBJECTIVE': '主观题',
        'OBJECTIVE': '客观题',
        'MIXED': '混合题'
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
/* 教师页面专用样式 */
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
  align-items: center;
  justify-content: space-between;
}

.header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  background: linear-gradient(90deg, #007bff, #00b4ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.controls {
  display: flex;
  gap: 16px;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 14px;
}

.user-label {
  color: #666;
}

.user-name {
  color: #333;
  font-weight: 500;
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

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.stat-icon {
  font-size: 24px;
  width: 48px;
  height: 48px;
  background: rgba(0,123,255,0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
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
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
}

.homework-tabs button.active {
  background: rgba(0,123,255,0.1);
  color: #007bff;
}

.homework-tabs button:hover {
  background: rgba(0,123,255,0.05);
}

.homework-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
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

.card-actions {
  display: flex;
  gap: 4px;
  margin-left: 8px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.publish-btn {
  background: rgba(40, 167, 69, 0.1);
  color: #28a745;
}

.close-btn {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

.edit-btn {
  background: rgba(255, 193, 7, 0.1);
  color: #ffc107;
}

.delete-btn {
  background: rgba(108, 117, 125, 0.1);
  color: #6c757d;
}

.action-btn:hover {
  transform: scale(1.1);
}

.status-badge {
  margin-bottom: 12px;
}

.status {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
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

.course {
  margin: 6px 0;
  color: #666;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
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
  gap: 4px;
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
  gap: 4px;
}

.time-label {
  margin: 0 6px;
  color: #888;
  width: 40px;
}

.homework-stats {
  display: flex;
  gap: 16px;
  margin: 16px 0;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-number {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.stat-text {
  font-size: 12px;
  color: #666;
}

.homework-actions {
  margin-top: auto;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.manage-btn, .stats-btn {
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

.manage-btn {
  background: linear-gradient(135deg, #6c757d, #5a6268);
  color: white;
}

.stats-btn {
  background: linear-gradient(135deg, #17a2b8, #138496);
  color: white;
}

.manage-btn:hover, .stats-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
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

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
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

.tab-icon, .icon {
  font-size: 14px;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .controls {
    width: 100%;
    justify-content: space-between;
  }

  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
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

  .homework-actions {
    flex-direction: column;
  }

  .card-actions {
    flex-wrap: wrap;
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

  .stats-cards {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 16px;
  }

  .homework-stats {
    flex-direction: column;
    gap: 8px;
  }

  .stat-item {
    flex-direction: row;
    justify-content: space-between;
  }
}
</style>