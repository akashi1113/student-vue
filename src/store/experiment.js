import { defineStore } from 'pinia'
import experimentApi from '@/api/experiment'
import { ElMessage } from 'element-plus'

export const useExperimentStore = defineStore('experiment', {
  state: () => ({
    experiments: [],
    isLoading: false,
    error: null,
    currentBooking: null,
    currentBookingId: null
  }),

  actions: {
    async fetchExperiments() {
      const token=localStorage.getItem('token');
  this.isLoading = true
  this.error = null
  try {
    const response = await experimentApi.getExperiments()
    console.log(response)
    
    if (response.data && Array.isArray(response.data)) {
      this.experiments = response.data.map(exp => ({
        ...exp,
        status: parseInt(exp.status) || 0,
        approval_status: parseInt(exp.approval_status) || 0,
        isPublished: exp.isPublished !== undefined ? exp.isPublished : 1
      }))
    } else {
      throw new Error('API返回数据格式不正确')
    }
  } catch (error) {
    console.error('获取实验数据失败:', error)
    this.error = error
    ElMessage.error('获取实验数据失败')
    throw error
  } finally {
    this.isLoading = false
  }
},

async bookExperiment(bookingData) {
  this.isLoading = true;
  try {
    const response = await experimentApi.bookExperiment(bookingData);
    if (response.data) {
      // 更新本地实验状态和审批状态
      const index = this.experiments.findIndex(e => e.id === bookingData.experimentId);
      if (index !== -1) {
        this.experiments[index].status = 0;
        this.experiments[index].approval_status = 
          response.data.approval_status ?? 
          response.data.approvalStatus ?? 
          0;
        console.log('更新后的状态:', this.experiments[index]); // 调试

      }
      return response.data;
    }
    throw new Error('预约响应数据为空');
  } catch (error) {
    console.error('预约失败:', error);
    throw error;
  } finally {
    this.isLoading = false;
  }
},
    async getExperimentById(id) {
    this.isLoading = true
      try {
        const response = await experimentApi.getExperimentById(id)
        if (response.data) {
          return response.data
        }
        throw new Error('未找到实验详情')
      } catch (error) {
        console.error('获取实验详情失败:', error)
        ElMessage.error('获取实验详情失败')
        throw error
      } finally {
        this.isLoading = false
      }
    },

     setCurrentBookingId(id) {
      this.currentBookingId = id;
    },
    
    // 可选：添加获取当前预约ID的方法
    getCurrentBookingId() {
      return this.currentBookingId;
    },

     async updateExperimentStatus({ id, status }) {
  try {
    console.log('Store更新状态 - ID:', id, '类型:', typeof id);
    const response = await experimentApi.updateExperimentStatus({ 
      id: Number(id), // 强制转换为数字
      status: Number(status) 
    });
    // 更新本地状态
    const index = this.experiments.findIndex(e => e.id === id)
    if (index !== -1) {
      this.experiments[index].status = status
    }
    return response
  } catch (error) {
    console.error('更新实验状态失败:', error)
    ElMessage.error('更新实验状态失败')
    throw error
  }
}
  },

  


  

  getters: {
    getPublishedExperiments: (state) => {
      return state.experiments.filter(exp => exp.isPublished !== 0)
    }
  }
})

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: null
  }),
  actions: {
    setCurrentUser(user) {
      this.currentUser = user
    },
    clearCurrentUser() {
      this.currentUser = null
    }
  },
  persist: true // 如果需要持久化
})