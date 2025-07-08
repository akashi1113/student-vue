<!-- src/views/ForumPage.vue -->
<template>
    <div class="forum-page-container">
        <el-card class="page-header" shadow="never">
            <div class="header-content">
                <h1>社区论坛</h1>
                <p>在这里，你可以自由地提问、分享知识和经验。</p>
                <el-button type="primary" :icon="Edit" @click="openCreatePostDialog">发布新帖</el-button>
            </div>
        </el-card>
        <!-- 顶部轮播条 -->
        <div class="hot-posts-carousel">
            <div class="carousel-header">
                <el-icon class="fire-icon">
                    <HotWater />
                </el-icon>
                <h2>热门帖子</h2>
                <el-button type="text" @click="goToHotPosts">查看全部</el-button>
            </div>
            <el-carousel :interval="5000" height="100px" indicator-position="none" arrow="never">
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
                            <el-avatar :size="32" :src="post.userAvatar || defaultAvatar" />
                            <span>{{ post.userName }}</span>
                        </div>
                    </div>
                </el-carousel-item>
            </el-carousel>
        </div>
        <div class="search-bar">
            <el-input v-model="searchKeyword" placeholder="搜索帖子标题..." clearable @clear="fetchPosts"
                @keyup.enter="fetchPosts" style="width: 300px; margin-right: 10px;">
                <template #prefix>
                    <el-icon>
                        <Search />
                    </el-icon>
                </template>
            </el-input>

            <el-select v-model="searchCategory" placeholder="所有分类" clearable style="width: 150px; margin-right: 10px;"
                @change="fetchPosts">
                <el-option v-for="category in availableCategories" :key="category.value" :label="category.label"
                    :value="category.value" />
            </el-select>

            <el-button type="primary" @click="fetchPosts">
                <el-icon>
                    <Search />
                </el-icon> 搜索
            </el-button>
        </div>

        <div v-loading="loading" class="post-list">
            <el-empty v-if="!posts.length && !loading" description="还没有人发帖，快来抢占沙发吧！" />
            <el-card v-for="post in posts" :key="post.id" class="post-item" shadow="hover">
                <template #header>
                    <div class="post-header">
                        <router-link :to="{ name: 'PostDetail', params: { id: post.id } }" class="post-title">
                            {{ post.title }}
                        </router-link>
                        <el-tag size="small" type="info">{{ post.category }}</el-tag>
                    </div>
                </template>
                <div class="post-meta">
                    <div class="author-info">
                        <el-avatar :size="24" :src="post.userAvatar || defaultAvatar" />
                        <span class="username">{{ post.userName }}</span>
                    </div>
                    <span class="time">{{ formatTime(post.createTime) }}</span>
                </div>
                <div class="post-stats">
                    <span><el-icon>
                            <View />
                        </el-icon> {{ post.viewCount }}</span>
                    <span><el-icon>
                            <Pointer />
                        </el-icon> {{ post.likeCount }}</span>
                    <span><el-icon>
                            <ChatDotRound />
                        </el-icon> {{ post.commentCount }}</span>
                </div>
            </el-card>
        </div>

        <el-pagination v-if="total > 0" class="pagination-container" background
            layout="prev, pager, next, jumper, ->, total" :total="total" :page-size="pageSize"
            :current-page="currentPage" @current-change="handlePageChange" />

        <!-- 发布新帖弹窗 -->
        <el-dialog v-model="createPostDialogVisible" title="发布新帖" width="60%">
            <el-form :model="newPostForm" :rules="rules" ref="newPostFormRef" label-width="80px">
                <el-form-item label="标题" prop="title">
                    <el-input v-model="newPostForm.title" placeholder="请输入帖子标题" />
                </el-form-item>
                <el-form-item label="分类" prop="category">
                    <!-- 将el-input改为el-select -->
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
                <el-button @click="createPostDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitNewPost">立即发布</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { forumAPI } from '../../api';
import { ElMessage } from 'element-plus';
import { Edit, View, Pointer, ChatDotRound, Search, HotWater } from '@element-plus/icons-vue';
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
// 新增状态
const hotPosts = ref([]);
const router = useRouter();

// 前端定义分类列表
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
        const response = await forumAPI.getHotPosts(count);
        // 修正：直接使用 response（假设后端返回的热门帖子结构是 { list: [...] }）
        hotPosts.value = response.list || [];
    } catch (error) {
        console.error("获取热门帖子失败:", error);
        ElMessage.error('获取热门帖子失败: ' + (error.message || '未知错误'));
    }
};

// 新增：跳转到帖子详情页的方法
const goToPostDetail = (postId) => {
    router.push({ name: 'PostDetail', params: { id: postId } });
};

// 跳转到热门帖子页面
const goToHotPosts = () => {
    router.push({ name: 'HotPosts' });
};

onMounted(() => {
    fetchPosts();
    fetchHotPosts(); // 同时获取热门帖子
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
        // 修正：直接访问 response 的 list 和 total（因为 response 已经是后端的 data 字段内容）
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

onMounted(() => {
    fetchPosts();
});

// --- 发布新帖逻辑 ---
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
    // 重置表单
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
                // ✅ 修改：不再传递userId
                await forumAPI.createPost({
                    title: newPostForm.title,
                    content: newPostForm.content,
                    category: newPostForm.category
                });

                ElMessage.success('帖子发布成功！');
                createPostDialogVisible.value = false;
                fetchPosts(); // 刷新列表
            } catch (error) {
                console.error('发布失败:', error);
                ElMessage.error('发布失败: ' + (error.message || '请稍后再试'));
            }
        }
    });
};

</script>

<style scoped>
.forum-page-container {
    max-width: 960px;
    margin: 20px auto;
    padding: 20px;
}

.page-header {
    margin-bottom: 20px;
    border: none;
    background-color: transparent;
}

.header-content {
    text-align: center;
}

.header-content h1 {
    font-size: 2.5em;
    margin-bottom: 10px;
}

.header-content p {
    color: #606266;
    margin-bottom: 20px;
}

.post-list {
    min-height: 400px;
}

.post-item {
    margin-bottom: 15px;
    transition: all 0.2s ease-in-out;
}

.post-item:hover {
    transform: translateY(-2px);
    box-shadow: var(--el-box-shadow-light);
}

.post-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.post-title {
    font-size: 1.2em;
    font-weight: bold;
    text-decoration: none;
    color: #303133;
}

.post-title:hover {
    color: #409eff;
}

.post-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #909399;
    font-size: 0.9em;
    margin-bottom: 10px;
}

.author-info {
    display: flex;
    align-items: center;
}

.author-info .username {
    margin-left: 8px;
}

.post-stats {
    display: flex;
    gap: 20px;
    color: #c0c4cc;
    font-size: 0.9em;
}

.post-stats span {
    display: flex;
    align-items: center;
    gap: 5px;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
}

/* 添加搜索栏样式 */
.search-bar {
    margin-bottom: 20px;
    display: flex;
    align-items: center;
}

@media (max-width: 768px) {
    .search-bar {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
    }

    .search-bar .el-input {
        width: 100% !important;
        margin-right: 0 !important;
    }

    .search-bar .el-select {
        width: 100% !important;
        margin-right: 0 !important;
    }
}

.hot-posts-carousel {
    background: linear-gradient(135deg, #fff8f8, #f0f7ff);
    border-radius: 8px;
    margin-bottom: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.carousel-header {
    display: flex;
    align-items: center;
    padding: 10px 20px;
    background-color: #fff;
    border-bottom: 1px solid #eee;
}

.fire-icon {
    color: #ff6b6b;
    font-size: 24px;
    margin-right: 10px;
}

.carousel-header h2 {
    margin: 0;
    font-size: 18px;
    flex-grow: 1;
}

.carousel-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.carousel-item:hover {
    background-color: rgba(255, 107, 107, 0.05);
}

.post-info {
    flex-grow: 1;
    padding-right: 20px;
}

.post-title {
    font-weight: bold;
    font-size: 16px;
    margin-bottom: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.post-stats {
    display: flex;
    gap: 15px;
    color: #909399;
    font-size: 14px;
}

.author-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 80px;
}

.author-info span {
    margin-top: 5px;
    font-size: 12px;
    white-space: nowrap;
}
</style>
