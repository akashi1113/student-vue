// 更新 api/chat.js 文件，确保正确处理响应格式
import axios from 'axios';
import { ElMessage } from 'element-plus';

const API_URL = 'http://localhost:8080/api/chat';

// 构建认证头的辅助函数
const buildAuthHeader = (token) => {
    if (!token) return {};
    const cleanToken = token.replace('Bearer ', '');
    return { Authorization: cleanToken };
};

// 响应拦截器
axios.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            ElMessage.error('登录已过期，请重新登录');
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default {
    /**
     * 创建新会话 (需要token)
     */
    createSession(token) {
        return axios.post(`${API_URL}/session`, null, {
            headers: buildAuthHeader(token)
        }).catch(this.handleError);
    },

    /**
     * 发送消息 (需要token)
     */
    sendMessage(request,token) {
        return axios.post(`${API_URL}/send`, request,{
            headers: buildAuthHeader(token)
        }).catch(this.handleError);
    },

    /**
     * 获取聊天历史 (不需要token)
     */
    getChatHistory(sessionId) {
        return axios.get(`${API_URL}/history/${sessionId}`)
            .catch(this.handleError);
    },

    /**
     * 获取用户的所有会话 (需要token)
     */
    getUserSessions(token) {
        return axios.get(`${API_URL}/sessions`, {
            headers: buildAuthHeader(token)
        }).catch(this.handleError);
    },

    /**
     * 删除会话 (不需要token)
     */
    deleteSession(sessionId) {
        return axios.delete(`${API_URL}/session/${sessionId}`)
            .catch(this.handleError);
    },

    /**
     * 更新会话标题 (不需要token)
     */
    updateSessionTitle(sessionId, title) {
        return axios.put(`${API_URL}/session/${sessionId}/title?title=${encodeURIComponent(title)}`)
            .catch(this.handleError);
    },

    /**
     * 健康检查 (不需要token)
     */
    healthCheck() {
        return axios.get(`${API_URL}/health`)
            .catch(this.handleError);
    },

    /**
     * 统一错误处理
     */
    handleError(error) {
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    ElMessage.error('未授权，请登录');
                    break;
                case 403:
                    ElMessage.error('拒绝访问');
                    break;
                case 404:
                    ElMessage.error('请求地址出错');
                    break;
                case 500:
                    ElMessage.error('服务器内部错误');
                    break;
                default:
                    ElMessage.error(error.response.data?.message || error.message);
            }
        } else {
            ElMessage.error('网络错误，请检查网络连接');
        }
        return Promise.reject(error);
    }
};