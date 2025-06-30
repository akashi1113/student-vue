import axios from 'axios';

const API_URL = 'http://localhost:8080/api/questions';

export default {
    getQuestionsByExamId(examId) {
        return axios.get(`${API_URL}/exam/${examId}`);
    },

    getQuestionsWithAnswersByExamId(examId) {
        return axios.get(`${API_URL}/exam/${examId}/manage`);
    },

    getQuestionById(id) {
        return axios.get(`${API_URL}/${id}`);
    },

    createQuestion(data) {
        return axios.post(API_URL, data);
    },

    createQuestions(data) {
        return axios.post(`${API_URL}/batch`, data);
    },

    updateQuestion(id, data) {
        return axios.put(`${API_URL}/${id}`, data);
    },

    deleteQuestion(id) {
        return axios.delete(`${API_URL}/${id}`);
    },

    deleteQuestions(ids) {
        return axios.delete(`${API_URL}/batch`, { data: ids });
    },

    deleteQuestionsByExamId(examId) {
        return axios.delete(`${API_URL}/exam/${examId}`);
    },

    getTotalScore(examId) {
        return axios.get(`${API_URL}/exam/${examId}/total-score`);
    },

    getQuestionAnalysis(examRecordId) {
        return axios.get(`${API_URL}/analysis/${examRecordId}`);
    }
};