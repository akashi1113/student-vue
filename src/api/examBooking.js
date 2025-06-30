import request from '@/utils/request'

// 时间段管理
export const getAvailableTimeSlots = (examId) => {
    return request.get(`/exam-booking/time-slots/${examId}`)
}

export const getTimeSlotsByDate = (date, examMode) => {
    return request.get('/exam-booking/time-slots/by-date', {
        params: { date, examMode }
    })
}

export const createTimeSlot = (data) => {
    return request.post('/exam-booking/time-slots', data)
}

export const batchCreateTimeSlots = (data) => {
    return request.post('/exam-booking/time-slots/batch', data)
}

export const updateTimeSlot = (timeSlotId, data) => {
    return request.put(`/exam-booking/time-slots/${timeSlotId}`, data)
}

export const deleteTimeSlot = (timeSlotId) => {
    return request.delete(`/exam-booking/time-slots/${timeSlotId}`)
}

// 预约管理
export const bookExam = (data) => {
    return request.post('/exam-booking/bookings', data)
}

export const cancelBooking = (bookingId, data) => {
    return request.post(`/exam-booking/bookings/${bookingId}/cancel`, data)
}

export const confirmBooking = (bookingId) => {
    return request.post(`/exam-booking/bookings/${bookingId}/confirm`)
}

export const getUserBookings = (userId, status) => {
    return request.get(`/exam-booking/bookings/user/${userId}`, {
        params: { status }
    })
}

export const getBookingDetails = (bookingId) => {
    return request.get(`/exam-booking/bookings/${bookingId}`)
}

export const getBookingDetailsByNumber = (bookingNumber) => {
    return request.get(`/exam-booking/bookings/by-number/${bookingNumber}`)
}

export const checkIn = (bookingId, data) => {
    return request.post(`/exam-booking/bookings/${bookingId}/check-in`, data)
}

// 统计查询
export const getTimeSlotStats = (timeSlotId) => {
    return request.get(`/exam-booking/stats/time-slot/${timeSlotId}`)
}

export const getUserBookingStats = (userId) => {
    return request.get(`/exam-booking/stats/user/${userId}`)
}

// 通知管理
export const getUserNotifications = (userId) => {
    return request.get(`/exam-booking/notifications/${userId}`)
}

export const getUnreadNotifications = (userId) => {
    return request.get(`/exam-booking/notifications/unread/${userId}`)
}

export const markNotificationAsRead = (notificationId) => {
    return request.post(`/exam-booking/notifications/${notificationId}/read`)
}

export const batchMarkAsRead = (userId, notificationIds) => {
    return request.post('/exam-booking/notifications/batch-read', notificationIds, {
        params: { userId }
    })
}

export const sendExamReminder = (examId) => {
    return request.post(`/exam-booking/notifications/exam-reminder/${examId}`)
}