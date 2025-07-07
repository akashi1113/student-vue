<template>
  <div class="ai-recommendation">
    <!-- 推荐入口卡片 -->
    <div class="recommendation-entry" @click="showRecommendationDialog = true">
      <div class="entry-content">
        <div class="entry-icon">
          <i class="el-icon-magic-stick"></i>
        </div>
        <div class="entry-text">
          <h3>AI智能推荐</h3>
          <p>基于您的考试成绩，为您推荐最适合的图书</p>
        </div>
        <div class="entry-arrow">
          <i class="el-icon-arrow-right"></i>
        </div>
      </div>
    </div>

    <!-- AI推荐弹窗 -->
    <el-dialog 
      v-model="showRecommendationDialog" 
      title="AI智能图书推荐" 
      width="900px"
      :close-on-click-modal="false"
      align-center
    >
      <div class="dialog-header-actions">
        <el-button 
          link
          @click="$router.push('/ai/recommendation-history')"
          style="margin-left: auto;"
        >
          <i class="el-icon-time"></i>
          查看历史
        </el-button>
      </div>
      
      <div class="recommendation-container">
        <!-- 操作按钮 -->
        <div class="action-section">
          <el-button 
            type="primary" 
            @click="generateRecommendations"
            :loading="generating"
            icon="el-icon-magic-stick"
          >
            生成新推荐
          </el-button>
          <el-button 
            @click="loadRecommendations"
            :loading="loading"
            icon="el-icon-refresh"
          >
            刷新推荐
          </el-button>
        </div>

        <!-- 推荐列表 -->
        <div class="recommendations-section">
          <div v-if="loading" class="loading-section">
            <el-icon class="is-loading"><Loading /></el-icon>
            <h3>AI正在分析您的学习情况，请稍候...</h3>
            <p>正在为您生成个性化推荐</p>
          </div>

          <div v-else-if="recommendations.length === 0" class="empty-results">
            <div class="empty-icon">
              <i class="el-icon-reading"></i>
            </div>
            <h3>暂无推荐</h3>
            <p>您目前没有任何考试记录，无法生成推荐</p>
            <el-button type="primary" @click="generateRecommendations">
              立即生成推荐
            </el-button>
          </div>

          <div v-else class="recommendation-list">
            <!-- 状态提示和筛选 -->
            <div class="list-controls">
              <div class="status-hint">
                <i class="el-icon-info"></i>
                <span>{{ getStatusHint() }}</span>
              </div>
              
              <div class="filter-section">
                <el-select 
                  v-model="filterType" 
                  placeholder="筛选推荐类型"
                  size="small"
                  style="width: 150px;"
                >
                  <el-option label="全部推荐" value="all" />
                  <el-option label="低分课程推荐" value="low-score" />
                  <el-option label="智能推荐" value="smart" />
                </el-select>
              </div>
            </div>

            <div class="list-header">
              <h3>为您推荐的图书</h3>
              <p>基于您的考试成绩，我们为您精选了以下图书</p>
            </div>

            <div 
              v-for="recommendation in filteredRecommendations" 
              :key="recommendation.id" 
              class="recommendation-item"
            >
              <div class="book-info">
                <div class="book-header">
                  <div class="recommendation-type">
                    <el-tag 
                      :type="getRecommendationType(recommendation.score).type"
                      size="small"
                      class="type-tag"
                    >
                      <i :class="getRecommendationType(recommendation.score).icon"></i>
                      {{ getRecommendationType(recommendation.score).label }}
                    </el-tag>
                  </div>
                  <h4 class="book-title">{{ recommendation.bookTitle }}</h4>
                  <div class="book-meta">
                    <span class="book-author">作者：{{ recommendation.bookAuthor }}</span>
                    <span class="book-course">课程：{{ recommendation.courseName }}</span>
                    <span class="book-score">成绩：{{ recommendation.score }}分</span>
                  </div>
                </div>
                
                <div class="book-description">
                  <p class="recommendation-reason">
                    <strong>推荐理由：</strong>{{ recommendation.recommendationReason }}
                  </p>
                </div>

                <div class="book-actions">
                  <el-button 
                    v-if="recommendation.isRead === 0"
                    type="success" 
                    size="small"
                    @click="markAsRead(recommendation.id)"
                    :loading="markingRead === recommendation.id"
                  >
                    <i class="el-icon-check"></i>
                    标记已读
                  </el-button>
                  
                  <el-tag 
                    v-else 
                    type="success" 
                    size="small"
                  >
                    <i class="el-icon-check"></i>
                    已读
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeDialog">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { 
  generateAIRecommendations, 
  getAIRecommendations, 
  markRecommendationAsRead 
} from '../api/knowledge.js'

export default {
  name: 'AIRecommendation',
  data() {
    return {
      showRecommendationDialog: false,
      loading: false,
      generating: false,
      markingRead: null,
      recommendations: [],
      filterType: 'all'
    }
  },
  computed: {
    filteredRecommendations() {
      switch(this.filterType) {
        case 'low-score':
          return this.recommendations.filter(r => r.score < 70);
        case 'smart':
          return this.recommendations.filter(r => r.score >= 70);
        default:
          return this.recommendations;
      }
    }
  },
  watch: {
    showRecommendationDialog(val) {
      if (val) {
        this.loadRecommendations()
      }
    }
  },
  methods: {
    async loadRecommendations() {
      this.loading = true
      try {
        const response = await getAIRecommendations()
        this.recommendations = response.data || []
      } catch (error) {
        console.error('加载推荐失败:', error)
        this.$message.error('加载推荐失败，请稍后重试')
        this.recommendations = []
      } finally {
        this.loading = false
      }
    },

    async generateRecommendations() {
      this.generating = true
      try {
        const response = await generateAIRecommendations()
        this.recommendations = response.data || []
        this.$message.success('推荐生成成功！')
        
        if (this.recommendations.length === 0) {
          this.$message.info('暂无需要推荐的课程，您的成绩都很优秀！')
        }
      } catch (error) {
        console.error('生成推荐失败:', error)
        if (error.response?.status === 401) {
          this.$message.error('请先登录')
        } else {
          this.$message.error('生成推荐失败，请稍后重试')
        }
      } finally {
        this.generating = false
      }
    },

    async markAsRead(recommendationId) {
      this.markingRead = recommendationId
      try {
        await markRecommendationAsRead(recommendationId)
        this.$message.success('已标记为已读')
        // 更新本地状态
        const recommendation = this.recommendations.find(r => r.id === recommendationId)
        if (recommendation) {
          recommendation.isRead = 1
        }
      } catch (error) {
        console.error('标记已读失败:', error)
        this.$message.error('操作失败，请稍后重试')
      } finally {
        this.markingRead = null
      }
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

    getStatusHint() {
      const lowScoreCount = this.recommendations.filter(r => r.score < 70).length;
      const smartCount = this.recommendations.filter(r => r.score >= 70).length;
      
      if (lowScoreCount > 0 && smartCount > 0) {
        return `基于您的低分课程和所有课程生成了个性化推荐（${lowScoreCount}个低分推荐，${smartCount}个智能推荐）`;
      } else if (lowScoreCount > 0) {
        return `基于您的低分课程生成了个性化推荐（${lowScoreCount}个推荐）`;
      } else if (smartCount > 0) {
        return `基于您的所有课程生成了智能推荐（${smartCount}个推荐）`;
      } else {
        return '暂无推荐数据';
      }
    },

    closeDialog() {
      this.showRecommendationDialog = false
    }
  }
}
</script>

<style scoped>
.ai-recommendation {
  margin-bottom: 20px;
}

.recommendation-entry {
  background: #e6f0fa;
  border-radius: 10px;
  padding: 16px 24px;
  cursor: pointer;
  transition: background 0.2s;
  border: 1.5px solid #409eff;
  box-shadow: none;
}

.recommendation-entry:hover {
  background: #d0e7fa;
  border-color: #337ecc;
}

.entry-content {
  display: flex;
  align-items: center;
  color: #337ecc;
}

.entry-icon {
  font-size: 28px;
  margin-right: 18px;
  color: #409eff;
  background: #fff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(64,158,255,0.08);
}

.entry-text {
  flex: 1;
}

.entry-text h3 {
  margin: 0 0 2px 0;
  font-size: 18px;
  font-weight: 500;
  color: #337ecc;
}

.entry-text p {
  margin: 0;
  opacity: 0.85;
  font-size: 13px;
  color: #337ecc;
}

.entry-arrow {
  font-size: 20px;
  opacity: 1;
  color: #409eff;
  margin-left: 8px;
}

.dialog-header-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.recommendation-container {
  padding: 20px 0;
}

.action-section {
  margin-bottom: 30px;
  display: flex;
  gap: 15px;
}

.loading-section {
  text-align: center;
  padding: 40px 20px;
}

.loading-section h3 {
  margin: 20px 0 10px 0;
  color: #333;
}

.loading-section p {
  color: #666;
  margin: 0;
}

.empty-results {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  color: #ddd;
  margin-bottom: 20px;
}

.empty-results h3 {
  margin: 0 0 10px 0;
  color: #666;
}

.empty-results p {
  margin: 0 0 20px 0;
  color: #999;
}

.list-header {
  text-align: center;
  margin-bottom: 30px;
}

.list-header h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.list-header p {
  margin: 0;
  color: #666;
}

.list-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 6px;
}

.status-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
}

.status-hint i {
  color: #409eff;
}

.filter-section {
  display: flex;
  align-items: center;
}

.recommendation-list {
  max-height: 500px;
  overflow-y: auto;
}

.recommendation-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 15px;
  background: #fafafa;
  transition: all 0.3s ease;
}

.recommendation-item:hover {
  background: #f5f7fa;
  border-color: #c0c4cc;
}

.book-header {
  margin-bottom: 15px;
}

.recommendation-type {
  margin-bottom: 10px;
}

.type-tag {
  font-size: 12px;
}

.type-tag i {
  margin-right: 4px;
}

.book-title {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.book-meta {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  font-size: 14px;
  color: #666;
}

.book-author,
.book-course,
.book-score {
  display: flex;
  align-items: center;
}

.book-description {
  margin-bottom: 15px;
}

.recommendation-reason {
  margin: 0;
  color: #666;
  line-height: 1.6;
  font-size: 14px;
}

.book-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.dialog-footer {
  text-align: right;
}

@media (max-width: 768px) {
  .list-controls {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .book-meta {
    flex-direction: column;
    gap: 5px;
  }
  
  .book-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style> 