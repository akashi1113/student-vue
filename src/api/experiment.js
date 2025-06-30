import request from '@/utils/request'
import axios from 'axios'
import dayjs from 'dayjs';

const API_URL = 'http://localhost:8082/api/experiment'

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

//   getBooking(bookingId) {
//     return axios.get(`${API_URL}/bookings/${bookingId}`)
//   },
  
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
      method: 'get'
    })
  },
  
  // 获取实验记录
  getRecord(recordId) {
    return request({
      url: `/api/experiment/records/${recordId}`,
      method: 'get'
    })
  },

  getAllExperiments() {
    return axios.get(API_URL)
  }
}