<template>
    <div class="video-detail-container">
        <!-- 返回按钮 -->
        <div class="back-button-container">
            <el-button @click="goBack" type="primary" :icon="ArrowLeft" circle class="back-button" />
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
            <el-skeleton :rows="5" animated />
        </div>

        <!-- 视频详情 -->
        <div v-else-if="video" class="video-detail">
            <!-- 视频播放器 -->
            <div class="video-player-section">
                <VideoPlayer :video="video" @update:video="handleVideoStateUpdate"
                    @progress-update="handleProgressUpdate" @completed="handleVideoCompleted" />
            </div>

            <!-- 番茄钟组件 -->
            <TomatoClock />

            <!-- 侧边栏：同课程的其他视频 -->
            <div class="sidebar" v-if="relatedVideos.length > 0">
                <div class="sidebar-header">
                    <h3>
                        <el-icon>
                            <List />
                        </el-icon>
                        课程目录
                    </h3>
                    <span class="video-count">{{ relatedVideos.length }}个视频</span>
                </div>

                <div class="related-videos">
                    <div v-for="relatedVideo in relatedVideos" :key="relatedVideo.id" class="related-video-item" :class="{
                        'current': relatedVideo.id === video.id,
                        'completed': relatedVideo.completed
                    }" @click="switchVideo(relatedVideo)">
                        <div class="video-thumbnail">
                            <el-icon v-if="relatedVideo.completed" class="completion-badge">
                                <Check />
                            </el-icon>
                            <el-icon v-else class="play-icon">
                                <VideoPlay />
                            </el-icon>
                        </div>

                        <div class="video-info">
                            <h4 class="video-title">{{ relatedVideo.title }}</h4>
                            <div class="video-meta">
                                <span class="duration">{{ formatTime(relatedVideo.duration) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 错误状态 -->
        <el-result v-else icon="warning" title="视频不存在" sub-title="该视频可能已被删除或暂时不可用">
            <template #extra>
                <el-button type="primary" @click="$router.push('/course-home')">
                    返回课程
                </el-button>
            </template>
        </el-result>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { videoAPI, studyRecordAPI } from '../../api'
import VideoPlayer from '../../components/VideoPlayer.vue'
import TomatoClock from '../../components/TomatoClock.vue';
import { ElMessage } from 'element-plus'
import {
    ArrowLeft, List, Check, VideoPlay
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(false)
const video = ref(null)
const relatedVideos = ref([])

// 计算属性
const completedCount = computed(() => {
    return relatedVideos.value.filter(v => v.completed).length
})

const overallProgress = computed(() => {
    if (relatedVideos.value.length === 0) return 0
    return Math.round((completedCount.value / relatedVideos.value.length) * 100)
})

// 格式化时间
const formatTime = (seconds) => {
    if (!seconds || seconds === 0) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 获取视频详情
const fetchVideoDetail = async (videoId) => {
    try {
        // ✅ 修改：不再需要用户ID参数
        const [videoResponse, studyRecordResponse] = await Promise.all([
            videoAPI.getVideoDetail(videoId),
            studyRecordAPI.getStudyRecordForVideo(videoId)
        ]);

        video.value = {
            ...videoResponse.data,
            progress: studyRecordResponse.data?.lastPlaybackPosition || 0,
            completed: studyRecordResponse.data?.isCompleted || false
        };

        // 获取相关视频
        if (videoResponse.data?.courseId) {
            await fetchRelatedVideos(videoResponse.data.courseId);
        }
    } catch (error) {
        console.error('获取视频详情失败:', error);
        ElMessage.error('获取视频详情失败: ' + (error.message || '未知错误'));
    }
};

// 获取相关视频（同课程）
const fetchRelatedVideos = async (courseId) => {
    try {
        // ✅ 修改：不再需要用户ID参数
        const response = await videoAPI.getVideosByCourse(courseId);
        const videos = response.data || [];

        // 为每个视频加载学习进度
        const videosWithProgress = await Promise.all(
            videos.map(async (v) => {
                try {
                    // ✅ 修改：不再需要用户ID参数
                    const recordResponse = await studyRecordAPI.getStudyRecord(v.id);
                    return {
                        ...v,
                        progress: recordResponse.data?.progress || 0,
                        completed: recordResponse.data ?
                            (recordResponse.data.progress >= v.duration * 0.9) : false,
                        studyDuration: recordResponse.data?.duration || 0
                    }
                } catch (error) {
                    console.error(`获取视频${v.id}学习记录失败:`, error);
                    return {
                        ...v,
                        progress: 0,
                        completed: false,
                        studyDuration: 0
                    }
                }
            })
        )

        relatedVideos.value = videosWithProgress.sort((a, b) => a.sort - b.sort)
    } catch (error) {
        console.error('获取相关视频失败:', error)
        ElMessage.error('获取相关视频失败: ' + (error.message || '未知错误'));
    }
}

// 切换视频
const switchVideo = (newVideo) => {
    if (newVideo.id === video.value.id) return
    router.push(`/video/${newVideo.id}`)
}

// 处理视频状态更新
const handleVideoStateUpdate = (updatedVideo) => {
    video.value = updatedVideo;

    // 更新相关视频列表中的状态
    const index = relatedVideos.value.findIndex(v => v.id === updatedVideo.id);
    if (index !== -1) {
        relatedVideos.value[index] = {
            ...relatedVideos.value[index],
            ...updatedVideo
        };
    }
}

// 处理进度更新
const handleProgressUpdate = (progressData) => {
    // 可以在这里添加额外的进度处理逻辑
}

// 处理视频完成
const handleVideoCompleted = (completedVideo) => {
    ElMessage.success({
        message: '恭喜完成视频学习！🎉',
        duration: 3000
    })

    // 自动播放下一个视频
    const currentIndex = relatedVideos.value.findIndex(v => v.id === completedVideo.id)
    const nextVideo = relatedVideos.value[currentIndex + 1]

    if (nextVideo && !nextVideo.completed) {
        ElMessage({
            message: '3秒后将自动播放下一个视频...',
            type: 'info',
            duration: 3000
        })

        setTimeout(() => {
            switchVideo(nextVideo)
        }, 3000)
    }
}

// 返回处理
const goBack = () => {
    if (video.value && video.value.courseId) {
        router.push(`/course/${video.value.courseId}`)
    } else {
        router.back()
    }
}

// 生命周期
onMounted(() => {
    const videoId = parseInt(route.params.id)
    if (videoId) {
        loading.value = true;
        fetchVideoDetail(videoId).finally(() => {
            loading.value = false;
        });
    }
})

// 监听路由变化
watch(() => route.params.id, (newId) => {
    if (newId && parseInt(newId) !== video.value?.id) {
        loading.value = true;
        fetchVideoDetail(parseInt(newId)).finally(() => {
            loading.value = false;
        });
    }
})
</script>

<style scoped>
.video-detail-container {
    max-width: 1400px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 350px;
    gap: 24px;
    padding: 0;
}

.back-button-container {
    grid-column: 1 / -1;
    margin-bottom: 16px;
}

.back-button {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(102, 126, 234, 0.2);
    color: #667eea;
    box-shadow: 0 4px 10px rgba(102, 126, 234, 0.1);
    font-size: 16px;
    width: 44px;
    height: 44px;
}

.back-button:hover {
    background: #667eea;
    color: white;
    border-color: #667eea;
}

.loading-container {
    grid-column: 1 / -1;
    padding: 40px 0;
}

.video-detail {
    display: contents;
    /* 确保子元素直接参与父网格布局 */
}

.video-player-section {
    grid-column: 1;
}

.sidebar {
    grid-column: 2;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 20px;
    height: fit-content;
    border: 1px solid rgba(102, 126, 234, 0.1);
    position: sticky;
    /* 粘性定位，随滚动 */
    top: 90px;
    /* 距离顶部导航栏的距离 */
    overflow: hidden;
    /* 防止内部内容溢出 */
}

.sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(102, 126, 234, 0.1);
}

.sidebar-header h3 {
    margin: 0;
    font-size: 18px;
    color: #333;
    display: flex;
    align-items: center;
    gap: 8px;
}

.video-count {
    font-size: 12px;
    color: #999;
    background: rgba(102, 126, 234, 0.1);
    padding: 4px 8px;
    border-radius: 12px;
}

.related-videos {
    max-height: 400px;
    /* 固定高度，可滚动 */
    overflow-y: auto;
    margin-bottom: 20px;
}

.related-video-item {
    display: flex;
    gap: 12px;
    padding: 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-bottom: 8px;
}

.related-video-item:hover {
    background: rgba(102, 126, 234, 0.05);
}

.related-video-item.current {
    background: rgba(102, 126, 234, 0.1);
    border: 1px solid rgba(102, 126, 234, 0.3);
}

.related-video-item.completed {
    opacity: 0.8;
}

.video-thumbnail {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    background: rgba(102, 126, 234, 0.1);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

.completion-badge {
    color: #52c41a;
    font-size: 20px;
}

.play-icon {
    color: #667eea;
    font-size: 16px;
}

.video-info {
    flex: 1;
    min-width: 0;
}

.video-info .video-title {
    font-size: 14px;
    font-weight: 500;
    margin: 0 0 4px 0;
    color: #333;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.video-meta {
    font-size: 12px;
    color: #999;
    display: flex;
    gap: 12px;
    margin-bottom: 4px;
}

.mini-progress {
    margin-top: 4px;
}

.course-progress-summary {
    border-top: 1px solid rgba(102, 126, 234, 0.1);
    padding-top: 16px;
}

.summary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.overall-percent {
    font-size: 18px;
    font-weight: bold;
    color: #667eea;
}

.progress-stats {
    font-size: 12px;
    color: #999;
    margin-top: 8px;
}

/* 响应式设计 */
@media (max-width: 992px) {
    .video-detail-container {
        grid-template-columns: 1fr;
        /* 单列布局 */
        gap: 30px;
    }

    .sidebar {
        position: static;
        /* 取消粘性定位 */
        max-height: 500px;
        /* 限制高度，允许滚动 */
    }
}

@media (max-width: 768px) {
    .sidebar {
        padding: 15px;
    }

    .sidebar-header h3 {
        font-size: 16px;
    }

    .related-video-item {
        padding: 8px;
    }

    .video-info .video-title {
        font-size: 13px;
    }
}
</style>
