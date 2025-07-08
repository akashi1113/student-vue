import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建 axios 实例
const api = axios.create({
    baseURL: 'http://localhost:8080/api', // 后端 API 地址
    timeout: 120000
})

// 请求拦截器 - 添加 JWT 认证
api.interceptors.request.use(
    config => {
        // 从 localStorage 获取 token
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        console.log("请求URL:", config.url);
        console.log("请求方法:", config.method);
        console.log("请求参数:", config.params);
        console.log("请求体:", config.data);

        return config
    },
    error => Promise.reject(error)
)

// 响应拦截器 (保持不变)
api.interceptors.response.use(
    response => {
        const { data } = response
        if (data.success) {
            return data.data
        } else {
            ElMessage.error(data.message || '请求失败')
            return Promise.reject(new Error(data.message))
        }
    },
    error => {
        let errorMessage = '网络错误，请稍后再试'
        if (error.response) {
            errorMessage = error.response.data.message || error.response.statusText || errorMessage
        } else if (error.request) {
            errorMessage = '服务器无响应，请检查网络或稍后再试'
        } else {
            errorMessage = error.message
        }
        ElMessage.error(errorMessage)
        return Promise.reject(new Error(errorMessage))
    }
)

// =====================================
// 课程相关 API
// =====================================
export const courseAPI = {
    // 获取课程列表
    getCourses: (pageNum = 1, pageSize = 10) =>
        api.get('/courses', { params: { pageNum, pageSize } }),

    // 获取课程详情
    getCourseDetail: (id) =>
        api.get(`/courses/${id}`),

    // 管理员添加课程
    addCourse: (courseData) =>
        api.post('/courses/admin', courseData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),

    // 管理员更新课程
    updateCourse: (id, courseData) =>
        api.put(`/courses/admin/${id}`, courseData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),

    // 管理员删除课程
    deleteCourse: (id) =>
        api.delete(`/courses/admin/${id}`),

    // 管理员获取课程列表
    getAdminCourses: (pageNum = 1, pageSize = 10) =>
        api.get('/courses/admin', { params: { pageNum, pageSize } }),

    // 获取课程学习进度
    getCourseProgress: (courseId) =>
        api.get(`/courses/${courseId}/progress`)
}

// =====================================
// 视频相关 API
// =====================================
export const videoAPI = {
    // 获取视频详情
    getVideoDetail: (id) =>
        api.get(`/video/${id}`),

    // 管理员获取视频列表
    getVideosAdmin: (pageNum = 1, pageSize = 10) =>
        api.get('/admin/videos', { params: { pageNum, pageSize } }),

    // 获取课程下的所有视频
    getVideosByCourse: (courseId) =>
        api.get(`/courses/${courseId}/videos`),

    // 管理员添加视频
    addVideo: (videoData) =>
        api.post('/admin/videos', videoData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),

    // 管理员更新视频
    updateVideo: (id, videoData) =>
        api.post(`/admin/videos/${id}`, videoData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),

    // 管理员删除视频
    deleteVideo: (id) =>
        api.delete(`/admin/videos/${id}`)
}

// =====================================
// 学习记录相关 API
// =====================================
export const studyRecordAPI = {
    // 保存学习记录
    saveStudyRecord: (studyRecordData) =>
        api.post('/study-records/save', studyRecordData),

    // 获取单个视频学习记录
    getStudyRecordForVideo: (videoId) =>
        api.get(`/study-records/video/${videoId}`),

    // 获取用户所有学习记录
    getUserStudyRecords: () =>
        api.get('/study-records/my-list')
}

// =====================================
// 论坛/帖子相关 API
// =====================================
export const forumAPI = {
    // 帖子核心功能
    getPosts: (params) => api.get('/post', { params }),
    getPostDetail: (id) => api.get(`/post/${id}`),
    createPost: (postData) => api.post('/post', postData),
    updatePost: (id, postData) => api.put(`/post/${id}`, postData),
    deletePost: (id) => api.delete(`/post/${id}`),
    getHotPosts: (count) => api.get(`/post/hot`, { params: { count } }),

    // 帖子互动
    likePost: (id) => api.post(`/post/${id}/like`),
    unlikePost: (id) => api.delete(`/post/${id}/like`),
    reportPost: (id, reason) => api.post(`/post/${id}/report`, null, { params: { reason } }),

    // 评论与回复
    getComments: (postId, page = 1, size = 10) =>
        api.get(`/post/${postId}/comments`, { params: { page, size } }),

    getCommentReplies: (parentCommentId, page = 1, size = 10) =>
        api.get(`/post/comments/${parentCommentId}/replies`, { params: { page, size } }),

    createComment: (postId, commentData) =>
        api.post(`/post/${postId}/comments`, commentData),

    updateComment: (postId, commentId, commentData) =>
        api.put(`/post/${postId}/comments/${commentId}`, commentData),

    deleteComment: (postId, commentId) =>
        api.delete(`/post/${postId}/comments/${commentId}`),

    likeComment: (commentId) => api.post(`/post/comments/${commentId}/like`),
    unlikeComment: (commentId) => api.delete(`/post/comments/${commentId}/like`),

    getPendingPosts: (params) =>
        api.get('/post/admin/pending', { params }),

    approvePost: (id) => api.post(`/post/admin/${id}/approve`),
    rejectPost: (id, reason) => api.post(`/post/admin/${id}/reject`, null, { params: { reason } }),
    getPostDetailForAdmin: (id) => api.get(`/post/admin/detail/${id}`),
    getPendingReports: (params) => api.get('/post/admin/reports', { params }),
    processReportAndDeletePost: (reportId) => api.put(`/post/admin/reports/${reportId}/deletePost`),
    processReportAndKeepPost: (reportId, reasonForKeeping) =>
        api.put(`/post/admin/reports/${reportId}/keepPost`, null, { params: { reasonForKeeping } })
};

// =====================================
// 通知相关 API
// =====================================
export const notificationAPI = {
    getNotifications: (page = 1, size = 10) =>
        api.get('/notifications', { params: { page, size } }),

    getUnreadCount: () => api.get('/notifications/unread/count'),

    markAsRead: (id) => api.put(`/notifications/${id}/read`),

    markAllAsRead: () => api.put('/notifications/read/all')
};

// // =====================================
// // 用户相关 API
// // =====================================
// export const userAPI = {
//     login: (username, password) =>
//         api.post('/users/login', null, { params: { username, password } }),

//     loginByCode: (email, code) =>
//         api.post('/users/loginByCode', null, { params: { email, code } }),

//     register: (userDTO) => api.post('/users/register', userDTO),

//     sendVerificationCode: (email) => api.post('/users/sendCode', null, { params: { email } }),

//     getUserById: (id) => api.get(`/users/${id}`),

//     updateProfile: (id, username, email, avatarFile, avatarString) => {
//         const formData = new FormData();
//         formData.append('username', username);
//         formData.append('email', email);
//         if (avatarFile) formData.append('avatarFile', avatarFile);
//         if (avatarString) formData.append('avatar', avatarString);

//         return api.put(`/users/${id}`, formData, {
//             headers: { 'Content-Type': 'multipart/form-data' }
//         });
//     },

//     changePassword: (oldPassword, newPassword) =>
//         api.put('/users/password', null, { params: { oldPassword, newPassword } }),

//     logout: (token) => api.post('/users/logout', null, { headers: { Authorization: `Bearer ${token}` } }),

//     // 管理员功能
//     listUsers: (page = 1, size = 10) =>
//         api.get('/users/admin/list', { params: { page, size } }),

//     enableUser: (id) => api.put(`/users/admin/${id}/enable`),
//     disableUser: (id) => api.put(`/users/admin/${id}/disable`),
//     setUserRole: (id, role) => api.put(`/users/admin/${id}/role`, null, { params: { role } }),
//     resetPassword: (id) => api.put(`/users/admin/${id}/password`),
//     forceLogout: (userId) => api.post(`/users/admin/${userId}/forceLogout`)
// };

export default api;