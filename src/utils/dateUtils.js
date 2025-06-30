import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn' // 导入中文语言包

// 设置中文为默认语言
dayjs.locale('zh-cn')

export const formatDate = (date, pattern = 'YYYY-MM-DD') => {
    if (!date) return ''
    return dayjs(date).format(pattern)
}

export const formatDateTime = (date) => {
    return formatDate(date, 'YYYY-MM-DD HH:mm:ss')
}

export const formatTime = (date) => {
    return formatDate(date, 'HH:mm')
}

export const isExpired = (date) => {
    return dayjs(date).isBefore(dayjs())
}

export const canCancel = (examDate, cancelDeadlineHours) => {
    const deadline = dayjs(examDate).subtract(cancelDeadlineHours, 'hour')
    return deadline.isAfter(dayjs())
}
export const getStatusText = (status) => {
    const statusMap = {
        'BOOKED': '已预约',
        'CONFIRMED': '已确认',
        'CANCELLED': '已取消',
        'COMPLETED': '已完成',
        'NO_SHOW': '缺席'
    }
    return statusMap[status] || status
}

export const getExamModeText = (mode) => {
    const modeMap = {
        'ONLINE': '线上考试',
        'OFFLINE': '线下考试',
        'HYBRID': '混合模式'
    }
    return modeMap[mode] || mode
}