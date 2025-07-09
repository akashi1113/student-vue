<!-- src/views/ForumPage.vue -->
<template>
    <div class="forum-page-container">
        <!-- 添加背景装饰元素 -->
        <div class="bg-decorations">
            <div class="circle circle-1"></div>
            <div class="circle circle-2"></div>
            <div class="circle circle-3"></div>
            <div class="circle circle-4"></div>
        </div>

        <el-card class="page-header" shadow="never">
            <div class="header-content">
                <div class="title-wrapper">
                    <h1>社区论坛</h1>
                    <div class="decoration-line"></div>
                </div>
                <p>在这里，你可以自由地提问、分享知识和经验</p>
                <el-button type="primary" :icon="Edit" @click="openCreatePostDialog" class="post-btn">
                    <span>发布新帖</span>
                </el-button>
            </div>
        </el-card>

        <!-- 顶部轮播条 -->
        <div class="hot-posts-carousel">
            <div class="carousel-header">
                <div class="header-left">
                    <el-icon class="fire-icon">
                        <HotWater />
                    </el-icon>
                    <h2>热门帖子</h2>
                </div>
                <el-button type="text" @click="goToHotPosts" class="view-all-btn">
                    <span>查看全部</span>
                    <el-icon>
                        <ArrowRight />
                    </el-icon>
                </el-button>
            </div>
            <el-carousel :interval="5000" height="120px" indicator-position="none" arrow="never">
                <el-carousel-item v-for="post in hotPosts" :key="post.id">
                    <div class="carousel-item" @click="goToPostDetail(post.id)">
                        <div class="post-info">
                            <div class="post-title">{{ post.title }}</div>
                            <div class="post-stats">
                                <span><el-icon>
                                        <View />
                                    </el-icon> {{ post.viewCount }}</span>
                                <span><el-icon>
                                        <Pointer />
                                    </el-icon> {{ post.likeCount }}</span>
                            </div>
                        </div>
                        <div class="author-info">
                            <el-avatar :size="36" :src="post.userAvatar || defaultAvatar" />
                            <div class="author-details">
                                <span class="author-name">{{ post.userName }}</span>
                                <span class="post-time">{{ formatTime(post.createTime) }}</span>
                            </div>
                        </div>
                    </div>
                </el-carousel-item>
            </el-carousel>
        </div>

        <div class="search-bar">
            <el-input v-model="searchKeyword" placeholder="搜索帖子标题..." clearable @clear="fetchPosts"
                @keyup.enter="fetchPosts" class="search-input">
                <template #prefix>
                    <el-icon class="search-icon">
                        <Search />
                    </el-icon>
                </template>
            </el-input>

            <el-select v-model="searchCategory" placeholder="所有分类" clearable class="category-select"
                @change="fetchPosts">
                <el-option v-for="category in availableCategories" :key="category.value" :label="category.label"
                    :value="category.value" />
            </el-select>

            <el-button type="primary" @click="fetchPosts" class="search-btn">
                <el-icon>
                    <Search />
                </el-icon> 搜索
            </el-button>
        </div>

        <div v-loading="loading" class="post-list">
            <el-empty v-if="!posts.length && !loading" description="还没有人发帖，快来抢占沙发吧！" />

            <div class="post-grid">
                <el-card v-for="post in posts" :key="post.id" class="post-item" shadow="hover">
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

        <el-pagination v-if="total > 0" class="pagination-container" background
            layout="prev, pager, next, jumper, ->, total" :total="total" :page-size="pageSize"
            :current-page="currentPage" @current-change="handlePageChange" />

        <!-- 发布新帖弹窗 -->
        <el-dialog v-model="createPostDialogVisible" title="发布新帖" width="60%" class="post-dialog">
            <el-form :model="newPostForm" :rules="rules" ref="newPostFormRef" label-width="80px">
                <el-form-item label="标题" prop="title">
                    <el-input v-model="newPostForm.title" placeholder="请输入帖子标题" />
                </el-form-item>
                <el-form-item label="分类" prop="category">
                    <el-select v-model="newPostForm.category" placeholder="请选择分类">
                        <el-option v-for="category in availableCategories" :key="category.value" :label="category.label"
                            :value="category.value" />
                    </el-select>
                </el-form-item>
                <el-form-item label="内容" prop="content">
                    <el-input v-model="newPostForm.content" type="textarea" :rows="10" placeholder="请输入帖子内容" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="createPostDialogVisible = false" class="cancel-btn">取消</el-button>
                <el-button type="primary" @click="submitNewPost" class="submit-btn">立即发布</el-button>
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

const availableCategories = ref([
    { value: '技术问答', label: '技术问答' },
    { value: '学习分享', label: '学习分享' },
    { value: '资源推荐', label: '资源推荐' },
    { value: '课程讨论', label: '课程讨论' },
    { value: '项目展示', label: '项目展示' },
    { value: '求职交流', label: '求职交流' },
    { value: '其他话题', label: '其他话题' }
]);

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

// 为不同分类返回不同的标签类型
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
.forum-page-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 30px 20px;
    position: relative;
    overflow-x: hidden;
}

.bg-decorations {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    overflow: hidden;
}

.circle {
    position: absolute;
    border-radius: 50%;
    opacity: 0.1;
    background: linear-gradient(135deg, #3b82f6, #60a5fa);
}

.circle-1 {
    width: 300px;
    height: 300px;
    top: -100px;
    left: -100px;
}

.circle-2 {
    width: 200px;
    height: 200px;
    bottom: 50px;
    right: -50px;
}

.circle-3 {
    width: 150px;
    height: 150px;
    top: 200px;
    right: 200px;
}

.circle-4 {
    width: 100px;
    height: 100px;
    bottom: 200px;
    left: 150px;
}

.page-header {
    margin-bottom: 30px;
    border: none;
    background: linear-gradient(135deg, #3b82f6, #60a5fa);
    border-radius: 16px;
    overflow: hidden;
    position: relative;
    box-shadow: 0 10px 30px rgba(59, 130, 246, 0.2);
}

.page-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="none"/><path d="M0,50 Q25,30 50,50 T100,50" stroke="rgba(255,255,255,0.1)" stroke-width="1" fill="none"/></svg>');
    opacity: 0.3;
}

.header-content {
    text-align: center;
    padding: 40px 20px;
    position: relative;
    z-index: 1;
}

.title-wrapper {
    display: inline-block;
    position: relative;
    margin-bottom: 15px;
}

.header-content h1 {
    font-size: 2.8rem;
    margin-bottom: 10px;
    color: white;
    font-weight: 700;
    letter-spacing: 1px;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.decoration-line {
    height: 4px;
    width: 60%;
    margin: 10px auto;
    background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.7), transparent);
    border-radius: 2px;
}

.header-content p {
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 30px;
    font-size: 1.1rem;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
}

.post-btn {
    background: white;
    color: #3b82f6;
    border: none;
    border-radius: 30px;
    padding: 12px 30px;
    font-weight: 600;
    font-size: 1rem;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

.post-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.post-btn:active {
    transform: translateY(1px);
}

.hot-posts-carousel {
    background: white;
    border-radius: 16px;
    margin-bottom: 30px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    border: 1px solid #eef2f7;
}

.carousel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 15px 25px;
    background-color: #f8fafc;
    border-bottom: 1px solid #eef2f7;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.fire-icon {
    color: #ff6b6b;
    font-size: 28px;
}

.carousel-header h2 {
    margin: 0;
    font-size: 1.3rem;
    color: #1e293b;
    font-weight: 600;
}

.view-all-btn {
    color: #3b82f6;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 5px;
}

.view-all-btn:hover {
    color: #2563eb;
}

.el-carousel {
    border-radius: 0 0 16px 16px;
}

.carousel-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 25px;
    cursor: pointer;
    transition: all 0.3s ease;
    height: 100%;
    background: linear-gradient(to right, rgba(255, 255, 255, 0.95), rgba(249, 250, 251, 0.95));
}

.carousel-item:hover {
    background: linear-gradient(to right, rgba(255, 255, 255, 1), rgba(240, 249, 255, 1));
    box-shadow: inset 0 0 0 1px #dbeafe;
}

.post-info {
    flex-grow: 1;
    padding-right: 30px;
}

.post-title {
    font-weight: 600;
    font-size: 1.1rem;
    margin-bottom: 10px;
    color: #1e293b;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.post-stats {
    display: flex;
    gap: 20px;
    color: #64748b;
    font-size: 0.9rem;
}

.post-stats span {
    display: flex;
    align-items: center;
    gap: 5px;
}

.author-info {
    display: flex;
    align-items: center;
    min-width: 150px;
    gap: 12px;
}

.author-details {
    display: flex;
    flex-direction: column;
}

.author-name {
    font-weight: 500;
    color: #1e293b;
}

.post-time {
    font-size: 0.8rem;
    color: #94a3b8;
}

.search-bar {
    margin-bottom: 30px;
    display: flex;
    gap: 15px;
    background: white;
    padding: 20px;
    border-radius: 16px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.03);
    border: 1px solid #eef2f7;
}

.search-input,
.category-select {
    flex: 1;
}

.search-input :deep(.el-input__wrapper) {
    border-radius: 30px;
    padding: 0 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
}

.search-input :deep(.el-input__wrapper):hover {
    box-shadow: 0 2px 12px rgba(59, 130, 246, 0.15);
}

.search-icon {
    color: #94a3b8;
}

.category-select :deep(.el-select__wrapper) {
    border-radius: 30px;
    padding: 0 15px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.search-btn {
    border-radius: 30px;
    padding: 0 25px;
    font-weight: 500;
    background: linear-gradient(135deg, #3b82f6, #60a5fa);
    border: none;
    transition: all 0.3s ease;
}

.search-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.post-list {
    min-height: 500px;
    margin-bottom: 40px;
}

.post-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 25px;
}

.post-item {
    border-radius: 16px;
    transition: all 0.3s ease;
    border: 1px solid #eef2f7;
    position: relative;
    overflow: visible;
    padding-top: 20px;
}

.post-item:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.15);
    border-color: #dbeafe;
}

.category-tag {
    position: absolute;
    top: -12px;
    right: 20px;
    z-index: 10;
}

.post-header {
    padding: 0 20px 15px;
    border-bottom: 1px solid #f1f5f9;
}

.post-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1e293b;
    text-decoration: none;
    display: block;
    margin-bottom: 5px;
    transition: color 0.2s;
    line-height: 1.4;
}

.post-title:hover {
    color: #3b82f6;
}

.post-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #64748b;
    font-size: 0.9rem;
    padding: 15px 20px 10px;
}

.author-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.username {
    font-weight: 500;
    color: #475569;
}

.time {
    font-size: 0.85rem;
    color: #94a3b8;
}

.post-stats {
    display: flex;
    justify-content: space-around;
    padding: 15px 20px 10px;
    border-top: 1px solid #f1f5f9;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 5px;
    color: #64748b;
    font-size: 0.9rem;
}

.stat-item .el-icon {
    font-size: 1.1rem;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
}

/* 弹窗样式 */
.post-dialog :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
}

.post-dialog :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #3b82f6, #60a5fa);
    margin: 0;
    padding: 20px;
}

.post-dialog :deep(.el-dialog__title) {
    color: white;
    font-weight: 600;
}

.post-dialog :deep(.el-dialog__body) {
    padding: 30px;
}

.post-dialog :deep(.el-form-item__label) {
    font-weight: 500;
    color: #334155;
}

.post-dialog :deep(.el-input__wrapper) {
    border-radius: 10px;
    padding: 0 15px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.post-dialog :deep(.el-textarea__inner) {
    border-radius: 10px;
    padding: 15px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    min-height: 200px;
}

.cancel-btn {
    border-radius: 8px;
    padding: 10px 20px;
    border: 1px solid #e2e8f0;
}

.submit-btn {
    border-radius: 8px;
    padding: 10px 20px;
    background: linear-gradient(135deg, #3b82f6, #60a5fa);
    border: none;
}

/* 响应式设计 */
@media (max-width: 992px) {
    .post-grid {
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }
}

@media (max-width: 768px) {
    .forum-page-container {
        padding: 20px 15px;
    }

    .search-bar {
        flex-direction: column;
        gap: 15px;
    }

    .post-grid {
        grid-template-columns: 1fr;
    }

    .header-content h1 {
        font-size: 2.2rem;
    }

    .carousel-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
    }

    .post-info {
        padding-right: 0;
    }

    .author-info {
        width: 100%;
        justify-content: flex-end;
    }
}

@media (max-width: 480px) {
    .header-content h1 {
        font-size: 1.8rem;
    }

    .header-content p {
        font-size: 1rem;
    }

    .carousel-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }

    .post-stats {
        gap: 10px;
    }
}
</style>