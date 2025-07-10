import axios from 'axios';

const API_URL = 'http://localhost:8080/api/exam/monitor';

// 构建认证头的辅助函数
const buildAuthHeader = () => {
    const token = localStorage.getItem('token')
    if (!token) return {};
    const cleanToken = token.replace('Bearer ', '');
    return { Authorization: cleanToken };
};

export default {
    // 上传监考图片
    uploadImage(formData) {
        return axios.post(`${API_URL}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...buildAuthHeader()
            }
        });
    },

    // 获取监考记录
    getMonitorRecords(examId, abnormalOnly = false) {
        return axios.get(`${API_URL}/records`, {
            params: {
                examId,
                abnormalOnly
            },
            headers: buildAuthHeader()
        });
    },

    // 获取监考统计
    getMonitorSummary(examId) {
        return axios.get(`${API_URL}/summary`, {
            params: {
                examId
            },
            headers: buildAuthHeader()
        });
    },

    // 获取监考状态
    getMonitorStatus(examId) {
        return axios.get(`${API_URL}/status`, {
            params: {
                examId
            },
            headers: buildAuthHeader()
        });
    },

    // 获取时间范围内的监考记录
    getMonitorRecordsByTimeRange(examId, startTime, endTime) {
        return axios.get(`${API_URL}/records/time-range`, {
            params: {
                examId,
                startTime,
                endTime
            },
            headers: buildAuthHeader()
        });
    },

    // 获取异常统计
    getAbnormalStats(examId) {
        return axios.get(`${API_URL}/abnormal-stats`, {
            params: {
                examId
            },
            headers: buildAuthHeader()
        });
    },

    // 删除监考记录
    deleteMonitorRecord(id) {
        return axios.delete(`${API_URL}/records/${id}`, {
            headers: buildAuthHeader()
        });
    }
}