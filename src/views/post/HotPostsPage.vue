<template>
    <div class="hot-posts-page">
        <el-page-header @back="goBack" content="热门帖子" />

        <div class="hot-posts-container">
            <div class="page-header">
                <h1><el-icon>
                        <Fire />
                    </el-icon> 热门帖子</h1>
                <p>当前最受欢迎的社区内容</p>
            </div>

            <el-row :gutter="20">
                <el-col :span="15">
                    <div v-loading="loading" class="post-list">
                        <el-empty v-if="!posts.length && !loading" description="暂无热门帖子" />
                        <!-- 帖子列表项（复用ForumPage的结构） -->
                        <el-card v-for="post in posts" :key="post.id" class="post-item" shadow="hover">
                            <template #header>
                                <div class="post-header">
                                    <router-link :to="{ name: 'PostDetail', params: { id: post.id } }"
                                        class="post-title">
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
                            <!-- 显示AI摘要（如果有） -->
                            <div class="post-summary" v-if="post.aiSummary">
                                <p>{{ post.aiSummary }} <router-link
                                        :to="{ name: 'PostDetail', params: { id: post.id } }">查看全文</router-link></p>
                            </div>
                            <div class="post-stats">
                                <span><el-icon>
                                        <View />
                                    </el-icon> {{ post.viewCount }} 浏览</span>
                                <span><el-icon>
                                        <Pointer />
                                    </el-icon> {{ post.likeCount }} 点赞</span>
                                <span><el-icon>
                                        <ChatDotRound />
                                    </el-icon> {{ post.commentCount }} 评论</span>
                            </div>
                        </el-card>
                    </div>
                </el-col>

                <el-col :span="9">
                    <!-- 数据分析图表 -->
                    <el-card class="analytics-card">
                        <h2>热门数据分析</h2>

                        <!-- 分类分布饼图 -->
                        <div class="chart-container">
                            <h3>分类分布</h3>
                            <div ref="categoryChart" style="height: 300px;"></div>
                        </div>

                        <!-- 作者发帖量柱状图 -->
                        <div class="chart-container">
                            <h3>热门作者</h3>
                            <div ref="authorChart" style="height: 300px;"></div>
                        </div>

                        <!-- 互动数据对比 -->
                        <div class="chart-container">
                            <h3>互动数据对比</h3>
                            <div ref="interactionChart" style="height: 300px;"></div>
                        </div>
                    </el-card>
                </el-col>
            </el-row>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { forumAPI } from '../../api';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';
// 导入所需图标和日期格式化工具
import { Fire, View, Pointer, ChatDotRound } from '@element-plus/icons-vue';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const router = useRouter();
const posts = ref([]);
const loading = ref(true);
// 默认头像（复用ForumPage的设置）
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

// 图表引用
const categoryChart = ref(null);
const authorChart = ref(null);
const interactionChart = ref(null);

// 获取热门帖子（按浏览量/互动量排序）
const fetchHotPosts = async () => {
    loading.value = true;
    try {
        const count = 5; // 获取5条热门帖子
        posts.value = await forumAPI.getHotPosts(count);
        // 等待DOM更新后初始化图表
        nextTick(() => {
            initCharts();
        });
    } catch (error) {
        console.error("获取热门帖子失败:", error);
        ElMessage.error('获取热门帖子失败');
    } finally {
        loading.value = false;
    }
};

// 返回论坛首页
const goBack = () => {
    router.push({ name: 'Forum' });
};

// 日期格式化（复用ForumPage的逻辑）
const formatTime = (time) => {
    if (!time) return '';
    const date = new Date(time);
    return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
};

// 初始化图表（基于热门帖子数据）
const initCharts = () => {
    if (!posts.value.length) return;

    // 1. 分类分布饼图
    const categoryMap = {};
    posts.value.forEach(post => {
        categoryMap[post.category] = (categoryMap[post.category] || 0) + 1;
    });

    const categoryChartInstance = echarts.init(categoryChart.value);
    categoryChartInstance.setOption({
        tooltip: { trigger: 'item' },
        legend: { orient: 'vertical', right: 10, top: 'center', itemGap: 15 },
        series: [{
            name: '分类分布',
            type: 'pie',
            radius: ['35%', '65%'],
            center: ['40%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10 },
            label: { show: false },
            emphasis: { label: { show: true } },
            data: Object.keys(categoryMap).map(category => ({
                value: categoryMap[category],
                name: category
            }))
        }]
    });

    // 2. 作者发帖量柱状图
    const authorMap = {};
    posts.value.forEach(post => {
        authorMap[post.userName] = (authorMap[post.userName] || 0) + 1;
    });

    // 按发帖量排序，取前5名
    const topAuthors = Object.entries(authorMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const authorChartInstance = echarts.init(authorChart.value);
    authorChartInstance.setOption({
        tooltip: { trigger: 'axis' },
        xAxis: {
            type: 'category',
            data: topAuthors.map(author => author[0]),
            axisLabel: { interval: 0, rotate: 30 }
        },
        yAxis: { type: 'value' },
        series: [{
            name: '发帖量',
            type: 'bar',
            data: topAuthors.map(author => author[1]),
            itemStyle: { color: '#36a3f7' }
        }]
    });

    // 3. 互动数据对比（浏览/点赞/评论）
    const interactionData = posts.value.map(post => ({
        name: post.title.substring(0, 15) + (post.title.length > 15 ? '...' : ''),
        views: post.viewCount,
        likes: post.likeCount,
        comments: post.commentCount
    }));

    const interactionChartInstance = echarts.init(interactionChart.value);
    interactionChartInstance.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['浏览量', '点赞量', '评论量'] },
        grid: { left: '5%', right: '5%', bottom: '8%', containLabel: true },
        xAxis: {
            type: 'category',
            data: interactionData.map(item => item.name),
            axisLabel: { rotate: 45, interval: 0 } // 标题过长时旋转显示
        },
        yAxis: { type: 'value' },
        series: [
            { name: '浏览量', type: 'bar', data: interactionData.map(item => item.views) },
            { name: '点赞量', type: 'bar', data: interactionData.map(item => item.likes) },
            { name: '评论量', type: 'bar', data: interactionData.map(item => item.comments) }
        ]
    });

    // 监听窗口大小变化，重绘图表
    window.addEventListener('resize', () => {
        categoryChartInstance.resize();
        authorChartInstance.resize();
        interactionChartInstance.resize();
    });
};

onMounted(() => {
    fetchHotPosts();
});
</script>

<style scoped>
.hot-posts-page {
    max-width: 1200px;
    margin: 20px auto;
    padding: 20px;
}

.page-header {
    text-align: center;
    margin-bottom: 30px;
}

.page-header h1 {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: #ff6b6b;
    margin-bottom: 10px;
}

.analytics-card {
    position: sticky;
    top: 20px;
    padding: 15px;
}

.chart-container {
    margin-bottom: 40px;
}

.chart-container h3 {
    margin-top: 0;
    margin-bottom: 15px;
    text-align: center;
    color: #409eff;
    font-size: 16px;
}

.post-list {
    min-height: 400px;
}

/* 帖子项样式（复用ForumPage） */
.post-item {
    margin-bottom: 15px;
    transition: all 0.2s ease;
}

.post-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.post-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.post-title {
    font-size: 1.1em;
    font-weight: bold;
    text-decoration: none;
    color: #303133;
    transition: color 0.2s;
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
    margin: 10px 0;
    padding-bottom: 10px;
    border-bottom: 1px dashed #eee;
}

.author-info {
    display: flex;
    align-items: center;
}

.username {
    margin-left: 8px;
}

.post-summary {
    color: #606266;
    line-height: 1.6;
    margin-bottom: 15px;
    padding: 10px;
    background-color: #f9f9f9;
    border-radius: 4px;
}

.post-stats {
    display: flex;
    gap: 20px;
    color: #606266;
    font-size: 0.9em;
}

.post-stats span {
    display: flex;
    align-items: center;
    gap: 5px;
}

/* 响应式调整：在中等屏幕下保持合适的宽度比例 */
@media (max-width: 1200px) and (min-width: 993px) {
    .el-col:nth-child(1) {
        /* 左侧帖子列表 */
        width: 62.5% !important;
    }

    .el-col:nth-child(2) {
        /* 右侧图表 */
        width: 37.5% !important;
    }
}
</style>