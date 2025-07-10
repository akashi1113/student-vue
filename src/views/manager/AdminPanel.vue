<template>
    <div class="admin-panel-container">
        <el-card class="admin-card">
            <template #header>
                <div class="card-header">
                    <span>后台管理中心</span>
                </div>
            </template>

            <el-tabs v-model="activeTabName" class="admin-tabs">
                <el-tab-pane label="课程管理" name="courses">
                    <div class="tab-content">
                        <div class="toolbar">
                            <el-button type="primary" :icon="Plus" @click="openAddCourseDialog">
                                添加课程
                            </el-button>
                        </div>

                        <el-table :data="courseTableData" v-loading="courseLoading" style="width: 100%"
                            class="admin-table">
                            <el-table-column type="index" label="序号" width="60" />
                            <el-table-column prop="title" label="标题" min-width="150" show-overflow-tooltip />
                            <el-table-column label="封面" width="100">
                                <template #default="scope">
                                    <el-image :src="scope.row.coverImg || defaultCourseCover"
                                        :preview-src-list="[scope.row.coverImg || defaultCourseCover]" fit="cover"
                                        style="width: 60px; height: 60px; border-radius: 8px;" lazy
                                        @error="handleImageErrorInTable" />
                                </template>
                            </el-table-column>
                            <el-table-column prop="teacherName" label="讲师" width="120" />
                            <el-table-column prop="videoCount" label="视频数" width="90" />
                            <el-table-column label="状态" width="100">
                                <template #default="scope">
                                    <el-tag :type="scope.row.status === 0 ? 'success' : 'info'">
                                        {{ scope.row.status === 0 ? '上架' : '下架' }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" width="180" fixed="right">
                                <template #default="scope">
                                    <el-button link type="primary" size="small"
                                        @click="openEditCourseDialog(scope.row)">
                                        <el-icon>
                                            <Edit />
                                        </el-icon> 编辑
                                    </el-button>
                                    <el-button link type="danger" size="small" @click="deleteCourse(scope.row.id)">
                                        <el-icon>
                                            <Delete />
                                        </el-icon> 删除
                                    </el-button>
                                </template>
                            </el-table-column>
                        </el-table>

                        <div class="pagination-container">
                            <el-pagination v-model:current-page="courseCurrentPage" v-model:page-size="coursePageSize"
                                :total="courseTotal" :page-sizes="[10, 20, 50]"
                                layout="total, sizes, prev, pager, next, jumper" @size-change="handleCourseSizeChange"
                                @current-change="handleCourseCurrentChange" />
                        </div>
                    </div>
                </el-tab-pane>

                <el-tab-pane label="视频管理" name="videos">
                    <div class="tab-content">
                        <div class="toolbar">
                            <el-button type="primary" :icon="Plus" @click="openAddVideoDialog">
                                添加视频
                            </el-button>

                            <!-- 将课程ID输入框改为课程名下拉选择 -->
                            <el-select v-model="selectedCourseId" placeholder="按课程名过滤视频"
                                style="width: 250px; margin-left: 10px;" clearable @clear="resetVideoFilter"
                                @change="handleCourseSelect">
                                <el-option v-for="item in courseListForSelect" :key="item.id" :label="item.title"
                                    :value="item.id" />
                            </el-select>

                            <el-button :icon="Refresh" @click="resetVideoFilter" style="margin-left: 5px;">
                                重置
                            </el-button>
                        </div>

                        <el-table :data="videoTableData" v-loading="videoLoading" style="width: 100%"
                            class="admin-table video-table">
                            <el-table-column prop="id" label="ID" width="80" />
                            <el-table-column prop="title" label="视频标题" min-width="200" show-overflow-tooltip />
                            <el-table-column prop="courseName" label="所属课程" width="180" show-overflow-tooltip />
                            <el-table-column label="时长" width="120">
                                <template #default="scope">
                                    {{ formatTime(scope.row.duration) }}
                                </template>
                            </el-table-column>
                            <el-table-column prop="sort" label="排序" width="80" />

                            <!-- 移除进度和状态列 -->

                            <el-table-column label="操作" width="180" fixed="right">
                                <template #default="scope">
                                    <el-button link type="primary" size="small" @click="openEditVideoDialog(scope.row)">
                                        <el-icon>
                                            <Edit />
                                        </el-icon> 编辑
                                    </el-button>
                                    <el-button link type="danger" size="small" @click="deleteVideo(scope.row.id)">
                                        <el-icon>
                                            <Delete />
                                        </el-icon> 删除
                                    </el-button>
                                </template>
                            </el-table-column>
                        </el-table>

                        <div class="pagination-container" v-if="!selectedCourseId && videoTableData.length > 0">
                            <el-pagination v-model:current-page="videoCurrentPage" v-model:page-size="videoPageSize"
                                :total="videoTotal" :page-sizes="[10, 20, 50]"
                                layout="total, sizes, prev, pager, next, jumper" @size-change="handleVideoSizeChange"
                                @current-change="handleVideoCurrentChange" />
                        </div>
                        <el-empty v-if="!videoLoading && videoTableData.length === 0" description="暂无视频数据" />
                    </div>
                </el-tab-pane>

                <!-- 新增：帖子管理 -->
                <el-tab-pane label="帖子管理" name="posts">
                    <div class="tab-content">
                        <el-tabs v-model="activePostSubTab" type="card">
                            <el-tab-pane label="待审核帖子" name="pending">
                                <el-table :data="pendingPosts" v-loading="postLoading" style="width: 100%">
                                    <el-table-column prop="id" label="ID" width="80" />
                                    <el-table-column prop="title" label="标题" />
                                    <el-table-column prop="userName" label="作者" width="150" />
                                    <el-table-column prop="createTime" label="发布时间" width="180">
                                        <!-- **【重点修改】**: 这里也使用新的函数名 -->
                                        <template #default="scope">{{ formatDateTime(scope.row.createTime) }}</template>
                                    </el-table-column>
                                    <el-table-column label="操作" width="250">
                                        <template #default="scope">
                                            <el-button size="small" type="primary"
                                                @click="viewPost(scope.row.id)">查看</el-button>
                                            <el-button size="small" type="success"
                                                @click="approvePost(scope.row.id)">通过</el-button>
                                            <el-button size="small" type="danger"
                                                @click="rejectPost(scope.row.id)">拒绝</el-button>
                                        </template>
                                    </el-table-column>
                                    <!-- 在待审核帖子的表格中添加新列 -->
                                    <el-table-column label="AI审核" width="140" align="center">
                                        <template #default="scope">
                                            <div v-if="scope.row.aiReviewLoading">
                                                <el-icon class="is-loading">
                                                    <Loading />
                                                </el-icon>
                                            </div>
                                            <template v-else>
                                                <el-tag v-if="scope.row.aiReviewStatus"
                                                    :type="getReviewTagType(scope.row.aiReviewStatus)" effect="dark">
                                                    {{ getReviewStatusText(scope.row.aiReviewStatus) }}
                                                </el-tag>
                                                <el-button v-else size="small"
                                                    @click="triggerAIReview(scope.row)">AI审核</el-button>
                                            </template>
                                        </template>
                                    </el-table-column>
                                </el-table>
                                <el-pagination v-if="postTotal > 0" style="margin-top: 20px;" background
                                    layout="prev, pager, next, jumper, ->, total" :total="postTotal"
                                    :page-size="postPageSize" :current-page="postCurrentPage"
                                    @current-change="handlePostPageChange" />
                            </el-tab-pane>
                            <!--【重点】被举报内容 -->
                            <el-tab-pane label="被举报内容" name="reported">
                                <el-table :data="reportedPosts" v-loading="reportLoading" style="width: 100%">
                                    <el-table-column prop="id" label="举报ID" width="80" />
                                    <el-table-column label="被举报帖子">
                                        <template #default="scope">
                                            <el-link type="primary" @click="viewPost(scope.row.postId)">{{
                                                scope.row.postTitle }}</el-link>
                                        </template>
                                    </el-table-column>
                                    <el-table-column prop="reason" label="举报理由" />
                                    <el-table-column prop="reporterName" label="举报人" width="150" />
                                    <el-table-column prop="reportTime" label="举报时间" width="180">
                                        <template #default="scope">{{ formatDateTime(scope.row.reportTime) }}</template>
                                    </el-table-column>
                                    <el-table-column label="操作" width="220">
                                        <template #default="scope">
                                            <el-button size="small" type="danger"
                                                @click="handleReportAction(scope.row.id, 'delete')">删除帖子</el-button>
                                            <el-button size="small" type="success"
                                                @click="handleReportAction(scope.row.id, 'keep')">保留帖子</el-button>
                                        </template>
                                    </el-table-column>
                                </el-table>
                                <!-- 举报分页 -->

                                <el-pagination v-if="reportTotal > 0" style="margin-top: 20px;" background
                                    layout="prev, pager, next, jumper, ->, total" :total="reportTotal"
                                    :page-size="reportPageSize" :current-page="reportCurrentPage"
                                    @current-change="handleReportPageChange" />
                            </el-tab-pane>
                        </el-tabs>
                    </div>
                </el-tab-pane>

            </el-tabs>
        </el-card>

        <!-- 添加/编辑课程弹窗 -->
        <el-dialog v-model="courseDialogVisible" :title="isEditCourse ? '编辑课程' : '添加课程'" width="600px"
            class="admin-dialog">
            <el-form :model="courseForm" :rules="courseRules" ref="courseFormRef" label-width="100px"
                label-position="top">
                <el-form-item label="课程标题" prop="title">
                    <el-input v-model="courseForm.title" placeholder="请输入课程标题" />
                </el-form-item>
                <el-form-item label="课程描述" prop="description">
                    <el-input type="textarea" v-model="courseForm.description" placeholder="请输入课程描述" :rows="3" />
                </el-form-item>
                <el-form-item label="授课讲师" prop="teacherName">
                    <el-input v-model="courseForm.teacherName" placeholder="请输入授课讲师姓名" />
                </el-form-item>
                <el-form-item label="课程状态" prop="status">
                    <el-radio-group v-model="courseForm.status">
                        <el-radio :value="0">上架</el-radio>
                        <el-radio :value="1">下架</el-radio>
                    </el-radio-group>
                </el-form-item>
                <!-- <el-form-item label="封面图片" prop="coverImageFile">
                    <el-upload class="avatar-uploader" :auto-upload="false" :show-file-list="false"
                        :on-change="handleCourseCoverChange" :limit="1" :file-list="courseCoverFileList">
                        <img v-if="courseForm.coverImgPreview" :src="courseForm.coverImgPreview" class="avatar" />
                        <el-icon v-else class="avatar-uploader-icon">
                            <Plus />
                        </el-icon>
                        <template #tip>
                            <div class="el-upload__tip">
                                <span v-if="!isEditCourse">请选择图片上传 (可选)</span>
                                <span v-else>
                                    {{ courseForm.coverImgPreview ? '点击更改封面' : '点击上传封面' }}
                                </span>
                                <el-checkbox v-if="isEditCourse && courseForm.id" v-model="courseForm.clearCoverImage"
                                    label="清除现有封面" size="small" style="margin-left: 10px;" />
                            </div>
                        </template>
                    </el-upload>
                </el-form-item> -->
                <!-- 替换掉原来的 el-upload 部分，用于测试 -->
                <el-form-item label="封面图片" prop="coverImageFile">
                    <el-upload class="avatar-uploader" :auto-upload="false" :show-file-list="false"
                        :on-change="handleCourseCoverChange" :limit="1">
                        <el-button type="primary">点击这里上传图片</el-button>
                    </el-upload>
                </el-form-item>

            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="courseDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="submitCourseForm">
                        {{ isEditCourse ? '保存修改' : '立即添加' }}
                    </el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 添加/编辑视频弹窗 -->
        <el-dialog v-model="videoDialogVisible" :title="isEditVideo ? '编辑视频' : '添加视频'" width="600px"
            class="admin-dialog">
            <el-form :model="videoForm" :rules="videoRules" ref="videoFormRef" label-width="100px" label-position="top">
                <el-form-item label="所属课程" prop="courseId">
                    <el-select v-model="videoForm.courseId" placeholder="请选择所属课程" filterable>
                        <el-option v-for="item in courseListForSelect" :key="item.id" :label="item.title"
                            :value="item.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="视频标题" prop="title">
                    <el-input v-model="videoForm.title" placeholder="请输入视频标题" />
                </el-form-item>
                <!-- <el-form-item label="视频时长 (秒)" prop="duration">
                    <el-input-number v-model="videoForm.duration" :min="0" />
                </el-form-item> -->
                <el-form-item label="排序" prop="sort">
                    <el-input-number v-model="videoForm.sort" :min="0" />
                </el-form-item>
                <el-form-item :label="isEditVideo ? '视频文件 (可选)' : '视频文件'" prop="videoFile">
                    <el-upload class="video-uploader" drag :auto-upload="false" :show-file-list="true"
                        :on-change="handleVideoFileChange" :on-remove="handleVideoFileRemove" :limit="1"
                        :file-list="videoFileList">
                        <el-icon class="el-icon--upload">
                            <UploadFilled />
                        </el-icon>
                        <div class="el-upload__text">
                            拖拽文件到此处 或 <em>点击上传</em>
                        </div>
                        <template #tip>
                            <div class="el-upload__tip">
                                支持 mp4等视频格式
                            </div>
                        </template>
                    </el-upload>
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="videoDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="submitVideoForm">
                        {{ isEditVideo ? '保存修改' : '立即添加' }}
                    </el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import { format } from 'date-fns';
import { courseAPI, videoAPI, forumAPI } from '../../api';
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Setting, UploadFilled, Search, Refresh } from '@element-plus/icons-vue'

// ==== Tab & 通用 ====
const activeTab = ref('courses')
const defaultCourseCover = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSJsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCAjNjY3ZWVhIDAlLCAjNzY0YmEyIDEwMCUpIi8+CjxjaXJjbGUgY3g9IjE2MCIgY3k9IjkwIiByPSIzMCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjMpIi8+Cjxwb2x5Z29uIHBvaW50cz0iMTQ1LDc1IDE0NSw5NSAxNzUsODUuNSIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuOCIvPgo8L3N2Zz4='

// 在AdminPanel.vue中添加更完善的格式时间函数
const formatTime = (seconds) => {
    if (!seconds || seconds === 0) return '00:00'

    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    return `${hrs > 0 ? hrs.toString().padStart(2, '0') + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 图片加载失败时显示默认图
const handleImageErrorInTable = (event) => {
    event.target.src = defaultCourseCover
}

// ==== 课程管理 ====
const courseTableData = ref([])
const courseLoading = ref(false)
const courseCurrentPage = ref(1)
const coursePageSize = ref(10)
const courseTotal = ref(0)
const courseDialogVisible = ref(false)
const isEditCourse = ref(false)
const courseFormRef = ref(null)
const courseForm = reactive({
    id: null,
    title: '',
    description: '',
    teacherName: '',
    status: 0, // 0-上架，1-下架
    coverImageFile: null,
    coverImgPreview: '', // 用于图片预览
    clearCoverImage: false, // 是否清除现有封面图
})
const courseCoverFileList = ref([]) // 用于el-upload的文件列表

const courseRules = {
    title: [{ required: true, message: '请输入课程标题', trigger: 'blur' }],
    teacherName: [{ required: true, message: '请输入授课讲师', trigger: 'blur' }],
}

const fetchCourseTableData = async () => {
    courseLoading.value = true
    try {
        const result = await courseAPI.getAdminCourses(courseCurrentPage.value, coursePageSize.value)
        courseTableData.value = result.list || []
        courseTotal.value = result.total || 0
    } catch (error) {
        console.error('获取课程数据失败:', error)
        ElMessage.error('获取课程数据失败')
    } finally {
        courseLoading.value = false
    }
}

const handleCourseSizeChange = (val) => {
    coursePageSize.value = val
    courseCurrentPage.value = 1
    fetchCourseTableData()
}

const handleCourseCurrentChange = (val) => {
    courseCurrentPage.value = val
    fetchCourseTableData()
}

// 打开添加课程弹窗
const openAddCourseDialog = () => {
    isEditCourse.value = false
    // 重置表单
    Object.assign(courseForm, {
        id: null,
        title: '',
        description: '',
        teacherName: '',
        status: 0,
        coverImageFile: null,
        coverImgPreview: '',
        clearCoverImage: false,
    })
    courseCoverFileList.value = [] // 清空文件列表
    courseDialogVisible.value = true
    // 确保表单DOM已渲染再重置校验状态
    courseFormRef.value?.resetFields()
}

// 打开编辑课程弹窗
const openEditCourseDialog = (row) => {
    isEditCourse.value = true
    // 填充表单数据
    Object.assign(courseForm, {
        id: row.id,
        title: row.title,
        description: row.description,
        teacherName: row.teacherName,
        status: row.status,
        coverImageFile: null, // 编辑时默认为空，除非用户重新上传
        coverImgPreview: row.coverImg || '', // 显示现有图片
        clearCoverImage: false, // 默认不清除
    })
    // 设置 el-upload 的文件列表，用于显示当前图片
    courseCoverFileList.value = row.coverImg ? [{ name: 'current_cover', url: row.coverImg, status: 'success' }] : []
    courseDialogVisible.value = true
    // 清除校验状态
    courseFormRef.value?.clearValidate()
}

// 处理课程封面文件选择
const handleCourseCoverChange = (file) => {
    console.log('handleCourseCoverChange triggered!', file);
    courseForm.coverImageFile = file.raw // 存储原始文件
    console.log('After assignment, courseForm.coverImageFile:', courseForm.coverImageFile); // 新增这行
    courseForm.coverImgPreview = URL.createObjectURL(file.raw)
    console.log('After assignment, courseForm.coverImgPreview:', courseForm.coverImgPreview); // 新增这行
    courseForm.clearCoverImage = false // 如果重新上传，取消清除标记
    courseCoverFileList.value = [file] // 更新 el-upload 的文件列表
}


// 提交课程表单
// const submitCourseForm = async () => {
//     await courseFormRef.value.validate(async (valid) => {
//         if (valid) {
//             const formData = new FormData()
//             // 动态添加非空字段，或确保必填字段有值
//             formData.append('title', courseForm.title)
//             formData.append('teacherName', courseForm.teacherName)
//             formData.append('status', courseForm.status)
//             if (courseForm.description) formData.append('description', courseForm.description)

//             if (courseForm.coverImageFile) {
//                 formData.append('coverImage', courseForm.coverImageFile)
//             } else if (isEditCourse.value && courseForm.clearCoverImage) {
//                 // 只有在编辑模式下，且用户明确勾选了清除封面，才发送这个标记
//                 formData.append('clearCoverImage', 'true')
//             }
const submitCourseForm = async () => {
    console.log('Submitting form. At start, courseForm.coverImageFile:', courseForm.coverImageFile); // 👈 关键点1

    // 验证表单
    const valid = await courseFormRef.value.validate(); // 等待验证结果

    console.log('After validation, before FormData. courseForm.coverImageFile:', courseForm.coverImageFile); // 👈 关键点2

    if (valid) {
        const formData = new FormData();
        formData.append('title', courseForm.title);
        formData.append('teacherName', courseForm.teacherName);
        formData.append('status', courseForm.status);
        if (courseForm.description) formData.append('description', courseForm.description);

        if (courseForm.coverImageFile) {
            formData.append('coverImage', courseForm.coverImageFile);
            console.log('Appending coverImage to FormData:', courseForm.coverImageFile); // 👈 关键点3
        } else if (isEditCourse.value && courseForm.clearCoverImage) {
            formData.append('clearCoverImage', 'true');
        }
        try {
            if (isEditCourse.value) {
                await courseAPI.updateCourse(courseForm.id, formData)
                ElMessage.success('课程更新成功！')
            } else {
                await courseAPI.addCourse(formData)
                ElMessage.success('课程添加成功！')
            }
            courseDialogVisible.value = false
            fetchCourseTableData() // 刷新课程列表
            fetchCourseListForSelect() // 刷新视频管理用的课程选择列表
        } catch (error) {
            console.error('提交课程失败:', error)
            // 错误信息由封装的api统一处理
        }
    } else {
        console.log('Form validation failed.');
    }
};

// 删除课程
const deleteCourse = async (id) => {
    ElMessageBox.confirm('此操作将永久删除该课程及其所有相关视频和学习记录，是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    })
        .then(async () => {
            try {
                await courseAPI.deleteCourse(id)
                ElMessage.success('课程删除成功！')
                fetchCourseTableData() // 刷新列表
                fetchCourseListForSelect() // 刷新视频课程选择列表
            } catch (error) {
                console.error('删除课程失败:', error)
                // 错误信息由封装的api统一处理
            }
        })
        .catch(() => {
            ElMessage.info('已取消删除')
        })
}

// ==== 视频管理 ====
const videoTableData = ref([])
const videoLoading = ref(false)
const videoDialogVisible = ref(false)
const isEditVideo = ref(false)
const videoFormRef = ref(null)
const videoForm = reactive({
    id: null,
    courseId: null,
    title: '',
    sort: 0,
    videoFile: null,
})
const videoFileList = ref([]) // 用于el-upload的文件列表
const courseListForSelect = ref([]) // 用于视频选择所属课程的下拉框
// 新增：用于课程名筛选的变量
const selectedCourseId = ref('') // 选中的课程ID
// const videoCourseFilter = ref('') // 用于视频列表的课程ID过滤

const videoRules = {
    courseId: [{ required: true, message: '请选择所属课程', trigger: 'change' }],
    title: [{ required: true, message: '请输入视频标题', trigger: 'blur' }],
    videoFile: [{ required: !isEditVideo.value, message: '请选择视频文件', trigger: 'change' }]
}

// 视频管理分页数据
const videoCurrentPage = ref(1)
const videoPageSize = ref(10)
const videoTotal = ref(0)

const fetchVideoTableData = async () => {
    videoLoading.value = true
    try {
        if (selectedCourseId.value) {
            const videos = await videoAPI.getVideosByCourse(selectedCourseId.value)
            videoTableData.value = videos.sort((a, b) => a.sort - b.sort)
        } else {
            const result = await videoAPI.getVideosAdmin(videoCurrentPage.value, videoPageSize.value)
            videoTableData.value = result.list || []
            videoTotal.value = result.total || 0
        }
    } catch (error) {
        console.error('获取视频数据失败:', error)
        ElMessage.error('获取视频数据失败')
        videoTableData.value = []
    } finally {
        videoLoading.value = false
    }
}

// 新增：处理课程选择变化
const handleCourseSelect = () => {
    videoCurrentPage.value = 1
    fetchVideoTableData()
}

// 处理分页大小变化
const handleVideoSizeChange = (val) => {
    videoPageSize.value = val
    videoCurrentPage.value = 1
    fetchVideoTableData()
}

// 处理当前页码变化
const handleVideoCurrentChange = (val) => {
    videoCurrentPage.value = val
    fetchVideoTableData()
}

// 修改：重置视频过滤
const resetVideoFilter = () => {
    selectedCourseId.value = ''
    videoCurrentPage.value = 1
    fetchVideoTableData()
}

// 在onMounted中添加初始化调用
onMounted(() => {
    fetchCourseTableData()
    fetchCourseListForSelect()
    fetchVideoTableData() // 初始化时加载视频数据
})

// 获取课程列表用于视频添加/编辑时的下拉选择
const fetchCourseListForSelect = async () => {
    try {
        const result = await courseAPI.getCourses(1, 9999) // 获取所有课程
        courseListForSelect.value = result.list.map(course => ({
            id: course.id,
            title: course.title,
        }))
    } catch (error) {
        console.error('获取课程列表失败:', error)
        ElMessage.error('获取课程列表用于选择失败')
    }
}

// 打开添加视频弹窗
const openAddVideoDialog = () => {
    isEditVideo.value = false
    // 重置表单
    Object.assign(videoForm, {
        id: null,
        courseId: null,
        title: '',
        duration: 0,
        sort: 0,
        videoFile: null,
    })
    videoFileList.value = [] // 清空文件列表
    videoDialogVisible.value = true
    videoFormRef.value?.resetFields()
}

// 打开编辑视频弹窗
const openEditVideoDialog = (row) => {
    isEditVideo.value = true
    // 填充表单数据
    Object.assign(videoForm, {
        id: row.id,
        courseId: row.courseId,
        title: row.title,
        sort: row.sort,
        videoFile: null, // 编辑时默认为空，除非用户重新上传
    })
    videoFileList.value = [] // 编辑时，不显示现有文件，用户需重新选择
    videoDialogVisible.value = true
    videoFormRef.value?.clearValidate()
}

// 处理视频文件选择
const handleVideoFileChange = (file) => {
    videoForm.videoFile = file.raw
    videoFileList.value = [file]
    // 触发文件字段校验，确保在添加模式下文件必选
    videoFormRef.value?.validateField('videoFile', () => { });
}

// 处理视频文件移除
const handleVideoFileRemove = () => {
    videoForm.videoFile = null
    videoFileList.value = []
    // 如果是添加模式，文件被移除后再次触发校验
    if (!isEditVideo.value) {
        videoFormRef.value?.validateField('videoFile', () => { });
    }
}

// 提交视频表单
const submitVideoForm = async () => {
    await videoFormRef.value.validate(async (valid) => {
        if (valid) {
            const formData = new FormData()
            formData.append('courseId', videoForm.courseId)
            formData.append('title', videoForm.title)
            formData.append('sort', videoForm.sort)

            // 添加时必须有视频文件
            if (!isEditVideo.value && !videoForm.videoFile) {
                ElMessage.error('请选择视频文件！')
                return
            }

            // 编辑时可选更新文件
            if (videoForm.videoFile) {
                formData.append('videoFile', videoForm.videoFile)
            }

            try {
                if (isEditVideo.value) {
                    await videoAPI.updateVideo(videoForm.id, formData)
                    ElMessage.success('视频更新成功！')
                } else {
                    await videoAPI.addVideo(formData)
                    ElMessage.success('视频添加成功！')
                }
                videoDialogVisible.value = false
                // 如果当前有课程过滤，则刷新当前课程下的视频，否则清空
                // if (videoCourseFilter.value) {
                fetchVideoTableData()
                // } else {
                //     videoTableData.value = [] // 确保没有过滤时表格是空的
                // }
                // 刷新课程列表，因为视频数量可能变化
                fetchCourseTableData()
            } catch (error) {
                console.error('提交视频失败:', error)
                // 错误信息由封装的api统一处理
            }
        }
    })
}

// 删除视频
const deleteVideo = async (id) => {
    ElMessageBox.confirm('此操作将永久删除该视频，是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    })
        .then(async () => {
            try {
                await videoAPI.deleteVideo(id)
                ElMessage.success('视频删除成功！')
                // 刷新当前课程下的视频，或清空
                // if (videoCourseFilter.value) {
                fetchVideoTableData()
                // } else {
                //     videoTableData.value = []
                // }
                // 刷新课程列表，因为视频数量可能变化
                fetchCourseTableData()
            } catch (error) {
                console.error('删除视频失败:', error)
                // 错误信息由封装的api统一处理
            }
        })
        .catch(() => {
            ElMessage.info('已取消删除')
        })
}

// // 重置视频过滤
// const resetVideoFilter = () => {
//     videoCourseFilter.value = ''
//     videoTableData.value = [] // 重置时不显示任何视频
//     ElMessage.info('视频列表已重置，请选择课程ID进行筛选。')
// }

// ========== 新增：帖子管理相关 ==========
const router = useRouter(); // 新增
const activePostSubTab = ref('pending');
const pendingPosts = ref([]);
const postLoading = ref(false);
const postTotal = ref(0);
const postCurrentPage = ref(1);
const postPageSize = ref(10);
const adminId = 1; // 假设管理员ID为1
const activeTabName = ref('courses'); // 用于控制主标签页的激活状态
//【新增】举报管理相关变量
const reportedPosts = ref([]);
const reportLoading = ref(false);
const reportTotal = ref(0);
const reportCurrentPage = ref(1);
const reportPageSize = ref(10);

// 新增方法
const triggerAIReview = async (post) => {
    post.aiReviewLoading = true;
    try {
        const result = await forumAPI.getAIReview(post.id);
        post.aiReviewResult = result;

        // 解析审核结果
        if (result.includes("【审核结果】通过")) {
            post.aiReviewStatus = "pass";
        } else if (result.includes("【审核结果】不通过")) {
            post.aiReviewStatus = "reject";
        } else {
            post.aiReviewStatus = "manual";
        }

        // 显示审核详情提示
        ElMessage.info({
            message: result,
            duration: 5000,
            showClose: true
        });
    } catch (error) {
        ElMessage.error("AI审核失败");
    } finally {
        post.aiReviewLoading = false;
    }
};

// 状态转换方法
const getReviewTagType = (status) => {
    return {
        'pass': 'success',
        'reject': 'danger',
        'manual': 'warning'
    }[status];
};

const getReviewStatusText = (status) => {
    return {
        'pass': '通过',
        'reject': '不通过',
        'manual': '人工审核'
    }[status];
};

const formatDateTime = (time) => {
    if (!time) return '';
    return format(new Date(time), 'yyyy-MM-dd HH:mm:ss');
};

const fetchPendingPosts = async () => {
    postLoading.value = true;
    try {
        const params = {
            page: postCurrentPage.value,
            size: postPageSize.value,
        };
        const result = await forumAPI.getPendingPosts(params);

        // 这里添加属性扩展
        pendingPosts.value = (result.list || []).map(post => ({
            ...post,
            aiReviewStatus: null,
            aiReviewLoading: false,
            aiReviewResult: ""
        }));

        postTotal.value = result.total || 0;
    } catch (error) {
        console.error("获取待审核帖子失败:", error);
    } finally {
        postLoading.value = false;
    }
};

const handlePostPageChange = (page) => {
    postCurrentPage.value = page;
    fetchPendingPosts();
};

// const viewPost = (postId) => {
//     const url = router.resolve({ name: 'PostDetail', params: { id: postId }, query: { mode: 'admin' } }).href;
//     window.open(url, '_blank');
// };

const viewPost = (postId) => {
    // 关键就在这一步的 query 参数！
    const url = router.resolve({
        name: 'PostDetail',
        params: { id: postId },
        // 我们必须在这里加上这个 mode: 'admin' 的“小旗子”！
        query: { mode: 'admin' }
    }).href;

    // 然后用这个带旗子的URL打开新窗口
    window.open(url, '_blank');
};

// 移除了adminId参数
const approvePost = async (postId) => {
    try {
        await forumAPI.approvePost(postId);
        ElMessage.success('审核通过成功！');
        fetchPendingPosts();
    } catch (error) {
        ElMessage.error('操作失败');
    }
};

const rejectPost = async (postId) => {
    ElMessageBox.prompt('请输入拒绝理由', '审核拒绝', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /.+/,
        inputErrorMessage: '必须填写拒绝理由',
    }).then(async ({ value }) => {
        try {
            await forumAPI.rejectPost(postId, value);
            ElMessage.success('已拒绝该帖子');
            fetchPendingPosts();
        } catch (error) {
            ElMessage.error('操作失败');
        }
    }).catch(() => {
        ElMessage.info('已取消操作');
    });
};

// 移除了adminId参数
const fetchReportedPosts = async () => {
    reportLoading.value = true;
    try {
        const params = { page: reportCurrentPage.value, size: reportPageSize.value };
        const result = await forumAPI.getPendingReports(params);
        reportedPosts.value = result.list || [];
        reportTotal.value = result.total || 0;
    } catch (error) {
        console.error("获取举报列表失败:", error);
        ElMessage.error('获取举报列表失败，请检查后端接口');
    } finally {
        reportLoading.value = false;
    }
};
const handleReportPageChange = (page) => {
    reportCurrentPage.value = page;
    fetchReportedPosts();
};

//【新增】处理举报
const handleReportAction = async (reportId, action) => {
    const confirmAction = action === 'delete' ? '删除' : '保留';
    ElMessageBox.confirm(`确定要【${confirmAction}】被举报的帖子吗？`, '处理举报', { type: 'warning' })
        .then(async () => {
            try {
                if (action === 'delete') {
                    await forumAPI.processReportAndDeletePost(reportId);
                } else {
                    await forumAPI.processReportAndKeepPost(reportId);
                }
                ElMessage.success('处理成功！');
                fetchReportedPosts();
            } catch (error) {
                ElMessage.error('处理失败');
            }
        });
};

// 监听子标签页切换
watch(activePostSubTab, (newTab) => {
    if (newTab === 'pending') fetchPendingPosts();
    else if (newTab === 'reported') fetchReportedPosts();
});


// 监听主标签页切换
watch(activeTabName, (newTab) => {
    if (newTab === 'courses') {
        // fetchCourseTableData();
    } else if (newTab === 'videos') {
        // fetchVideoTableData();
    } else if (newTab === 'posts') {
        // 触发子标签页的 watch
        if (activePostSubTab.value === 'pending') fetchPendingPosts();
        else fetchReportedPosts();
    }
}, { immediate: true });

// 生命周期钩子
onMounted(() => {
    fetchCourseTableData()
    fetchCourseListForSelect() // 初始化课程下拉列表
})
</script>

<style scoped>
:deep(.el-table__row) {
    &.ai-pass {
        --el-table-tr-bg-color: rgba(103, 194, 58, 0.08);
    }

    &.ai-reject {
        --el-table-tr-bg-color: rgba(245, 108, 108, 0.08);
    }

    &.ai-manual {
        --el-table-tr-bg-color: rgba(230, 162, 60, 0.08);
    }
}

.tab-content {
    padding: 10px;
}

.admin-panel-container {
    max-width: 4000px;
    margin: 0 auto;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 40px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 30px rgba(102, 126, 234, 0.15);
    min-height: 80vh;
}

.panel-title {
    font-size: 32px;
    font-weight: 700;
    color: #667eea;
    margin-bottom: 30px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.admin-tabs :deep(.el-tabs__item) {
    font-size: 16px;
    font-weight: 500;
    color: #667eea;
}

.admin-tabs :deep(.el-tabs__item.is-active) {
    font-weight: 700;
}

.admin-tabs :deep(.el-tabs__active-bar) {
    background-color: #667eea;
}

.admin-tabs :deep(.el-tabs__nav-wrap::after) {
    background-color: transparent;
}

.tab-content {
    padding: 20px 0;
}

.toolbar {
    margin-bottom: 20px;
    display: flex;
    align-items: center;
}

.admin-table {
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 20px;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.08);
}

.admin-table :deep(.el-table__header-wrapper th) {
    background-color: rgba(102, 126, 234, 0.1);
    color: #667eea;
    font-weight: 600;
}

.pagination-container {
    display: flex;
    justify-content: center;
    margin-top: 20px;
}

/* Dialog styles */
.admin-dialog :deep(.el-dialog__header) {
    background: linear-gradient(45deg, #667eea, #764ba2);
    color: white;
    border-radius: 16px 16px 0 0;
    padding: 20px 24px;
}

.admin-dialog :deep(.el-dialog__title) {
    color: white;
    font-size: 20px;
    font-weight: bold;
}

.admin-dialog :deep(.el-dialog__body) {
    padding: 30px 40px;
}

.admin-dialog :deep(.el-form-item__label) {
    font-weight: 600;
    color: #333;
}

.avatar-uploader .avatar {
    width: 178px;
    height: 178px;
    display: block;
    object-fit: cover;
    border-radius: 8px;
}

.avatar-uploader .el-upload {
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
    border-color: #667eea;
}

.el-icon.avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 178px;
    height: 178px;
    text-align: center;
}

.video-uploader .el-upload-dragger {
    padding: 20px;
    height: 150px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.video-uploader .el-icon--upload {
    font-size: 60px;
    color: #667eea;
}

.video-uploader .el-upload__text {
    font-size: 14px;
    color: #667eea;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .admin-panel-container {
        padding: 20px;
    }

    .panel-title {
        font-size: 24px;
    }

    .toolbar {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }

    .toolbar .el-input {
        margin-left: 0 !important;
        width: 100% !important;
    }

    .toolbar .el-button:last-of-type {
        /* 针对搜索按钮在小屏幕下的调整 */
        margin-left: 0 !important;
    }

    .admin-table :deep(.el-table__body-wrapper) {
        overflow-x: auto;
        /* Allow horizontal scroll for table */
    }

    .admin-dialog {
        width: 95% !important;
        /* 对话框宽度调整 */
    }
}

/* 视频表格特殊样式优化 */
.video-table {
    border-collapse: separate;
    border-spacing: 0;
}

.video-table :deep(.el-table__header th) {
    background-color: rgba(102, 126, 234, 0.1);
    color: #667eea;
    font-weight: 600;
    padding: 12px 8px;
}

.video-table :deep(.el-table__body td) {
    padding: 12px 8px;
    vertical-align: middle;
}

.video-table :deep(.el-table__row) {
    transition: background-color 0.2s ease;
}

.video-table :deep(.el-table__row:hover > td) {
    background-color: rgba(102, 126, 234, 0.05);
}

/* 优化工具栏布局 */
.toolbar {
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
}
</style>
