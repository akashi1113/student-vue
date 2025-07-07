import request from '@/utils/request'

// 添加实验创建和更新的API方法
export const createExperiment = (data) => {
  return request({
    url: '/api/teacher/experiment',
    method: 'post',
    data
  })
}

// 实验基础操作
export const getTeacherExperiments = (params) => {
  return request({
    url: '/api/teacher/experiment/page',
    method: 'get',
    params
  })
}

// 创建实验模板
export function createExperimentTemplate(data) {
  return request({
    url: '/api/teacher/experiment/template',
    method: 'post',
    data
  })
}

// 更新实验模板
export function updateExperimentTemplate(id, data) {
  return request({
    url: `/teacher/experiment/${id}`,
    method: 'put',
    data
  })
}

// 获取实验模板
export function getExperimentTemplate(experimentId) {
  return request({
    url: `/api/teacher/experiment/template/${experimentId}`,
    method: 'get'
  })
}

export const updateExperiment = (data, id) => {
  return request({
    url: `/api/teacher/experiment/${id}`,
    method: 'PUT',
    data // 包含teacherId的数据
  })
}

// 添加实验时间段
export function addTimeSlot(data) {
  return request({
    url: '/api/teacher/experiment/time-slot',
    method: 'post',
    data
  })
}

// 更新实验时间段
export function updateTimeSlot(id, data) {
  return request({
    url: `/api/teacher/experiment/time-slot/${id}`,
    method: 'put',
    data
  })
}

// 删除实验时间段
export function deleteTimeSlot(id) {
  return request({
    url: `/teacher/experiment/time-slot/${id}`,
    method: 'delete'
  })
}

// 获取实验的时间段列表
export function getTimeSlots(experimentId) {
  return request({
    url: `/api/teacher/experiment/time-slots/${experimentId}`,
    method: 'get'
  })
}

// 审批预约申请
export function approveBooking(approvalData) {
  return request({
    url: '/api/teacher/experiment/approve-booking',
    method: 'post',
    data: approvalData,  // 使用 data 而不是 params
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

// 获取待审批预约列表
export function getPendingBookings({page, size}) {
  return request({
    url: '/api/teacher/experiment/pending-bookings',
    method: 'get',
    params: {
      pageNum: page,  // 如果后端使用pageNum
      pageSize: size // 如果后端使用pageSize
    }
  })
}