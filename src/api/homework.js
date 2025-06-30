import axios from 'axios';

const API_URL = 'http://localhost:8080/api/homework';

export default {
    // ================ 作业管理 ================
    createHomework(homeworkData) {
        return axios.post(API_URL, homeworkData);
    },
    updateHomework(homeworkId, homeworkData) {
        return axios.put(`${API_URL}/${homeworkId}`, homeworkData);
    },
    deleteHomework(homeworkId) {
        return axios.delete(`${API_URL}/${homeworkId}`);
    },
    getHomeworkById(homeworkId) {
        return axios.get(`${API_URL}/${homeworkId}`);
    },
    getHomeworkByTeacher(teacherId) {
        return axios.get(`${API_URL}/teacher/${teacherId}`);
    },
    getHomeworkByCourse(courseId) {
        return axios.get(`${API_URL}/course/${courseId}`);
    },
    getAvailableHomework(studentId) {
        return axios.get(`${API_URL}/student/${studentId}/available`);
    },
    getHomeworkByStudent(studentId) {
        return axios.get(`${API_URL}/student/${studentId}`);
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
    getCoursesByTeacher(teacherId) {
        return axios.get(`${API_URL}/teacher/${teacherId}/courses`);
    },
    getCoursesByStudent(studentId) {
        return axios.get(`${API_URL}/student/${studentId}/courses`);
    },

    // ================ 作业提交 ================
    submitHomework(homeworkId, submitData) {
        return axios.post(`${API_URL}/${homeworkId}/submit`, submitData);
    },
    getStudentSubmission(homeworkId, studentId) {
        return axios.get(`${API_URL}/${homeworkId}/submission/student/${studentId}`);
    },
    getHomeworkSubmissions(homeworkId) {
        return axios.get(`${API_URL}/${homeworkId}/submissions`);
    },
    getStudentSubmissions(studentId) {
        return axios.get(`${API_URL}/student/${studentId}/submissions`);
    },
    getCourseSubmissions(courseId) {
        return axios.get(`${API_URL}/course/${courseId}/submissions`);
    },
    canResubmit(homeworkId, studentId) {
        return axios.get(`${API_URL}/${homeworkId}/student/${studentId}/can-resubmit`);
    },

    // ================ 作业批改 ================
    gradeHomework(submissionId, gradeData) {
        return axios.put(`${API_URL}/submission/${submissionId}/grade`, gradeData);
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
    getStudentProgress(studentId) {
        return axios.get(`${API_URL}/student/${studentId}/progress`);
    },
    getCourseHomeworkStatistics(courseId) {
        return axios.get(`${API_URL}/course/${courseId}/statistics`);
    },

    // ================ 权限检查 ================
    checkHomeworkAccess(homeworkId, studentId) {
        return axios.get(`${API_URL}/${homeworkId}/student/${studentId}/access`);
    },
    checkHomeworkManageAccess(homeworkId, teacherId) {
        return axios.get(`${API_URL}/${homeworkId}/teacher/${teacherId}/manage-access`);
    },
    isHomeworkExpired(homeworkId) {
        return axios.get(`${API_URL}/${homeworkId}/expired`);
    },
};