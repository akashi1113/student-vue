import axios from 'axios';
import dayjs from 'dayjs';

const API_URL = 'http://localhost:8080/api/experiment';

const ExperimentService = {
    // ==================== 实验项目管理 ====================

    getExperiments() {
        return axios.get(`${API_URL}/projects`, {
            headers: {
                ...this._buildAuthHeader(this.getToken())
            },
            transformResponse: [function (data) {
                const parsed = JSON.parse(data);
                return parsed.data.map(item => ({
                    ...item,
                    status: item.status || 0,
                    approval_status: item.approvalStatus || item.approval_status || 0
                }));
            }]
        });
    },

    getExperimentById(id) {
        return axios.get(`${API_URL}/${id}`, {
            transformResponse: [function (data) {
                const parsed = JSON.parse(data);
                return parsed.data;
            }]
        });
    },

    // ==================== 实验预约管理 ====================

    bookExperiment(data) {
        return axios.post(`${API_URL}/book-with-slot`, {
            experimentId: data.experimentId,
            userId: data.userId,
            timeSlotId: data.timeSlotId
        }, {
            headers: this._buildAuthHeader(this.getToken())
        });
    },

    bookExperimentWithTime(data) {
        return axios.post(`${API_URL}/book`, {
            experimentId: data.experimentId,
            userId: data.userId,
            startTime: data.startTime,
            endTime: data.endTime
        }, {
            headers: this._buildAuthHeader(this.getToken())
        });
    },

    getBooking(bookingId) {
        return axios.get(`${API_URL}/bookings/${bookingId}`, {
            transformResponse: [function (data) {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.data) {
                        return {
                            ...parsed.data,
                            approval_status: parsed.data.approval_status ?? parsed.data.approvalStatus ?? 0
                        };
                    }
                    return null;
                } catch (e) {
                    console.error('解析预约详情失败:', e);
                    return null;
                }
            }]
        });
    },

    // ==================== 实验过程管理 ====================

    startExperiment(experimentId) {
        return axios.post(`${API_URL}/${experimentId}/start`, {}, {
            headers: this._buildAuthHeader(this.getToken())
        });
    },

    saveCodeHistory(data) {
        return axios.post(`${API_URL}/code-history`, data);
    },

    getCodeHistory(experimentRecordId) {
        return axios.get(`${API_URL}/record/${experimentRecordId}/code-history`);
    },

    updateStepRecord(data) {
        return axios.put(`${API_URL}/step-record`, data);
    },

    completeExperiment(data) {
        return axios.post(`${API_URL}/complete`, data);
    },

    // ==================== 实验记录管理 ====================

    getExperimentRecord(experimentRecordId) {
        return axios.get(`${API_URL}/record/${experimentRecordId}/detail`);
    },

    getUserExperimentRecords() {
        return axios.get(`${API_URL}/user-records`, {
            headers: this._buildAuthHeader(this.getToken())
        });
    },

    // ==================== 实验报告管理 ====================

    generateReport(experimentRecordId) {
        return axios.get(`${API_URL}/record/${experimentRecordId}/report`);
    },

    getStudentFinalReport(experimentId) {
        return axios.get(`${API_URL}/reports/${experimentId}`, {
            headers: this._buildAuthHeader(this.getToken())
        });
    },

    getExperimentReports(experimentId) {
        return axios.get(`${API_URL}/reports/${experimentId}/all`);
    },

    // ==================== 其他方法 ====================

    getPublishedExperiments() {
        return axios.get(`${API_URL}/published`);
    },

    getAvailableTimeSlots(experimentId) {
        return axios.get(`${API_URL}/${experimentId}/time-slots`, {
            transformResponse: [function (data) {
                try {
                    const parsed = JSON.parse(data);
                    return Array.isArray(parsed.data) ? parsed.data : [];
                } catch (e) {
                    console.error('解析响应数据失败:', e);
                    return [];
                }
            }]
        });
    },

    updateExperimentStatus({ id, status }) {
        if (id === undefined || id === null) {
            return Promise.reject(new Error('实验ID不能为空'));
        }

        return axios.put(`${API_URL}/${id}/status`, null, {
            params: { status }
        });
    },

    // ==================== 辅助方法 ====================

    /**
     * 构建认证请求头
     * @private
     * @param {string} token 用户令牌
     * @returns {Object} 认证头
     */
    _buildAuthHeader(token) {
        const cleanToken = token?.replace('Bearer ', '') || '';
        return { Authorization: cleanToken };
    },

    /**
     * 获取本地存储的token
     * @returns {string} 用户token
     */
    getToken() {
        return localStorage.getItem('token') || '';
    },

    /**
     * 检查认证状态
     * @throws {Error} 如果未认证
     */
    checkAuth() {
        const token = this.getToken();
        if (!token) {
            throw new Error('未登录，请先登录');
        }
        return token;
    }
};

export default ExperimentService;