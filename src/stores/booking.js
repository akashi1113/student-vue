import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import bookingApi from '@/api/examBooking'

export const useBookingStore = defineStore('booking', () => {
    // 状态
    const timeSlots = ref([])
    const userBookings = ref([])
    const notifications = ref([])
    const loading = ref(false)
    const error = ref(null)
    const currentBooking = ref(null)

    // 计算属性
    const unreadNotifications = computed(() => {
        return notifications.value.filter(n => n.sendStatus !== 'READ')
    })

    const unreadCount = computed(() => unreadNotifications.value.length)

    const activeBookings = computed(() => {
        return userBookings.value.filter(b =>
            ['BOOKED', 'CONFIRMED'].includes(b.bookingStatus)
        )
    })

    // 获取token的辅助函数
    const getToken = () => {
        return localStorage.getItem('token') || sessionStorage.getItem('token')
    }

    // 通用请求处理函数
    const handleApiRequest = async (apiCall, successCallback) => {
        loading.value = true
        error.value = null
        try {
            const data = await apiCall()
            console.log('API处理后的数据:', data)

            if (successCallback) {
                successCallback(data)
            }

            // 返回包装格式以保持兼容性
            return { data: data }
        } catch (err) {
            error.value = err.message || '请求失败'
            console.error('API请求错误:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    // 方法
    const fetchAvailableTimeSlots = async (examId, token = null) => {
        const authToken = token || getToken()
        return handleApiRequest(
            () => bookingApi.getAvailableTimeSlots(examId, authToken),
            (data) => { timeSlots.value = data }
        )
    }

    const fetchTimeSlotsByDate = async (date, examMode, token = null) => {
        const authToken = token || getToken()
        return handleApiRequest(
            () => bookingApi.getTimeSlotsByDate(date, examMode, authToken),
            (data) => { timeSlots.value = data }
        )
    }

    const fetchUserBookings = async (token = null, status = null) => {
        const authToken = token || getToken()
        return handleApiRequest(
            () => bookingApi.getUserBookings(authToken, status),
            (data) => { userBookings.value = data }
        )
    }

    const fetchUserNotifications = async (token = null) => {
        const authToken = token || getToken()
        return handleApiRequest(
            () => bookingApi.getUserNotifications(authToken),
            (data) => { notifications.value = data }
        )
    }

    const fetchUnreadNotifications = async (token = null) => {
        const authToken = token || getToken()
        return handleApiRequest(
            () => bookingApi.getUnreadNotifications(authToken),
            (data) => { notifications.value = data }
        )
    }

    const bookExam = async (bookingData, token = null) => {
        const authToken = token || getToken()
        return handleApiRequest(
            () => bookingApi.bookExam(bookingData, authToken),
            async () => {
                // 刷新用户预约列表
                await fetchUserBookings(authToken)
            }
        )
    }

    const cancelBooking = async (bookingId, cancelData, token = null) => {
        const authToken = token || getToken()
        return handleApiRequest(
            () => bookingApi.cancelBooking(bookingId, cancelData, authToken),
            async () => {
                // 刷新用户预约列表
                await fetchUserBookings(authToken)
            }
        )
    }

    const confirmBooking = async (bookingId, token = null) => {
        const authToken = token || getToken()
        return handleApiRequest(
            () => bookingApi.confirmBooking(bookingId, authToken)
        )
    }

    const getBookingDetails = async (bookingId, token = null) => {
        const authToken = token || getToken()
        return handleApiRequest(
            () => bookingApi.getBookingDetails(bookingId, authToken),
            (data) => { currentBooking.value = data }
        )
    }

    const markAsRead = async (notificationId, token = null) => {
        const authToken = token || getToken()
        try {
            await bookingApi.markNotificationAsRead(notificationId, authToken)
            // 更新本地状态
            const notification = notifications.value.find(n => n.id === notificationId)
            if (notification) {
                notification.sendStatus = 'READ'
                notification.readTime = new Date().toISOString()
            }
        } catch (error) {
            console.error('标记已读失败:', error)
            throw error
        }
    }

    const batchMarkAsRead = async (notificationIds, token = null) => {
        const authToken = token || getToken()
        try {
            await bookingApi.batchMarkAsRead(notificationIds, authToken)
            // 更新本地状态
            notifications.value.forEach(notification => {
                if (notificationIds.includes(notification.id)) {
                    notification.sendStatus = 'READ'
                    notification.readTime = new Date().toISOString()
                }
            })
        } catch (error) {
            console.error('批量标记已读失败:', error)
            throw error
        }
    }

    const checkIn = async (bookingId, checkInData, token = null) => {
        const authToken = token || getToken()
        return handleApiRequest(
            () => bookingApi.checkIn(bookingId, checkInData, authToken)
        )
    }

    const getBookingStats = async (params = {}, token = null) => {
        const authToken = token || getToken()
        return handleApiRequest(
            () => bookingApi.getBookingStats(params, authToken)
        )
    }

    return {
        // 状态
        timeSlots,
        userBookings,
        notifications,
        loading,
        error,
        currentBooking,

        // 计算属性
        unreadNotifications,
        unreadCount,
        activeBookings,

        // 方法
        fetchAvailableTimeSlots,
        fetchTimeSlotsByDate,
        fetchUserBookings,
        fetchUserNotifications,
        fetchUnreadNotifications,
        bookExam,
        cancelBooking,
        confirmBooking,
        getBookingDetails,
        markAsRead,
        batchMarkAsRead,
        checkIn,
        getBookingStats,

        // 工具方法
        getToken
    }
})