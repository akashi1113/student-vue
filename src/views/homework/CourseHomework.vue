<!-- views/homework/CourseHomework.vue -->
<template>
  <div class="course-homework">
    <div class="header">
      <button @click="$router.go(-1)" class="back-btn">← 返回</button>
      <div class="course-info">
        <h1>{{ courseTitle }} - 作业列表</h1>
        <p v-if="courseDescription">{{ courseDescription }}</p>
      </div>
      <div class="actions" v-if="isTeacher">
        <button @click="createHomework" class="create-btn">创建作业</button>
        <button @click="viewStatistics" class="stats-btn">查看统计</button>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="content">
      <div class="homework-list">
        <div
            v-for="homework in homeworkList"
            :key="homework.id"
            class="homework-item">
          <div class="homework-header">
            <h3>{{ homework.title }}</h3>
            <div class="homework-status">
              <span :class="['status', homework.status.toLowerCase()]">
                {{ getStatusText(homework.status) }}
              </span>
              <span class="type">{{ getTypeText(homework.homeworkType) }}</span>
            </div>
          </div>

          <div class="homework-info">
            <p class="description">{{ homework.description || '暂无描述' }}</p>

            <div class="homework-meta">
              <div class="meta-item">
                <span class="label">总分:</span>
                <span class="value">{{ homework.totalScore }}</span>
              </div>
              <div class="meta-item">
                <span class="label">开始时间:</span>
                <span class="value">{{ formatDate(homework.startTime) }}</span>
              </div>
              <div class="meta-item">
                <span class="label">截止时间:</span>
                <span class="value">{{ formatDate(homework.endTime) }}</span>
              </div>
              <div class="meta-item" v-if="homework.allowResubmit">
                <span class="label">可重提:</span>
                <span class="value">{{ homework.maxSubmitTimes }}次</span>
              </div>
            </div>
          </div>

          <div class="homework-actions">
            <button @click="viewHomework(homework.id)" class="view-btn">
              查看详情
            </button>

            <template v-if="isTeacher">
              <button @click="editHomework(homework.id)" class="edit-btn">
                编辑
              </button>
              <button @click="viewSubmissions(homework.id)" class="submissions-btn">
                提交记录
              </button>
              <button
                  v-if="homework.status === 'DRAFT'"
                  @click="publishHomework(homework.id)"
                  class="publish-btn">
                发布
              </button>
            </template>

            <template v-else>
              <button
                  @click="submitHomework(homework.id)"
                  :disabled="!canSubmit(homework)"
                  class="submit-btn">
                {{ getSubmitButtonText(homework) }}
              </button>
            </template>
          </div>
        </div>
      </div>

      <div v-if="homeworkList.length === 0" class="empty">
        {{ isTeacher ? '暂无作业，点击"创建作业"开始' : '该课程暂无作业' }}
      </div>
    </div>
  </div>
</template>

<script>
import homeworkApi from '@/api/homework';

export default {
  name: 'CourseHomework',
  props: ['courseId'],
  data() {
    return {
      homeworkList: [],
      courseTitle: '',
      courseDescription: '',
      loading: false,
      isTeacher: false,
      userId: 2 // 默认学生ID，实际应该从用户状态获取
    };
  },
  async mounted() {
    await this.loadHomework();
    await this.loadCourseInfo();
  },
  methods: {
    async loadHomework() {
      this.loading = true;
      try {
        const response = await homeworkApi.getHomeworkByCourse(this.courseId);
        if (response.data.success) {
          this.homeworkList = response.data.data;

          // 简单判断是否为教师（检查第一个作业的教师ID）
          if (this.homeworkList.length > 0) {
            this.isTeacher = this.userId === this.homeworkList[0].teacherId;
          }
        }
      } catch (error) {
        console.error('加载作业失败:', error);
        alert('加载作业失败');
      } finally {
        this.loading = false;
      }
    },
    async loadCourseInfo() {
      // 这里应该调用课程API获取课程信息
      // 暂时从作业信息中获取
      if (this.homeworkList.length > 0) {
        this.courseTitle = this.homeworkList[0].courseTitle;
      } else {
        this.courseTitle = '课程作业';
      }
    },
    createHomework() {
      this.$router.push(`/homework/create?courseId=${this.courseId}`);
    },
    viewStatistics() {
      // 跳转到课程统计页面
      alert('课程统计功能待实现');
    },
    viewHomework(homeworkId) {
      this.$router.push(`/homework/${homeworkId}`);
    },
    editHomework(homeworkId) {
      this.$router.push(`/homework/${homeworkId}/edit`);
    },
    viewSubmissions(homeworkId) {
      this.$router.push(`/homework/${homeworkId}/submissions`);
    },
    async publishHomework(homeworkId) {
      try {
        const response = await homeworkApi.publishHomework(homeworkId);
        if (response.data.success) {
          alert('作业发布成功');
          await this.loadHomework();
        }
      } catch (error) {
        console.error('发布作业失败:', error);
        alert('发布作业失败');
      }
    },
    submitHomework(homeworkId) {
      this.$router.push(`/homework/${homeworkId}/submit`);
    },
    canSubmit(homework) {
      if (homework.status !== 'PUBLISHED') return false;

      const now = new Date();
      const endTime = new Date(homework.endTime);
      return now <= endTime;
    },
    getSubmitButtonText(homework) {
      if (homework.status !== 'PUBLISHED') {
        return '未发布';
      }

      const now = new Date();
      const endTime = new Date(homework.endTime);

      if (now > endTime) {
        return '已截止';
      }

      return '开始作业';
    },
    getStatusText(status) {
      const statuses = {
        'DRAFT': '草稿',
        'PUBLISHED': '已发布',
        'CLOSED': '已关闭'
      };
      return statuses[status] || status;
    },
    getTypeText(type) {
      const types = {
        'SUBJECTIVE': '主观题',
        'OBJECTIVE': '客观题',
        'MIXED': '混合题'
      };
      return types[type] || type;
    },
    formatDate(dateString) {
      if (!dateString) return '';
      return new Date(dateString).toLocaleString('zh-CN');
    }
  }
};
</script>

<style scoped>
.course-homework {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.back-btn {
  padding: 8px 16px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 8px;
}

.course-info {
  flex: 1;
}

.course-info h1 {
  margin: 0 0 8px 0;
  color: #333;
}

.course-info p {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.create-btn,
.stats-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.create-btn {
  background: #28a745;
  color: white;
}

.stats-btn {
  background: #17a2b8;
  color: white;
}

.homework-list {
  display: grid;
  gap: 20px;
}

.homework-item {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  transition: box-shadow 0.2s;
}

.homework-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.homework-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.homework-header h3 {
  margin: 0;
  color: #333;
  flex: 1;
}

.homework-status {
  display: flex;
  gap: 8px;
  align-items: center;
}

.status,
.type {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.status.draft {
  background: #fff3e0;
  color: #f57c00;
}

.status.published {
  background: #e8f5e8;
  color: #388e3c;
}

.status.closed {
  background: #ffebee;
  color: #d32f2f;
}

.type {
  background: #e3f2fd;
  color: #1976d2;
}

.homework-info {
  margin-bottom: 20px;
}

.description {
  margin: 0 0 15px 0;
  color: #666;
  line-height: 1.6;
}

.homework-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.meta-item {
  display: flex;
  gap: 8px;
}

.meta-item .label {
  font-weight: bold;
  color: #555;
  min-width: 80px;
}

.meta-item .value {
  color: #333;
}

.homework-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.homework-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.view-btn {
  background: #007bff;
  color: white;
}

.edit-btn {
  background: #ffc107;
  color: #212529;
}

.submissions-btn {
  background: #17a2b8;
  color: white;
}

.publish-btn {
  background: #28a745;
  color: white;
}

.submit-btn {
  background: #28a745;
  color: white;
}

.submit-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.empty {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.loading {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 16px;
}
</style>