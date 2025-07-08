<template>
    <div class="video-list-container">
        <el-collapse v-model="activeNames" accordion>
            <el-collapse-item v-for="(video, index) in videos" :key="video.id" :name="video.id">
                <template #title>
                    <div class="video-item-title">
                        <span class="video-index">{{ index + 1 }}.</span>
                        <span class="video-name">{{ video.title }}</span>
                        <div class="video-meta-summary">
                            <el-tag :type="video.completed ? 'success' : 'info'" size="small" effect="plain">
                                {{ video.completed ? '已完成' : '未完成' }}
                            </el-tag>
                            <el-progress v-if="!video.completed && video.progress !== undefined && video.duration > 0"
                                :percentage="Math.round((video.progress / video.duration) * 100)" :stroke-width="4"
                                color="#667eea" :show-text="false" class="mini-progress" />
                            <span class="video-duration">{{ formatTime(video.duration) }}</span>
                        </div>
                        <el-icon class="header-icon">
                            <Right />
                        </el-icon>
                    </div>
                </template>
                <div class="video-item-content">
                    <p class="content-description">
                        这是一个视频的简介，您可以点击下方的按钮开始观看。
                        本视频时长为 {{ formatTime(video.duration) }}。
                    </p>
                    <div class="content-actions">
                        <el-button type="primary" :icon="VideoPlay" @click="$emit('video-click', video.id)">
                            立即观看
                        </el-button>
                        <span v-if="video.progress > 0 && !video.completed" class="current-progress-text">
                            上次观看至: {{ formatTime(video.progress) }}
                        </span>
                    </div>
                </div>
            </el-collapse-item>
        </el-collapse>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { VideoPlay, Right } from '@element-plus/icons-vue'

defineProps({
    videos: {
        type: Array,
        default: () => []
    }
})

defineEmits(['video-click'])

const activeNames = ref([]) // 默认不展开任何项

// 格式化时间显示
const formatTime = (seconds) => {
    if (!seconds || seconds === 0) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.video-list-container {
    margin-top: 20px;
}

.video-item-title {
    flex: 1;
    display: flex;
    align-items: center;
    font-size: 16px;
    color: #333;
    padding-right: 15px;
    /* 防止文本被箭头覆盖 */
}

.video-index {
    font-weight: bold;
    color: #667eea;
    margin-right: 12px;
    flex-shrink: 0;
}

.video-name {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 500;
}

.video-meta-summary {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-left: 20px;
    flex-shrink: 0;
}

.video-meta-summary .el-progress {
    width: 60px;
    /* 进度条宽度 */
}

.video-duration {
    font-size: 13px;
    color: #999;
}

.header-icon {
    font-size: 18px;
    color: #667eea;
    transition: transform 0.3s ease;
}

/* Element Plus Collapse 组件默认样式覆盖 */
:deep(.el-collapse-item__header) {
    height: 60px;
    padding: 0 20px;
    background-color: white;
    border-radius: 12px;
    margin-bottom: 10px;
    border: 1px solid rgba(102, 126, 234, 0.1);
    box-shadow: 0 2px 10px rgba(102, 126, 234, 0.05);
    transition: all 0.3s ease;
}

:deep(.el-collapse-item__header.is-active) {
    background-color: rgba(102, 126, 234, 0.05);
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
}

:deep(.el-collapse-item__header.is-active .header-icon) {
    transform: rotate(90deg);
}

:deep(.el-collapse-item__wrap) {
    background-color: white;
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
    margin-bottom: 10px;
    border: 1px solid rgba(102, 126, 234, 0.1);
    border-top: none;
    box-shadow: 0 2px 10px rgba(102, 126, 234, 0.05);
}

:deep(.el-collapse-item__content) {
    padding: 20px;
    line-height: 1.6;
    color: #555;
    font-size: 14px;
}

.content-description {
    margin-bottom: 15px;
}

.content-actions {
    display: flex;
    align-items: center;
    gap: 15px;
}

.current-progress-text {
    font-size: 13px;
    color: #667eea;
    font-weight: 500;
}
</style>
