<template>
  <div class="dog-assistant" @mouseenter="showTip = true" @mouseleave="showTip = false">
    <div v-if="showTip" class="dog-tip">
      {{ tip }}
      <div class="dog-tip-arrow"></div>
    </div>
    <div class="dog-lottie-wrapper">
      <Vue3Lottie :animationData="dogAnimation" :height="130" :width="130" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Vue3Lottie } from 'vue3-lottie';
import dogAnimation from '@/assets/animations/dog.json'; // 你需要将Lottie动画JSON放在此处

const showTip = ref(false);
const tip = computed(() => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 18) {
    return '汪！继续加油吧！';
  } else {
    return '汪~ 已经很晚了，注意休息哦！';
  }
});
</script>

<style scoped>
.dog-assistant {
  position: fixed;
  right: 30px;
  bottom: 30px;
  z-index: 999;
  width: 130px;
  height: 160px;
}
.dog-tip {
  position: absolute;
  left: 50%;
  bottom: 140px;
  transform: translateX(-50%);
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 16px;
  max-width: 320px;
  word-break: break-all;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  margin-bottom: 0;
  position: absolute;
}
.dog-tip-arrow {
  position: absolute;
  left: 50%;
  bottom: -8px;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid #fffbe6;
  filter: drop-shadow(0 1px 1px #ffe58f);
}
.dog-lottie-wrapper {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 130px;
  height: 130px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
</style> 