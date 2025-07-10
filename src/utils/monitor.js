import monitorConfig from '@/config/monitor'

export class MonitorUtils {
    /**
     * 检查浏览器是否支持监考功能
     */
    static checkBrowserSupport() {
        const support = {
            camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            canvas: !!document.createElement('canvas').getContext,
            blob: !!window.Blob,
            formData: !!window.FormData
        }

        return {
            ...support,
            isSupported: Object.values(support).every(s => s)
        }
    }

    /**
     * 获取摄像头权限状态
     */
    static async getCameraPermission() {
        if (!navigator.permissions) {
            return 'unknown'
        }

        try {
            const permission = await navigator.permissions.query({ name: 'camera' })
            return permission.state
        } catch (error) {
            return 'unknown'
        }
    }

    /**
     * 格式化监考统计数据
     */
    static formatStats(stats) {
        const totalCount = stats.totalCount || 0
        const abnormalCount = stats.abnormalCount || 0
        const normalCount = totalCount - abnormalCount

        return {
            totalCount,
            abnormalCount,
            normalCount,
            normalRate: totalCount > 0 ? Math.round((normalCount / totalCount) * 100) : 100,
            abnormalRate: totalCount > 0 ? Math.round((abnormalCount / totalCount) * 100) : 0,
            riskLevel: this.calculateRiskLevel(abnormalCount, totalCount)
        }
    }

    /**
     * 计算风险等级
     */
    static calculateRiskLevel(abnormalCount, totalCount) {
        if (totalCount === 0) return 'LOW'

        const rate = abnormalCount / totalCount

        if (rate >= 0.3) return 'HIGH'
        if (rate >= 0.1) return 'MEDIUM'
        return 'LOW'
    }

    /**
     * 获取风险等级样式类
     */
    static getRiskLevelClass(level) {
        const classMap = {
            LOW: 'risk-low',
            MEDIUM: 'risk-medium',
            HIGH: 'risk-high'
        }
        return classMap[level] || 'risk-unknown'
    }

    /**
     * 创建监考警告
     */
    static createAlert(message, type = 'info') {
        return {
            id: Date.now() + Math.random(),
            message,
            type,
            timestamp: new Date(),
            read: false
        }
    }

    /**
     * 格式化时间
     */
    static formatTime(date) {
        if (!date) return ''

        const now = new Date()
        const target = new Date(date)
        const diff = now - target

        if (diff < 60000) { // 1分钟内
            return '刚刚'
        } else if (diff < 3600000) { // 1小时内
            return Math.floor(diff / 60000) + '分钟前'
        } else if (diff < 86400000) { // 1天内
            return Math.floor(diff / 3600000) + '小时前'
        } else {
            return target.toLocaleString()
        }
    }

    /**
     * 监考数据本地存储
     */
    static saveToLocal(key, data) {
        try {
            localStorage.setItem(`monitor_${key}`, JSON.stringify(data))
        } catch (error) {
            console.warn('监考数据本地存储失败:', error)
        }
    }

    /**
     * 从本地存储获取监考数据
     */
    static getFromLocal(key) {
        try {
            const data = localStorage.getItem(`monitor_${key}`)
            return data ? JSON.parse(data) : null
        } catch (error) {
            console.warn('监考数据本地读取失败:', error)
            return null
        }
    }

    /**
     * 清理本地监考数据
     */
    static clearLocal(examId) {
        try {
            const keys = Object.keys(localStorage).filter(key =>
                key.startsWith('monitor_') && key.includes(examId)
            )
            keys.forEach(key => localStorage.removeItem(key))
        } catch (error) {
            console.warn('清理监考数据失败:', error)
        }
    }
}