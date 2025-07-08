<template>
    <div class="video-player-container">
        <div class="video-wrapper">
            <!-- 使用vue3-video-play组件 -->
            <vue3VideoPlay v-bind="videoOptions" @play="onPlay" @pause="onPause" @timeupdate="onTimeUpdate"
                @ended="onEnded" @loadedmetadata="onLoadedMetadata" class="custom-video-player" />

            <!-- 学习进度显示 -->
            <div class="progress-overlay" v-if="showProgressInfo">
                <div class="progress-info">
                    <el-icon>
                        <Clock />
                    </el-icon>
                    <span>已学习: {{ formatTime(internalCurrentTime) }} / {{ formatTime(videoDuration) }}</span>
                    <span class="progress-percent">({{ progressPercent }}%)</span>
                </div>
            </div>
        </div>

        <!-- 视频信息栏 -->
        <div class="video-info-bar">
            <div class="video-meta">
                <h3 class="video-title">{{ props.video.title }}</h3>
                <div class="video-stats">
                    <span class="duration">
                        <el-icon>
                            <Timer />
                        </el-icon>
                        时长: {{ formatTime(props.video.duration) }}
                    </span>
                    <span class="course-name" v-if="props.video.courseName">
                        <el-icon>
                            <Collection />
                        </el-icon>
                        课程: {{ props.video.courseName }}
                    </span>
                </div>
            </div>

            <div class="video-actions">
                <!-- 这里使用 props.video.completed 来决定按钮状态，但点击时会触发更新事件 -->
                <el-button type="primary" :icon="video.completed ? Check : VideoPlay" :disabled="video.completed"
                    @click="markAsCompleted">
                    {{ video.completed ? '已完成' : '标记完成' }}
                </el-button>

            </div>
        </div>

        <!-- 学习进度条 -->
        <div class="study-progress-section">
            <div class="progress-header">
                <span class="progress-label">学习进度</span>
                <span class="progress-text">{{ progressPercent }}%</span>
            </div>
            <el-progress :percentage="progressPercent" :stroke-width="8" color="#667eea" :show-text="false" />
            <div class="progress-tips">
                <el-icon>
                    <InfoFilled />
                </el-icon>
                <span>观看进度会自动保存，下次可从断点继续观看</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue' // 引入 nextTick
// import { vue3VideoPlay } from 'vue3-video-play'
import vue3VideoPlay from 'vue3-video-play'
import 'vue3-video-play/dist/style.css'
import { studyRecordAPI } from '../api'
import { ElMessage } from 'element-plus'
import {
    Clock, Timer, Collection, VideoPlay, Check, InfoFilled
} from '@element-plus/icons-vue'

const props = defineProps({
    video: {
        type: Object,
        required: true
    },
    userId: {
        type: Number,
        default: 1
    },
    autoSave: {
        type: Boolean,
        default: true
    }
})

// 关键修改：增加 'update:video' 事件
const emit = defineEmits(['progress-update', 'completed', 'update:video'])

// 响应式数据
const internalCurrentTime = ref(0) // 内部播放器的当前时间
const videoDuration = ref(0) // 播放器加载后的视频总时长
const isPlaying = ref(false)
const showProgressInfo = ref(false)
const saveTimer = ref(null)
const studyStartTime = ref(Date.now())
const totalStudyTime = ref(0) // 累计学习时长 (对应 studyRecordDTO.duration)

// 计算属性
const progressPercent = computed(() => {
    if (videoDuration.value === 0) return 0
    return Math.round((internalCurrentTime.value / videoDuration.value) * 100)
})

// 视频播放器选项
const videoOptions = computed(() => ({
    src: props.video.url,
    title: props.video.title,
    poster: '', // 可以添加视频封面，这里暂时为空
    currentTime: props.video.progress || 0, // 从父组件传来的视频对象中的进度开始
    muted: false,
    autoplay: false,
    loop: false,
    controls: true,
    preload: 'metadata',
    fluid: true,
    responsive: true
}))

// 格式化时间显示
const formatTime = (seconds) => {
    if (!seconds || seconds === 0) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 视频事件处理
const onPlay = () => {
    isPlaying.value = true
    showProgressInfo.value = true
    studyStartTime.value = Date.now() // 开始本次学习计时

    // 开始定时保存进度
    if (props.autoSave) {
        startAutoSave()
    }
}

const onPause = () => {
    isPlaying.value = false

    // 累加学习时长
    if (studyStartTime.value) {
        totalStudyTime.value += Math.floor((Date.now() - studyStartTime.value) / 1000)
        studyStartTime.value = null // 重置计时
    }

    // 暂停时保存进度
    if (props.autoSave) {
        saveStudyProgress()
    }
}

const onTimeUpdate = (event) => {
    internalCurrentTime.value = event.target.currentTime
    // videoDuration.value = event.target.duration; // 这一行可以在 loadedmetadata 中设置一次即可，避免频繁更新

    // ⚠️ 关键修改：通过 update:video 事件通知父组件更新 progress
    emit('update:video', {
        ...props.video, // 保持 video 对象的其他属性不变
        progress: Math.floor(internalCurrentTime.value), // 更新 progress 属性
        // completed 状态通常不在 timeupdate 实时更新，而是在 onEnded 或 markAsCompleted 中处理
        completed: internalCurrentTime.value >= videoDuration.value * 0.9 // 这里可以实时更新完成状态
    });

    // 原始的 progress-update 事件可以保留，用于传递详细进度数据，但不用于修改 prop
    emit('progress-update', {
        currentTime: internalCurrentTime.value,
        duration: videoDuration.value,
        percent: progressPercent.value
    });
}

const onEnded = () => {
    isPlaying.value = false
    showProgressInfo.value = false

    // 视频播放完成，调用 markAsCompleted 来处理完成逻辑和状态更新
    markAsCompleted()

    // emit('completed', props.video) // 这一行可以删除，因为 markAsCompleted 会最终触发 update:video
}

const onLoadedMetadata = (event) => {
    videoDuration.value = event.target.duration
    // 初始化播放器时，如果 props.video.progress 有值，就用它来设置内部 currentTime
    if (props.video.progress && props.video.progress > 0) {
        internalCurrentTime.value = props.video.progress;
        // 注意：vue3-video-play 会根据 videoOptions.currentTime 自动跳转
        // 所以这里不需要手动设置播放器的当前时间
    }
}

// 自动保存进度
const startAutoSave = () => {
    if (saveTimer.value) {
        clearInterval(saveTimer.value)
    }

    // 每30秒自动保存一次进度
    saveTimer.value = setInterval(() => {
        if (isPlaying.value) {
            saveStudyProgress()
        }
    }, 30000)
}

// 保存学习进度
// 保存学习记录逻辑
const saveStudyProgress = async () => {
    try {
        const currentPlayDuration = studyStartTime.value ?
            Math.floor((Date.now() - studyStartTime.value) / 1000) : 0;

        const studyRecord = {
            userId: props.userId,
            videoId: props.video.id,
            currentPlaybackPosition: Math.floor(internalCurrentTime.value),
            watchDurationSinceLastSave: currentPlayDuration
        };

        await studyRecordAPI.saveStudyRecord(studyRecord);

        // 更新本地状态
        emit('update:video', {
            ...props.video,
            progress: studyRecord.currentPlaybackPosition,
            completed: studyRecord.currentPlaybackPosition >= videoDuration.value * 0.9
        });
    } catch (error) {
        console.error('保存学习进度失败:', error);
    }
}

// 标记完成逻辑
const markAsCompleted = async () => {
    const studyRecord = {
        userId: props.userId,
        videoId: props.video.id,
        currentPlaybackPosition: Math.floor(videoDuration.value),
        watchDurationSinceLastSave: 0 // 标记完成时不增加时长
    };

    await studyRecordAPI.saveStudyRecord(studyRecord);

    emit('update:video', {
        ...props.video,
        progress: studyRecord.currentPlaybackPosition,
        completed: true
    });
}

// 视频切换时获取学习记录
watch(() => props.video.id, async (newVideoId) => {
    const record = await studyRecordAPI.getStudyRecordForVideo(props.userId, newVideoId);

    emit('update:video', {
        ...props.video,
        progress: record.lastPlaybackPosition,
        completed: record.isCompleted
    });
});

// 组件生命周期
onMounted(() => {
    // 初始化内部进度和总学习时长（从props.video中获取，这里假设props.video已经包含了历史学习记录）
    internalCurrentTime.value = props.video.progress || 0;
    totalStudyTime.value = props.video.studyDuration || 0; // 确保这里获取的是累计学习时长
    showProgressInfo.value = false;
})

onUnmounted(() => {
    // 组件销毁时保存进度
    if (isPlaying.value && props.autoSave) {
        saveStudyProgress()
    }

    // 清理定时器
    if (saveTimer.value) {
        clearInterval(saveTimer.value)
    }
})

// 监听视频ID变化，当父组件切换视频时，重置并加载新视频的进度
watch(() => props.video.id, async (newVideoId) => {
    // 只有当 newVideoId 存在且与当前视频 ID 不同时才执行重置和加载
    if (newVideoId && newVideoId !== props.video.id) { // 额外的防御性检查
        // 清理之前的定时器
        if (saveTimer.value) {
            clearInterval(saveTimer.value)
            saveTimer.value = null
        }
        isPlaying.value = false
        showProgressInfo.value = false
        internalCurrentTime.value = 0 // 重置内部播放时间
        videoDuration.value = 0 // 重置视频总时长
        totalStudyTime.value = 0 // 重置累计学习时长

        try {
            // 重新获取新视频的学习记录
            const studyRecord = await studyRecordAPI.getStudyRecord(props.userId, newVideoId);
            const initialProgress = studyRecord?.progress || 0;
            const initialStudyDuration = studyRecord?.duration || 0;

            internalCurrentTime.value = initialProgress;
            totalStudyTime.value = initialStudyDuration;

            // ⚠️ 关键修改：通过 update:video 事件通知父组件新视频的初始进度和完成状态
            // 这确保了父组件的 video.value 对象在切换视频时也更新为新视频的初始状态
            emit('update:video', {
                ...props.video, // 保持其他属性不变
                id: newVideoId, // 更新 ID (重要，因为是新视频)
                progress: initialProgress,
                completed: initialProgress >= props.video.duration * 0.9, // 确保这个判断基于新视频的duration
                studyDuration: initialStudyDuration
            });

            // nextTick 确保 DOM 更新完成后再尝试让播放器跳转
            await nextTick();
            // vue3-video-play 会自动监听 videoOptions.currentTime
            // videoOptions.currentTime 依赖 props.video.progress
            // 所以，当父组件的 video.value.progress 更新后，播放器会自动跳转
            // 这里不需要手动设置播放器的 currentTime
        } catch (error) {
            console.error('加载新视频学习记录失败:', error)
            // 如果获取失败，则发出一个将进度重置为0的 update:video 事件
            emit('update:video', {
                ...props.video,
                id: newVideoId,
                progress: 0,
                completed: false,
                studyDuration: 0
            });
            internalCurrentTime.value = 0;
            totalStudyTime.value = 0;
        }
    }
}, { immediate: true }) // 立即执行一次，确保组件挂载时加载初始视频的进度
</script>

<style scoped>
.video-player-container {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.1);
}

.video-wrapper {
    position: relative;
    background: #000;
}

.custom-video-player {
    width: 100%;
    height: auto;
    min-height: 400px;
}

.progress-overlay {
    position: absolute;
    top: 16px;
    right: 16px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    backdrop-filter: blur(4px);
}

.progress-info {
    display: flex;
    align-items: center;
    gap: 4px;
}

.progress-percent {
    color: #667eea;
    font-weight: bold;
}

.video-info-bar {
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 1px solid #f0f0f0;
}

.video-title {
    font-size: 20px;
    font-weight: 600;
    color: #333;
    margin: 0 0 8px 0;
}

.video-stats {
    display: flex;
    flex-wrap: wrap;
    /* 允许换行 */
    gap: 20px;
    font-size: 14px;
    color: #666;
}

.video-stats span {
    display: flex;
    align-items: center;
    gap: 4px;
}

.video-actions {
    flex-shrink: 0;
}

.study-progress-section {
    padding: 20px;
}

.progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.progress-label {
    font-size: 16px;
    font-weight: 500;
    color: #333;
}

.progress-text {
    font-size: 16px;
    font-weight: 600;
    color: #667eea;
}

.progress-tips {
    margin-top: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #999;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .video-info-bar {
        flex-direction: column;
        gap: 16px;
    }

    .video-stats {
        flex-direction: column;
        gap: 8px;
    }

    .custom-video-player {
        min-height: 250px;
    }

    .progress-overlay {
        top: 8px;
        right: 8px;
        padding: 6px 10px;
        font-size: 10px;
    }

    .video-title {
        font-size: 18px;
    }
}
</style>
