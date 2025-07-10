export const monitorConfig = {
    // 监考功能开关
    enabled: true,

    // 摄像头配置
    camera: {
        width: 640,
        height: 480,
        facingMode: 'user',
        frameRate: 30
    },

    // 截图配置
    capture: {
        interval: 5000, // 5秒截图一次
        quality: 0.8,   // 图片质量
        format: 'image/jpeg'
    },

    // 违规检测配置
    violation: {
        maxRetries: 3,
        debounceTime: 1000,
        autoSubmitThreshold: 3
    },

    // 监考警告配置
    alerts: {
        maxAlerts: 10,
        autoCloseTime: 5000,
        showSystemNotification: true
    },

    // 监考统计配置
    stats: {
        refreshInterval: 10000, // 10秒刷新一次统计
        abnormalRateThreshold: 0.3 // 异常率阈值
    }
}