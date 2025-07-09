<!-- src/views/ForumPage.vue -->
<template>
    <div class="forum-page-container">
        <!-- 背景特效 -->
        <div class="bg-decorations">
            <div class="floating-particles">
                <div class="particle" v-for="i in 20" :key="i" :style="getParticleStyle(i)"></div>
            </div>
            <div class="animated-bg">
                <div class="wave wave1"></div>
                <div class="wave wave2"></div>
                <div class="wave wave3"></div>
            </div>
            <div class="circle circle-1"></div>
            <div class="circle circle-2"></div>
            <div class="circle circle-3"></div>
            <div class="circle circle-4"></div>
        </div>

        <!-- 头部增强版 -->
        <el-card class="page-header" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);"
            shadow="never">
            <div class="header-content">
                <div class="title-wrapper">
                    <h1 class="glowing-title">
                        <span class="title-char" v-for="(char, index) in '社区论坛'" :key="index"
                            :style="{ animationDelay: index * 0.1 + 's' }">
                            {{ char }}
                        </span>
                    </h1>
                    <div class="decoration-line"></div>
                    <div class="sparkles">
                        <div class="sparkle" v-for="i in 12" :key="i"></div>
                    </div>
                </div>
                <p class="fade-in-text">在这里，你可以自由地提问、分享知识和经验</p>
                <el-button type="primary" :icon="Edit" @click="openCreatePostDialog" class="post-btn magical-btn">
                    <span class="btn-text">
                        <span class="btn-icon">✨</span>
                        发布新帖
                        <span class="btn-shine"></span>
                    </span>
                </el-button>
            </div>
        </el-card>

        <!-- 增强版热门帖子轮播 -->
        <div class="hot-posts-carousel enhanced-carousel">
            <div class="carousel-header">
                <div class="header-left">
                    <div class="fire-container">
                        <el-icon class="fire-icon">
                            <HotWater />
                        </el-icon>
                        <div class="fire-effect"></div>
                    </div>
                    <h2 class="carousel-title">热门帖子</h2>
                </div>
                <el-button type="text" @click="goToHotPosts" class="view-all-btn pulse-btn">
                    <span>查看全部</span>
                    <el-icon class="arrow-icon">
                        <ArrowRight />
                    </el-icon>
                </el-button>
            </div>
            <el-carousel :interval="5000" height="150px" indicator-position="none" arrow="never">
                <el-carousel-item v-for="post in hotPosts" :key="post.id">
                    <div class="carousel-item enhanced-item" @click="goToPostDetail(post.id)">
                        <div class="post-info">
                            <div class="post-title">{{ post.title }}</div>
                            <div class="post-stats" style="display: flex; gap: 15px; margin-top: 15px;">
                                <span class="stat-item">
                                    <el-icon>
                                        <View />
                                    </el-icon>
                                    <span class="counter" :data-count="post.viewCount">{{ post.viewCount }}</span>
                                </span>
                                <span class="stat-item">
                                    <el-icon>
                                        <Pointer />
                                    </el-icon>
                                    <span class="counter" :data-count="post.likeCount">{{ post.likeCount }}</span>
                                </span>
                            </div>
                        </div>
                        <div class="author-info">
                            <div class="avatar-container">
                                <el-avatar :size="36" :src="post.userAvatar || defaultAvatar" />
                                <div class="avatar-ring"></div>
                            </div>
                            <div class="author-details">
                                <span class="author-name">{{ post.userName }}</span>
                                <span class="post-time">{{ formatTime(post.createTime) }}</span>
                            </div>
                        </div>
                    </div>
                </el-carousel-item>
            </el-carousel>
        </div>

        <!-- 增强版搜索栏 -->
        <div class="search-bar enhanced-search">
            <div class="search-container">
                <el-input v-model="searchKeyword" placeholder="搜索帖子标题..." clearable @clear="fetchPosts"
                    @keyup.enter="fetchPosts" class="search-input magical-input">
                    <template #prefix>
                        <el-icon class="search-icon">
                            <Search />
                        </el-icon>
                    </template>
                </el-input>
                <div class="input-glow"></div>
            </div>

            <div class="select-container">
                <el-select v-model="searchCategory" placeholder="所有分类" clearable class="category-select magical-select"
                    @change="fetchPosts">
                    <el-option v-for="category in availableCategories" :key="category.value" :label="category.label"
                        :value="category.value" />
                </el-select>
                <div class="select-glow"></div>
            </div>

            <el-button type="primary" @click="fetchPosts" class="search-btn cosmic-btn">
                <span class="btn-content">
                    <el-icon>
                        <Search />
                    </el-icon>
                    搜索
                </span>
                <div class="btn-bg"></div>
            </el-button>
        </div>

        <!-- 帖子列表 -->
        <div v-loading="loading" class="post-list">
            <el-empty v-if="!posts.length && !loading" description="还没有人发帖，快来抢占沙发吧！" />

            <div class="post-grid">
                <el-card v-for="post in posts" :key="post.id" class="post-item enhanced-post" shadow="hover">
                    <div class="category-tag">
                        <el-tag size="small" :type="getCategoryTagType(post.category)">{{ post.category }}</el-tag>
                    </div>
                    <div class="post-header">
                        <router-link :to="{ name: 'PostDetail', params: { id: post.id } }" class="post-title">
                            {{ post.title }}
                        </router-link>
                    </div>
                    <div class="post-meta">
                        <div class="author-info">
                            <el-avatar :size="28" :src="post.userAvatar || defaultAvatar" />
                            <span class="username">{{ post.userName }}</span>
                        </div>
                        <span class="time">{{ formatTime(post.createTime) }}</span>
                    </div>
                    <div class="post-stats">
                        <div class="stat-item">
                            <el-icon>
                                <View />
                            </el-icon>
                            <span>{{ post.viewCount }}</span>
                        </div>
                        <div class="stat-item">
                            <el-icon>
                                <Pointer />
                            </el-icon>
                            <span>{{ post.likeCount }}</span>
                        </div>
                        <div class="stat-item">
                            <el-icon>
                                <ChatDotRound />
                            </el-icon>
                            <span>{{ post.commentCount }}</span>
                        </div>
                    </div>
                </el-card>
            </div>
        </div>


        <el-pagination v-if="total > 0" class="pagination-container enhanced-pagination" background
            layout="prev, pager, next, jumper, ->, total" :total="total" :page-size="pageSize"
            :current-page="currentPage" @current-change="handlePageChange" />

        <!-- 增强版发布新帖弹窗 -->
        <el-dialog v-model="createPostDialogVisible" title="发布新帖" width="80%" class="post-dialog enhanced-dialog">
            <div class="dialog-bg-effects">
                <div class="dialog-particle" v-for="i in 15" :key="i" :style="getDialogParticleStyle(i)"></div>
            </div>
            <el-form :model="newPostForm" :rules="rules" ref="newPostFormRef" label-width="80px" class="enhanced-form">
                <el-form-item label="标题" prop="title">
                    <el-input v-model="newPostForm.title" placeholder="请输入帖子标题" class="form-input" />
                </el-form-item>
                <el-form-item label="分类" prop="category">
                    <el-select v-model="newPostForm.category" placeholder="请选择分类" class="form-select">
                        <el-option v-for="category in availableCategories" :key="category.value" :label="category.label"
                            :value="category.value" />
                    </el-select>
                </el-form-item>
                <el-form-item label="内容" prop="content">
                    <!-- 增加富文本编辑器高度 -->
                    <div class="rich-editor-container" style="min-height: 400px;">
                        <QuillEditor v-model:content="newPostForm.content" content-type="html" :options="editorOptions"
                            class="rich-editor" placeholder="请输入帖子内容..." style="min-height: 350px;" />
                    </div>
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="createPostDialogVisible = false" class="cancel-btn enhanced-cancel">
                        取消
                    </el-button>
                    <el-button type="primary" @click="submitNewPost" class="submit-btn enhanced-submit">
                        <span class="btn-content">
                            <span class="btn-icon">🚀</span>
                            立即发布
                        </span>
                        <div class="btn-ripple"></div>
                    </el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { forumAPI } from '../../api';
import { ElMessage } from 'element-plus';
import { Edit, View, Pointer, ChatDotRound, Search, HotWater, ArrowRight } from '@element-plus/icons-vue';
import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useRouter } from 'vue-router';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';

const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

const posts = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const loading = ref(true);
const searchKeyword = ref('');
const searchCategory = ref('');
const hotPosts = ref([]);
const router = useRouter();

// 富文本编辑器配置
const editorOptions = {
    theme: 'snow',
    modules: {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'header': 1 }, { 'header': 2 }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'font': [] }],
            [{ 'align': [] }],
            ['clean'],
            ['link', 'image', 'video']
        ]
    },
    placeholder: '请输入帖子内容...'
};

const availableCategories = ref([
    { value: '技术问答', label: '技术问答' },
    { value: '学习分享', label: '学习分享' },
    { value: '资源推荐', label: '资源推荐' },
    { value: '课程讨论', label: '课程讨论' },
    { value: '项目展示', label: '项目展示' },
    { value: '求职交流', label: '求职交流' },
    { value: '其他话题', label: '其他话题' }
]);

// 粒子特效样式生成
const getParticleStyle = (index) => {
    const size = Math.random() * 4 + 2;
    const left = Math.random() * 100;
    const animationDelay = Math.random() * 20;
    const animationDuration = Math.random() * 10 + 10;
    return {
        width: size + 'px',
        height: size + 'px',
        left: left + '%',
        animationDelay: animationDelay + 's',
        animationDuration: animationDuration + 's'
    };
};

// 弹窗粒子特效样式生成
const getDialogParticleStyle = (index) => {
    const size = Math.random() * 3 + 1;
    const left = Math.random() * 100;
    const top = Math.random() * 100;
    const animationDelay = Math.random() * 5;
    const animationDuration = Math.random() * 8 + 5;
    return {
        width: size + 'px',
        height: size + 'px',
        left: left + '%',
        top: top + '%',
        animationDelay: animationDelay + 's',
        animationDuration: animationDuration + 's'
    };
};

// 现有的所有函数保持不变
const fetchHotPosts = async () => {
    try {
        const count = 5;
        hotPosts.value = await forumAPI.getHotPosts(count);
    } catch (error) {
        console.error("获取热门帖子失败:", error);
        ElMessage.error('获取热门帖子失败');
    }
};

const goToPostDetail = (postId) => {
    router.push({ name: 'PostDetail', params: { id: postId } });
};

const goToHotPosts = () => {
    router.push({ name: 'HotPosts' });
};

onMounted(() => {
    fetchPosts();
    fetchHotPosts();
});

const fetchPosts = async () => {
    loading.value = true;
    try {
        const params = {
            page: currentPage.value,
            size: pageSize.value,
            keyword: searchKeyword.value,
            category: searchCategory.value,
        };

        const response = await forumAPI.getPosts(params);
        posts.value = response.list || [];
        total.value = response.total || 0;
    } catch (error) {
        console.error("获取帖子列表失败:", error);
        ElMessage.error('获取帖子列表失败: ' + (error.message || '未知错误'));
    } finally {
        loading.value = false;
    }
};

const handlePageChange = (page) => {
    currentPage.value = page;
    fetchPosts();
};

const formatTime = (time) => {
    if (!time) return '';
    const date = new Date(time);
    return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
};

const createPostDialogVisible = ref(false);
const newPostFormRef = ref(null);
const newPostForm = reactive({
    title: '',
    content: '',
    category: '',
});

const rules = {
    title: [
        { required: true, message: '请输入帖子标题', trigger: 'blur' },
        { min: 5, max: 100, message: '标题长度需在 5 到 100 个字符之间', trigger: 'blur' }
    ],
    content: [
        { required: true, message: '请输入帖子内容', trigger: 'blur' },
        { min: 10, message: '内容至少需要 10 个字符', trigger: 'blur' }
    ],
    category: [
        { required: true, message: '请输入帖子分类', trigger: 'blur' }
    ],
};

const openCreatePostDialog = () => {
    newPostForm.title = '';
    newPostForm.content = '';
    newPostForm.category = '';
    newPostFormRef.value?.clearValidate();
    createPostDialogVisible.value = true;
};

const submitNewPost = async () => {
    await newPostFormRef.value.validate(async (valid) => {
        if (valid) {
            try {
                await forumAPI.createPost({
                    title: newPostForm.title,
                    content: newPostForm.content,
                    category: newPostForm.category
                });

                ElMessage.success('帖子发布成功！');
                createPostDialogVisible.value = false;
                fetchPosts();
            } catch (error) {
                console.error('发布失败:', error);
                ElMessage.error('发布失败: ' + (error.message || '请稍后再试'));
            }
        }
    });
};

const getCategoryTagType = (category) => {
    const types = {
        '技术问答': 'danger',
        '学习分享': 'success',
        '资源推荐': 'warning',
        '课程讨论': '',
        '项目展示': 'info',
        '求职交流': 'primary',
        '其他话题': 'info'
    };
    return types[category] || 'info';
};
</script>

<style scoped>
.enhanced-post {
    background: linear-gradient(135deg, #ffffff, #f8fafc);
    border: 1px solid rgba(59, 130, 246, 0.1);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.08);
    transition: all 0.3s ease;
    position: relative;
    overflow: visible;
}

.enhanced-post:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 30px rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.3);
}

.glowing-link {
    color: #1e40af;
    font-weight: 600;
    text-decoration: none;
    background: linear-gradient(to right, #3b82f6, #3b82f6);
    background-size: 0% 2px;
    background-repeat: no-repeat;
    background-position: left bottom;
    transition: all 0.3s ease;
    padding-bottom: 3px;
}

.glowing-link:hover {
    background-size: 100% 2px;
    color: #1e3a8a;
    text-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
}

.enhanced-post::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, #3b82f6, #8b5cf6);
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;
    filter: blur(20px);
}

.enhanced-post:hover::before {
    opacity: 0.1;
}

/* 基础容器 */
.forum-page-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 30px 20px;
    position: relative;
    overflow-x: hidden;
}

/* 增强版背景特效 */
.bg-decorations {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    overflow: hidden;
    pointer-events: none;
}

.floating-particles {
    position: absolute;
    width: 100%;
    height: 100%;
}

.particle {
    position: absolute;
    background: linear-gradient(45deg, #3b82f6, #8b5cf6, #f59e0b);
    border-radius: 50%;
    animation: float 20s infinite linear;
    opacity: 0.3;
}

@keyframes float {
    0% {
        transform: translateY(100vh) rotate(0deg);
        opacity: 0;
    }

    10% {
        opacity: 0.3;
    }

    90% {
        opacity: 0.3;
    }

    100% {
        transform: translateY(-100px) rotate(360deg);
        opacity: 0;
    }
}

.animated-bg {
    position: absolute;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    opacity: 0.05;
}

.wave {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100px;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    opacity: 0.1;
    animation: wave 8s ease-in-out infinite;
}

.wave1 {
    animation-delay: 0s;
}

.wave2 {
    animation-delay: -2s;
}

.wave3 {
    animation-delay: -4s;
}

@keyframes wave {

    0%,
    100% {
        clip-path: polygon(0 40%, 100% 60%, 100% 100%, 0% 100%);
    }

    50% {
        clip-path: polygon(0 60%, 100% 40%, 100% 100%, 0% 100%);
    }
}

.circle {
    position: absolute;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #60a5fa);
    opacity: 0.1;
    animation: pulse 4s ease-in-out infinite;
}

.circle-1 {
    width: 300px;
    height: 300px;
    top: -100px;
    left: -100px;
    animation-delay: 0s;
}

.circle-2 {
    width: 200px;
    height: 200px;
    bottom: 50px;
    right: -50px;
    animation-delay: -1s;
}

.circle-3 {
    width: 150px;
    height: 150px;
    top: 200px;
    right: 200px;
    animation-delay: -2s;
}

.circle-4 {
    width: 100px;
    height: 100px;
    bottom: 200px;
    left: 150px;
    animation-delay: -3s;
}

@keyframes pulse {

    0%,
    100% {
        transform: scale(1);
        opacity: 0.1;
    }

    50% {
        transform: scale(1.1);
        opacity: 0.2;
    }
}

/* 增强版页面头部 */
.page-header {
    margin-bottom: 30px;
    border: none;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20px;
    overflow: hidden;
    position: relative;
    box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3);
    animation: slideInDown 0.8s ease-out;
}

@keyframes slideInDown {
    from {
        transform: translateY(-100px);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.page-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background:
        radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 40% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
    animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {

    0%,
    100% {
        opacity: 0.5;
    }

    50% {
        opacity: 1;
    }
}

.header-content {
    text-align: center;
    padding: 50px 20px;
    position: relative;
    z-index: 1;
}

.title-wrapper {
    position: relative;
    display: inline-block;
    margin-bottom: 20px;
}

.glowing-title {
    font-size: 3rem;
    margin-bottom: 15px;
    color: white;
    font-weight: 700;
    letter-spacing: 2px;
    text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
    position: relative;
}

.title-char {
    display: inline-block;
    animation: titleGlow 2s ease-in-out infinite;
}

@keyframes titleGlow {

    0%,
    100% {
        text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
        transform: translateY(0);
    }

    50% {
        text-shadow: 0 0 30px rgba(255, 255, 255, 0.8);
        transform: translateY(-5px);
    }
}

.sparkles {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
}

.sparkle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: white;
    border-radius: 50%;
    animation: sparkle 2s ease-in-out infinite;
}

.sparkle:nth-child(1) {
    top: 10%;
    left: 10%;
    animation-delay: 0s;
}

.sparkle:nth-child(2) {
    top: 20%;
    left: 80%;
    animation-delay: 0.2s;
}

.sparkle:nth-child(3) {
    top: 80%;
    left: 20%;
    animation-delay: 0.4s;
}

.sparkle:nth-child(4) {
    top: 70%;
    left: 90%;
    animation-delay: 0.6s;
}

.sparkle:nth-child(5) {
    top: 30%;
    left: 70%;
    animation-delay: 0.8s;
}

.sparkle:nth-child(6) {
    top: 90%;
    left: 10%;
    animation-delay: 1s;
}

.sparkle:nth-child(7) {
    top: 15%;
    left: 50%;
    animation-delay: 1.2s;
}

.sparkle:nth-child(8) {
    top: 60%;
    left: 30%;
    animation-delay: 1.4s;
}

.sparkle:nth-child(9) {
    top: 40%;
    left: 85%;
    animation-delay: 1.6s;
}

.sparkle:nth-child(10) {
    top: 85%;
    left: 60%;
    animation-delay: 1.8s;
}

.sparkle:nth-child(11) {
    top: 25%;
    left: 15%;
    animation-delay: 2s;
}

.sparkle:nth-child(12) {
    top: 50%;
    left: 95%;
    animation-delay: 2.2s;
}

@keyframes sparkle {

    0%,
    100% {
        opacity: 0;
        transform: scale(0);
    }

    50% {
        opacity: 1;
        transform: scale(1);
    }
}

.decoration-line {
    height: 4px;
    width: 80%;
    margin: 15px auto;
    background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.8), transparent);
    border-radius: 2px;
    animation: lineGlow 3s ease-in-out infinite;
}

@keyframes lineGlow {

    0%,
    100% {
        box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
    }

    50% {
        box-shadow: 0 0 20px rgba(255, 255, 255, 0.6);
    }
}

.fade-in-text {
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 30px;
    font-size: 1.2rem;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
    animation: fadeInUp 1s ease-out 0.5s both;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.magical-btn {
    background: linear-gradient(45deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3);
    border: none;
    border-radius: 50px;
    padding: 15px 40px;
    font-weight: 600;
    font-size: 1.1rem;
    position: relative;
    overflow: hidden;
    animation: magicPulse 3s ease-in-out infinite;
}

@keyframes magicPulse {

    0%,
    100% {
        box-shadow: 0 0 20px rgba(255, 107, 107, 0.4);
    }

    33% {
        box-shadow: 0 0 20px rgba(254, 202, 87, 0.4);
    }

    66% {
        box-shadow: 0 0 20px rgba(72, 219, 251, 0.4);
    }
}

.btn-text {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 8px;
}

.btn-icon {
    animation: rotate 2s linear infinite;
}

@keyframes rotate {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

/* 继续之前的样式... */

.btn-shine {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    animation: shine 3s ease-in-out infinite;
}

@keyframes shine {
    0% {
        left: -100%;
    }

    100% {
        left: 100%;
    }
}

/* 增强版轮播区域 */
.enhanced-carousel {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95));
    border-radius: 20px;
    margin-bottom: 30px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    animation: slideInLeft 0.8s ease-out 0.2s both;
}

@keyframes slideInLeft {
    from {
        transform: translateX(-100px);
        opacity: 0;
    }

    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.carousel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 30px;
    background: linear-gradient(135deg, #f8fafc, #e2e8f0);
    border-bottom: 1px solid rgba(226, 232, 240, 0.6);
    position: relative;
}

.carousel-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
    animation: headerShimmer 4s ease-in-out infinite;
}

@keyframes headerShimmer {

    0%,
    100% {
        transform: translateX(-100%);
    }

    50% {
        transform: translateX(100%);
    }
}

.fire-container {
    position: relative;
    display: flex;
    align-items: center;
}

.fire-icon {
    color: #ff6b6b;
    font-size: 32px;
    animation: fireFlicker 2s ease-in-out infinite;
    z-index: 2;
}

@keyframes fireFlicker {

    0%,
    100% {
        transform: scale(1);
        filter: hue-rotate(0deg);
    }

    50% {
        transform: scale(1.1);
        filter: hue-rotate(10deg);
    }
}

.fire-effect {
    position: absolute;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: radial-gradient(circle, #ff6b6b, transparent);
    animation: fireGlow 2s ease-in-out infinite;
    z-index: 1;
}

@keyframes fireGlow {

    0%,
    100% {
        opacity: 0.3;
        transform: scale(0.8);
    }

    50% {
        opacity: 0.6;
        transform: scale(1.2);
    }
}

.carousel-title {
    margin: 0 0 0 15px;
    font-size: 1.4rem;
    color: #1e293b;
    font-weight: 600;
    animation: textGlow 3s ease-in-out infinite;
}

@keyframes textGlow {

    0%,
    100% {
        text-shadow: 0 0 5px rgba(59, 130, 246, 0.3);
    }

    50% {
        text-shadow: 0 0 15px rgba(59, 130, 246, 0.6);
    }
}

.pulse-btn {
    color: #3b82f6;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {

    0%,
    100% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.05);
    }
}

.arrow-icon {
    animation: arrowBounce 2s ease-in-out infinite;
}

@keyframes arrowBounce {

    0%,
    100% {
        transform: translateX(0);
    }

    50% {
        transform: translateX(5px);
    }
}

.enhanced-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 25px 30px;
    cursor: pointer;
    transition: all 0.4s ease;
    height: 100%;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.9));
    position: relative;
    overflow: hidden;
}

.enhanced-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
    transition: left 0.6s ease;
}

.enhanced-item:hover::before {
    left: 100%;
}

.enhanced-item:hover {
    background: linear-gradient(135deg, rgba(255, 255, 255, 1), rgba(239, 246, 255, 1));
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
}

.avatar-container {
    position: relative;
    display: flex;
    align-items: center;
}

.avatar-ring {
    position: absolute;
    width: 50px;
    height: 50px;
    border: 2px solid #3b82f6;
    border-radius: 50%;
    animation: avatarSpin 4s linear infinite;
    opacity: 0.6;
}

@keyframes avatarSpin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.counter {
    position: relative;
    font-weight: 600;
    animation: counterGlow 3s ease-in-out infinite;
}

@keyframes counterGlow {

    0%,
    100% {
        color: #64748b;
    }

    50% {
        color: #3b82f6;
    }
}

/* 增强版搜索栏 */
.enhanced-search {
    margin-bottom: 30px;
    display: flex;
    gap: 20px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95));
    padding: 25px;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    animation: slideInRight 0.8s ease-out 0.4s both;
}

@keyframes slideInRight {
    from {
        transform: translateX(100px);
        opacity: 0;
    }

    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.search-container,
.select-container {
    flex: 1;
    position: relative;
}

.magical-input :deep(.el-input__wrapper) {
    border-radius: 50px;
    padding: 0 25px;
    border: 2px solid transparent;
    background: linear-gradient(white, white) padding-box,
        linear-gradient(45deg, #3b82f6, #8b5cf6) border-box;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.magical-input :deep(.el-input__wrapper):hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.2);
}

.input-glow,
.select-glow {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50px;
    background: linear-gradient(45deg, #3b82f6, #8b5cf6);
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;
    filter: blur(15px);
}

.search-container:hover .input-glow,
.select-container:hover .select-glow {
    opacity: 0.3;
}

.magical-select :deep(.el-select__wrapper) {
    border-radius: 50px;
    padding: 0 20px;
    border: 2px solid transparent;
    background: linear-gradient(white, white) padding-box,
        linear-gradient(45deg, #8b5cf6, #f59e0b) border-box;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.magical-select :deep(.el-select__wrapper):hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(139, 92, 246, 0.2);
}

.cosmic-btn {
    border-radius: 50px;
    padding: 0 35px;
    font-weight: 600;
    position: relative;
    overflow: hidden;
    border: none;
    background: linear-gradient(45deg, #667eea, #764ba2);
    transition: all 0.3s ease;
}

.cosmic-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}

.btn-content {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 8px;
}

.btn-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, #764ba2, #667eea);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.cosmic-btn:hover .btn-bg {
    opacity: 1;
}

/* 新增帖子卡片样式 */
.enhanced-post {
    border-radius: 18px;
    transition: all 0.4s ease;
    border: 1px solid rgba(238, 242, 247, 0.8);
    position: relative;
    overflow: hidden;
    padding: 40px 20px 20px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95));
    backdrop-filter: blur(10px);
    animation: fadeInUp 0.6s ease-out both;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.enhanced-post:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 15px 35px rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.3);
}

.post-header {
    margin: 15px 0;
    min-height: 60px;
}

.post-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1e293b;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-decoration: none;
    transition: color 0.3s ease;
}

.post-title:hover {
    color: #3b82f6;
    text-decoration: underline;
}

.post-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
    padding-top: 15px;
    border-top: 1px dashed #e2e8f0;
}

.author-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.username {
    font-size: 0.9rem;
    color: #475569;
}

.time {
    font-size: 0.85rem;
    color: #94a3b8;
}

/* 修复统计信息布局 - 改为横向排列 */
.post-stats {
    display: flex;
    justify-content: space-around;
    gap: 10px;
    margin-top: 15px;
    padding-top: 10px;
    border-top: 1px solid #f1f5f9;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.9rem;
    color: #64748b;
    padding: 6px 12px;
    border-radius: 16px;
    background: rgba(241, 245, 249, 0.6);
    transition: all 0.3s ease;
}

.stat-item:hover {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
    transform: translateY(-2px);
}

.stat-item .el-icon {
    font-size: 1rem;
}

.category-tag {
    position: absolute;
    top: 15px;
    right: 20px;
    z-index: 10;
    transform: translateY(0);
    transition: transform 0.3s ease;
}

.enhanced-post:hover .category-tag {
    transform: translateY(-5px);
}

/* 响应式调整 */
@media (max-width: 768px) {
    .post-stats {
        flex-wrap: wrap;
        gap: 8px;
    }

    .stat-item {
        flex: 1;
        min-width: 80px;
        justify-content: center;
    }

    .post-header {
        min-height: auto;
    }
}

/* 增强版帖子列表 */
.enhanced-list {
    min-height: 500px;
    margin-bottom: 40px;
}

.enhanced-empty {
    animation: bounceIn 1s ease-out;
}

@keyframes bounceIn {
    0% {
        transform: scale(0.3);
        opacity: 0;
    }

    50% {
        transform: scale(1.05);
        opacity: 0.8;
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}

.post-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 30px;
}

.enhanced-post {
    border-radius: 20px;
    transition: all 0.4s ease;
    border: 1px solid rgba(238, 242, 247, 0.8);
    position: relative;
    overflow: hidden;
    padding-top: 25px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95));
    backdrop-filter: blur(10px);
    animation: fadeInUp 0.6s ease-out both;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.enhanced-post:hover {
    transform: translateY(-10px) scale(1.02);
    box-shadow: 0 20px 40px rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.3);
}

.post-glow {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, #3b82f6, #8b5cf6);
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;
    filter: blur(20px);
}

.enhanced-post:hover .post-glow {
    opacity: 0.1;
}

.floating-tag {
    position: absolute;
    top: -15px;
    right: 25px;
    z-index: 10;
    animation: float 3s ease-in-out infinite;
}

@keyframes float {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-5px);
    }
}

.hover-effects {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: hidden;
}

.shine-effect {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    transition: left 0.6s ease;
}

.enhanced-post:hover .shine-effect {
    left: 100%;
}

.ripple-effect {
    position: absolute;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.3), transparent);
    animation: ripple 2s ease-out infinite;
}

@keyframes ripple {
    0% {
        width: 0;
        height: 0;
        opacity: 1;
    }

    100% {
        width: 300px;
        height: 300px;
        opacity: 0;
    }
}

/* 增强版分页 */
.enhanced-pagination {
    margin-top: 40px;
    display: flex;
    justify-content: center;
    animation: slideInUp 0.8s ease-out 0.6s both;
}

@keyframes slideInUp {
    from {
        transform: translateY(50px);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.enhanced-pagination :deep(.el-pager li) {
    transition: all 0.3s ease;
    border-radius: 10px;
    margin: 0 2px;
}

.enhanced-pagination :deep(.el-pager li:hover) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.enhanced-pagination :deep(.el-pager li.is-active) {
    background: linear-gradient(45deg, #3b82f6, #8b5cf6);
    color: white;
    transform: scale(1.1);
}

/* 增强版弹窗 */
.enhanced-dialog :deep(.el-dialog) {
    border-radius: 25px;
    overflow: hidden;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(20px);
    animation: dialogAppear 0.5s ease-out;
}

@keyframes dialogAppear {
    from {
        transform: scale(0.8);
        opacity: 0;
    }

    to {
        transform: scale(1);
        opacity: 1;
    }
}

.enhanced-dialog :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #667eea, #764ba2);
    margin: 0;
    padding: 25px;
    position: relative;
    overflow: hidden;
}

.enhanced-dialog :deep(.el-dialog__header)::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, rgba(255, 255, 255, 0.1), transparent);
    animation: headerFlow 3s ease-in-out infinite;
}

@keyframes headerFlow {

    0%,
    100% {
        transform: translateX(-100%);
    }

    50% {
        transform: translateX(100%);
    }
}

.enhanced-dialog :deep(.el-dialog__title) {
    color: white;
    font-weight: 600;
    font-size: 1.3rem;
    position: relative;
    z-index: 2;
}

.enhanced-dialog :deep(.el-dialog__body) {
    padding: 35px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95));
    position: relative;
}

.dialog-bg-effects {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: hidden;
}

.dialog-particle {
    position: absolute;
    background: linear-gradient(45deg, #3b82f6, #8b5cf6);
    border-radius: 50%;
    animation: dialogFloat 15s linear infinite;
    opacity: 0.1;
}

@keyframes dialogFloat {
    0% {
        transform: translateY(100%) rotate(0deg);
        opacity: 0;
    }

    10% {
        opacity: 0.1;
    }

    90% {
        opacity: 0.1;
    }

    100% {
        transform: translateY(-100%) rotate(360deg);
        opacity: 0;
    }
}

.enhanced-form :deep(.el-form-item__label) {
    font-weight: 600;
    color: #1e293b;
    font-size: 1.1rem;
}

.form-input :deep(.el-input__wrapper) {
    border-radius: 15px;
    padding: 0 20px;
    border: 2px solid transparent;
    background: linear-gradient(white, white) padding-box,
        linear-gradient(45deg, #3b82f6, #8b5cf6) border-box;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.form-input :deep(.el-input__wrapper):focus {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.2);
}

.form-select :deep(.el-select__wrapper) {
    border-radius: 15px;
    padding: 0 20px;
    border: 2px solid transparent;
    background: linear-gradient(white, white) padding-box,
        linear-gradient(45deg, #8b5cf6, #f59e0b) border-box;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

/* 富文本编辑器样式 */
.rich-editor-container {
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    border: 2px solid transparent;
    background: linear-gradient(white, white) padding-box,
        linear-gradient(45deg, #3b82f6, #8b5cf6, #f59e0b) border-box;
    transition: all 0.3s ease;
}

.rich-editor-container:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 35px rgba(59, 130, 246, 0.15);
}

.rich-editor {
    min-height: 300px;
}

.rich-editor :deep(.ql-toolbar) {
    border-top: none;
    border-left: none;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    padding: 15px;
}

.rich-editor :deep(.ql-container) {
    border: none;
    font-size: 16px;
    line-height: 1.6;
    min-height: 250px;
}

.rich-editor :deep(.ql-editor) {
    padding: 20px;
    color: #1e293b;
}

.rich-editor :deep(.ql-toolbar .ql-formats) {
    margin-right: 20px;
}

.rich-editor :deep(.ql-toolbar button) {
    border-radius: 8px;
    transition: all 0.3s ease;
}

.rich-editor :deep(.ql-toolbar button:hover) {
    background: rgba(59, 130, 246, 0.1);
    transform: scale(1.1);
}

.rich-editor :deep(.ql-toolbar button.ql-active) {
    background: linear-gradient(45deg, #3b82f6, #8b5cf6);
    color: white;
}

/* 弹窗底部按钮 */
.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 15px;
    padding: 25px 35px;
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border-top: 1px solid #e5e7eb;
}

.enhanced-cancel {
    border-radius: 15px;
    padding: 12px 25px;
    border: 2px solid #e5e7eb;
    background: white;
    color: #64748b;
    font-weight: 500;
    transition: all 0.3s ease;
}

.enhanced-cancel:hover {
    border-color: #3b82f6;
    color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.enhanced-submit {
    border-radius: 15px;
    padding: 12px 25px;
    background: linear-gradient(45deg, #3b82f6, #8b5cf6);
    border: none;
    color: white;
    font-weight: 600;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
}

.enhanced-submit:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
}

.enhanced-submit .btn-content {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 8px;
}

.enhanced-submit .btn-icon {
    animation: rocket 2s ease-in-out infinite;
}

@keyframes rocket {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-3px);
    }
}

.btn-ripple {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    animation: rippleExpand 2s ease-out infinite;
}

@keyframes rippleExpand {
    0% {
        width: 0;
        height: 0;
        opacity: 1;
    }

    100% {
        width: 100px;
        height: 100px;
        opacity: 0;
    }
}

/* 响应式优化 */
@media (max-width: 992px) {
    .post-grid {
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 20px;
    }

    .enhanced-search {
        flex-direction: column;
        gap: 20px;
    }

    .glowing-title {
        font-size: 2.5rem;
    }
}

@media (max-width: 768px) {
    .forum-page-container {
        padding: 20px 15px;
    }

    .post-grid {
        grid-template-columns: 1fr;
    }

    .glowing-title {
        font-size: 2rem;
    }

    .enhanced-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
    }

    .enhanced-dialog :deep(.el-dialog) {
        width: 95% !important;
        margin: 0 !important;
    }
}

@media (max-width: 480px) {
    .glowing-title {
        font-size: 1.8rem;
    }

    .header-content {
        padding: 30px 15px;
    }

    .carousel-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
    }

    .rich-editor-container {
        border-radius: 10px;
    }

    .dialog-footer {
        flex-direction: column;
        gap: 10px;
    }
}

/* 加载动画增强 */
:deep(.el-loading-spinner) {
    animation: loadingSpin 1s linear infinite;
}

@keyframes loadingSpin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

/* 滚动条美化 */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb {
    background: linear-gradient(45deg, #3b82f6, #8b5cf6);
    border-radius: 4px;
    transition: background 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(45deg, #2563eb, #7c3aed);
}
</style>