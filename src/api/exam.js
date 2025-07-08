import axios from 'axios';

const API_URL = 'http://localhost:8080/api/exams';

const ExamService = {
    // ==================== 学生端接口 ====================
    /**
     * 获取所有可用的考试
     */
    async getAllExams() {
        const response = await axios.get(API_URL);
        return this._handleResponse(response);
    },

    /**
     * 获取考试列表
     */
    async getExamList() {
        const response = await axios.get(`${API_URL}/list`);
        return this._handleResponse(response);
    },

    // 获取可预约的考试
    async getBookableExams() {
        try {
            const response = await axios.get(`${API_URL}/bookable`);
            console.log('API raw response:', response);
            return this._handleResponse(response);
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },

    // 获取已预约的考试
    async getBookedExams(token) {
        try {
            const response = await axios.get(`${API_URL}/booked`, {
                headers: this._buildAuthHeader(token)
            });
            console.log('Booked exams API raw response:', response);
            return this._handleResponse(response);
        } catch (error) {
            console.error('Booked exams API request failed:', error);
            throw error;
        }
    },

    /**
     * 获取考试详情
     * @param {number} examId 考试ID
     */
    async getExamById(examId) {
        const response = await axios.get(`${API_URL}/${examId}`);
        return this._handleResponse(response);
    },

    /**
     * 开始考试
     * @param {number} examId 考试ID
     * @param {string} token JWT令牌
     */
    async startExam(examId, token) {
        const response = await axios.post(
            `${API_URL}/${examId}/start`,
            {},
            { headers: this._buildAuthHeader(token) }
        );
        return this._handleResponse(response);
    },

    /**
     * 提交考试答案
     * @param {number} examId 考试ID
     * @param {AnswerDTO[]} answers 答案列表
     * @param {string} token JWT令牌
     */
    async submitExam(examId, answers, token) {
        const response = await axios.post(
            `${API_URL}/${examId}/submit`,
            answers,
            { headers: this._buildAuthHeader(token) }
        );
        return this._handleResponse(response);
    },

    /**
     * 记录违规行为
     * @param {number} examId 考试ID
     * @param {string} type 违规类型
     * @param {string} token JWT令牌
     */
    async recordViolation(examId, type, token) {
        const response = await axios.post(
            `${API_URL}/${examId}/violation`,
            { type },
            { headers: this._buildAuthHeader(token) }
        );
        return this._handleResponse(response);
    },

    /**
     * 获取考试状态
     * @param {number} examId 考试ID
     * @param {string} token JWT令牌
     */
    async getExamStatus(examId, token) {
        const response = await axios.get(
            `${API_URL}/${examId}/status`,
            { headers: this._buildAuthHeader(token) }
        );
        return this._handleResponse(response);
    },

    /**
     * 处理考试超时
     * @param {number} examId 考试ID
     * @param {string} token JWT令牌
     */
    async handleTimeout(examId, token) {
        const response = await axios.post(
            `${API_URL}/${examId}/timeout`,
            {},
            { headers: this._buildAuthHeader(token) }
        );
        return this._handleResponse(response);
    },

    /**
     * 获取考试成绩
     * @param {number} examId 考试ID
     * @param {string} token JWT令牌
     */
    async getExamScore(examId, token) {
        const response = await axios.get(
            `${API_URL}/${examId}/score`,
            { headers: this._buildAuthHeader(token) }
        );
        return this._handleResponse(response);
    },

    // ==================== 教师端接口 ====================
    /**
     * 创建考试
     * @param {CreateExamRequest} examData 考试数据
     * @param {string} token JWT令牌
     */
    async createExam(examData, token) {
        const response = await axios.post(
            API_URL,
            examData,
            { headers: this._buildAuthHeader(token) }
        );
        return this._handleResponse(response);
    },

    /**
     * 获取教师创建的考试列表
     * @param {string} status 考试状态(ALL/DRAFT/PUBLISHED)
     * @param {string} token JWT令牌
     */
    async getCreatedExams(status = 'ALL', token) {
        const response = await axios.get(
            `${API_URL}/created`,
            {
                params: { status },
                headers: this._buildAuthHeader(token)
            }
        );
        return this._handleResponse(response);
    },

    /**
     * 发布考试
     * @param {number} examId 考试ID
     * @param {string} token JWT令牌
     */
    async publishExam(examId, token) {
        const response = await axios.post(
            `${API_URL}/${examId}/publish`,
            {},
            { headers: this._buildAuthHeader(token) }
        );
        return this._handleResponse(response);
    },

    /**
     * 添加考试题目
     * @param {number} examId 考试ID
     * @param {QuestionCreateDTO} questionData 题目数据
     * @param {string} token JWT令牌
     */
    async addQuestionToExam(examId, questionData, token) {
        const response = await axios.post(
            `${API_URL}/${examId}/questions`,
            questionData,
            { headers: this._buildAuthHeader(token) }
        );
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
        console.log('Handling response:', response);

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

export default ExamService;