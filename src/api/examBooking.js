import axios from 'axios';

const API_URL = 'http://localhost:8080/api/exam-booking';

const ExamBookingService = {
    // ============================== 考试时间段管理 ==============================

    /**
     * 获取可用时间段
     * @param {number} examId 考试ID
     */
    async getAvailableTimeSlots(examId) {
        const response = await axios.get(`${API_URL}/time-slots/${examId}`);
        return this._handleResponse(response);
    },

    /**
     * 根据日期获取时间段
     * @param {string} date 日期 (yyyy-MM-dd)
     * @param {string} examMode 考试模式
     */
    async getTimeSlotsByDate(date, examMode) {
        const response = await axios.get(`${API_URL}/time-slots/by-date`, {
            params: { date, examMode }
        });
        return this._handleResponse(response);
    },

    /**
     * 创建时间段
     * @param {object} data 时间段数据
     * @param {string} token JWT令牌
     */
    async createTimeSlot(data, token) {
        const response = await axios.post(`${API_URL}/time-slots`, data, {
            headers: this._buildAuthHeader(token)
        });
        return this._handleResponse(response);
    },

    /**
     * 批量创建时间段
     * @param {array} data 时间段数据数组
     * @param {string} token JWT令牌
     */
    async batchCreateTimeSlots(data, token) {
        const response = await axios.post(`${API_URL}/time-slots/batch`, data, {
            headers: this._buildAuthHeader(token)
        });
        return this._handleResponse(response);
    },

    /**
     * 更新时间段
     * @param {number} timeSlotId 时间段ID
     * @param {object} data 更新数据
     * @param {string} token JWT令牌
     */
    async updateTimeSlot(timeSlotId, data, token) {
        const response = await axios.put(`${API_URL}/time-slots/${timeSlotId}`, data, {
            headers: this._buildAuthHeader(token)
        });
        return this._handleResponse(response);
    },

    /**
     * 删除时间段
     * @param {number} timeSlotId 时间段ID
     */
    async deleteTimeSlot(timeSlotId) {
        const response = await axios.delete(`${API_URL}/time-slots/${timeSlotId}`);
        return this._handleResponse(response);
    },

    /**
     * 获取考试时间段
     * @param {number} examId 考试ID
     */
    async getTimeSlots(examId) {
        const response = await axios.get(`${API_URL}/${examId}/time-slots`);
        return this._handleResponse(response);
    },

    /**
     * 切换时间段状态
     * @param {number} timeSlotId 时间段ID
     */
    async toggleTimeSlotStatus(timeSlotId) {
        const response = await axios.post(`${API_URL}/time-slots/${timeSlotId}/toggle-status`);
        return this._handleResponse(response);
    },

    // ============================== 考试预约管理 ==============================

    /**
     * 预约考试
     * @param {object} data 预约数据
     * @param {string} token JWT令牌
     */
    async bookExam(data, token) {
        const response = await axios.post(`${API_URL}/bookings`, data, {
            headers: this._buildAuthHeader(token)
        });
        return this._handleResponse(response);
    },

    /**
     * 取消预约
     * @param {number} bookingId 预约ID
     * @param {object} data 取消原因
     * @param {string} token JWT令牌
     */
    async cancelBooking(bookingId, data, token) {
        const response = await axios.post(`${API_URL}/bookings/${bookingId}/cancel`, data, {
            headers: this._buildAuthHeader(token)
        });
        return this._handleResponse(response);
    },

    /**
     * 确认预约
     * @param {number} bookingId 预约ID
     * @param {string} token JWT令牌
     */
    async confirmBooking(bookingId, token) {
        const response = await axios.post(`${API_URL}/bookings/${bookingId}/confirm`, {}, {
            headers: this._buildAuthHeader(token)
        });
        return this._handleResponse(response);
    },

    /**
     * 获取用户预约列表
     * @param {string} token JWT令牌
     * @param {string} status 状态过滤
     */
    async getUserBookings(token, status) {
        const response = await axios.get(`${API_URL}/bookings/user`, {
            params: { status },
            headers: this._buildAuthHeader(token)
        });
        return this._handleResponse(response);
    },

    /**
     * 获取预约详情
     * @param {number} bookingId 预约ID
     */
    async getBookingDetails(bookingId) {
        const response = await axios.get(`${API_URL}/bookings/${bookingId}`);
        return this._handleResponse(response);
    },

    /**
     * 根据用户和考试获取预约ID
     * @param {number} examId 考试ID
     * @param {string} token JWT令牌
     */
    async getBookingIdByUserAndExam(examId, token) {
        const response = await axios.get(`${API_URL}/bookings/by-user-exam`, {
            params: { examId },
            headers: this._buildAuthHeader(token)
        });
        return this._handleResponse(response);
    },

    /**
     * 根据预约号获取预约详情
     * @param {string} bookingNumber 预约号
     */
    async getBookingDetailsByNumber(bookingNumber) {
        const response = await axios.get(`${API_URL}/bookings/by-number/${bookingNumber}`);
        return this._handleResponse(response);
    },

    /**
     * 签到
     * @param {number} bookingId 预约ID
     * @param {object} data 签到数据
     */
    async checkIn(bookingId, data) {
        const response = await axios.post(`${API_URL}/bookings/${bookingId}/check-in`, data);
        return this._handleResponse(response);
    },

    // ============================== 统计查询 ==============================

    /**
     * 获取时间段统计
     * @param {number} timeSlotId 时间段ID
     */
    async getTimeSlotStats(timeSlotId) {
        const response = await axios.get(`${API_URL}/stats/time-slot/${timeSlotId}`);
        return this._handleResponse(response);
    },

    /**
     * 获取用户预约统计
     * @param {string} token JWT令牌
     */
    async getUserBookingStats(token) {
        const response = await axios.get(`${API_URL}/stats/user`, {
            headers: this._buildAuthHeader(token)
        });
        return this._handleResponse(response);
    },

    /**
     * 获取预约统计
     * @param {object} params 查询参数
     */
    async getBookingStats(params = {}) {
        const response = await axios.get(`${API_URL}/stats`, {
            params: {
                startDate: params.startDate,
                endDate: params.endDate
            }
        });
        return this._handleResponse(response);
    },

    // ============================== 通知管理 ==============================

    /**
     * 获取用户通知
     * @param {string} token JWT令牌
     */
    async getUserNotifications(token) {
        const response = await axios.get(`${API_URL}/notifications`, {
            headers: this._buildAuthHeader(token)
        });
        return this._handleResponse(response);
    },

    /**
     * 获取未读通知
     * @param {string} token JWT令牌
     */
    async getUnreadNotifications(token) {
        const response = await axios.get(`${API_URL}/notifications/unread`, {
            headers: this._buildAuthHeader(token)
        });
        return this._handleResponse(response);
    },

    /**
     * 标记通知为已读
     * @param {number} notificationId 通知ID
     */
    async markNotificationAsRead(notificationId) {
        const response = await axios.post(`${API_URL}/notifications/${notificationId}/read`);
        return this._handleResponse(response);
    },

    /**
     * 批量标记为已读
     * @param {array} notificationIds 通知ID数组
     * @param {string} token JWT令牌
     */
    async batchMarkAsRead(notificationIds, token) {
        const response = await axios.post(`${API_URL}/notifications/batch-read`, notificationIds, {
            headers: this._buildAuthHeader(token)
        });
        return this._handleResponse(response);
    },

    /**
     * 发送考试提醒
     * @param {number} examId 考试ID
     */
    async sendExamReminder(examId) {
        const response = await axios.post(`${API_URL}/notifications/exam-reminder/${examId}`);
        return this._handleResponse(response);
    },

    // ============================== 管理功能 ==============================

    /**
     * 处理过期预约
     */
    async handleExpiredBookings() {
        const response = await axios.post(`${API_URL}/admin/handle-expired`);
        return this._handleResponse(response);
    },

    /**
     * 获取预约列表
     * @param {object} params 查询参数
     */
    async getBookings(params = {}) {
        const response = await axios.get(`${API_URL}/list`, {
            params: {
                status: params.status,
                startDate: params.startDate,
                endDate: params.endDate,
                pageNum: params.pageNum || 1,
                pageSize: params.pageSize || 20
            }
        });
        return this._handleResponse(response);
    },

    // ==================== 通用方法 ====================
    /**
     * 构建认证头
     * @private
     */
    _buildAuthHeader(token) {
        // 移除 Bearer 前缀（如果存在），因为后端直接使用 token
        const cleanToken = token.replace('Bearer ', '');
        return { Authorization: cleanToken };
    },

    /**
     * 统一处理响应
     * @private
     */
    _handleResponse(response) {
        if (response.data && response.data.success) {
            return response.data.data;
        } else {
            const errorMsg = response.data?.message || '请求失败';
            throw new Error(errorMsg);
        }
    }
};

export default ExamBookingService;