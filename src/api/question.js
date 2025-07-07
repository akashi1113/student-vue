import axios from 'axios';

const API_URL = 'http://localhost:8080/api/questions';

const QuestionService = {
    // ==================== 公共接口 ====================
    /**
     * 根据考试ID获取题目列表（考试用）
     */
    async getQuestionsByExamId(examId) {
        const response = await axios.get(`${API_URL}/exam/${examId}`);
        return this._handleResponse(response);
    },

    /**
     * 获取考试总分
     */
    async getTotalScore(examId) {
        const response = await axios.get(`${API_URL}/exam/${examId}/total-score`);
        return this._handleResponse(response);
    },

    // ==================== 需要认证的接口 ====================
    /**
     * 根据考试ID获取题目列表（管理用，含答案）
     */
    async getQuestionsWithAnswersByExamId(examId, token) {
        const response = await axios.get(`${API_URL}/exam/${examId}/manage`, {
            headers: this._buildAuthHeader(token)
        });
        return this._handleResponse(response);
    },

    /**
     * 根据题目ID获取题目详情
     */
    async getQuestionById(id, token) {
        const response = await axios.get(`${API_URL}/${id}`, {
            headers: this._buildAuthHeader(token)
        });
        return this._handleResponse(response);
    },

    /**
     * 创建题目
     */
    async createQuestion(data, token) {
        const response = await axios.post(API_URL, data, {
            headers: this._buildAuthHeader(token)
        });
        return this._handleResponse(response);
    },

    /**
     * 批量创建题目
     */
    async createQuestions(data, token) {
        const response = await axios.post(`${API_URL}/batch`, data, {
            headers: this._buildAuthHeader(token)
        });
        return this._handleResponse(response);
    },

    /**
     * 更新题目
     */
    async updateQuestion(id, data, token) {
        const response = await axios.put(`${API_URL}/${id}`, data, {
            headers: this._buildAuthHeader(token)
        });
        return this._handleResponse(response);
    },

    /**
     * 删除题目
     */
    async deleteQuestion(id, token) {
        const response = await axios.delete(`${API_URL}/${id}`, {
            headers: this._buildAuthHeader(token)
        });
        return this._handleResponse(response);
    },

    /**
     * 批量删除题目
     */
    async deleteQuestions(ids, token) {
        const response = await axios.delete(`${API_URL}/batch`, {
            data: ids,
            headers: this._buildAuthHeader(token)
        });
        return this._handleResponse(response);
    },

    /**
     * 根据考试ID删除所有题目
     */
    async deleteQuestionsByExamId(examId, token) {
        const response = await axios.delete(`${API_URL}/exam/${examId}`, {
            headers: this._buildAuthHeader(token)
        });
        return this._handleResponse(response);
    },

    /**
     * 获取答题分析结果
     */
    async getQuestionAnalysis(examRecordId, token) {
        const response = await axios.get(`${API_URL}/analysis/${examRecordId}`, {
            headers: this._buildAuthHeader(token)
        });
        return this._handleResponse(response);
    },

    // ==================== 通用方法 ====================
    /**
     * 构建认证头
     * @private
     */
    _buildAuthHeader(token) {
        const cleanToken = token?.replace('Bearer ', '') || '';
        return { Authorization: cleanToken };
    },

    /**
     * 统一处理响应
     * @private
     */
    _handleResponse(response) {
        console.log('Question API Response:', response);

        // 检查响应是否存在
        if (!response) {
            throw new Error('响应为空');
        }

        // 检查响应数据
        if (!response.data) {
            throw new Error('响应数据为空');
        }

        // 如果是标准的 ApiResponse 格式
        if (response.data.success !== undefined) {
            if (response.data.success) {
                return response.data.data || [];
            } else {
                const errorMsg = response.data.message || '请求失败';
                throw new Error(errorMsg);
            }
        }

        // 如果直接是数据数组
        if (Array.isArray(response.data)) {
            return response.data;
        }

        // 其他情况返回响应数据
        return response.data;
    }
};

export default QuestionService;