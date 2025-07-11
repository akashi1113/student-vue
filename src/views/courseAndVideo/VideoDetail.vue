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

            <!-- 新增：AI助手按钮 -->
            <el-button class="ai-assistant-button" type="primary" :icon="ChatRound" circle
                @click="showChatDialog = true" />

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

    <!-- 新增：AI助手对话框 -->
    <el-dialog v-model="showChatDialog" title="AI学习助手" width="500px" :close-on-click-modal="false">
        <div class="ai-chat-container">
            <div class="messages">
                <div v-for="(msg, index) in chatMessages" :key="index" class="message" :class="msg.role">
                    <div class="avatar">
                        <el-icon v-if="msg.role === 'assistant'">
                            <Avatar />
                        </el-icon>
                        <el-icon v-else>
                            <User />
                        </el-icon>
                    </div>
                    <div class="content">
                        <div class="name">{{ msg.role === 'assistant' ? '小光球' : '我' }}</div>
                        <div class="text">{{ msg.content }}</div>
                    </div>
                </div>
                <div v-if="aiLoading" class="message assistant">
                    <div class="avatar">
                        <el-icon>
                            <Avatar />
                        </el-icon>
                    </div>
                    <div class="content">
                        <div class="name">小光球</div>
                        <div class="text">
                            <el-icon class="loading-icon">
                                <Loading />
                            </el-icon> 思考中...
                        </div>
                    </div>
                </div>
            </div>
            <div class="input-area">
                <el-input v-model="userInput" placeholder="有什么想提问的吗？" :disabled="aiLoading" @keyup.enter="sendMessage">
                    <template #append>
                        <el-button :icon="Promotion" @click="sendMessage" :disabled="aiLoading || !userInput.trim()" />
                    </template>
                </el-input>
                <div class="suggestions">
                    <el-tag v-for="(suggestion, idx) in quickSuggestions" :key="idx"
                        @click="selectSuggestion(suggestion)" effect="plain">
                        {{ suggestion }}
                    </el-tag>
                </div>
            </div>
        </div>
    </el-dialog>

</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { videoAPI, studyRecordAPI } from '../../api'
import VideoPlayer from '../../components/VideoPlayer.vue'
import TomatoClock from '../../components/TomatoClock.vue';
import { ElMessage } from 'element-plus'
import {
    ArrowLeft, List, Check, VideoPlay
} from '@element-plus/icons-vue'
import { MagicStick, ChatRound, Avatar, User, Promotion, Loading } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(false)
const video = ref(null)
const relatedVideos = ref([])

// 新增响应式数据
const videoSummary = ref('')
const summaryLoading = ref(false)
const showFullSummary = ref(false)
const showChatDialog = ref(false)
const userInput = ref('')
const chatMessages = ref([])
const aiLoading = ref(false)
const quickSuggestions = ref([
    '你是谁',
    '计算机网络怎么理解？'
])

// 计算摘要长度
const summaryLength = computed(() => {
    return videoSummary.value ? videoSummary.value.length : 0
})

// 获取视频摘要
const fetchVideoSummary = async () => {
    if (!video.value || !video.value.id) return

    summaryLoading.value = true
    try {
        // 调用后端API获取视频摘要
        const response = await videoAPI.getVideoSummary(video.value.id)
        videoSummary.value = response.summary || '暂无总结内容'
    } catch (error) {
        console.error('获取视频摘要失败:', error)
        videoSummary.value = '获取摘要失败，请稍后再试'
    } finally {
        summaryLoading.value = false
    }
}

// 发送消息给AI
const sendMessage = async () => {
    if (!userInput.value.trim() || aiLoading.value) return

    const message = userInput.value.trim()
    userInput.value = ''

    // 添加用户消息
    chatMessages.value.push({
        role: 'user',
        content: message
    })

    // 滚动到底部
    scrollToBottom()

    aiLoading.value = true

    try {
        // 调用后端AI聊天API
        const response = await videoAPI.chatWithAI({
            videoId: video.value.id,
            message: message
        })

        // 添加AI回复
        chatMessages.value.push({
            role: 'assistant',
            content: response.reply
        })
    } catch (error) {
        console.error('AI请求失败:', error)
        chatMessages.value.push({
            role: 'assistant',
            content: '抱歉，暂时无法回答这个问题，请稍后再试。'
        })
    } finally {
        aiLoading.value = false
        scrollToBottom()
    }
}

// 滚动到底部
const scrollToBottom = () => {
    nextTick(() => {
        const container = document.querySelector('.messages')
        if (container) {
            container.scrollTop = container.scrollHeight
        }
    })
}

// 选择快捷建议
const selectSuggestion = (suggestion) => {
    userInput.value = suggestion
    sendMessage()
}

// 监听视频变化
watch(() => video.value, (newVideo) => {
    if (newVideo) {
        fetchVideoSummary()
        // 重置聊天
        chatMessages.value = [{
            role: 'assistant',
            content: `你好！我是你的学习助手小光球。关于《${newVideo.title}》有什么问题吗？`
        }]
    }
}, { immediate: true, deep: true })

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

// 关键修改：确保正确获取和传递学习记录
const fetchVideoDetail = async (videoId) => {
    try {
        loading.value = true;

        // 并行请求视频详情和学习记录
        const [videoResponse, studyRecordResponse] = await Promise.all([
            videoAPI.getVideoDetail(videoId),
            studyRecordAPI.getStudyRecordForVideo(videoId) // 确保API调用正确
        ]);

        // 确保正确解析响应（根据实际API响应结构调整）
        const videoData = videoResponse.data || videoResponse;
        const recordData = studyRecordResponse.data || studyRecordResponse;

        // 确保学习记录正确赋值
        video.value = {
            ...videoData,
            progress: recordData.lastPlaybackPosition || 0,
            completed: recordData.isCompleted || false
        };

        // 获取相关视频
        if (videoData.courseId) {
            await fetchRelatedVideos(videoData.courseId);
        }
    } catch (error) {
        console.error('获取视频详情失败:', error);
        ElMessage.error('获取视频详情失败: ' + (error.message || '未知错误'));

        // 设置默认值
        video.value = {
            id: parseInt(videoId),
            title: '加载失败',
            duration: 0,
            progress: 0,
            completed: false
        }
    } finally {
        loading.value = false;
    }
};

// 获取相关视频（同课程）
const fetchRelatedVideos = async (courseId) => {
    try {
        // ✅ 修改：不再需要用户ID参数
        console.log(`获取课程${courseId}的相关视频`);
        const response = await videoAPI.getVideosByCourse(courseId);
        const videos = response || [];

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
/* AI总结样式 */
.ai-summary {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 20px;
    margin-top: 24px;
    border: 1px solid rgba(102, 126, 234, 0.15);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.08);
}

.ai-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
}

.ai-header h3 {
    margin: 0;
    font-size: 18px;
    color: #333;
    flex-grow: 1;
}

.summary-content {
    font-size: 15px;
    line-height: 1.6;
    color: #555;
    transition: max-height 0.3s ease;
}

.summary-collapsed {
    max-height: 60px;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.summary-footer {
    margin-top: 12px;
    font-size: 13px;
    color: #999;
    text-align: right;
}

/* AI助手按钮 */
.ai-assistant-button {
    position: fixed;
    right: 40px;
    /* 调整位置避免遮挡 */
    bottom: 40px;
    /* 调整位置避免遮挡 */
    width: 80px;
    /* 从60px增加到80px */
    height: 80px;
    /* 从60px增加到80px */
    font-size: 32px;
    /* 从24px增加到32px */
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.3);
    z-index: 1000;
    transition: transform 0.3s ease;
    /* 添加悬停动画 */
}

.ai-assistant-button:hover {
    transform: scale(1.1);
    /* 悬停时轻微放大 */
}

/* AI聊天对话框 */
.ai-chat-container {
    height: 500px;
    display: flex;
    flex-direction: column;
}

.messages {
    flex: 1;
    overflow-y: auto;
    padding: 10px 0;
    margin-bottom: 15px;
    border-bottom: 1px solid #eee;
}

.message {
    display: flex;
    margin-bottom: 20px;
}

.message.user {
    flex-direction: row-reverse;
}

.avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(102, 126, 234, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin: 0 12px;
}

.avatar .el-icon {
    font-size: 18px;
    color: #667eea;
}

.content {
    max-width: 75%;
}

.message.user .content {
    text-align: right;
}

.name {
    font-size: 12px;
    color: #999;
    margin-bottom: 5px;
}

.text {
    padding: 12px 16px;
    border-radius: 18px;
    background: #f5f7fa;
    line-height: 1.5;
    display: inline-block;
}

.message.user .text {
    background: #667eea;
    color: white;
}

.loading-icon {
    animation: rotate 1s linear infinite;
    margin-right: 5px;
}

@keyframes rotate {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.input-area {
    position: relative;
}

.suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
}

.suggestions .el-tag {
    cursor: pointer;
    transition: all 0.2s;
}

.suggestions .el-tag:hover {
    background: rgba(102, 126, 234, 0.1);
    border-color: rgba(102, 126, 234, 0.3);
}

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