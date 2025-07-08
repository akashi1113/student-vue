<template>
    <el-card class="course-card" shadow="hover" @click="goToCourseDetail">
        <div class="card-image-wrapper">
            <img :src="course.coverImg || defaultCoverImg" :alt="course.title" class="card-image"
                @error="handleImageError" />
            <div class="video-count-overlay" v-if="course.videoCount !== undefined">
                <el-icon>
                    <video-camera /> <!-- 将 <VideoCamera /> 改为 <video-camera /> -->
                </el-icon>
                <span>{{ course.videoCount }}节</span>
            </div>
            <div class="study-progress-overlay" v-if="course.studyProgress !== undefined">
                <el-progress :percentage="course.studyProgress" :stroke-width="5" :text-inside="true" color="#667eea" />
            </div>
        </div>
        <div class="card-content">
            <h3 class="card-title">{{ course.title }}</h3>
            <p class="card-description">{{ course.description || '暂无描述' }}</p>
            <div class="card-footer">
                <span class="teacher-name">
                    <el-icon>
                        <user /> <!-- 将 <User /> 改为 <user /> -->
                    </el-icon> {{ course.teacherName || '未知讲师' }}
                </span>
                <el-button type="primary" size="small" :icon="Right" circle />
            </div>
        </div>
    </el-card>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { User, VideoCamera, Right } from '@element-plus/icons-vue'

const props = defineProps({
    course: {
        type: Object,
        required: true,
        default: () => ({})
    }
})

const router = useRouter()

// 默认封面图 (用于图片加载失败或无封面时显示)
const defaultCoverImg = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSJsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCAjNjY3ZWVhIDAlLCAjNzY0YmEyIDEwMCUpIi8+CjxjaXJjbGUgY3g9IjE2MCIgY3k9IjkwIiByPSIzMCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjMpIi8+Cjxwb2x5Z29uIHBvaW50cz0iMTQ1LDc1IDE0NSw5NSAxNzUsODUuNSIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuOCIvPgo8L3N2Zz4='

// 图片加载失败时显示默认图
const handleImageError = (event) => {
    event.target.src = defaultCoverImg
}

// 跳转到课程详情页
const goToCourseDetail = () => {
    router.push(`/course/${props.course.id}`)
}
</script>

<style scoped>
.course-card {
    width: 100%;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.1);
}

.course-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
}

:deep(.el-card__body) {
    padding: 0 !important;
}

.card-image-wrapper {
    position: relative;
    width: 100%;
    height: 180px;
    /* 固定高度 */
    overflow: hidden;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    /* 渐变占位背景 */
}

.card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.course-card:hover .card-image {
    transform: scale(1.05);
}

.video-count-overlay {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    padding: 4px 8px;
    border-radius: 5px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
    backdrop-filter: blur(3px);
}

.study-progress-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 20px;
    /* 进度条高度 */
}

/* 覆盖 Element Plus Progress 样式 */
.study-progress-overlay :deep(.el-progress-bar) {
    border-radius: 0 !important;
}

.study-progress-overlay :deep(.el-progress-bar__outer) {
    border-radius: 0 !important;
    background-color: rgba(255, 255, 255, 0.3);
    /* 半透明背景 */
}

.study-progress-overlay :deep(.el-progress-bar__inner) {
    border-radius: 0 !important;
}

.study-progress-overlay :deep(.el-progress__text) {
    color: white !important;
    font-size: 10px !important;
    margin-left: 0 !important;
    line-height: 20px;
    height: 20px;
}


.card-content {
    padding: 15px;
    text-align: left;
}

.card-title {
    font-size: 18px;
    font-weight: bold;
    color: #333;
    margin-bottom: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.card-description {
    font-size: 13px;
    color: #666;
    line-height: 1.5;
    height: 3em;
    /* 限制两行 */
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    margin-bottom: 12px;
}

.card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 10px;
    border-top: 1px solid #eee;
}

.teacher-name {
    font-size: 13px;
    color: #999;
    display: flex;
    align-items: center;
    gap: 5px;
}

/* 响应式调整 */
@media (max-width: 768px) {
    .card-image-wrapper {
        height: 150px;
    }

    .card-title {
        font-size: 16px;
    }

    .card-description {
        font-size: 12px;
    }

    .card-content {
        padding: 10px;
    }
}
</style>
