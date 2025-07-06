import axios from 'axios';
import request from '../utils/request'

const API_URL = 'http://localhost:8080/api/exams';

export default {
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
    // 检查预约状态
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
    }
};