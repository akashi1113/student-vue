<template>
    <div class="post-detail-container">
        <!-- 管理员模式返回按钮 -->
        <div v-if="isAdminMode" class="admin-back-btn">
            <el-button type="primary" @click="closeWindow">
                <el-icon>
                    <ArrowLeft />
                </el-icon> 返回管理面板
            </el-button>
        </div>

        <!-- 骨架屏 -->
        <el-skeleton :rows="10" animated v-if="loading" />

        <!-- 帖子详情卡片 -->
        <el-card v-if="post && !loading" class="post-card" shadow="never">
            <template #header>
                <h1>{{ post.title }}</h1>
                <div class="meta-info">
                    <div class="author">
                        <el-avatar :size="32" :src="post.userAvatar || defaultAvatar" />
                        <span class="username">{{ post.userName }}</span>
                    </div>
                    <div class="stats">
                        <span>发布于 {{ formatTime(post.createTime) }}</span>
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
                </div>
            </template>

            <!-- 帖子内容 -->
            <div class="post-content" v-html="post.content"></div>

            <!-- 操作按钮 -->
            <div class="actions">
                <el-button type="primary" :plain="!post.isLiked" @click="toggleLikePost" :icon="Pointer">
                    {{ post.isLiked ? '已赞' : '点赞' }} ({{ post.likeCount }})
                </el-button>
                <!-- 修复后的操作按钮区域 -->
                <div class="post-operations">
                    <!-- 自己的帖子：显示编辑和删除 -->
                    <template v-if="currentUserId && Number(post.userId) === Number(currentUserId)">
                        <el-button type="primary" link @click="openEditPostDialog">编辑</el-button>
                        <el-button type="danger" link @click="handleDeletePost">删除</el-button>
                    </template>
                    <!-- 别人的帖子：只显示举报 -->
                    <template v-else-if="currentUserId">
                        <el-button type="warning" link @click="handleReportPost">举报</el-button>
                    </template>
                    <!-- 未登录：不显示任何操作按钮 -->
                    <template v-else>
                        <el-button type="info" link @click="toLogin">请登录后操作</el-button>
                    </template>
                </div>
            </div>
        </el-card>

        <!-- 评论区 -->
        <el-card class="comments-section" shadow="never" v-if="post && !loading">
            <h2 class="comment-title">评论区 ({{ post.commentCount }})</h2>
            <div class="comment-form">
                <el-input v-model="newCommentContent" placeholder="发表你的看法..." type="textarea" :rows="3" />
                <el-button type="primary" @click="submitComment(null, newCommentContent)"
                    :disabled="!newCommentContent.trim()">发布评论</el-button>
            </div>

            <div class="comment-list">
                <el-empty v-if="!comments.length" description="还没有评论，快来发表第一条评论吧！" />
                <CommentItem v-for="comment in comments" :key="comment.id" :comment="comment"
                    :current-user-id="currentUserId" @toggle-like="toggleLikeComment" @delete="handleDeleteComment"
                    @update="handleUpdateComment" @reply="handleReply" @load-replies="loadReplies" />
            </div>
        </el-card>

        <!-- 编辑帖子弹窗 -->
        <el-dialog v-model="editPostDialogVisible" title="编辑帖子" width="60%">
            <el-form v-if="editPostForm" :model="editPostForm" :rules="rules" ref="editPostFormRef" label-width="80px">
                <el-form-item label="标题" prop="title">
                    <el-input v-model="editPostForm.title" />
                </el-form-item>
                <el-form-item label="分类" prop="category">
                    <el-select v-model="editPostForm.category" placeholder="请选择分类">
                        <el-option v-for="category in availableCategories" :key="category.value" :label="category.label"
                            :value="category.value" />
                    </el-select>
                </el-form-item>
                <el-form-item label="内容" prop="content">
                    <el-input v-model="editPostForm.content" type="textarea" :rows="10" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="editPostDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitUpdatePost">保存修改</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { forumAPI } from '../../api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { View, Pointer, ChatDotRound, ArrowLeft } from '@element-plus/icons-vue';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import CommentItem from '../../components/CommentItem.vue';

const route = useRoute();
const router = useRouter();
const postId = Number(route.params.id);
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';
// ✅ 修改：移除硬编码的用户ID，从JWT获取
// const currentUserId = ref(null);
const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
const currentUserId = ref(userInfo.user ? userInfo.user.id : null);

// 响应式数据
const post = ref(null);
const comments = ref([]);
const loading = ref(true);
const newCommentContent = ref('');
const availableCategories = ref([
    { value: '技术问答', label: '技术问答' },
    { value: '学习分享', label: '学习分享' },
    { value: '资源推荐', label: '资源推荐' },
    { value: '课程讨论', label: '课程讨论' },
    { value: '项目展示', label: '项目展示' },
    { value: '求职交流', label: '求职交流' },
    { value: '其他话题', label: '其他话题' }
]);

const fetchPostDetail = async () => {
    try {
        const isAdminMode = route.query.mode === 'admin';
        let result = null;

        if (isAdminMode) {
            // ✅ 直接使用API返回的结果（已经是data.data）
            result = await forumAPI.getPostDetailForAdmin(postId);
        } else {
            // ✅ 直接使用API返回的结果
            result = await forumAPI.getPostDetail(postId);
        }

        console.log("API返回的数据:", result); // 调试

        if (result) {
            post.value = result;
            // // ✅ 根据数据结构，用户ID应该是result.userId
            // currentUserId.value = result.userId || null;


        } else {
            throw new Error("帖子数据为空或加载失败");
        }
    } catch (error) {
        console.error('获取帖子详情失败:', error);
        ElMessage.error(error.message || '获取帖子详情失败');
    }
};

const fetchComments = async () => {
    try {
        const params = { page: 1, size: 100 };
        // ✅ 直接使用响应结果（已经是data.data）
        const result = await forumAPI.getComments(postId, params);

        // ✅ 直接访问 result.list
        comments.value = (result?.list || []).map(c => ({ ...c, children: [] }));
    } catch (error) {
        console.error('获取评论列表失败:', error);
        ElMessage.error('获取评论列表失败: ' + (error.message || '未知错误'));
    }
};

// 点赞/取消点赞帖子
const toggleLikePost = async () => {
    try {
        if (!currentUserId.value) {
            ElMessage.warning('请先登录');
            return;
        }

        if (post.value.isLiked) {
            await forumAPI.unlikePost(postId);
            post.value.likeCount--;
        } else {
            await forumAPI.likePost(postId);
            post.value.likeCount++;
        }
        post.value.isLiked = !post.value.isLiked;
    } catch (error) {
        ElMessage.error('操作失败: ' + (error.message || '未知错误'));
    }
};

// 日期格式化
const formatTime = (time) => {
    if (!time) return '';
    const date = new Date(time);
    return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
};

// 删除帖子
const handleDeletePost = () => {
    ElMessageBox.confirm('确定要删除这篇帖子吗？此操作不可恢复。', '警告', {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
    }).then(async () => {
        try {
            await forumAPI.deletePost(postId);
            ElMessage.success('帖子已删除');
            router.push({ name: 'Forum' });
        } catch (error) {
            ElMessage.error('删除失败: ' + (error.message || '未知错误'));
        }
    });
};

// 举报帖子
const handleReportPost = () => {
    ElMessageBox.prompt('请输入举报理由', '举报帖子', {
        confirmButtonText: '提交举报',
        cancelButtonText: '取消',
        inputPattern: /.+/,
        inputErrorMessage: '必须填写举报理由',
    }).then(async ({ value }) => {
        try {
            await forumAPI.reportPost(postId, value);
            ElMessage.success('举报已提交，感谢您的反馈！');
        } catch (error) {
            ElMessage.error('举报失败: ' + (error.message || '未知错误'));
        }
    });
};

// 点赞/取消点赞评论
const toggleLikeComment = async (comment) => {
    try {
        if (!currentUserId.value) {
            ElMessage.warning('请先登录');
            return;
        }

        const action = comment.isLiked ? forumAPI.unlikeComment : forumAPI.likeComment;
        await action(comment.id);
        comment.likeCount += comment.isLiked ? -1 : 1;
        comment.isLiked = !comment.isLiked;
    } catch (error) {
        ElMessage.error('操作失败: ' + (error.message || '未知错误'));
    }
};

// 发布评论
const submitComment = async (parentId, content) => {
    try {
        if (!currentUserId.value) {
            ElMessage.warning('请先登录');
            return;
        }

        const commentData = { content, parentId };
        const response = await forumAPI.createComment(postId, commentData);
        const newComment = response.data;

        ElMessage.success('发布成功！');
        if (parentId) {
            const parentComment = findComment(comments.value, parentId);
            if (parentComment) {
                if (!parentComment.children) parentComment.children = [];
                parentComment.children.push(newComment);
            }
        } else {
            newCommentContent.value = '';
            fetchComments();
        }
        post.value.commentCount++;
    } catch (error) {
        ElMessage.error('发布失败: ' + (error.message || '未知错误'));
    }
};

// 删除评论
const handleDeleteComment = async (commentId) => {
    ElMessageBox.confirm('确定要删除这条评论吗？', '提示', { type: 'warning' })
        .then(async () => {
            try {
                await forumAPI.deleteComment(postId, commentId);
                ElMessage.success('评论已删除');
                removeComment(comments.value, commentId);
                post.value.commentCount--;
            } catch (error) {
                ElMessage.error('删除失败: ' + (error.message || '未知错误'));
            }
        });
};

// 更新评论
const handleUpdateComment = async ({ commentId, content }) => {
    try {
        await forumAPI.updateComment(postId, commentId, { content });
        ElMessage.success('评论已更新');
        const comment = findComment(comments.value, commentId);
        if (comment) comment.content = content;
    } catch (error) {
        ElMessage.error('更新失败: ' + (error.message || '未知错误'));
    }
};

// 回复评论
const handleReply = ({ parentId, content }) => {
    submitComment(parentId, content);
};

const loadReplies = async (parentComment) => {
    try {
        const params = { page: 1, size: 100 };
        // ✅ 直接使用结果
        const result = await forumAPI.getCommentReplies(parentComment.id, params);
        parentComment.children = result?.list || [];
    } catch (error) {
        ElMessage.error('加载回复失败: ' + (error.message || '未知错误'));
    }
};

// 辅助函数 - 查找评论
const findComment = (commentList, commentId) => {
    for (const comment of commentList) {
        if (comment.id === commentId) return comment;
        if (comment.children?.length) {
            const found = findComment(comment.children, commentId);
            if (found) return found;
        }
    }
    return null;
};

// 辅助函数 - 删除评论
const removeComment = (commentList, commentId) => {
    const index = commentList.findIndex(c => c.id === commentId);
    if (index !== -1) {
        commentList.splice(index, 1);
        return true;
    }
    for (const comment of commentList) {
        if (comment.children?.length) {
            if (removeComment(comment.children, commentId)) return true;
        }
    }
    return false;
};

// 编辑帖子相关逻辑
const editPostDialogVisible = ref(false);
const editPostFormRef = ref(null);
const editPostForm = ref(null);
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

const openEditPostDialog = () => {
    editPostForm.value = reactive({
        title: post.value.title,
        content: post.value.content,
        category: post.value.category,
    });
    editPostDialogVisible.value = true;
};

const submitUpdatePost = async () => {
    await editPostFormRef.value.validate(async (valid) => {
        if (valid) {
            try {
                await forumAPI.updatePost(postId, editPostForm.value);
                ElMessage.success('帖子更新成功！');
                editPostDialogVisible.value = false;
                fetchPostDetail();
            } catch (error) {
                ElMessage.error('更新失败: ' + (error.message || '未知错误'));
            }
        }
    });
};

// 初始化加载
onMounted(async () => {
    loading.value = true;
    try {
        await Promise.all([fetchPostDetail(), fetchComments()]);
    } catch (error) {
        console.error('初始化加载失败:', error);
    } finally {
        loading.value = false;
    }
});

// 管理员模式
const isAdminMode = computed(() => route.query.mode === 'admin');

// 关闭窗口
const closeWindow = () => {
    if (window.opener) {
        window.close();
    } else {
        router.push({ name: 'Admin' });
    }
};
</script>

<style scoped>
.post-detail-container {
    max-width: 800px;
    margin: 20px auto;
    padding: 20px;
}

.post-card,
.comments-section {
    border: none;
    background-color: #fff;
    border-radius: 8px;
    margin-bottom: 20px;
}

h1 {
    font-size: 2em;
    margin-bottom: 20px;
}

.meta-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #909399;
    font-size: 0.9em;
}

.author,
.stats {
    display: flex;
    align-items: center;
    gap: 15px;
}

.author .username {
    margin-left: 8px;
    font-weight: bold;
}

.post-content {
    line-height: 1.8;
    font-size: 1.1em;
    margin: 20px 0;
    word-wrap: break-word;
}

.actions {
    display: flex;
    justify-content: space-between;
    /* 修改 */
    align-items: center;
    /* 修改 */
    margin-top: 20px;
    border-top: 1px solid #e4e7ed;
    padding-top: 20px;
}

.comment-title {
    margin-bottom: 20px;
}

.comment-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 30px;
}

.comment-form .el-button {
    align-self: flex-end;
}

.comment-item {
    display: flex;
    gap: 15px;
    padding: 15px 0;
    border-top: 1px solid #f2f2f2;
}

.comment-body {
    flex: 1;
}

.comment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
}

.comment-username {
    font-weight: bold;
    color: #303133;
}

.comment-time {
    color: #909399;
    font-size: 0.8em;
}

.comment-content {
    margin: 5px 0;
    line-height: 1.6;
}

.el-button.liked {
    color: var(--el-color-primary);
}

.comment-actions {
    display: flex;
    /* 新增 */
    align-items: center;
    /* 新增 */
    gap: 10px;
    /* 新增 */
}

.admin-back-btn {
    margin-bottom: 20px;
    display: flex;
    justify-content: flex-start;
}
</style>
