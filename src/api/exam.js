import axios from 'axios';
import request from '../utils/request'

const API_URL = 'http://localhost:8080/api/exams';

export default {
    // 学生端接口
    getAllExams() {
        return axios.get(API_URL);
    },
    getBookableExams() {
        return axios.get(`${API_URL}/bookable`);
    },
    getBookedExams() {
        return axios.get(`${API_URL}/booked`);
    },
    getExamById(examId) {
        return axios.get(`${API_URL}/${examId}`);
    },
    startExam(examId) {
        return axios.post(`${API_URL}/${examId}/start`);
    },
    submitExam(examId, answers) {
        return axios.post(`${API_URL}/${examId}/submit`, answers);
    },
    recordViolation(examId, type) {
        return axios.post(`${API_URL}/${examId}/violation`, { type });
    },
    getExamStatus(examId) {
        return axios.get(`${API_URL}/${examId}/status`);
    },
    handleTimeout(examId) {
        return axios.post(`${API_URL}/${examId}/timeout`);
    },
    getExamScore(examId) {
        return axios.get(`${API_URL}/${examId}/score`);
    },
    checkBookingStatus(userId, examId) {
        return axios.get(`${API_URL}/check-status`, {
            params: { userId, examId }
        });
    },

    // 获取考试列表
    getExamList() {
        return request({
            url: '/api/exams/list',
            method: 'get'
        })
    },

    // 教师端接口
    // 创建考试
    createExam(examData) {
        return axios.post(API_URL, examData);
    },

    // 获取教师创建的考试列表
    getCreatedExams(status = 'ALL') {
        return axios.get(`${API_URL}/created`, {
            params: { status }
        });
    },

    // 获取考试详情（包含题目）
    getExamDetails(examId) {
        return axios.get(`${API_URL}/${examId}/details`);
    },

    // 更新考试
    updateExam(examId, examData) {
        return axios.put(`${API_URL}/${examId}`, examData);
    },

    // 删除考试
    deleteExam(examId) {
        return axios.delete(`${API_URL}/${examId}`);
    },

    // 发布考试
    publishExam(examId) {
        return axios.post(`${API_URL}/${examId}/publish`);
    },

    // 为考试添加题目
    addQuestionToExam(examId, questionData) {
        return axios.post(`${API_URL}/${examId}/questions`, questionData);
    },

    // 获取题目列表
    getQuestionsByExamId(examId) {
        return axios.get(`${API_URL}/${examId}/questions`);
    }
};