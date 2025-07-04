<template>
  <div class="knowledge-detail">
    <div class="back-button" @click="goBack">
      ← 返回列表
    </div>
    
    <div v-if="loading" class="loading">
      <LoadingSpinner />
    </div>
    
    <div v-else-if="knowledge" class="detail-content">
      <div class="detail-header-with-image">
        <div class="detail-header-text">
          <h1>{{ knowledge.title }}</h1>
          <div class="meta">
            <span>作者：{{ knowledge.author }}</span>
            <span style="margin-left: 30px;">创建时间：{{ formatDate(knowledge.createTime) }}</span>
          </div>
        </div>
        <img v-if="knowledge.imagePath" :src="getImageUrl(knowledge.imagePath)" alt="书籍封面" class="detail-book-image" />
      </div>
      
      <div class="detail-body">
        <p class="description">{{ knowledge.content }}</p>
        <div class="link">
          <a :href="knowledge.linkUrl" target="_blank" rel="noopener noreferrer">点击查看书籍链接</a>
        </div>
        <div class="favorite-bar">
          <el-button
            :type="isFavorite ? 'danger' : 'primary'"
            @click="isFavorite ? handleCancelFavorite() : handleAddFavorite()"
            style="margin-top: 18px;"
          >
            {{ isFavorite ? '取消收藏' : '收藏' }}
          </el-button>
        </div>
      </div>
    </div>
    
    <div v-else class="error">
      <p>知识库内容不存在或已被删除</p>
    </div>
    <!-- 收藏备注弹窗 -->
    <el-dialog v-model="showRemarkDialog" title="添加收藏备注" width="400px">
      <el-input v-model="remark" placeholder="可填写备注（选填）" />
      <template #footer>
        <el-button @click="showRemarkDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAddFavorite">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { getKnowledgeDetail, addFavorite, cancelFavorite, getFavoriteStatus } from '../api/knowledge.js'
import { ElMessage } from 'element-plus'

export default {
  name: 'KnowledgeDetail',
  components: {
    LoadingSpinner
  },
  data() {
    return {
      loading: true,
      knowledge: null,
      isFavorite: false,
      showRemarkDialog: false,
      remark: ''
    }
  },
  mounted() {
    console.log('路由参数id:', this.$route.params.id)
    this.loadKnowledgeDetail()
    this.fetchFavoriteStatus()
  },
  methods: {
    async loadKnowledgeDetail() {
      const id = this.$route.params.id
      console.log('loadKnowledgeDetail调用，id:', id)
      try {
        const data = await getKnowledgeDetail(id)
        console.log('详情页数据:', data)
        this.knowledge = data && data.data ? data.data : data
      } catch (error) {
        console.error('加载知识库详情失败:', error)
        this.knowledge = null
      } finally {
        this.loading = false
      }
    },
    async fetchFavoriteStatus() {
      if (!this.$route.params.id) return
      const res = await getFavoriteStatus(this.$route.params.id)
      if (res && res.code === 200) {
        this.isFavorite = res.data
      }
    },
    handleAddFavorite() {
      this.showRemarkDialog = true
    },
    async confirmAddFavorite() {
      const res = await addFavorite({ knowledgeId: this.$route.params.id, remark: this.remark })
      if (res && res.code === 200) {
        ElMessage.success('收藏成功')
        this.isFavorite = true
        this.showRemarkDialog = false
        this.remark = ''
      } else {
        ElMessage.error(res.msg || '收藏失败')
      }
    },
    async handleCancelFavorite() {
      const res = await cancelFavorite(this.$route.params.id)
      if (res && res.code === 200) {
        ElMessage.success('取消收藏成功')
        this.isFavorite = false
      } else {
        ElMessage.error(res.msg || '取消收藏失败')
      }
    },
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN')
    },
    goBack() {
      this.$router.push('/knowledge')
    },
    getImageUrl(path) {
      if (!path) return ''
      if (path.startsWith('http')) return path
      if (!path.startsWith('/')) path = '/' + path
      return 'http://localhost:8080' + path
    }
  }
}
</script>

<style scoped>
.knowledge-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.detail-header-with-image {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
}

.detail-header-text {
  flex: 1;
}

.detail-book-image {
  width: 160px;
  height: 160px;
  object-fit: contain;
  border-radius: 8px;
  background: #f5f5f5;
  margin-left: 30px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.back-button {
  color: #409eff;
  cursor: pointer;
  margin-bottom: 20px;
  font-size: 14px;
}

.back-button:hover {
  text-decoration: underline;
}

.loading {
  text-align: center;
  padding: 40px;
}

.detail-header h1 {
  margin: 0 0 15px 0;
  font-size: 28px;
  color: #303133;
}

.meta {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
  font-size: 14px;
  color: #909399;
}

.category {
  background: #409eff;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.detail-body {
  line-height: 1.6;
}

.detail-body .meta {
  margin-bottom: 20px;
  color: #909399;
  font-size: 15px;
}

.description {
  font-size: 16px;
  color: #606266;
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.link {
  margin-top: 20px;
}

.link a {
  color: #409eff;
  text-decoration: underline;
  font-size: 16px;
}

.link a:hover {
  color: #337ecc;
}

.error {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.favorite-bar {
  margin-top: 18px;
}

@media (max-width: 768px) {
  .detail-header-with-image {
    flex-direction: column;
    align-items: flex-start;
  }
  .detail-book-image {
    margin-left: 0;
    margin-top: 20px;
    width: 100%;
    max-width: 300px;
    height: auto;
  }
  .meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
