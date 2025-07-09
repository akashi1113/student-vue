<template>
    <div class="post-detail-container">
        <!-- 背景装饰元素 -->
        <div class="bg-decorations">
            <div class="circle circle-1"></div>
            <div class="circle circle-2"></div>
            <div class="circle circle-3"></div>
            <div class="circle circle-4"></div>
            <div class="wave wave-1"></div>
            <div class="wave wave-2"></div>
        </div>

        <!-- 管理员模式返回按钮 -->
        <div v-if="isAdminMode" class="admin-back-btn">
            <el-button type="primary" @click="closeWindow" class="admin-btn">
                <el-icon>
                    <ArrowLeft />
                </el-icon> 返回管理面板
            </el-button>
        </div>

        <!-- 骨架屏 -->
        <el-skeleton :rows="10" animated v-if="loading" class="skeleton-loader" />

        <!-- 帖子详情卡片 -->
        <transition name="fade-slide">
            <el-card v-if="post && !loading" class="post-card" shadow="hover">
                <div class="post-header">
                    <h1>{{ post.title }}</h1>
                    <div class="category-tag">
                        <el-tag size="small" :type="getCategoryTagType(post.category)">{{ post.category }}</el-tag>
                    </div>
                </div>

                <div class="meta-info">
                    <div class="author">
                        <el-avatar :size="42" :src="post.userAvatar || defaultAvatar" class="author-avatar" />
                        <div class="author-details">
                            <span class="username">{{ post.userName }}</span>
                            <span class="time">发布于 {{ formatTime(post.createTime) }}</span>
                        </div>
                    </div>
                    <div class="stats">
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
                </div>

                <!-- 帖子内容 -->
                <div class="post-content" v-html="post.content"></div>

                <!-- 操作按钮 -->
                <div class="actions">
                    <div class="like-btn-wrapper" @click="toggleLikePost" ref="likeBtnWrapper">
                        <el-button type="primary" :plain="!post.isLiked" :icon="Pointer" class="like-btn">
                            <span class="btn-text">{{ post.isLiked ? '已赞' : '点赞' }}</span>
                            <span class="like-count" :key="post.likeCount">
                                ({{ post.likeCount }})
                            </span>
                            <span v-for="i in 15" :key="i" class="particle" :class="`particle-${i}`"></span>
                        </el-button>
                    </div>

                    <div class="post-operations">
                        <template v-if="currentUserId && Number(post.userId) === Number(currentUserId)">
                            <el-button type="primary" link @click="openEditPostDialog" class="action-btn">编辑</el-button>
                            <el-button type="danger" link @click="handleDeletePost" class="action-btn">删除</el-button>
                        </template>
                        <template v-else-if="currentUserId">
                            <el-button type="warning" link @click="handleReportPost" class="action-btn">举报</el-button>
                        </template>
                        <template v-else>
                            <el-button type="info" link @click="toLogin" class="action-btn">请登录后操作</el-button>
                        </template>
                    </div>
                </div>
            </el-card>
        </transition>

        <!-- 评论区 -->
        <transition name="fade-slide" appear>
            <el-card class="comments-section" shadow="hover" v-if="post && !loading">
                <h2 class="comment-title">
                    <span>评论区</span>
                    <span class="comment-count">{{ post.commentCount }}</span>
                </h2>
                <div class="comment-form">
                    <el-input v-model="newCommentContent" placeholder="发表你的看法..." type="textarea" :rows="3"
                        class="comment-input" />
                    <el-button type="primary" @click="submitComment(null, newCommentContent)"
                        :disabled="!newCommentContent.trim()" class="comment-submit">发布评论</el-button>
                </div>

                <div class="comment-list">
                    <el-empty v-if="!comments.length" description="还没有评论，快来发表第一条评论吧！" />
                    <CommentItem v-for="comment in comments" :key="comment.id" :comment="comment"
                        :current-user-id="currentUserId" @toggle-like="toggleLikeComment" @delete="handleDeleteComment"
                        @update="handleUpdateComment" @reply="handleReply" @load-replies="loadReplies" />
                </div>
            </el-card>
        </transition>

        <!-- 编辑帖子弹窗 -->
        <el-dialog v-model="editPostDialogVisible" title="编辑帖子" width="60%" class="edit-dialog">
            <el-form v-if="editPostForm" :model="editPostForm" :rules="rules" ref="editPostFormRef" label-width="80px">
                <el-form-item label="标题" prop="title">
                    <el-input v-model="editPostForm.title" class="edit-input" />
                </el-form-item>
                <el-form-item label="分类" prop="category">
                    <el-select v-model="editPostForm.category" placeholder="请选择分类" class="edit-select">
                        <el-option v-for="category in availableCategories" :key="category.value" :label="category.label"
                            :value="category.value" />
                    </el-select>
                </el-form-item>
                <el-form-item label="内容" prop="content">
                    <el-input v-model="editPostForm.content" type="textarea" :rows="10" class="edit-textarea" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="editPostDialogVisible = false" class="dialog-btn cancel-btn">取消</el-button>
                <el-button type="primary" @click="submitUpdatePost" class="dialog-btn save-btn">保存修改</el-button>
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

// 添加点赞动画的ref
const likeBtnWrapper = ref(null);

// 点赞/取消点赞帖子
const toggleLikePost = async () => {
    try {
        if (!currentUserId.value) {
            ElMessage.warning('请先登录');
            return;
        }

        // 触发粒子动画
        if (likeBtnWrapper.value) {
            likeBtnWrapper.value.classList.add('animate');
            setTimeout(() => {
                likeBtnWrapper.value.classList.remove('animate');
            }, 1000);
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

// // 点赞/取消点赞帖子
// const toggleLikePost = async () => {
//     try {
//         if (!currentUserId.value) {
//             ElMessage.warning('请先登录');
//             return;
//         }

//         if (post.value.isLiked) {
//             await forumAPI.unlikePost(postId);
//             post.value.likeCount--;
//         } else {
//             await forumAPI.likePost(postId);
//             post.value.likeCount++;
//         }
//         post.value.isLiked = !post.value.isLiked;
//     } catch (error) {
//         ElMessage.error('操作失败: ' + (error.message || '未知错误'));
//     }
// };

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
    max-width: 900px;
    margin: 0 auto;
    padding: 30px 20px;
    position: relative;
    overflow-x: hidden;
}

.bg-decorations {
    position: fixed;
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
    opacity: 0.08;
    background: linear-gradient(135deg, #3b82f6, #60a5fa);
    z-index: -1;
}

.circle-1 {
    width: 300px;
    height: 300px;
    top: -100px;
    left: -100px;
    animation: float 15s infinite ease-in-out;
}

.circle-2 {
    width: 200px;
    height: 200px;
    bottom: 50px;
    right: -50px;
    animation: float 18s infinite ease-in-out;
    animation-delay: 2s;
}

.circle-3 {
    width: 150px;
    height: 150px;
    top: 200px;
    right: 200px;
    animation: float 12s infinite ease-in-out;
    animation-delay: 4s;
}

.circle-4 {
    width: 100px;
    height: 100px;
    bottom: 200px;
    left: 150px;
    animation: float 14s infinite ease-in-out;
    animation-delay: 1s;
}

.wave {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 200%;
    height: 100px;
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill="%233b82f6"></path><path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" fill="%233b82f6"></path><path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="%233b82f6"></path></svg>');
    background-size: 50% 100px;
    opacity: 0.1;
    z-index: -1;
}

.wave-1 {
    height: 150px;
    animation: wave-animation 25s linear infinite;
}

.wave-2 {
    height: 120px;
    animation: wave-animation 20s linear infinite reverse;
    opacity: 0.15;
}

.admin-back-btn {
    margin-bottom: 30px;
    display: flex;
    justify-content: flex-start;
}

.admin-btn {
    border-radius: 30px;
    padding: 10px 20px;
    font-weight: 600;
    background: linear-gradient(135deg, #3b82f6, #60a5fa);
    border: none;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
    transition: all 0.3s ease;
}

.admin-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.admin-btn:active {
    transform: translateY(1px);
}

.skeleton-loader {
    border-radius: 16px;
    overflow: hidden;
}

.post-card,
.comments-section {
    border: none;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    margin-bottom: 30px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    overflow: hidden;
    position: relative;
    border: 1px solid rgba(235, 245, 255, 0.8);
}

.post-card:hover,
.comments-section:hover {
    box-shadow: 0 15px 40px rgba(59, 130, 246, 0.2);
    transform: translateY(-5px);
}

.post-header {
    padding: 25px 30px 10px;
    position: relative;
}

.post-header h1 {
    font-size: 2.2rem;
    margin-bottom: 15px;
    color: #1e293b;
    font-weight: 700;
    line-height: 1.3;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    letter-spacing: -0.5px;
}

.category-tag {
    position: absolute;
    top: 25px;
    right: 30px;
    z-index: 10;
    transform: rotate(3deg);
}

.meta-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 30px 20px;
    border-bottom: 1px solid #f1f5f9;
}

.author {
    display: flex;
    align-items: center;
    gap: 15px;
}

.author-avatar {
    transition: all 0.3s ease;
    border: 2px solid #dbeafe;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
}

.author-avatar:hover {
    transform: scale(1.1);
    box-shadow: 0 5px 15px rgba(59, 130, 246, 0.3);
}

.author-details {
    display: flex;
    flex-direction: column;
}

.username {
    font-weight: 600;
    color: #334155;
    font-size: 1.1rem;
}

.time {
    color: #64748b;
    font-size: 0.85rem;
}

.stats {
    display: flex;
    gap: 25px;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #64748b;
    font-weight: 500;
    font-size: 1rem;
    padding: 5px 12px;
    background: #f1f5f9;
    border-radius: 20px;
    transition: all 0.3s ease;
}

.stat-item:hover {
    background: #dbeafe;
    color: #3b82f6;
    transform: translateY(-2px);
}

.post-content {
    line-height: 1.8;
    font-size: 1.1em;
    margin: 30px;
    padding: 20px 0;
    border-bottom: 1px solid #f1f5f9;
    color: #334155;
}

.actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 30px;
}

/* 点赞按钮容器 */
.like-btn-wrapper {
    position: relative;
    display: inline-block;
}

/* 点赞按钮样式 */
.like-btn {
    position: relative;
    z-index: 1;
    overflow: visible;
    border-radius: 30px;
    padding: 10px 25px;
    font-weight: 600;
    background: linear-gradient(135deg, #3b82f6, #60a5fa);
    border: none;
    color: white;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
    transform: scale(1);
}

.like-btn.is-plain {
    background: white;
    color: #3b82f6;
    border: 1px solid #3b82f6;
}

.like-btn:hover:not(.is-plain) {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.like-btn:hover .btn-text {
    animation: pulse 0.5s infinite alternate;
}

/* 点赞文本动画 */
@keyframes pulse {
    from {
        transform: scale(1);
    }

    to {
        transform: scale(1.1);
    }
}

/* 心跳动画 */
@keyframes heartbeat {
    0% {
        transform: scale(1);
    }

    25% {
        transform: scale(1.15);
    }

    50% {
        transform: scale(0.95);
    }

    75% {
        transform: scale(1.1);
    }

    100% {
        transform: scale(1);
    }
}

.animate .like-btn {
    animation: heartbeat 0.5s ease;
}

/* 粒子效果 */
.particle {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #3b82f6;
    opacity: 0;
    z-index: 0;
    pointer-events: none;
}

.animate .particle {
    opacity: 1;
}

/* 粒子动画 */
.animate .particle-1 {
    animation: particle-ani 1s ease-in-out;
}

.animate .particle-2 {
    animation: particle-ani 1s ease-in-out 0.1s;
}

.animate .particle-3 {
    animation: particle-ani 1s ease-in-out 0.2s;
}

.animate .particle-4 {
    animation: particle-ani 1s ease-in-out 0.3s;
}

.animate .particle-5 {
    animation: particle-ani 1s ease-in-out 0.4s;
}

.animate .particle-6 {
    animation: particle-ani 1s ease-in-out 0.5s;
}

.animate .particle-7 {
    animation: particle-ani 1s ease-in-out 0.6s;
}

.animate .particle-8 {
    animation: particle-ani 1s ease-in-out 0.7s;
}

.animate .particle-9 {
    animation: particle-ani 1s ease-in-out 0.8s;
}

.animate .particle-10 {
    animation: particle-ani 1s ease-in-out 0.9s;
}

.animate .particle-11 {
    animation: particle-ani 1s ease-in-out 1.0s;
}

.animate .particle-12 {
    animation: particle-ani 1s ease-in-out 1.1s;
}

.animate .particle-13 {
    animation: particle-ani 1s ease-in-out 1.2s;
}

.animate .particle-14 {
    animation: particle-ani 1s ease-in-out 1.3s;
}

.animate .particle-15 {
    animation: particle-ani 1s ease-in-out 1.4s;
}

@keyframes particle-ani {
    0% {
        transform: translate(-50%, -50%) scale(0);
        opacity: 1;
    }

    100% {
        transform: translate(-50%, -50%) translate(var(--tx), var(--ty)) scale(1);
        opacity: 0;
    }
}

.animate .particle-1 {
    --tx: -30px;
    --ty: -30px;
    background: #ff6b6b;
}

.animate .particle-2 {
    --tx: 30px;
    --ty: -30px;
    background: #3b82f6;
}

.animate .particle-3 {
    --tx: -30px;
    --ty: 30px;
    background: #10b981;
}

.animate .particle-4 {
    --tx: 30px;
    --ty: 30px;
    background: #f59e0b;
}

.animate .particle-5 {
    --tx: 0;
    --ty: -40px;
    background: #8b5cf6;
}

.animate .particle-6 {
    --tx: 0;
    --ty: 40px;
    background: #ec4899;
}

.animate .particle-7 {
    --tx: -40px;
    --ty: 0;
    background: #06b6d4;
}

.animate .particle-8 {
    --tx: 40px;
    --ty: 0;
    background: #f43f5e;
}

.animate .particle-9 {
    --tx: -20px;
    --ty: -35px;
    background: #3b82f6;
}

.animate .particle-10 {
    --tx: 20px;
    --ty: -35px;
    background: #10b981;
}

.animate .particle-11 {
    --tx: -20px;
    --ty: 35px;
    background: #f59e0b;
}

.animate .particle-12 {
    --tx: 20px;
    --ty: 35px;
    background: #8b5cf6;
}

.animate .particle-13 {
    --tx: -35px;
    --ty: -20px;
    background: #ec4899;
}

.animate .particle-14 {
    --tx: 35px;
    --ty: -20px;
    background: #06b6d4;
}

.animate .particle-15 {
    --tx: -35px;
    --ty: 20px;
    background: #f43f5e;
}

/* 点赞数字动画 */
.like-count {
    display: inline-block;
    transition: all 0.3s ease;
    position: relative;
}

.like-btn:active .like-count {
    animation: count-pop 0.5s ease;
}

@keyframes count-pop {
    0% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.5);
    }

    100% {
        transform: scale(1);
    }
}

.post-operations {
    display: flex;
    gap: 15px;
}

.action-btn {
    font-weight: 600;
    padding: 5px 10px;
    border-radius: 8px;
    transition: all 0.3s ease;
}

.action-btn:hover {
    background: #f1f5f9;
    transform: translateY(-2px);
}

/* 评论区样式 */
.comments-section {
    padding: 30px;
}

.comment-title {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 30px;
    font-size: 1.6rem;
    color: #1e293b;
    padding-bottom: 15px;
    border-bottom: 1px solid #eef2f7;
}

.comment-count {
    background: #3b82f6;
    color: white;
    padding: 2px 12px;
    border-radius: 20px;
    font-size: 1rem;
}

.comment-form {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 30px;
}

.comment-input :deep(.el-textarea__inner) {
    border-radius: 16px;
    padding: 15px 20px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;
    font-size: 1rem;
}

.comment-input :deep(.el-textarea__inner):focus {
    border-color: #3b82f6;
    box-shadow: 0 2px 15px rgba(59, 130, 246, 0.2);
}

.comment-submit {
    align-self: flex-end;
    border-radius: 30px;
    padding: 10px 30px;
    font-weight: 600;
    background: linear-gradient(135deg, #3b82f6, #60a5fa);
    border: none;
    transition: all 0.3s ease;
}

.comment-submit:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 6px 15px rgba(59, 130, 246, 0.4);
}

.comment-submit:disabled {
    opacity: 0.6;
}

.comment-list {
    max-height: 800px;
    overflow-y: auto;
    padding-right: 10px;
}

/* 弹窗样式 */
.edit-dialog :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
}

.edit-dialog :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #3b82f6, #60a5fa);
    margin: 0;
    padding: 20px;
}

.edit-dialog :deep(.el-dialog__title) {
    color: white;
    font-weight: 700;
    font-size: 1.4rem;
}

.edit-dialog :deep(.el-dialog__body) {
    padding: 30px;
}

.edit-input :deep(.el-input__wrapper),
.edit-select :deep(.el-select__wrapper) {
    border-radius: 12px;
    padding: 0 15px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
}

.edit-input :deep(.el-input__wrapper):hover,
.edit-select :deep(.el-select__wrapper):hover {
    box-shadow: 0 2px 12px rgba(59, 130, 246, 0.15);
}

.edit-textarea :deep(.el-textarea__inner) {
    border-radius: 16px;
    padding: 15px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    min-height: 300px;
    font-size: 1rem;
    transition: all 0.3s ease;
}

.edit-textarea :deep(.el-textarea__inner):focus {
    border-color: #3b82f6;
    box-shadow: 0 2px 15px rgba(59, 130, 246, 0.2);
}

.dialog-btn {
    border-radius: 12px;
    padding: 10px 25px;
    font-weight: 600;
    transition: all 0.3s ease;
}

.cancel-btn {
    background: #f1f5f9;
    color: #64748b;
}

.cancel-btn:hover {
    background: #e2e8f0;
    transform: translateY(-2px);
}

.save-btn {
    background: linear-gradient(135deg, #3b82f6, #60a5fa);
    border: none;
    color: white;
}

.save-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 15px rgba(59, 130, 246, 0.4);
}

/* 动画效果 */
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all 0.5s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(20px);
}

@keyframes float {
    0% {
        transform: translate(0, 0);
    }

    50% {
        transform: translate(20px, 20px);
    }

    100% {
        transform: translate(0, 0);
    }
}

@keyframes wave-animation {
    0% {
        transform: translateX(0);
    }

    100% {
        transform: translateX(-50%);
    }
}

/* 响应式设计 */
@media (max-width: 768px) {
    .post-detail-container {
        padding: 20px 15px;
    }

    .post-header h1 {
        font-size: 1.8rem;
        padding-right: 80px;
    }

    .meta-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 20px;
    }

    .post-content {
        margin: 20px 15px;
        padding: 15px 0;
    }

    .actions {
        flex-direction: column;
        gap: 15px;
        align-items: flex-start;
    }
}
</style>