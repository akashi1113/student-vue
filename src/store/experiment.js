import { defineStore } from 'pinia'
import experimentApi from '@/api/experiment'
import { ElMessage } from 'element-plus'

export const useExperimentStore = defineStore('experiment', {
  state: () => ({
    experiments: [],
    bookings: [],
    currentExperiment: null,
    currentBooking: null,
    currentBookingId: localStorage.getItem('currentBookingId') || null,
    isLoading: false,
    error: null
  }),
      
  actions: {
    async fetchExperiments(forceRefresh = false) {
      // 如果已经有数据且不需要强制刷新，则直接返回
      if (this.experiments.length > 0 && !forceRefresh) {
        return this.experiments
      }

      this.isLoading = true
      this.error = null
      try {
        const response = await experimentApi.getExperiments()
        // 确保正确处理API响应结构
        if (response.data && Array.isArray(response.data)) {
          this.experiments = response.data
        } else {
          console.error('API返回数据格式不正确:', response)
          this.experiments = []
          ElMessage.warning('获取实验数据格式错误')
        }
        return this.experiments
      } catch (error) {
        console.error('获取实验列表失败:', error)
        this.error = error
        ElMessage.error('加载实验数据失败')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    setCurrentBookingId(id) {
      this.currentBookingId = id
      localStorage.setItem('currentBookingId', id)
      sessionStorage.setItem('currentBookingId', id)
    },

    clearCurrentBookingId() {
      this.currentBookingId = null
      localStorage.removeItem('currentBookingId')
      sessionStorage.removeItem('currentBookingId')
    },
    
    // async getBooking(bookingId) {
    //   this.isLoading = true
    //   this.error = null
    //   try {
    //     const response = await experimentApi.getBooking(bookingId)
    //     this.currentBooking = response.data
    //     return this.currentBooking
    //   } catch (error) {
    //     console.error('获取预约记录失败:', error)
    //     this.error = error
    //     ElMessage.error('获取预约详情失败')
    //     throw error
    //   } finally {
    //     this.isLoading = false
    //   }
    // },
    
    async bookExperiment(bookingData) {
      this.isLoading = true
      this.error = null
      try {
        const response = await experimentApi.bookExperiment({
          experimentId: bookingData.experimentId,
          userId: bookingData.userId, // 确保从bookingData获取userId
          startTime: bookingData.startTime,
          endTime: bookingData.endTime
        })
        
        if (response.data) {
          this.bookings.unshift(response.data)
           this.setCurrentBookingId(response.data.id) // 存储bookingId
          ElMessage.success('实验预约成功')
          return response.data
        }
        throw new Error('预约响应数据为空')
      } catch (error) {
        console.error('预约实验失败:', error)
        this.error = error
        ElMessage.error(`预约失败: ${error.message}`)
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // async startExperiment(bookingId) {
    //   this.isLoading = true
    //   this.error = null
    //   try {
    //     const response = await experimentApi.startExperiment(bookingId)
    //     ElMessage.success('实验已开始')
    //     return response.data
    //   } catch (error) {
    //     console.error('开始实验失败:', error)
    //     this.error = error
    //     ElMessage.error('开始实验失败')
    //     throw error
    //   } finally {
    //     this.isLoading = false
    //   }
    // },
    
    async saveExperimentRecord(recordData) {
      this.isLoading = true
      this.error = null
      try {
        const response = await experimentApi.saveExperimentRecord(recordData)
        ElMessage.success('实验进度已保存')
        return response.data
      } catch (error) {
        console.error('保存实验记录失败:', error)
        this.error = error
        ElMessage.error('保存实验记录失败')
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    async endExperiment(recordId) {
      this.isLoading = true
      this.error = null
      try {
        const response = await experimentApi.endExperiment(recordId)
        ElMessage.success('实验已完成')
        return response.data
      } catch (error) {
        console.error('结束实验失败:', error)
        this.error = error
        ElMessage.error('结束实验失败')
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    async generateReport(reportData) {
      this.isLoading = true
      this.error = null
      try {
        const response = await experimentApi.generateReport(reportData)
        ElMessage.success('报告生成成功')
        return response.data
      } catch (error) {
        console.error('生成报告失败:', error)
        this.error = error
        ElMessage.error('生成报告失败')
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    async exportReport(reportId, format) {
      this.isLoading = true
      this.error = null
      try {
        const response = await experimentApi.exportReport(reportId, format)
        ElMessage.success('报告导出成功')
        return response.data
      } catch (error) {
        console.error('导出报告失败:', error)
        this.error = error
        ElMessage.error('导出报告失败')
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    async importExperimentData(recordId, file) {
      this.isLoading = true
      this.error = null
      try {
        const response = await experimentApi.importExperimentData(recordId, file)
        ElMessage.success('数据导入成功')
        return response.data
      } catch (error) {
        console.error('导入实验数据失败:', error)
        this.error = error
        ElMessage.error('导入数据失败')
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 新增方法：根据ID获取实验
     async getExperimentById(id) {
      // 检查本地缓存
      const existing = this.experiments.find(e => e.id == id) // 使用宽松相等
      if (existing) return existing
      
      try {
        const response = await experimentApi.getExperimentById(id)
        // 修正数据处理逻辑
        if (response.data && response.data.data) { // 处理ApiResponse结构
          const experiment = response.data.data
          // 确保状态值是数字
          experiment.status = parseInt(experiment.status) || 0
          this.experiments.push(experiment)
          return experiment
        }
        throw new Error('实验不存在')
      } catch (error) {
        console.error('获取实验详情失败:', error)
        throw error
      }
    },
  
  
  getters: {
    // 按学科分类获取实验
    getExperimentsBySubject: (state) => (subject) => {
      return state.experiments.filter(e => e.subject === subject)
    },
    
    // 获取可预约的实验
    getAvailableExperiments(state) {
      return state.experiments.filter(e => e.status === 1) // 假设状态1为可预约
    }
  }
}
})