<template>
    <div class="video-player-container">
        <div class="video-wrapper">
            <!-- 视频播放器 -->
            <vue3VideoPlay ref="videoPlayerRef" v-bind="videoOptions" @play="onPlay" @pause="onPause"
                @timeupdate="onTimeUpdate" @ended="onEnded" @loadedmetadata="onLoadedMetadata"
                class="custom-video-player" />
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
                <el-button type="primary" :icon="video.completed ? Check : VideoPlay" :disabled="video.completed"
                    @click="markAsCompleted" class="complete-btn">
                    {{ video.completed ? '已完成' : '标记完成' }}
                </el-button>
            </div>
        </div>

        <!-- 学习进度信息 -->
        <div class="progress-info-card">
            <div class="progress-info-content">
                <div class="progress-icon">
                    <el-icon>
                        <Clock />
                    </el-icon>
                </div>
                <div class="progress-text">
                    <div class="progress-header">
                        <span class="progress-label">当前学习进度</span>
                        <span class="progress-percent">{{ progressPercent }}%</span>
                    </div>
                    <div class="progress-time">
                        已学习: {{ formatTime(internalCurrentTime) }} / {{ formatTime(videoDuration) }}
                    </div>
                </div>
            </div>
            <el-progress :percentage="progressPercent" :stroke-width="6" color="#667eea" :show-text="false" />
        </div>

        <!-- 学习提示 -->
        <div class="progress-tips">
            <el-icon>
                <InfoFilled />
            </el-icon>
            <span>观看进度会自动保存，下次可从断点继续观看</span>
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

// 关键修改：添加播放器引用
const videoPlayerRef = ref(null)

// 关键修改：优化加载元数据逻辑
const onLoadedMetadata = async (event) => {
    videoDuration.value = event.target.duration

    // 确保优先使用传入的进度
    const initialTime = props.video.progress > 0
        ? props.video.progress
        : internalCurrentTime.value

    // 设置播放器时间（核心修复）
    await nextTick()
    if (videoPlayerRef.value?.player) {
        videoPlayerRef.value.player.currentTime(initialTime)
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
            videoDuration: Math.floor(videoDuration.value), // 视频总时长（秒）
            watchDurationSinceLastSave: currentPlayDuration,
            progress: Math.floor(internalCurrentTime.value)
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
        watchDurationSinceLastSave: 0,// 标记完成时不增加时长
        videoDuration: Math.floor(videoDuration.value), // 视频总时长（秒）
        progress: Math.floor(internalCurrentTime.value)
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

// 关键修改：简化视频切换处理
watch(() => props.video.id, async (newVideoId) => {
    // 清理状态
    if (saveTimer.value) clearInterval(saveTimer.value)
    isPlaying.value = false
    showProgressInfo.value = false
    internalCurrentTime.value = 0
    videoDuration.value = 0

    try {
        // 获取新视频的学习记录
        const studyRecord = await studyRecordAPI.getStudyRecordForVideo(props.userId, newVideoId)
        const initialProgress = studyRecord.lastPlaybackPosition || 0

        // 更新父组件状态
        emit('update:video', {
            ...props.video,
            id: newVideoId,
            progress: initialProgress,
            completed: studyRecord.isCompleted || false
        })

        // 确保播放器跳转到正确位置
        await nextTick()
        if (videoPlayerRef.value?.player) {
            videoPlayerRef.value.player.currentTime(initialProgress)
        }
    } catch (error) {
        console.error('加载学习记录失败:', error)
        ElMessage.error('加载学习记录失败')

        // 重置状态
        emit('update:video', {
            ...props.video,
            id: newVideoId,
            progress: 0,
            completed: false
        })
    }
})
</script>

<style scoped>
.video-player-container {
    background: white;
    align-content: center;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 6px 30px rgba(102, 126, 234, 0.15);
    transition: all 0.3s ease;
}

.video-player-container:hover {
    box-shadow: 0 10px 40px rgba(102, 126, 234, 0.2);
}

.video-wrapper {
    position: relative;
    background: #ffff;
    border-radius: 16px 16px 0 0;
    overflow: hidden;
    display: flex;
    /* 新增 */
    justify-content: center;
    /* 新增 */
    align-items: center;
    /* 新增 */
}

.custom-video-player {
    width: 100%;
    height: auto;
    /* 高度自适应 */
    max-height: 100%;
    /* 新增：确保高度不超过容器 */
    min-height: 400px;
    border-radius: 16px 16px 0 0;
}

.video-info-bar {
    padding: 20px 24px 16px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    background: linear-gradient(to bottom, #f9faff, #ffffff);
    border-bottom: 1px solid #f0f2f7;
}

.video-title {
    font-size: 22px;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0 0 10px 0;
    letter-spacing: -0.3px;
}

.video-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    font-size: 14px;
    color: #5a6c8d;
}

.video-stats span {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(102, 126, 234, 0.08);
    padding: 6px 12px;
    border-radius: 20px;
}

.video-actions {
    flex-shrink: 0;
}

.complete-btn {
    padding: 10px 20px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    transition: all 0.3s ease;
}

.complete-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

/* 进度信息卡片 - 新增样式 */
.progress-info-card {
    background: white;
    padding: 20px 24px;
    border-bottom: 1px solid #f0f2f7;
}

.progress-info-content {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 15px;
}

.progress-icon {
    width: 44px;
    height: 44px;
    background: rgba(102, 126, 234, 0.1);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.progress-icon .el-icon {
    font-size: 22px;
    color: #667eea;
}

.progress-text {
    flex: 1;
}

.progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
}

.progress-label {
    font-size: 16px;
    font-weight: 600;
    color: #2d3748;
}

.progress-percent {
    font-size: 20px;
    font-weight: 700;
    color: #667eea;
}

.progress-time {
    font-size: 14px;
    color: #718096;
    background: rgba(113, 128, 150, 0.05);
    padding: 6px 12px;
    border-radius: 8px;
    display: inline-block;
}

/* 学习提示 */
.progress-tips {
    padding: 18px 24px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: #718096;
    background: #f8fafc;
    border-top: 1px solid #edf2f7;
    border-radius: 0 0 16px 16px;
}

.progress-tips .el-icon {
    color: #667eea;
    font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 992px) {
    .video-title {
        font-size: 20px;
    }

    .custom-video-player {
        min-height: 350px;
    }
}

@media (max-width: 768px) {
    .video-info-bar {
        flex-direction: column;
        gap: 16px;
        padding: 16px;
    }

    .video-stats {
        flex-direction: column;
        gap: 10px;
    }

    .video-stats span {
        width: fit-content;
    }

    .video-title {
        font-size: 18px;
    }

    .progress-info-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }

    .progress-header {
        width: 100%;
    }

    .progress-percent {
        font-size: 18px;
    }

    .custom-video-player {
        min-height: 250px;
    }

    .progress-info-card,
    .progress-tips {
        padding: 16px;
    }
}

@media (max-width: 480px) {
    .video-title {
        font-size: 17px;
    }

    .progress-label {
        font-size: 15px;
    }

    .progress-percent {
        font-size: 17px;
    }

    .progress-time {
        font-size: 13px;
    }

    .complete-btn {
        width: 100%;
    }
}
</style>