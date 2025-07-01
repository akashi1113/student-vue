import axios from 'axios';

const API_URL = 'http://localhost:8080/api/exam-booking';

export default {
    // 时间段管理
    getAvailableTimeSlots(examId) {
        return axios.get(`${API_URL}/time-slots/${examId}`);
    },
    getTimeSlotsByDate(date, examMode) {
        return axios.get(`${API_URL}/time-slots/by-date`, {
            params: { date, examMode }
        });
    },
    createTimeSlot(data) {
        return axios.post(`${API_URL}/time-slots`, data);
    },
    batchCreateTimeSlots(data) {
        return axios.post(`${API_URL}/time-slots/batch`, data);
    },
    updateTimeSlot(timeSlotId, data) {
        return axios.put(`${API_URL}/time-slots/${timeSlotId}`, data);
    },
    deleteTimeSlot(timeSlotId) {
        return axios.delete(`${API_URL}/time-slots/${timeSlotId}`);
    },
    // 预约管理
    bookExam(data) {
        return axios.post(`${API_URL}/bookings`, data);
    },
    cancelBooking(bookingId, data) {
        return axios.post(`${API_URL}/bookings/${bookingId}/cancel`, data);
    },
    confirmBooking(bookingId) {
        return axios.post(`${API_URL}/bookings/${bookingId}/confirm`);
    },
    getUserBookings(userId, status) {
        return axios.get(`${API_URL}/bookings/user/${userId}`, {
            params: { status }
        });
    },
    getBookingDetails(bookingId) {
        return axios.get(`${API_URL}/bookings/${bookingId}`);
    },
    getBookingDetailsByNumber(bookingNumber) {
        return axios.get(`${API_URL}/bookings/by-number/${bookingNumber}`);
    },
    checkIn(bookingId, data) {
        return axios.post(`${API_URL}/bookings/${bookingId}/check-in`, data);
    },
    // 根据用户ID和考试ID获取预约
    getBookingIdByUserAndExam(userId, examId) {
        return axios.get(`${API_URL}/bookings/by-user-exam`, {
            params: { userId, examId }
        });
    },
    // 统计查询
    getTimeSlotStats(timeSlotId) {
        return axios.get(`${API_URL}/stats/time-slot/${timeSlotId}`);
    },
    getUserBookingStats(userId) {
        return axios.get(`${API_URL}/stats/user/${userId}`);
    },
    // 通知管理
    getUserNotifications(userId) {
        return axios.get(`${API_URL}/notifications/${userId}`);
    },
    getUnreadNotifications(userId) {
        return axios.get(`${API_URL}/notifications/unread/${userId}`);
    },
    markNotificationAsRead(notificationId) {
        return axios.post(`${API_URL}/notifications/${notificationId}/read`);
    },
    batchMarkAsRead(userId, notificationIds) {
        return axios.post(`${API_URL}/notifications/batch-read`, notificationIds, {
            params: { userId }
        });
    },
    sendExamReminder(examId) {
        return axios.post(`${API_URL}/notifications/exam-reminder/${examId}`);
    },
    getBookings(params = {}) {
        return axios.get(`${API_URL}/list`, {
            params: {
                status: params.status,
                startDate: params.startDate,
                endDate: params.endDate,
                pageNum: params.pageNum || 1,
                pageSize: params.pageSize || 20
            }
        });
    },
    getBookingStats(params = {}) {
        return axios.get(`${API_URL}/stats`, {
            params: {
                startDate: params.startDate,
                endDate: params.endDate
            }
        });
    },
    // 获取考试时间段
    getTimeSlots(examId) {
        return axios.get(`${API_URL}/${examId}/time-slots`);
    },
    // 切换时间段状态
    toggleTimeSlotStatus(timeSlotId) {
        return axios.post(`${API_URL}/time-slots/${timeSlotId}/toggle-status`);
    }
};