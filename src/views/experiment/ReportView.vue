<template>
  <div class="report-container">
    <el-page-header @back="$router.go(-1)" content="实验报告" class="page-header" />
    
    <div class="report-card" v-if="report">
      <div class="report-header">
        <h1>{{ report.experimentName }} - 实验报告</h1>
        <div class="report-meta">
          <div class="meta-item">
            <el-icon><user /></el-icon>
            <span>学生: {{ report.studentName }}</span>
          </div>
          <div class="meta-item">
            <el-icon><calendar /></el-icon>
            <span>提交时间: {{ formatDate(report.submitTime) }}</span>
          </div>
          <div class="meta-item">
            <el-tag :type="getScoreTagType(report.score)">
              {{ report.score !== null ? `得分: ${report.score}` : '待批改' }}
            </el-tag>
          </div>
        </div>
      </div>

      <el-divider />

      <div class="report-content">
        <el-tabs type="border-card">
          <el-tab-pane label="报告内容">
            <div class="section">
              <h2>实验目的</h2>
              <div class="content-box" v-html="report.objective"></div>
            </div>
            
            <div class="section">
              <h2>实验过程</h2>
              <div class="content-box" v-html="report.procedure"></div>
            </div>
            
            <div class="section">
              <h2>数据分析</h2>
              <div class="content-box">
                <div v-html="report.dataAnalysis"></div>
                <div v-if="report.dataImages && report.dataImages.length" class="data-images">
                  <el-image
                    v-for="(img, index) in report.dataImages"
                    :key="index"
                    :src="img"
                    fit="contain"
                    class="data-image"
                    :preview-src-list="report.dataImages"
                  />
                </div>
              </div>
            </div>
            
            <div class="section">
              <h2>结论与讨论</h2>
              <div class="content-box" v-html="report.conclusion"></div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="教师评语" v-if="report.feedback">
            <div class="feedback-section">
              <div class="teacher-feedback">
                <div class="feedback-header">
                  <el-avatar :size="40" :src="report.teacherAvatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" />
                  <div class="teacher-info">
                    <span class="teacher-name">{{ report.teacherName }}</span>
                    <span class="feedback-time">{{ formatDate(report.feedbackTime) }}</span>
                  </div>
                </div>
                <div class="feedback-content" v-html="report.feedback"></div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      
      <div class="report-actions" v-if="!report.score">
        <el-button type="primary" @click="handleEdit">编辑报告</el-button>
        <el-button @click="handleDownload">下载报告</el-button>
      </div>
    </div>

    <div v-else class="loading-state">
      <el-skeleton :rows="10" animated />
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Calendar, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

export default {
  components: {
    Calendar, User
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    // const report = ref(null)

    // onMounted(async () => {
    //   try {
    //     // 这里应该是从API获取报告数据的逻辑
    //     // 模拟数据
    //     report.value = {
    //       id: route.params.id,
    //       experimentName: "光学折射实验",
    //       studentName: "张三",
    //       submitTime: new Date(),
    //       score: 85,
    //       objective: "<p>通过实验观察光的折射现象，验证折射定律...</p>",
    //       procedure: "<p>1. 调整激光笔角度...</p><p>2. 记录入射角和折射角...</p>",
    //       dataAnalysis: "<p>根据实验数据绘制折射角与入射角关系图...</p>",
    //       dataImages: [
    //         "https://via.placeholder.com/400x300?text=Data+Chart+1",
    //         "https://via.placeholder.com/400x300?text=Data+Chart+2"
    //       ],
    //       conclusion: "<p>实验验证了光的折射定律...</p>",
    //       feedback: "<p>报告数据详实，分析到位，但结论部分可以更深入...</p>",
    //       teacherName: "李老师",
    //       teacherAvatar: "",
    //       feedbackTime: new Date()
    //     }
    //   } catch (error) {
    //     ElMessage.error('获取实验报告失败')
    //   }
    // })

    const report = ref({
      experimentName: "光学折射实验",
      studentName: "张三",
      submitTime: new Date(),
      score: 85,
      objective: "<p>通过实验观察光的折射现象，验证折射定律...</p>",
          procedure: "<p>1. 调整激光笔角度...</p><p>2. 记录入射角和折射角...</p>",
          dataAnalysis: "<p>根据实验数据绘制折射角与入射角关系图...</p>",
          dataImages: [
            "https://via.placeholder.com/400x300?text=Data+Chart+1",
            "https://via.placeholder.com/400x300?text=Data+Chart+2"
          ],
          conclusion: "<p>实验验证了光的折射定律...</p>",
          feedback: "<p>报告数据详实，分析到位，但结论部分可以更深入...</p>",
          teacherName: "李老师",
          teacherAvatar: "",
          feedbackTime: new Date()
    })

    const formatDate = (date) => {
      if (!date) return ''
      return new Date(date).toLocaleString()
    }

    const getScoreTagType = (score) => {
      if (score === null) return 'info'
      if (score >= 90) return 'success'
      if (score >= 60) return 'warning'
      return 'danger'
    }

    const handleEdit = () => {
      router.push({
        path: `/reports/generate/${route.params.id}`,
        query: { edit: true, from: route.fullPath }
      })
    }

    const handleDownload = () => {
      // 下载报告逻辑
      ElMessage.success('报告下载中...')
    }

    return {
      report,
      formatDate,
      getScoreTagType,
      handleEdit,
      handleDownload
    }
  }
}
</script>

<style scoped>
.report-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.report-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.report-header h1 {
  font-size: 24px;
  margin: 0 0 15px 0;
  color: #303133;
}

.report-meta {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
}

.report-content {
  margin-top: 20px;
}

.section {
  margin-bottom: 30px;
}

.section h2 {
  color: #409EFF;
  margin-bottom: 15px;
  font-size: 20px;
}

.content-box {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 4px;
  line-height: 1.8;
}

.data-images {
  display: flex;
  gap: 15px;
  margin-top: 15px;
  flex-wrap: wrap;
}

.data-image {
  width: 200px;
  height: 150px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.feedback-section {
  padding: 20px;
}

.teacher-feedback {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 4px;
}

.feedback-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.teacher-info {
  display: flex;
  flex-direction: column;
}

.teacher-name {
  font-weight: bold;
  color: #303133;
}

.feedback-time {
  font-size: 12px;
  color: #909399;
}

.feedback-content {
  line-height: 1.8;
}

.report-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
}

.loading-state {
  margin-top: 40px;
}

@media (max-width: 768px) {
  .report-meta {
    flex-direction: column;
    gap: 10px;
  }
  
  .data-image {
    width: 100%;
    height: auto;
  }
}
</style>