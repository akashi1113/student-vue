<template>
  <div class="category-filter">
    <select v-model="selectedCategory" @change="handleChange">
      <option value="">全部分类</option>
      <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
    </select>
  </div>
</template>

<script>
export default {
  name: 'CategoryFilter',
  props: {
    categories: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      selectedCategory: ''
    }
  },
  watch: {
    // 如果父组件切换了分类列表，重置选中项
    categories() {
      this.selectedCategory = ''
    }
  },
  methods: {
    handleChange() {
      this.$emit('filter', this.selectedCategory)
    }
  }
}
</script>

<style scoped>
.category-filter select {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.category-filter select:focus {
  outline: none;
  border-color: #409eff;
}
</style>
