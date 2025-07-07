<template>
  <div class="recommendation-history">
    <div class="page-header">
      <h2>AI推荐历史</h2>
      <p>查看您的AI推荐记录和阅读状态</p>
    </div>

    <div class="content-section">
      <LoadingSpinner v-if="loading" />
      
      <div v-else-if="historyList.length === 0" class="empty-state">
        <div class="empty-icon">
          <i class="el-icon-reading"></i>
        </div>
        <p>暂无推荐历史记录</p>
        <el-button type="primary" @click="$router.push('/knowledge')">
          开始AI推荐
        </el-button>
      </div>
      
      <div v-else class="history-list">
        <div 
          v-for="record in historyList" 
          :key="record.id" 
          class="history-item"
        >
          <div class="record-header">
            <div class="record-info">
              <div class="book-title-section">
                <h3>{{ record.bookTitle }}</h3>
                <el-tag 
                  :type="getRecommendationType(record.score).type"
                  size="small"
                  class="recommendation-type-tag"
                >
                  <i :class="getRecommendationType(record.score).icon"></i>
                  {{ getRecommendationType(record.score).label }}
                </el-tag>
              </div>
              <p class="record-time">{{ formatTime(record.createTime) }}</p>
            </div>
            <div class="record-status">
              <el-tag 
                :type="record.isRead === 1 ? 'success' : 'info'"
                size="small"
              >
                {{ record.isRead === 1 ? '已读' : '未读' }}
              </el-tag>
            </div>
          </div>
          
          <div class="record-summary">
            <div class="book-info">
              <h4>书籍信息</h4>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">作者：</span>
                  <span class="value">{{ record.bookAuthor }}</span>
                </div>
                <div class="info-item">
                  <span class="label">课程：</span>
                  <span class="value">{{ record.courseName }}</span>
                </div>
                <div class="info-item">
                  <span class="label">成绩：</span>
                  <span class="value score">{{ record.score }}分</span>
                </div>
              </div>
            </div>
            
            <div class="recommendation-info">
              <h4>推荐理由</h4>
              <p class="recommendation-reason">{{ record.recommendationReason }}</p>
            </div>
          </div>
          
          <div class="record-actions">
            <el-button 
              v-if="record.isRead === 0"
              type="success" 
              size="small"
              @click="markAsRead(record.id)"
              :loading="markingRead === record.id"
            >
              <i class="el-icon-check"></i>
              标记已读
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="confirmDelete(record)"
              style="margin-left: 8px;"
            >
              <i class="el-icon-delete"></i>
              删除
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div v-if="historyList.length > 0" class="statistics-section">
      <el-card>
        <template #header>
          <span>推荐统计</span>
        </template>
        <div class="statistics-grid">
          <div class="stat-item">
            <div class="stat-number">{{ totalCount }}</div>
            <div class="stat-label">总推荐数</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ readCount }}</div>
            <div class="stat-label">已读书籍</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ unreadCount }}</div>
            <div class="stat-label">未读书籍</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ courseCount }}</div>
            <div class="stat-label">涉及课程</div>
          </div>
          <div class="stat-item">
            <div class="stat-number low-score">{{ lowScoreCount }}</div>
            <div class="stat-label">低分课程推荐</div>
          </div>
          <div class="stat-item">
            <div class="stat-number smart">{{ smartCount }}</div>
            <div class="stat-label">智能推荐</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 分页 -->
    <div v-if="total > 0" class="pagination-section">
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        @update:current-page="handlePageChange"
        @update:page-size="handleSizeChange"
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 20, 50, 100]"
      />
    </div>
  </div>
</template>

<script>
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import { getAIRecommendations, markRecommendationAsRead, deleteAIRecommendation } from '../../api/knowledge.js'

export default {
  name: 'RecommendationHistory',
  components: {
    LoadingSpinner
  },
  data() {
    return {
      loading: false,
      historyList: [],
      currentPage: 1,
      pageSize: 10,
      total: 0,
      markingRead: null,
      deletingId: null
    }
  },
  computed: {
    totalCount() {
      return this.historyList.length
    },
    readCount() {
      return this.historyList.filter(item => item.isRead === 1).length
    },
    unreadCount() {
      return this.historyList.filter(item => item.isRead === 0).length
    },
    courseCount() {
      const courses = new Set(this.historyList.map(item => item.courseId))
      return courses.size
    },
    lowScoreCount() {
      return this.historyList.filter(item => item.score < 70).length
    },
    smartCount() {
      return this.historyList.filter(item => item.score >= 70).length
    }
  },
  mounted() {
    this.loadHistory()
  },
  methods: {
    async loadHistory() {
      this.loading = true
      try {
        const response = await getAIRecommendations()
        this.historyList = response.data || []
        this.total = this.historyList.length
      } catch (error) {
        console.error('加载推荐历史失败:', error)
        this.$message.error('加载推荐历史失败')
        this.historyList = []
        this.total = 0
      } finally {
        this.loading = false
      }
    },

    handlePageChange(page) {
      this.currentPage = page
      // 由于API没有分页参数，这里只是更新页码
      // 实际项目中应该调用带分页的API
    },

    handleSizeChange(size) {
      this.pageSize = size
      this.currentPage = 1
      // 重新加载数据
    },

    async markAsRead(recommendationId) {
      this.markingRead = recommendationId
      try {
        await markRecommendationAsRead(recommendationId)
        this.$message.success('已标记为已读')
        // 更新本地状态
        const record = this.historyList.find(r => r.id === recommendationId)
        if (record) {
          record.isRead = 1
        }
      } catch (error) {
        console.error('标记已读失败:', error)
        this.$message.error('操作失败，请稍后重试')
      } finally {
        this.markingRead = null
      }
    },

    async confirmDelete(record) {
      this.$confirm(`确定要删除《${record.bookTitle}》的推荐记录吗？`, '删除确认', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        this.deletingId = record.id
        try {
          const res = await deleteAIRecommendation(record.id)
          if (res.code === 200) {
            this.$message.success('删除成功')
            // 立即移除该条记录
            this.historyList = this.historyList.filter(item => item.id !== record.id)
            this.total = this.historyList.length
          } else {
            this.$message.error(res.message || '删除失败')
          }
        } catch (error) {
          this.$message.error(error?.response?.data?.message || '删除失败')
        } finally {
          this.deletingId = null
        }
      }).catch(() => {})
    },

    getRecommendationType(score) {
      if (score < 70) {
        return {
          type: 'danger',
          label: '低分课程推荐',
          icon: 'el-icon-warning'
        };
      } else {
        return {
          type: 'primary',
          label: '智能推荐',
          icon: 'el-icon-magic-stick'
        };
      }
    },

    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      return date.toLocaleString('zh-CN')
    }
  }
}
</script>

<style scoped>
.recommendation-history {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h2 {
  margin: 0 0 10px 0;
  color: #333;
}

.page-header p {
  margin: 0;
  color: #666;
}

.content-section {
  min-height: 400px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  color: #ddd;
  margin-bottom: 20px;
}

.empty-state p {
  margin-bottom: 20px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.history-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  background: white;
  transition: all 0.3s ease;
}

.history-item:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.record-info h3 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 16px;
}

.book-title-section {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}

.recommendation-type-tag {
  font-size: 12px;
}

.recommendation-type-tag i {
  margin-right: 4px;
}

.record-time {
  margin: 0;
  color: #999;
  font-size: 14px;
}

.record-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 15px;
}

.book-info h4,
.recommendation-info h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: center;
}

.label {
  font-weight: 500;
  color: #666;
  min-width: 60px;
}

.value {
  color: #333;
}

.value.score {
  color: #f56c6c;
  font-weight: 500;
}

.recommendation-reason {
  margin: 0;
  color: #666;
  line-height: 1.6;
  font-size: 14px;
}

.record-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.statistics-section {
  margin-top: 30px;
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 20px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.stat-number.low-score {
  color: #f56c6c;
}

.stat-number.smart {
  color: #67c23a;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.pagination-section {
  margin-top: 30px;
  text-align: center;
}

@media (max-width: 768px) {
  .record-summary {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .record-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .record-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .statistics-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
  }
}
</style> 