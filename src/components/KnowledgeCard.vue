<template>
  <div class="knowledge-card" @click="handleClick">
    <img :src="getImageUrl(knowledge.imagePath)" alt="书籍封面" class="book-image" />
    <div class="card-header">
      <h3 class="title">{{ knowledge.title }}</h3>
      <span class="category">{{ knowledge.category }}</span>
    </div>
    <div class="card-footer">
      <span class="author">{{ knowledge.author }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'KnowledgeCard',
  props: {
    knowledge: {
      type: Object,
      required: true
    }
  },
  methods: {
    handleClick() {
      this.$emit('click', this.knowledge.id)
    },
    getImageUrl(path) {
      if (!path) return ''
      if (path.startsWith('http')) return path
      return 'http://localhost:8080' + path // 根据你的后端图片访问地址修改
    }
  }
}
</script>

<style scoped>
.knowledge-card {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 0 0 20px 0;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.knowledge-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #409eff;
}

.book-image {
  width: 100%;
  height: 160px;
  object-fit: contain;
  border-radius: 8px 8px 0 0;
  margin-bottom: 12px;
  background: #f5f5f5;
  display: block;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
  padding: 0 20px;
}

.title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  flex: 1;
  margin-right: 10px;
}

.category {
  background: #409eff;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
}

.card-footer {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  font-size: 12px;
  color: #909399;
  padding: 0 20px;
}

.author {
  font-weight: 500;
}
</style>
