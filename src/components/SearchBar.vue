<template>
  <div class="search-bar">
    <input
      v-model="searchInput"
      type="text"
      placeholder="搜索知识库..."
      @input="handleInput"
      @keyup.enter="handleSearch"
    />
    <button @click="handleSearch" class="search-btn">
      搜索
    </button>
  </div>
</template>

<script>
export default {
  name: 'SearchBar',
  data() {
    return {
      searchInput: ''
    }
  },
  methods: {
    handleInput() {
      // 可以添加防抖逻辑
      this.$emit('search', this.searchInput)
    },
    handleSearch() {
      this.$emit('search', this.searchInput)
    }
  }
}
</script>

<style scoped>
.search-bar {
  display: flex;
  gap: 10px;
  flex: 1;
  max-width: 400px;
}

.search-bar input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-bar input:focus {
  outline: none;
  border-color: #409eff;
}

.search-btn {
  padding: 10px 20px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.search-btn:hover {
  background: #337ecc;
}
</style>
