import axios from 'axios';

const API_URL = 'http://localhost:8080/api/exams';

export default {
    getAllExams() {
        return axios.get(API_URL);
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
    }
};