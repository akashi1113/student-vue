import axios from 'axios';

const API_URL = 'http://localhost:8080/api/homework';

// 构建认证头的辅助函数
const buildAuthHeader = (token) => {
    if (!token) return {};
    const cleanToken = token.replace('Bearer ', '');
    return { Authorization: cleanToken };
};

export default {
    // ================ 作业管理 ================
    createHomework(homeworkData, token) {
        return axios.post(API_URL, homeworkData, {
            headers: buildAuthHeader(token)
        });
    },

    updateHomework(homeworkId, homeworkData, token) {
        return axios.put(`${API_URL}/${homeworkId}`, homeworkData, {
            headers: buildAuthHeader(token)
        });
    },

    deleteHomework(homeworkId, token) {
        return axios.delete(`${API_URL}/${homeworkId}`, {
            headers: buildAuthHeader(token)
        });
    },

    getHomeworkById(homeworkId) {
        return axios.get(`${API_URL}/${homeworkId}`);
    },

    getHomeworkByTeacher(token) {
        return axios.get(`${API_URL}/teacher`, {
            headers: buildAuthHeader(token)
        });
    },

    getHomeworkByCourse(courseId) {
        return axios.get(`${API_URL}/course/${courseId}`);
    },

    getAvailableHomework(token) {
        return axios.get(`${API_URL}/student/available`, {
            headers: buildAuthHeader(token)
        });
    },

    getHomeworkByStudent(token) {
        return axios.get(`${API_URL}/student`, {
            headers: buildAuthHeader(token)
        });
    },

    publishHomework(homeworkId) {
        return axios.put(`${API_URL}/${homeworkId}/publish`);
    },

    closeHomework(homeworkId) {
        return axios.put(`${API_URL}/${homeworkId}/close`);
    },

    // ================ 课程相关 ================
    getStudentsByCourse(courseId) {
        return axios.get(`${API_URL}/course/${courseId}/students`);
    },

    getCoursesByTeacher(token) {
        return axios.get(`${API_URL}/teacher/courses`, {
            headers: buildAuthHeader(token)
        });
    },

    // 修改：后端路径是 /student/courses，需要token
    getCoursesByStudent(token) {
        return axios.get(`${API_URL}/student/courses`, {
            headers: buildAuthHeader(token)
        });
    },

    // ================ 作业提交 ================
    submitHomework(homeworkId, submitData, token) {
        return axios.post(`${API_URL}/${homeworkId}/submit`, submitData, {
            headers: buildAuthHeader(token)
        });
    },

    getStudentSubmission(homeworkId, token) {
        return axios.get(`${API_URL}/${homeworkId}/submission/student`, {
            headers: buildAuthHeader(token)
        });
    },

    getHomeworkSubmissions(homeworkId) {
        return axios.get(`${API_URL}/${homeworkId}/submissions`);
    },

    // 修改：后端路径是 /student/submissions，需要token
    getStudentSubmissions(token) {
        return axios.get(`${API_URL}/student/submissions`, {
            headers: buildAuthHeader(token)
        });
    },

    getCourseSubmissions(courseId) {
        return axios.get(`${API_URL}/course/${courseId}/submissions`);
    },

    // 修改：后端路径是 /{homeworkId}/student/can-resubmit，需要token
    canResubmit(homeworkId, token) {
        return axios.get(`${API_URL}/${homeworkId}/student/can-resubmit`, {
            headers: buildAuthHeader(token)
        });
    },

    // ================ 作业批改 ================
    gradeHomework(submissionId, gradeData, token) {
        return axios.put(`${API_URL}/submission/${submissionId}/grade`, gradeData, {
            headers: buildAuthHeader(token)
        });
    },

    getSubmissionAnswers(submissionId) {
        return axios.get(`${API_URL}/submission/${submissionId}/answers`);
    },

    getSubmissionById(submissionId) {
        return axios.get(`${API_URL}/submission/${submissionId}`);
    },

    returnGradedHomework(submissionIds) {
        return axios.put(`${API_URL}/submissions/return`, submissionIds);
    },

    // ================ 统计分析 ================
    getHomeworkStatistics(homeworkId) {
        return axios.get(`${API_URL}/${homeworkId}/statistics`);
    },

    getStudentProgress(token) {
        return axios.get(`${API_URL}/student/progress`, {
            headers: buildAuthHeader(token)
        });
    },

    getCourseHomeworkStatistics(courseId) {
        return axios.get(`${API_URL}/course/${courseId}/statistics`);
    },

    // ================ 权限检查 ================
    checkHomeworkAccess(homeworkId, token) {
        return axios.get(`${API_URL}/${homeworkId}/student/access`, {
            headers: buildAuthHeader(token)
        });
    },

    checkHomeworkManageAccess(homeworkId, token) {
        return axios.get(`${API_URL}/${homeworkId}/teacher/manage-access`, {
            headers: buildAuthHeader(token)
        });
    },

    isHomeworkExpired(homeworkId) {
        return axios.get(`${API_URL}/${homeworkId}/expired`);
    },

    // ================ 新增：重新计算得分 ================
    recalculateScore(submissionId) {
        return axios.put(`${API_URL}/submission/${submissionId}/recalculate`);
    }
};