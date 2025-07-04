import request from '@/utils/request';

export default {
    executeCode(data) {
        return request({
            url: '/api/code/execute',
            method: 'post',
            data: {
                code: data.code,
                language: data.language,
                className: data.className || 'Solution',
                input: data.input || '',
                expectedOutput: data.expectedOutput || ''
            }
        });
    },

    testJava() {
        return request({
            url: '/api/code/test/java',
            method: 'post'
        });
    },

    testCpp() {
        return request({
            url: '/api/code/test/cpp',
            method: 'post'
        });
    },

    testPython() {
        return request({
            url: '/api/code/test/python',
            method: 'post'
        });
    },

    testInput(language) {
        return request({
            url: '/api/code/test/input',
            method: 'post',
            params: { language }
        });
    }
};
