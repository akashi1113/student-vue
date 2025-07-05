import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import bookingApi from '@/api/examBooking'

export const useBookingStore = defineStore('booking', () => {
    // 状态
    const timeSlots = ref([])
    const userBookings = ref([])
    const notifications = ref([])
    const loading = ref(false)
    const currentBooking = ref(null)

    // 计算属性
    const unreadNotifications = computed(() => {
        return notifications.value.filter(n => n.sendStatus !== 'READ')
    })

    const unreadCount = computed(() => {
        return unreadNotifications.value.length
    })

    const activeBookings = computed(() => {
        return userBookings.value.filter(b =>
            ['BOOKED', 'CONFIRMED'].includes(b.bookingStatus)
        )
    })

    // 方法
    const fetchAvailableTimeSlots = async (examId) => {
        loading.value = true
        try {
            const response = await bookingApi.getAvailableTimeSlots(examId)
            timeSlots.value = response.data.data || []
            return response
        } finally {
            loading.value = false
        }
    }

    const fetchUserBookings = async (userId, status = null) => {
        loading.value = true
        try {
            const response = await bookingApi.getUserBookings(userId, status)
            userBookings.value = response.data.data || []
            return response
        } finally {
            loading.value = false
        }
    }

    const fetchUserNotifications = async (userId) => {
        try {
            const response = await bookingApi.getUserNotifications(userId)
            notifications.value = response.data.data || []
            return response
        } catch (error) {
            console.error('获取通知失败:', error)
            throw error
        }
    }

    const bookExam = async (bookingData) => {
        loading.value = true
        try {
            const response = await bookingApi.bookExam(bookingData)
            // 刷新用户预约列表
            if (bookingData.userId) {
                await fetchUserBookings(bookingData.userId)
            }
            return response
        } finally {
            loading.value = false
        }
    }

    const cancelBooking = async (bookingId, userId, cancelReason) => {
        loading.value = true
        try {
            const response = await bookingApi.cancelBooking(bookingId, {
                userId,
                cancelReason
            })
            // 刷新用户预约列表
            await fetchUserBookings(userId)
            return response
        } finally {
            loading.value = false
        }
    }

    const markAsRead = async (notificationId) => {
        try {
            await bookingApi.markNotificationAsRead(notificationId)
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

    const batchMarkAsRead = async (notificationIds) => {
        try {
            await bookingApi.batchMarkNotificationsAsRead(notificationIds)
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

    return {
        // 状态
        timeSlots,
        userBookings,
        notifications,
        loading,
        currentBooking,

        // 计算属性
        unreadNotifications,
        unreadCount,
        activeBookings,

        // 方法
        fetchAvailableTimeSlots,
        fetchUserBookings,
        fetchUserNotifications,
        bookExam,
        cancelBooking,
        markAsRead,
        batchMarkAsRead
    }
})