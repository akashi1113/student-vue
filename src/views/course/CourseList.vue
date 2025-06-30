<template>
  <div class="course-list">
    <div class="header">
      <h1>课程管理</h1>
      <div class="controls">
        <select v-model="userRole" @change="onRoleChange">
          <option value="student">学生视图</option>
          <option value="teacher">教师视图</option>
        </select>
        <input v-model="userId" placeholder="用户ID" @change="loadCourses" />
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="content">
      <div class="courses-grid">
        <div
            v-for="course in courseList"
            :key="course.id"
            class="course-card"
            @click="viewCourse(course.id)">
          <div class="course-cover">
            <img v-if="course.cover_img" :src="course.cover_img" :alt="course.title">
            <div v-else class="default-cover">{{ course.title.charAt(0) }}</div>
          </div>

          <div class="course-info">
            <h3>{{ course.title }}</h3>
            <p class="teacher">教师: {{ course.teacher_name }}</p>
            <p class="description">{{ course.description || '暂无描述' }}</p>

            <div class="course-meta">
              <span :class="['status', course.status === 0 ? 'active' : 'inactive']">
                {{ course.status === 0 ? '上架' : '下架' }}
              </span>
              <span class="create-time">{{ formatDate(course.create_time) }}</span>
            </div>

            <div v-if="userRole === 'student' && course.enroll_time" class="enroll-info">
              选课时间: {{ formatDate(course.enroll_time) }}
            </div>
          </div>

          <div class="course-actions" @click.stop>
            <button @click="viewHomework(course.id)" class="homework-btn">
              查看作业
            </button>
            <button v-if="userRole === 'teacher'" @click="createHomework(course.id)" class="create-btn">
              创建作业
            </button>
          </div>
        </div>
      </div>

      <div v-if="courseList.length === 0" class="empty">
        {{ userRole === 'student' ? '暂未选择任何课程' : '暂无授课课程' }}
      </div>
    </div>
  </div>
</template>

<script>
import homeworkApi from '@/api/homework';

export default {
  name: 'CourseList',
  data() {
    return {
      courseList: [],
      loading: false,
      userRole: 'student', // student 或 teacher
      userId: 2 // 默认学生ID
    };
  },
  mounted() {
    this.loadCourses();
  },
  methods: {
    async loadCourses() {
      this.loading = true;
      try {
        let response;
        if (this.userRole === 'student') {
          response = await homeworkApi.getCoursesByStudent(this.userId);
        } else {
          response = await homeworkApi.getCoursesByTeacher(this.userId);
        }

        if (response.data.success) {
          this.courseList = response.data.data;
        }
      } catch (error) {
        console.error('加载课程失败:', error);
        alert('加载课程失败');
      } finally {
        this.loading = false;
      }
    },
    onRoleChange() {
      // 切换角色时更新默认用户ID
      this.userId = this.userRole === 'student' ? 2 : 1;
      this.loadCourses();
    },
    viewCourse(courseId) {
      this.$router.push(`/courses/${courseId}/homework`);
    },
    viewHomework(courseId) {
      this.$router.push(`/courses/${courseId}/homework`);
    },
    createHomework(courseId) {
      this.$router.push(`/homework/create?courseId=${courseId}`);
    },
    formatDate(dateString) {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('zh-CN');
    }
  }
};
</script>

<style scoped>
.course-list {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header h1 {
  margin: 0;
  color: #333;
}

.controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.controls select,
.controls input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.course-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.course-cover {
  height: 160px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.course-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-cover {
  font-size: 48px;
  font-weight: bold;
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.course-info {
  padding: 20px;
}

.course-info h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 18px;
  line-height: 1.4;
}

.teacher {
  margin: 4px 0;
  color: #666;
  font-size: 14px;
}

.description {
  margin: 8px 0;
  color: #888;
  font-size: 14px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 12px 0;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.status.active {
  background: #e8f5e8;
  color: #388e3c;
}

.status.inactive {
  background: #ffebee;
  color: #d32f2f;
}

.create-time {
  font-size: 12px;
  color: #999;
}

.enroll-info {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
  background: #f0f8ff;
  padding: 6px 8px;
  border-radius: 4px;
}

.course-actions {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 8px;
}

.homework-btn,
.create-btn {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.homework-btn {
  background: #007bff;
  color: white;
}

.homework-btn:hover {
  background: #0056b3;
}

.create-btn {
  background: #28a745;
  color: white;
}

.create-btn:hover {
  background: #1e7e34;
}

.empty {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 16px;
}

.loading {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 16px;
}
</style>