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

  // 预约实验 - 基于时间段
  bookExperiment(data) {
    return request({
      url: '/api/experiment/book-with-slot',
      method: 'post',
      data: {
        experimentId: data.experimentId,
        userId: data.userId,
        timeSlotId: data.timeSlotId
      }
    });
  },

  // 预约实验 - 基于时间
  bookExperimentWithTime(data) {
    return request({
      url: '/api/experiment/book',
      method: 'post',
      data: {
        experimentId: data.experimentId,
        userId: data.userId,
        startTime: data.startTime,
        endTime: data.endTime
      },
    });
  },

  // 获取预约详情
  getBooking(bookingId) {
    return request({
      url: `/api/experiment/bookings/${bookingId}`,
      method: 'get',
      transformResponse: [function (data) {
        try {
          const parsed = JSON.parse(data);
          console.log('预约详情响应:', parsed);
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

  // 开始实验 - 需要token
  startExperiment(experimentId, token) {
    return request({
      url: `/api/experiment/${experimentId}/start`,
      method: 'post',
      headers: {
        'Authorization': token
      }
    });
  },

  // 获取实验详情
  getExperimentDetail(experimentRecordId) {
    return request({
      url: `/api/experiment/record/${experimentRecordId}/detail`,
      method: 'get'
    });
  },

  // 保存代码历史
  saveCodeHistory(data) {
    return request({
      url: '/api/experiment/code-history',
      method: 'post',
      data
    });
  },

  // 获取代码历史
  getCodeHistory(experimentRecordId) {
    return request({
      url: `/api/experiment/record/${experimentRecordId}/code-history`,
      method: 'get'
    });
  },

  // 更新步骤记录
  updateStepRecord(data) {
    return request({
      url: '/api/experiment/step-record',
      method: 'put',
      data
    });
  },

  // 完成实验
  completeExperiment(data) {
    return request({
      url: '/api/experiment/complete',
      method: 'post',
      data
    });
  },

  // 生成报告
  generateReport(experimentRecordId) {
    return request({
      url: `/api/experiment/record/${experimentRecordId}/report`,
      method: 'get'
    });
  },

  // 获取用户实验记录 - 需要token
  getUserExperimentRecords(token) {
    return request({
      url: '/api/experiment/user-records',
      method: 'get',
      headers: {
        'Authorization': token
      }
    });
  },

  // 获取实验记录详情
  getExperimentRecord(experimentRecordId) {
    return request({
      url: `/api/experiment/record/${experimentRecordId}`,
      method: 'get'
    });
  },

  // 获取学生最后一次提交的实验报告 - 需要token
  getStudentFinalReport(experimentId, token) {
    return request({
      url: `/api/experiment/reports/${experimentId}`,
      method: 'get',
      headers: {
        'Authorization': token
      }
    });
  },

  // 获取实验所有学生的报告列表
  getExperimentReports(experimentId) {
    return request({
      url: `/api/experiment/reports/${experimentId}/all`,
      method: 'get'
    });
  },

  // 获取已发布的实验列表
  getPublishedExperiments() {
    return request({
      url: '/api/experiment/published',
      method: 'get'
    })
  },

  // 获取可用时间段
  getAvailableTimeSlots(experimentId) {
    return request({
      url: `/api/experiment/${experimentId}/time-slots`,
      method: 'get',
      transformResponse: [function (data) {
        try {
          const parsed = JSON.parse(data)
          return Array.isArray(parsed.data) ? parsed.data : []
        } catch (e) {
          console.error('解析响应数据失败:', e)
          return []
        }
      }]
    })
  },

  // 更新实验状态
  updateExperimentStatus({ id, status }, token) {
    if (id === undefined || id === null) {
      return Promise.reject(new Error('实验ID不能为空'));
    }

    return request({
      url: `/api/experiment/${id}/status`,
      method: 'put',
      params: { status },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      }
    });
  },

  // 辅助方法：获取token
  getToken() {
    return localStorage.getItem('token');
  },

  // 辅助方法：检查认证
  checkAuth() {
    const token = this.getToken();
    if (!token) {
      throw new Error('未登录，请先登录');
    }
    return token;
  }
}