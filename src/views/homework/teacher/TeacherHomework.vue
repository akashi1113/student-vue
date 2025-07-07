<template>
  <div class="homework-list">
    <div class="header">
      <h1>作业管理</h1>
      <div class="controls">
        <div class="user-info">
          <span class="user-name">{{ userName || '未登录' }}</span>
        </div>
        <button
            @click="$router.push('/homework/create')"
            class="create-btn"
        >
          创建作业
        </button>
      </div>
    </div>

    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon total-icon"></div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.totalHomework }}</div>
          <div class="stat-label">总作业数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon published-icon"></div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.publishedHomework }}</div>
          <div class="stat-label">已发布</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon submissions-icon"></div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.totalSubmissions }}</div>
          <div class="stat-label">提交总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon pending-icon"></div>
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
        全部作业
      </button>
      <button
          :class="{ active: statusFilter === 'DRAFT' }"
          @click="filterByStatus('DRAFT')"
      >
        草稿
      </button>
      <button
          :class="{ active: statusFilter === 'PUBLISHED' }"
          @click="filterByStatus('PUBLISHED')"
      >
        已发布
      </button>
      <button
          :class="{ active: statusFilter === 'CLOSED' }"
          @click="filterByStatus('CLOSED')"
      >
        已截止
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
              <i class="icon-publish"></i>
            </button>
            <button
                v-if="homework.status === 'PUBLISHED'"
                @click="closeHomework(homework.id)"
                class="action-btn close-btn"
                title="关闭作业"
            >
              <i class="icon-close"></i>
            </button>
            <button
                @click="deleteHomework(homework.id)"
                class="action-btn delete-btn"
                title="删除作业"
            >
              <i class="icon-delete"></i>
            </button>
          </div>
        </div>

        <div class="status-badge">
          <span :class="['status', homework.status.toLowerCase()]">
            {{ getStatusText(homework.status) }}
          </span>
        </div>

        <p class="course">
          {{ homework.courseTitle || '未指定课程' }}
        </p>

        <div class="divider"></div>

        <p class="description">{{ homework.description || '暂无描述' }}</p>

        <div class="homework-meta">
          <span class="type">{{ getTypeText(homework.homeworkType) }}</span>
          <span class="score">
            总分: {{ homework.totalScore }}分
          </span>
        </div>

        <div class="homework-time">
          <div class="time-item">
            <span class="time-label">开始时间:</span>
            {{ formatDate(homework.startTime) }}
          </div>
          <div class="time-item">
            <span class="time-label">截止时间:</span>
            {{ formatDate(homework.endTime) }}
          </div>
        </div>

        <div class="homework-stats">
          <div class="stat-item" @click.stop="manageSubmissions(homework.id)">
            <span class="stat-number">{{ homework.submissionCount || 0 }}</span>
            <span class="stat-text">提交数</span>
          </div>
          <div class="stat-item" v-if="homework.avgScore !== undefined">
            <span class="stat-number">{{ homework.avgScore.toFixed(1) }}</span>
            <span class="stat-text">平均分</span>
          </div>
          <div class="stat-item" @click.stop="viewGradedSubmissions(homework.id)">
            <span class="stat-number">{{ homework.gradedCount || 0 }}</span>
            <span class="stat-text">已批改</span>
          </div>
        </div>

        <div class="homework-actions" @click.stop>
          <button
              @click="manageSubmissions(homework.id)"
              class="manage-btn"
          >
            管理提交
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-if="!loading && filteredHomeworkList.length === 0" class="empty">
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

          // 为每个作业加载统计信息
          await this.loadHomeworkStatistics();
          this.calculateStats();
        } else {
          throw new Error('数据格式错误');
        }
      } catch (error) {
        console.error('加载作业失败:', error);
        this.$message.error('加载作业失败，请稍后重试');
      } finally {
        this.loading = false;
      }
    },

    // 加载作业统计信息
    async loadHomeworkStatistics() {
      const promises = this.homeworkList.map(async homework => {
        try {
          const response = await homeworkApi.getHomeworkStatistics(homework.id);
          if (response.data && response.data.success) {
            const stats = response.data.data;
            homework.submissionCount = stats.submitted_count || 0;
            homework.avgScore = stats.avg_score || 0;
            homework.gradedCount = stats.graded_count || 0;
          }
        } catch (error) {
          console.error(`获取作业 ${homework.id} 统计信息失败:`, error);
          homework.submissionCount = 0;
          homework.avgScore = 0;
          homework.gradedCount = 0;
        }
        return homework;
      });

      await Promise.all(promises);
    },

    calculateStats() {
      this.stats = {
        totalHomework: this.homeworkList.length,
        publishedHomework: this.homeworkList.filter(h => h.status === 'PUBLISHED').length,
        totalSubmissions: this.homeworkList.reduce((sum, h) => sum + (h.submissionCount || 0), 0),
        pendingGrade: this.homeworkList.reduce((sum, h) => sum + ((h.submissionCount || 0) - (h.gradedCount || 0)), 0)
      };
    },

    // 查看已批改的作业
    viewGradedSubmissions(homeworkId) {
      this.$router.push({
        path: `/homework/${homeworkId}/submissions`,
        query: { status: 'GRADED' }
      });
    },

    // 管理所有提交
    manageSubmissions(homeworkId) {
      this.$router.push({
        path: `/homework/${homeworkId}/submissions`,
        query: { status: 'ALL' }
      });
    },

    viewHomework(homeworkId) {
      this.$router.push(`/homework/${homeworkId}`);
    },

    editHomework(homeworkId) {
      this.$router.push(`/homework/${homeworkId}/edit`);
    },

    viewStatistics(homeworkId) {
      this.$router.push(`/homework/${homeworkId}/statistics`);
    },

    async publishHomework(homeworkId) {
      try {
        await homeworkApi.publishHomework(homeworkId);
        this.$message.success('作业发布成功');
        this.loadHomework();
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
        this.loadHomework();
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
        this.loadHomework();
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
.homework-list {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px 20px;
  background: #f8fafc;
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
  border-left: 4px solid #3b82f6;
}

.header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1e3a8a;
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
  background: #f0f7ff;
  border-radius: 8px;
  font-size: 14px;
  color: #1e40af;
}

.create-btn {
  padding: 10px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.create-btn:hover {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
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
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: 24px;
  background-position: center;
  background-repeat: no-repeat;
}

.total-icon {
  background-color: #e0f2fe;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%230369a1'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'%3E%3C/path%3E%3C/svg%3E");
}

.published-icon {
  background-color: #dbeafe;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%231d4ed8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'%3E%3C/path%3E%3C/svg%3E");
}

.submissions-icon {
  background-color: #dcfce7;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23166534'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'%3E%3C/path%3E%3C/svg%3E");
}

.pending-icon {
  background-color: #fef3c7;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23b45309'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'%3E%3C/path%3E%3C/svg%3E");
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #1e3a8a;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #475569;
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
  color: #64748b;
}

.homework-tabs button.active {
  background: #3b82f6;
  color: white;
}

.homework-tabs button:hover {
  background: #e0e7ff;
  color: #1e40af;
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
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.homework-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.1);
  border-color: #bfdbfe;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.card-header h3 {
  margin: 0;
  color: #1e3a8a;
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
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8fafc;
}

.action-btn i {
  display: inline-block;
  width: 16px;
  height: 16px;
  background-size: contain;
  background-repeat: no-repeat;
}

.icon-publish {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2328a745'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'%3E%3C/path%3E%3C/svg%3E");
}

.icon-close {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23dc3545'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 18L18 6M6 6l12 12'%3E%3C/path%3E%3C/svg%3E");
}

.icon-edit {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23f59e0b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'%3E%3C/path%3E%3C/svg%3E");
}

.icon-delete {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236c757d'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'%3E%3C/path%3E%3C/svg%3E");
}

.publish-btn:hover {
  background-color: rgba(40, 167, 69, 0.1);
}

.close-btn:hover {
  background-color: rgba(220, 53, 69, 0.1);
}

.edit-btn:hover {
  background-color: rgba(245, 158, 11, 0.1);
}

.delete-btn:hover {
  background-color: rgba(108, 117, 125, 0.1);
}

.action-btn:hover {
  transform: scale(1.1);
}

.status-badge {
  margin-bottom: 12px;
}

.status {
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.status.draft {
  background: #e0f2fe;
  color: #0369a1;
}

.status.published {
  background: #dbeafe;
  color: #1d4ed8;
}

.status.closed {
  background: #fee2e2;
  color: #b91c1c;
}

.course {
  margin: 6px 0;
  color: #475569;
  font-size: 14px;
}

.divider {
  height: 1px;
  background: #f1f5f9;
  margin: 12px 0;
}

.description {
  margin: 12px 0;
  color: #475569;
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
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
}

.type {
  background: #e0f2fe;
  color: #0369a1;
}

.score {
  background: #dbeafe;
  color: #1d4ed8;
}

.homework-time {
  background: #f8fafc;
  padding: 12px;
  border-radius: 8px;
  margin: 16px 0;
  font-size: 13px;
}

.time-item {
  margin: 6px 0;
  color: #475569;
}

.time-label {
  color: #64748b;
  margin-right: 8px;
}

.homework-stats {
  display: flex;
  gap: 16px;
  margin: 16px 0;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.stat-number {
  font-size: 18px;
  font-weight: 600;
  color: #1e3a8a;
}

.stat-text {
  font-size: 12px;
  color: #64748b;
}

.homework-actions {
  margin-top: auto;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.manage-btn, .stats-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.manage-btn {
  background: #3b82f6;
  color: white;
}

.stats-btn {
  background: #60a5fa;
  color: white;
}

.manage-btn:hover {
  background: #2563eb;
}

.stats-btn:hover {
  background: #3b82f6;
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
  border: 4px solid rgba(59, 130, 246, 0.1);
  border-radius: 50%;
  border-top-color: #3b82f6;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty p {
  font-size: 16px;
  color: #64748b;
  margin-bottom: 16px;
}

.empty-create-btn {
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.empty-create-btn:hover {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
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

.homework-stats .stat-item {
  cursor: pointer;
  transition: all 0.2s;
  padding: 8px;
  border-radius: 8px;
}

.homework-stats .stat-item:hover {
  background-color: #f0f7ff;
  transform: translateY(-2px);
}

.homework-stats .stat-item:active {
  transform: translateY(0);
}
</style>