import request from '@/utils/request'
import axios from 'axios'
import dayjs from 'dayjs';

const API_URL = 'http://localhost:8080/api/experiment'

export default {
  // 获取所有实验项目
  getExperiments() {
  return request({
    url: '/api/experiment/projects',
    method: 'get',
    transformResponse: [function (data) {
      const parsed = JSON.parse(data);
      // 确保返回的数据包含status和approval_status
      return parsed.data.map(item => ({
        ...item,
        status: item.status || 0,
        approval_status: item.approvalStatus || item.approval_status || 0 // 兼容不同命名
      }));
    }]
  })
},

  // 获取单个实验详情
getExperimentById(id) {
  return request({
    url: `/api/experiment/${id}`,
    method: 'get',
    transformResponse: [function (data) {
      const parsed = JSON.parse(data)
      return parsed.data // 确保返回的是 data 字段
    }]
  })
},

//   getBooking(bookingId) {
//     return axios.get(`${API_URL}/bookings/${bookingId}`)
//   },
  
  // 预约实验
  // 修改后的 bookExperiment 方法
bookExperiment(data) {
  return request({
    url: '/api/experiment/book-with-slot', // 修改为使用基于时间段的接口
    method: 'post',
    data: {
      experimentId: data.experimentId,
      userId: data.userId,
      timeSlotId: data.timeSlotId // 只传递这三个参数
    },
    headers: {
      'Content-Type': 'application/json'
    }
  });
},
  
  // 开始实验
  // startExperiment(bookingId) {
  //   return request({
  //     url: `/api/experiment/start/${bookingId}`,
  //     method: 'post'
  //   })
  // },
  
  // 保存实验记录
  saveExperimentRecord(data) {
    return request({
      url: '/api/experiment/save-record',
      method: 'post',
      data
    })
  },
  
  // 结束实验
  endExperiment(recordId) {
    return request({
      url: `/api/experiment/end/${recordId}`,
      method: 'post'
    })
  },
  
  // 生成报告
  generateReport(data) {
    return request({
      url: '/api/experiment/generate-report',
      method: 'post',
      data
    })
  },
  
  // 导出报告
  exportReport(reportId, format) {
    return request({
      url: '/api/experiment/export-report',
      method: 'post',
      params: {
        reportId,
        format
      }
    })
  },
  
  // 导入实验数据
  importExperimentData(recordId, file) {
    const formData = new FormData()
    formData.append('file', file)
    return request({
      url: `/api/experiment/import-data?recordId=${recordId}`,
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // 获取预约详情
getBooking(bookingId) {
  return request({
    url: `/api/experiment/bookings/${bookingId}`,
    method: 'get',
    transformResponse: [function (data) {
      try {
        const parsed = JSON.parse(data);
        console.log('预约详情响应:', parsed); // 调试日志
        if (parsed.data) {
          return {
            ...parsed.data,
            approval_status: parsed.data.approval_status ?? parsed.data.approvalStatus ?? 0 // 兼容两种命名
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
  
  // 获取实验记录
  getRecord(recordId) {
    return request({
      url: `/api/experiment/records/${recordId}`,
      method: 'get'
    })
  },

  // 获取已发布的实验列表
  getPublishedExperiments() {
    return request({
      url: '/api/experiment/published',
      method: 'get'
    })
  },

  getAvailableTimeSlots(experimentId) {
  return request({
    url: `/api/experiment/${experimentId}/time-slots`,
    method: 'get',
    transformResponse: [function (data) {
      try {
        const parsed = JSON.parse(data)
        // 确保返回的是数组
        return Array.isArray(parsed.data) ? parsed.data : []
      } catch (e) {
        console.error('解析响应数据失败:', e)
        return []
      }
    }]
  })
},

// 新增更新实验状态的方法
  updateExperimentStatus({ id, status }) {
  // 添加参数验证
  if (id === undefined || id === null) {
    return Promise.reject(new Error('实验ID不能为空'));
  }
  
  return request({
    url: `/api/experiment/${id}/status`,
    method: 'put',
    params: { status },
    headers: {
      'Content-Type': 'application/json'
    }
  });
},

  getAllExperiments() {
    return axios.get(API_URL)
  }
}