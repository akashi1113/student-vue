<template>
  <div class="knowledge-list">
    <!-- AI推荐组件 -->
    <AIRecommendation />
    
    <div class="search-section">
      <SearchBar @search="handleSearch" />
      <CategoryFilter :categories="categories" @filter="handleFilter" />
      <el-button type="primary" @click="showFavoriteDialog = true" style="margin-left:auto;">我的收藏</el-button>
    </div>
    
    <div class="content-section">
      <LoadingSpinner v-if="loading" />
      
      <div v-else-if="knowledgeList.length === 0" class="empty-state">
        <p>暂无知识库内容</p>
      </div>
      
      <div v-else class="knowledge-grid">
        <KnowledgeCard
          v-for="item in knowledgeList"
          :key="item.id"
          :knowledge="item"
          @click="viewDetail(item.id)"
        />
      </div>
    </div>
    <!-- 我的收藏弹窗 -->
    <el-dialog v-model="showFavoriteDialog" title="我的收藏" width="700px">
      <el-table :data="favoriteList" v-loading="favoriteLoading" style="width: 100%">
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="author" label="作者" />
        <el-table-column prop="remark" label="备注" />
        <el-table-column prop="favoriteTime" label="收藏时间" />
        <el-table-column prop="linkUrl" label="书籍链接">
          <template #default="scope">
            <a :href="scope.row.linkUrl" target="_blank" style="color:#409eff;">{{ scope.row.linkUrl }}</a>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        :current-page="favoritePage"
        :page-size="favoriteSize"
        :total="favoriteTotal"
        @update:current-page="val => { favoritePage = val; fetchFavoriteList() }"
        @update:page-size="val => { favoriteSize = val; fetchFavoriteList() }"
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 20, 50, 100]"
        style="margin-top: 20px; text-align: center;"
      />
    </el-dialog>
    <DogAssistant />
  </div>
</template>

<script>
import SearchBar from '../components/SearchBar.vue'
import CategoryFilter from '../components/CategoryFilter.vue'
import KnowledgeCard from '../components/KnowledgeCard.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import AIRecommendation from '../components/AIRecommendation.vue'
import DogAssistant from '@/components/DogAssistant.vue'
import { getKnowledgeList, getCategories, getFavoriteList } from '../api/knowledge.js'

export default {
  name: 'KnowledgeList',
  components: {
    SearchBar,
    CategoryFilter,
    KnowledgeCard,
    LoadingSpinner,
    AIRecommendation,
    DogAssistant
  },
  data() {
    return {
      loading: false,
      knowledgeList: [],
      searchQuery: '',
      selectedCategory: '',
      categories: [],
      // 收藏弹窗相关
      showFavoriteDialog: false,
      favoriteList: [],
      favoriteTotal: 0,
      favoritePage: 1,
      favoriteSize: 10,
      favoriteLoading: false
    }
  },
  watch: {
    showFavoriteDialog(val) {
      if (val) {
        this.fetchFavoriteList()
      }
    }
  },
  mounted() {
    this.loadCategories()
    this.loadKnowledgeList()
  },
  methods: {
    async loadCategories() {
      try {
        const res = await getCategories()
        this.categories = res.data || []
      } catch (error) {
        this.categories = []
      }
    },
    async loadKnowledgeList() {
      this.loading = true
      try {
        const res = await getKnowledgeList({
          keyword: this.searchQuery,
          category: this.selectedCategory,
          current: 1, // 可根据需要做分页
          size: 12
        })
        console.log('完整返回:', res)
        this.knowledgeList = res.data.list || []
        console.log('records:', this.knowledgeList)
      } catch (error) {
        console.error('加载知识库列表失败:', error)
        this.knowledgeList = []
      } finally {
        this.loading = false
      }
    },
    handleSearch(query) {
      this.searchQuery = query
      this.loadKnowledgeList()
    },
    handleFilter(category) {
      this.selectedCategory = category
      this.loadKnowledgeList()
    },
    viewDetail(id) {
      this.$router.push(`/knowledge/${id}`)
    },
    async fetchFavoriteList() {
      this.favoriteLoading = true
      const res = await getFavoriteList(this.favoritePage, this.favoriteSize)
      // 兼容数组和对象两种返回格式
      if (Array.isArray(res.data)) {
        this.favoriteList = res.data
        this.favoriteTotal = res.data.length
      } else if (res.data && Array.isArray(res.data.list)) {
        this.favoriteList = res.data.list
        this.favoriteTotal = res.data.total
      } else {
        this.favoriteList = []
        this.favoriteTotal = 0
      }
      this.favoriteLoading = false
    }
  }
}
</script>

<style scoped>
.knowledge-list {
  max-width: 1200px;
  margin: 0 auto;
}

.search-section {
  margin-bottom: 30px;
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.content-section {
  min-height: 400px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.knowledge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

@media (max-width: 768px) {
  .search-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .knowledge-grid {
    grid-template-columns: 1fr;
  }
}
</style>
