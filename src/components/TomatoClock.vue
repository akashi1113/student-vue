<template>
    <div class="tomato-clock-float" @mousedown="onMouseDown">
        <div v-if="!isFinished" class="tomato-clock-container">
            <div class="header">
                <h2>
                    <el-icon>
                        <Tomato />
                    </el-icon> 番茄钟
                </h2>
            </div>
            <div class="input-container">
                <el-input v-model="customMinutes" type="number" placeholder="请输入分钟数" min="1"></el-input>
                <el-button @click="setCustomTime">
                    <el-icon>
                        <Check />
                    </el-icon> 设置时间
                </el-button>
            </div>
            <p class="time-display">
                <el-icon>
                    <Timer />
                </el-icon> {{ timeLeft }}
            </p>
            <div class="button-container">
                <el-button @click="startTimer" type="primary">
                    <el-icon>
                        <Play />
                    </el-icon> 开始
                </el-button>
                <el-button @click="stopTimer" type="danger">
                    <el-icon>
                        <Stop />
                    </el-icon> 停止
                </el-button>
            </div>
        </div>
        <div v-else class="congratulations-container">
            <div class="confetti-container">
                <div v-for="(confetti, index) in confettiCount" :key="index" class="confetti"></div>
            </div>
            <h2 class="congrats-title">恭喜你！</h2>
            <p class="congrats-message">你已完成一轮专注时间，休息一下吧！</p>
            <el-button @click="restartTimer" type="primary">
                <el-icon>
                    <Refresh />
                </el-icon> 返回重新开始
            </el-button>
        </div>
    </div>
</template>

<script setup>
import { ref, onUnmounted, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Tomato, Check, Timer, Play, Stop, Refresh } from '@element-plus/icons-vue';
// 增加导入
import { tomatoStore } from '@/store/tomatoStore';

const timeLeft = ref('25:00');
const timer = ref(null);
const isRunning = ref(false);
const customMinutes = ref('25');
const isDragging = ref(false);
const offsetX = ref(0);
const offsetY = ref(0);
const floatElement = ref(null);
const initialX = ref(0);
const initialY = ref(0);
const currentX = ref(0);
const currentY = ref(0);
const isFinished = ref(false);
const confettiCount = ref(50);
const isTomatoRunning = ref(false); // 新增状态

const setCustomTime = () => {
    const minutes = parseInt(customMinutes.value);
    if (isNaN(minutes) || minutes < 1) {
        ElMessage.error('请输入有效的分钟数');
        return;
    }
    timeLeft.value = `${minutes.toString().padStart(2, '0')}:00`;
};

const startTimer = () => {
    if (isRunning.value) return;
    isRunning.value = true;
    isFinished.value = false;
    isTomatoRunning.value = true; // 开始番茄钟时设置为 true
    tomatoStore.value.isRunning = true; // 更新全局状态
    const [minutes, seconds] = timeLeft.value.split(':').map(Number);
    let totalSeconds = minutes * 60 + seconds;
    timer.value = setInterval(() => {
        if (totalSeconds === 0) {
            clearInterval(timer.value);
            isRunning.value = false;
            isFinished.value = true;
            isTomatoRunning.value = false; // 结束番茄钟时设置为 false
            tomatoStore.value.isRunning = false; // 更新全局状态
            ElMessage.success('专注时间结束，休息一下吧！');
        } else {
            totalSeconds--;
            const mins = Math.floor(totalSeconds / 60);
            const secs = totalSeconds % 60;
            timeLeft.value = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    }, 1000);
};

const stopTimer = () => {
    if (timer.value) {
        clearInterval(timer.value);
        isRunning.value = false;
        isTomatoRunning.value = false; // 停止番茄钟时设置为 false
        tomatoStore.value.isRunning = false; // 更新全局状态
        setCustomTime();
    }
};

const restartTimer = () => {
    isFinished.value = false;
    setCustomTime();
};

const onMouseDown = (e) => {
    isDragging.value = true;
    initialX.value = e.clientX;
    initialY.value = e.clientY;
    offsetX.value = floatElement.value.offsetLeft;
    offsetY.value = floatElement.value.offsetTop;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
};

const onMouseMove = (e) => {
    if (isDragging.value) {
        const dx = e.clientX - initialX.value;
        const dy = e.clientY - initialY.value;
        currentX.value = offsetX.value + dx;
        currentY.value = offsetY.value + dy;
        floatElement.value.style.left = `${currentX.value}px`;
        floatElement.value.style.top = `${currentY.value}px`;
    }
};

const onMouseUp = () => {
    isDragging.value = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
};

onMounted(() => {
    floatElement.value = document.querySelector('.tomato-clock-float');
});

onUnmounted(() => {
    if (timer.value) {
        clearInterval(timer.value);
    }
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    tomatoStore.value.isRunning = false;
});

// 导出 isTomatoRunning 状态
defineExpose({
    isTomatoRunning
});
</script>

<style scoped>
.tomato-clock-float {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999;
    cursor: move;
}

.tomato-clock-container {
    background-color: white;
    border: 1px solid #ccc;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    width: 250px;
}

.header {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
}

.header h2 {
    margin: 0;
    font-size: 20px;
    color: #667eea;
    display: flex;
    align-items: center;
    gap: 8px;
}

.input-container {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
}

.time-display {
    font-size: 24px;
    font-weight: bold;
    color: #333;
    text-align: center;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.button-container {
    display: flex;
    justify-content: center;
    gap: 15px;
}

.congratulations-container {
    background-color: white;
    border: 1px solid #ccc;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    width: 250px;
    text-align: center;
    position: relative;
    overflow: hidden;
}

.confetti-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
}

.confetti {
    position: absolute;
    width: 8px;
    height: 8px;
    background-color: #ff6b6b;
    border-radius: 50%;
    animation: confetti-fall 3s linear infinite;
}

@keyframes confetti-fall {
    0% {
        top: -10%;
        left: calc(var(--random-left) * 100%);
        transform: rotate(0deg);
    }

    100% {
        top: 100%;
        left: calc(var(--random-left) * 100% + (var(--random-x) * 20% - 10%));
        transform: rotate(360deg);
    }
}

.congrats-title {
    font-size: 24px;
    color: #52c41a;
    margin-bottom: 10px;
}

.congrats-message {
    font-size: 16px;
    color: #333;
    margin-bottom: 20px;
}
</style>