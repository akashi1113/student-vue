import { ref } from 'vue';

// 创建全局响应式的番茄钟状态
export const tomatoStore = ref({
    isRunning: false
});