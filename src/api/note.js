import axios from 'axios';

const API_URL = 'http://localhost:8080/api/notes';

// 构建认证头的辅助函数
const buildAuthHeader = () => {
    const token = localStorage.getItem('token')
    if (!token) return {};
    const cleanToken = token.replace('Bearer ', '');
    return { Authorization: cleanToken };
};

export default {
    // 创建笔记
    createNote(noteData) {
        return axios.post(API_URL, noteData, {
            headers: buildAuthHeader()
        });
    },

    // 更新笔记
    updateNote(id, noteData) {
        return axios.put(`${API_URL}/${id}`, noteData);
    },

    // 获取用户所有笔记
    getUserNotes() {
        return axios.get(API_URL, {
            headers: buildAuthHeader()
        });
    },

    // 获取单个笔记
    getNoteById(id, token) {
        return axios.get(`${API_URL}/${id}`);
    },

    // 删除笔记
    deleteNote(id) {
        return axios.delete(`${API_URL}/${id}`, {
            headers: buildAuthHeader()
        });
    }
};