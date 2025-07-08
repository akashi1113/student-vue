<!-- src/components/NotificationDrawer.vue -->
<template>
  <el-drawer :model-value="visible" title="消息通知" direction="rtl" size="400px" @close="$emit('close')">
    <div class="notification-container">
      <div class="header-actions">
        <el-button type="primary" link @click="handleMarkAllAsRead">全部已读</el-button>
      </div>

      <el-skeleton :rows="5" animated v-if="loading" />

      <el-empty v-if="!loading && notifications.length === 0" description="暂无通知" />

      <ul class="notification-list" v-else>
        <li v-for="item in notifications" :key="item.id" class="notification-item"
            :class="{ 'is-unread': item.status === 0 }" @click="handleNotificationClick(item)">
          <div class="notification-icon">
            <el-icon v-if="item.type === 1">
              <BellFilled />
            </el-icon>
            <el-icon v-if="item.type === 2">
              <Document />
            </el-icon>
            <el-icon v-if="item.type === 3">
              <ChatDotRound />
            </el-icon>
          </div>
          <div class="notification-content">
            <p class="content-text">{{ item.content }}</p>
            <span class="notification-time">{{ formatTime(item.createTime) }}</span>
          </div>
        </li>
      </ul>

      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination small background layout="prev, pager, next" :total="total" :page-size="pageSize"
                       :current-page="currentPage" @current-change="handlePageChange" />
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { BellFilled, Document, ChatDotRound } from '@element-plus/icons-vue';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { notificationAPI } from '../api';

const props = defineProps({
  visible: Boolean,
  currentUserId: Number,
});
const emit = defineEmits(['close', 'update-unread-count']);

const router = useRouter();
const notifications = ref([]);
const loading = ref(true);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

const formatTime = (time) => {
  if (!time) return '';
  return formatDistanceToNow(new Date(time), { addSuffix: true, locale: zhCN });
};

const fetchNotifications = async () => {
  if (!props.currentUserId) return;
  loading.value = true;
  try {
    const params = {
      userId: props.currentUserId,
      page: currentPage.value,
      size: pageSize.value,
    };
    const result = await notificationAPI.getNotifications(params);
    notifications.value = result.list || [];
    total.value = result.total || 0;
  } catch (error) {
    console.error('获取通知列表失败:', error);
    ElMessage.error('获取通知列表失败');
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page) => {
  currentPage.value = page;
  fetchNotifications();
};

const handleNotificationClick = async (notification) => {
  // 如果是帖子或评论相关的通知，则跳转
  if ((notification.type === 2 || notification.type === 3) && notification.relatedId) {
    router.push(`/post/${notification.relatedId}`);
    emit('close'); // 关闭抽屉
  }

  // 如果是未读的，则标记为已读
  if (notification.status === 0) {
    try {
      await notificationAPI.markAsRead(notification.id, props.currentUserId);
      notification.status = 1; // 本地立即更新状态
      emit('update-unread-count'); // 通知父组件更新未读数
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  }
};

const handleMarkAllAsRead = async () => {
  try {
    await notificationAPI.markAllAsRead(props.currentUserId);
    ElMessage.success('所有消息已标记为已读');
    notifications.value.forEach(item => item.status = 1);
    emit('update-unread-count'); // 通知父组件更新未读数
  } catch (error) {
    console.error('一键已读失败:', error);
    ElMessage.error('操作失败');
  }
};

// 监听抽屉的显示状态
watch(() => props.visible, (newVal) => {
  if (newVal) {
    currentPage.value = 1; // 每次打开都重置到第一页
    fetchNotifications();
  }
});
</script>

<style scoped>
.notification-container {
  padding: 0 10px;
}

.header-actions {
  text-align: right;
  margin-bottom: 10px;
}

.notification-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.notification-item {
  display: flex;
  padding: 15px 10px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item.is-unread {
  font-weight: bold;
}

.notification-icon {
  font-size: 20px;
  margin-right: 15px;
  color: #409EFF;
  flex-shrink: 0;
  margin-top: 4px;
}

.notification-content {
  flex-grow: 1;
}

.content-text {
  margin: 0 0 5px;
  color: #303133;
  line-height: 1.5;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
