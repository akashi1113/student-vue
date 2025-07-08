<!-- src/components/CommentItem.vue -->
<template>
    <div class="comment-item">
        <el-avatar :size="40" :src="comment.userAvatar || defaultAvatar" class="comment-avatar" />
        <div class="comment-body">
            <div class="comment-header">
                <span class="comment-username">{{ comment.userName }}</span>
                <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
            </div>

            <!-- 编辑状态 -->
            <div v-if="isEditing" class="edit-comment-area">
                <el-input v-model="editContent" type="textarea" :rows="2" />
                <div class="edit-actions">
                    <el-button size="small" @click="cancelEdit">取消</el-button>
                    <el-button size="small" type="primary" @click="handleUpdateComment">保存</el-button>
                </div>
            </div>
            <!-- 显示状态 -->
            <p v-else class="comment-content">{{ comment.content }}</p>

            <div class="comment-actions">
                <el-button link type="primary" :class="{ 'liked': comment.isLiked }"
                    @click="emit('toggleLike', comment)">
                    <el-icon>
                        <Pointer />
                    </el-icon> {{ comment.likeCount }}
                </el-button>
                <el-button link type="info" @click="toggleReplyBox">
                    {{ showReplyBox ? '取消回复' : '回复' }}
                </el-button>
                <template v-if="comment.userId === currentUserId">
                    <el-button link type="primary" @click="startEdit">编辑</el-button>
                    <el-button link type="danger" @click="emit('delete', comment.id)">删除</el-button>
                </template>
            </div>

            <!-- 回复输入框 -->
            <div v-if="showReplyBox" class="reply-form">
                <el-input v-model="replyContent" :placeholder="`回复 @${comment.userName}`" size="small" />
                <el-button type="primary" size="small" @click="handleReplySubmit">发布回复</el-button>
            </div>

            <!-- 楼中楼回复列表 -->
            <div v-if="comment.children && comment.children.length > 0" class="replies-list">
                <CommentItem v-for="reply in comment.children" :key="reply.id" :comment="reply"
                    :currentUserId="currentUserId" @toggle-like="emit('toggleLike', $event)"
                    @delete="emit('delete', $event)" @update="emit('update', $event)" @reply="emit('reply', $event)" />
            </div>
            <el-button v-if="comment.replyCount > 0 && (!comment.children || comment.children.length === 0)" link
                type="primary" @click="emit('loadReplies', comment)" class="load-replies-btn">
                查看 {{ comment.replyCount }} 条回复
            </el-button>
        </div>
    </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';
import { Pointer } from '@element-plus/icons-vue';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const props = defineProps({
    comment: Object,
    currentUserId: Number
});
const emit = defineEmits(['toggleLike', 'delete', 'update', 'reply', 'loadReplies']);

const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

const isEditing = ref(false);
const editContent = ref('');
const showReplyBox = ref(false);
const replyContent = ref('');

const formatTime = (time) => {
    if (!time) return '';
    return formatDistanceToNow(new Date(time), { addSuffix: true, locale: zhCN });
};

const startEdit = () => {
    editContent.value = props.comment.content;
    isEditing.value = true;
};

const cancelEdit = () => {
    isEditing.value = false;
};

const handleUpdateComment = () => {
    if (!editContent.value.trim()) return;
    emit('update', { commentId: props.comment.id, content: editContent.value });
    isEditing.value = false;
};

const toggleReplyBox = () => {
    showReplyBox.value = !showReplyBox.value;
};

const handleReplySubmit = () => {
    if (!replyContent.value.trim()) return;
    emit('reply', { parentId: props.comment.id, content: replyContent.value });
    replyContent.value = '';
    showReplyBox.value = false;
};
</script>

<style scoped>
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

.comment-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.9em;
    margin-top: 5px;
}

.comment-actions .el-button.liked {
    color: var(--el-color-primary);
}

.edit-comment-area {
    margin: 5px 0;
}

.edit-actions {
    text-align: right;
    margin-top: 5px;
}

.reply-form {
    display: flex;
    gap: 10px;
    margin-top: 10px;
}

.replies-list {
    background-color: #fafafa;
    border-radius: 4px;
    padding: 0 10px;
    margin-top: 10px;
}

.load-replies-btn {
    font-size: 0.9em;
    padding-left: 0;
}
</style>
