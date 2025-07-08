<template>
    <div class="home-container">
        <h1 class="page-title">
            <el-icon>
                <Reading />
            </el-icon>
            热门课程
        </h1>

        <div v-if="loading" class="loading-grid">
            <el-skeleton animated v-for="i in 8" :key="i" class="skeleton-card">
                <template #template>
                    <el-skeleton-item variant="image" style="width: 100%; height: 180px;" />
                    <div style="padding: 14px;">
                        <el-skeleton-item variant="h3" style="width: 50%;" />
                        <el-skeleton-item variant="text" style="width: 80%; margin-top: 10px;" />
                        <el-skeleton-item variant="text" style="width: 100%;" />
                    </div>
                </template>
            </el-skeleton>
        </div>

        <div v-else-if="courses.length > 0" class="course-grid">
            <CourseCard v-for="course in courses" :key="course.id" :course="course" />
        </div>

        <el-empty v-else description="暂无课程数据" class="empty-state" />

        <div class="pagination-container" v-if="courses.length > 0">
            <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="total"
                :page-sizes="[8, 16, 24, 32]" layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange" @current-change="handleCurrentChange" background />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { courseAPI } from '../../api'
import CourseCard from '../../components/CourseCard.vue'
import { ElMessage } from 'element-plus'
import { Reading } from '@element-plus/icons-vue'

// 响应式数据
const courses = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(8)
const total = ref(0)

// 获取课程列表
const fetchCourses = async () => {
    loading.value = true
    try {
        // ✅ 修改：不再传递userId，适配API响应格式
        const response = await courseAPI.getCourses(currentPage.value, pageSize.value)
        courses.value = response.data?.list || []
        total.value = response.data?.total || 0
    } catch (error) {
        console.error('获取课程失败:', error)
        ElMessage.error('获取课程失败: ' + (error.message || '请稍后再试'))
        courses.value = [] // 清空数据
    } finally {
        loading.value = false
    }
}

// 处理每页显示数量变化
const handleSizeChange = (val) => {
    pageSize.value = val
    currentPage.value = 1 // 切换每页大小后回到第一页
    fetchCourses()
}

// 处理当前页码变化
const handleCurrentChange = (val) => {
    currentPage.value = val
    fetchCourses()
}

// 组件挂载时获取数据
onMounted(() => {
    fetchCourses()
})
</script>

<style scoped>
.home-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0;
}

.page-title {
    font-size: 32px;
    font-weight: 700;
    color: #667eea;
    margin-bottom: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
}

.loading-grid,
.course-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 30px;
    margin-bottom: 40px;
}

.skeleton-card {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.empty-state {
    padding: 80px 0;
    color: #999;
}

.pagination-container {
    display: flex;
    justify-content: center;
    padding: 20px 0;
}

/* 响应式调整 */
@media (max-width: 1200px) {
    .course-grid {
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 25px;
    }
}

@media (max-width: 992px) {
    .course-grid {
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 20px;
    }

    .page-title {
        font-size: 28px;
        margin-bottom: 30px;
    }
}

@media (max-width: 768px) {
    .course-grid {
        grid-template-columns: 1fr;
        /* 单列布局 */
        max-width: 350px;
        /* 限制最大宽度，居中显示 */
        margin-left: auto;
        margin-right: auto;
    }

    .page-title {
        font-size: 24px;
        margin-bottom: 25px;
    }
}
</style>
