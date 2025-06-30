<template>
  <div class="knowledge-list">
    <div class="search-section">
      <SearchBar @search="handleSearch" />
      <CategoryFilter :categories="categories" @filter="handleFilter" />
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
  </div>
</template>

<script>
import SearchBar from '../components/SearchBar.vue'
import CategoryFilter from '../components/CategoryFilter.vue'
import KnowledgeCard from '../components/KnowledgeCard.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { getKnowledgeList, getCategories } from '../api/knowledge.js'

export default {
  name: 'KnowledgeList',
  components: {
    SearchBar,
    CategoryFilter,
    KnowledgeCard,
    LoadingSpinner
  },
  data() {
    return {
      loading: false,
      knowledgeList: [],
      searchQuery: '',
      selectedCategory: '',
      categories: []
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
        this.knowledgeList = res.data.records || [] 
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
