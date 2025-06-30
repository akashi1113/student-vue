import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    // 首页重定向
    {
        path: '/',
        redirect: '/homework'
    },

    // 考试系统路由
    {
        path: '/exams',
        component: () => import('@/views/exam/ExamList.vue')
    },
    {
        path: '/exams/:examId',
        component: () => import('@/views/exam/ExamDetail.vue'),
        props: true
    },
    {
        path: '/exams/:examId/take',
        component: () => import('@/views/exam/ExamTaking.vue'),
        props: true
    },
    {
        path: '/exams/:examId/result',
        component: () => import('@/views/exam/ExamResult.vue'),
        props: true
    },

    // 作业系统路由
    {
        path: '/homework',
        component: () => import('@/views/homework/HomeworkList.vue')
    },
    {
        path: '/homework/create',
        component: () => import('@/views/homework/HomeworkCreate.vue')
    },
    {
        path: '/homework/:homeworkId',
        component: () => import('@/views/homework/HomeworkDetail.vue'),
        props: true
    },
    {
        path: '/homework/:homeworkId/submit',
        component: () => import('@/views/homework/HomeworkSubmit.vue'),
        props: true
    },
    {
        path: '/homework/:homeworkId/submissions',
        component: () => import('@/views/homework/HomeworkSubmissions.vue'),
        props: true
    },
    {
        path: '/homework/submission/:submissionId/grade',
        component: () => import('@/views/homework/HomeworkGrade.vue'),
        props: true
    },
    {
        path: '/homework/my-submissions',
        component: () => import('@/views/homework/MySubmissions.vue')
    },
    {
        path: '/homework/:homeworkId/submission/student/:userId',
        component: () => import('@/views/homework/StudentSubmissionDetail.vue'),
        props: true
    },
    {
        path: '/courses',
        component: () => import('@/views/course/CourseList.vue')
    },
    {
        path: '/courses/:courseId/homework',
        component: () => import('@/views/homework/CourseHomework.vue'),
        props: true
    }
]

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
})

export default router