import request from '@/utils/request';

export const codeExecutionApi = {
    // 执行代码
    executeCode(data) {
        return request({
            url: '/api/code/execute',
            method: 'post',
            data
        });
    },

    // 测试基本功能
    testBasic() {
        return request({
            url: '/api/code/test',
            method: 'post'
        });
    },
};

export default codeExecutionApi;