import request from '@/utils/request'
import axios from 'axios'
import dayjs from 'dayjs';

const API_URL = 'http://localhost:8080/api/experiment'

export default {
  // 获取所有实验项目
  getExperiments() {
    return request({
      url: '/api/experiment/projects',
      method: 'get'
    })
  },

  // 获取单个实验详情
getExperimentById(id) {
  return request({
    url: `/api/experiment/${id}`,
    method: 'get'
  })
},

  
  // 预约实验
  bookExperiment(data) {
  return request({
    url: '/api/experiment/book',
    method: 'post',
    data: {
      experimentId: data.experimentId,
      userId: data.userId,
      startTime: dayjs(data.startTime).format('YYYY-MM-DD HH:mm:ss'),
      endTime: dayjs(data.endTime).format('YYYY-MM-DD HH:mm:ss')
    },
    headers: {
      'Content-Type': 'application/json'  // 必须指定
    }
  });
},


  // 获取预约详情
  getBooking(bookingId) {
    return request({
      url: `/api/experiment/bookings/${bookingId}`,
      method: 'get'
    })
  },


  getAllExperiments() {
    return axios.get(API_URL)
  },

  // 开始实验
  startExperiment(experimentId) {
    return request({
      url: `/api/experiment/${experimentId}/start`,
      method: 'post'
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

  // 获取用户实验记录
  getUserExperimentRecords(params) {
    return request({
      url: '/api/experiment/user-records',
      method: 'get',
      params
    });
  }
}