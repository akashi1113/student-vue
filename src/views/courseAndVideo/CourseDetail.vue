<template>
    <div class="course-detail-container">
        <!-- 返回按钮 -->
        <div class="back-button-container">
            <el-button @click="$router.back()" type="primary" :icon="ArrowLeft" circle class="back-button" />
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
            <el-skeleton :rows="5" animated />
        </div>

        <!-- 课程详情 -->
        <div v-else-if="course" class="course-detail">
            <!-- 课程头部信息 -->
            <div class="course-header">
                <div class="course-cover">
                    <img :src="course.coverImg || defaultCoverImg" :alt="course.title" @error="handleImageError" />
                </div>

                <div class="course-info">
                    <h1 class="course-title">{{ course.title }}</h1>
                    <p class="course-description">{{ course.description || '暂无描述' }}</p>

                    <div class="course-stats">
                        <div class="stat-item">
                            <el-icon>
                                <User />
                            </el-icon>
                            <span>讲师：{{ course.teacherName || '未知讲师' }}</span>
                        </div>
                        <div class="stat-item">
                            <el-icon>
                                <VideoCamera />
                            </el-icon>
                            <span>视频数量：{{ course.videoCount || 0 }}</span>
                        </div>
                        <div class="stat-item" v-if="course.studyProgress !== undefined">
                            <el-icon>
                                <TrendCharts />
                            </el-icon>
                            <span>学习进度：{{ course.studyProgress }}%</span>
                        </div>
                    </div>

                    <div class="course-progress-bar" v-if="course.studyProgress !== undefined">
                        <el-progress :percentage="course.studyProgress" :stroke-width="8" color="#667eea" />
                    </div>
                </div>
            </div>

            <!-- 番茄钟组件 -->
            <TomatoClock />

            <!-- 视频列表 -->
            <div class="videos-section">
                <h2 class="section-title">
                    <el-icon>
                        <Collection />
                    </el-icon>
                    课程视频 ({{ videoList.length }})
                </h2>

                <div v-if="videosLoading" class="loading-container">
                    <el-skeleton :rows="3" animated />
                </div>

                <VideoList v-else :videos="videoList" @video-click="playVideo" />

                <el-empty v-if="!videosLoading && videoList.length === 0" description="该课程暂无视频内容" />
            </div>
        </div>

        <!-- 错误状态 -->
        <el-result v-else icon="warning" title="课程不存在" sub-title="该课程可能已被删除或暂时不可用">
            <template #extra>
                <el-button type="primary" @click="$router.push('/course-home')">
                    返回课程
                </el-button>
            </template>
        </el-result>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { courseAPI, videoAPI, studyRecordAPI } from '../../api'
import VideoList from '../../components/VideoList.vue' // 引入视频列表组件
import TomatoClock from '../../components/TomatoClock.vue'; // 引入番茄钟组件
import { ElMessage } from 'element-plus'
import {
    ArrowLeft, User, VideoCamera, TrendCharts, Collection
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(false)
const videosLoading = ref(false)
const course = ref(null)
const videoList = ref([])

// 默认封面图 (和 CourseCard 保持一致)
const defaultCoverImg = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSJsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCAjNjY3ZWVhIDAlLCAjNzY0YmEyIDEwMCUpIi8+CjxjaXJjbGUgY3g9IjE2MCIgY3k9IjkwIiByPSIzMCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjMpIi8+Cjxwb2x5Z29uIHBvaW50cz0iMTQ1LDc1IDE0NSw5NSAxNzUsODUuNSIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuOCIvPgo8L3N2Zz4='

// 处理图片加载错误
const handleImageError = (event) => {
    event.target.src = defaultCoverImg
}

// // 获取课程详情
// const fetchCourseDetail = async () => {
//     loading.value = true
//     try {
//         const courseId = parseInt(route.params.id)
//         if (isNaN(courseId)) {
//             ElMessage.error('课程ID无效')
//             course.value = null
//             return
//         }

//         // ✅ 修改：不再传递userId
//         const response = await courseAPI.getCourseDetail(courseId)
//         course.value = response.data

//         if (course.value) {
//             await fetchVideosByCourse(courseId)
//         }
//     } catch (error) {
//         ElMessage.error('获取课程详情失败：' + (error.message || '未知错误'))
//         course.value = null
//     } finally {
//         loading.value = false
//     }
// }

// 获取课程详情
const fetchCourseDetail = async () => {
    loading.value = true
    try {
        const courseId = parseInt(route.params.id)
        if (isNaN(courseId)) {
            ElMessage.error('课程ID无效')
            course.value = null
            return
        }
        // 调用API获取课程详情
        const response = await courseAPI.getCourseDetail(courseId)
        course.value = response   // 修改点：直接使用response，因为拦截器已经返回了data.data（即课程对象）
        if (course.value) {
            await fetchVideosByCourse(courseId)
        }
    } catch (error) {
        ElMessage.error('获取课程详情失败：' + (error.message || '未知错误'))
        course.value = null
    } finally {
        loading.value = false
    }
}

// // 获取课程视频列表
// const fetchVideosByCourse = async (courseId) => {
//     videosLoading.value = true
//     try {
//         // ✅ 修改：不再传递userId
//         const response = await videoAPI.getVideosByCourse(courseId)
//         const videos = response.data || []

//         // 并行获取每个视频的学习记录
//         videoList.value = await Promise.all(videos.map(async v => {
//             try {
//                 // ✅ 修改：不再传递userId
//                 const recordResponse = await studyRecordAPI.getStudyRecordForVideo(v.id)
//                 return {
//                     ...v,
//                     progress: recordResponse.data.lastPlaybackPosition || 0,
//                     completed: recordResponse.data.isCompleted || false
//                 }
//             } catch (error) {
//                 console.error(`获取视频${v.id}学习记录失败:`, error)
//                 return {
//                     ...v,
//                     progress: 0,
//                     completed: false
//                 }
//             }
//         }))
//     } catch (error) {
//         ElMessage.error('获取视频列表失败：' + (error.message || '未知错误'))
//         videoList.value = []
//     } finally {
//         videosLoading.value = false
//     }
// }

// 获取课程视频列表
const fetchVideosByCourse = async (courseId) => {
    videosLoading.value = true
    try {
        const response = await videoAPI.getVideosByCourse(courseId)
        const videos = response || []   // 修改点：直接使用response，因为拦截器返回了data.data（视频列表数组）
        // 并行获取每个视频的学习记录
        videoList.value = await Promise.all(videos.map(async v => {
            try {
                const recordResponse = await studyRecordAPI.getStudyRecordForVideo(v.id)
                // 注意：recordResponse 已经是学习记录对象了（即后端返回的data.data）
                return {
                    ...v,
                    progress: recordResponse.lastPlaybackPosition || 0,
                    completed: recordResponse.isCompleted || false
                }
            } catch (error) {
                console.error(`获取视频${v.id}学习记录失败:`, error)
                return {
                    ...v,
                    progress: 0,
                    completed: false
                }
            }
        }))
    } catch (error) {
        ElMessage.error('获取视频列表失败：' + (error.message || '未知错误'))
        videoList.value = []
    } finally {
        videosLoading.value = false
    }
}

// 播放视频（保持不变）
const playVideo = (videoId) => {
    router.push(`/video/${videoId}`)
}

onMounted(() => {
    fetchCourseDetail()
})
</script>

<style scoped>
.course-detail-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0;
}

.back-button-container {
    margin-bottom: 24px;
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
    padding: 60px 0;
}

.course-detail {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 40px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 30px rgba(102, 126, 234, 0.15);
}

.course-header {
    display: flex;
    gap: 40px;
    margin-bottom: 40px;
}

.course-cover {
    flex-shrink: 0;
    width: 380px;
    height: 250px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.course-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.course-info {
    flex: 1;
}

.course-title {
    font-size: 36px;
    font-weight: 700;
    color: #333;
    margin: 0 0 16px 0;
}

.course-description {
    font-size: 16px;
    color: #555;
    line-height: 1.6;
    margin-bottom: 24px;
}

.course-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    margin-bottom: 24px;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    color: #666;
}

.stat-item .el-icon {
    font-size: 18px;
    color: #667eea;
}

.course-progress-bar {
    margin-top: 16px;
}

.videos-section {
    padding-top: 40px;
    border-top: 1px solid #eee;
}

.section-title {
    font-size: 24px;
    font-weight: 600;
    color: #667eea;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 12px;
}

/* 响应式设计 */
@media (max-width: 992px) {
    .course-header {
        flex-direction: column;
        gap: 30px;
    }

    .course-cover {
        width: 100%;
        height: 220px;
    }

    .course-title {
        font-size: 30px;
    }
}

@media (max-width: 768px) {
    .course-detail {
        padding: 30px 20px;
    }

    .course-title {
        font-size: 24px;
    }

    .course-description {
        font-size: 14px;
    }

    .section-title {
        font-size: 20px;
    }
}
</style>
