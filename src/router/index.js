import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'

// 来自index.js的组件
import KnowledgeList from '../views/KnowledgeList.vue'
import KnowledgeDetail from '../views/KnowledgeDetail.vue'
import ScoreManage from '../views/score_manage/ScoreManage.vue'
import LearningEvaluation from '../views/learning_evaluation/LearningEvaluation.vue'

// 来自index.ts的组件
import Dashboard from '@/views/Dashboard.vue'
import NoteView from '@/views/NoteView.vue'
import ExperimentListView from '@/views/ExperimentListView.vue'
import ExperimentSimulationView from '@/views/ExperimentSimulationView.vue'
import ReportView from '@/views/ReportView.vue'
import ReportGenerator from '@/views/ReportGenerator.vue'

// 动态导入组件
const Login = () => import('../views/UserLogin.vue')
const Register = () => import('../views/UserRegister.vue')
const ExperimentDetailView = () => import('@/views/ExperimentDetailView.vue')
const ExperimentBookingView = () => import('@/views/ExperimentBookingView.vue')

// 来自index.js的认证检查
function isAuthenticated() {
  const userInfo = localStorage.getItem('userInfo')
  return !!userInfo
}

const routes = [
  // 来自index.js的路由
  {
    path: '/login',
    name: 'UserLogin',
    component: Login,
    meta: {
      title: '登录',
      requiresAuth: false
    }
  },
  {
    path: '/register',
    name: 'UserRegister',
    component: Register,
    meta: {
      title: '注册',
      requiresAuth: false
    }
  },
  {
    path: '/',
    name: 'KnowledgeList',
    component: KnowledgeList,
    meta: {
      title: '知识库',
      requiresAuth: true
    }
  },
  {
    path: '/knowledge/:id',
    name: 'KnowledgeDetail',
    component: KnowledgeDetail,
    meta: {
      title: '知识详情',
      requiresAuth: true
    }
  },
  {
    path: '/score-manage',
    name: 'ScoreManage',
    component: ScoreManage,
    meta: {
      title: '成绩管理',
      requiresAuth: true
    }
  },
  {
    path: '/learning-evaluation',
    name: 'LearningEvaluation',
    component: LearningEvaluation,
    meta: {
      title: '学习评估',
      requiresAuth: true
    }
  },
  // 考试系统路由
  {
    path: '/exams',
    name: 'ExamList',
    component: () => import('@/views/exam/ExamList.vue'),
    meta: {
      title: '考试列表',
      requiresAuth: true
    }
  },
  {
    path: '/exams/:examId',
    name: 'ExamDetail',
    component: () => import('@/views/exam/ExamDetail.vue'),
    props: true,
    meta: {
      title: '考试详情',
      requiresAuth: true
    }
  },
  {
    path: '/exams/:examId/take',
    name: 'ExamTaking',
    component: () => import('@/views/exam/ExamTaking.vue'),
    props: true,
    meta: {
      title: '参加考试',
      requiresAuth: true
    }
  },
  {
    path: '/exams/:examId/result',
    name: 'ExamResult',
    component: () => import('@/views/exam/ExamResult.vue'),
    props: true,
    meta: {
      title: '考试结果',
      requiresAuth: true
    }
  },

  // 作业系统路由
  {
    path: '/homework',
    name: 'HomeworkList',
    component: () => import('@/views/homework/HomeworkList.vue'),
    meta: {
      title: '作业列表',
      requiresAuth: true
    }
  },
  {
    path: '/homework/create',
    name: 'HomeworkCreate',
    component: () => import('@/views/homework/HomeworkCreate.vue'),
    meta: {
      title: '创建作业',
      requiresAuth: true
    }
  },
  {
    path: '/homework/:homeworkId',
    name: 'HomeworkDetail',
    component: () => import('@/views/homework/HomeworkDetail.vue'),
    props: true,
    meta: {
      title: '作业详情',
      requiresAuth: true
    }
  },
  {
    path: '/homework/:homeworkId/submit',
    name: 'HomeworkSubmit',
    component: () => import('@/views/homework/HomeworkSubmit.vue'),
    props: true,
    meta: {
      title: '提交作业',
      requiresAuth: true
    }
  },
  {
    path: '/homework/:homeworkId/submissions',
    name: 'HomeworkSubmissions',
    component: () => import('@/views/homework/HomeworkSubmissions.vue'),
    props: true,
    meta: {
      title: '作业提交情况',
      requiresAuth: true
    }
  },
  {
    path: '/homework/submission/:submissionId/grade',
    name: 'HomeworkGrade',
    component: () => import('@/views/homework/HomeworkGrade.vue'),
    props: true,
    meta: {
      title: '作业评分',
      requiresAuth: true
    }
  },
  {
    path: '/homework/my-submissions',
    name: 'MySubmissions',
    component: () => import('@/views/homework/MySubmissions.vue'),
    meta: {
      title: '我的提交',
      requiresAuth: true
    }
  },
  {
    path: '/homework/:homeworkId/submission/student/:userId',
    name: 'StudentSubmissionDetail',
    component: () => import('@/views/homework/StudentSubmissionDetail.vue'),
    props: true,
    meta: {
      title: '学生提交详情',
      requiresAuth: true
    }
  },
  {
    path: '/courses',
    name: 'CourseList',
    component: () => import('@/views/course/CourseList.vue'),
    meta: {
      title: '课程列表',
      requiresAuth: true
    }
  },
  {
    path: '/courses/:courseId/homework',
    name: 'CourseHomework',
    component: () => import('@/views/homework/CourseHomework.vue'),
    props: true,
    meta: {
      title: '课程作业',
      requiresAuth: true
    }
  },

  {
    path: '/notes',
    name: 'Notes',
    component: NoteView,
    meta: { title: '学习笔记' }
  },
 
  {
    path: '/experimentList',
    name: 'ExperimentList',
    component: ExperimentListView,
    props: true,
    meta: { title: '实验项目库' }
  },
  {
    path: '/experiment/simulation',
    name: 'ExperimentSimulation',
    component: ExperimentSimulationView,
    props: true,
    meta: { title: '实验操作' }
  },
  {
    path: '/experiment/:id',
    name: 'ExperimentDetail',
    component: ExperimentDetailView,
    props: true,
    meta: { title: '实验详情' }
  },
  {
    path: '/booking/:id',
    name: 'ExperimentBooking',
    component: ExperimentBookingView,
    props: true
  },
  {
    path: '/report',
    name: 'Report',
    component: ReportView,
    props: true,
    meta: { title: '实验报告' }
  },
  {
    path: '/reports/generate/:recordId',
    name: 'ReportGenerator',
    component: ReportGenerator,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 合并路由守卫逻辑
router.beforeEach((to, from, next) => {
  // 来自index.js的标题设置
  if (to.meta.title) {
    document.title = `${to.meta.title} - 智能化在线教学支持服务平台`
  }
  
  // 来自index.js的认证检查
  if (to.meta.requiresAuth) {
    if (isAuthenticated()) {
      next()
    } else {
      ElMessage.warning('请先登录')
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }
  } else {
    // 来自index.js的重定向逻辑
    if ((to.path === '/login' || to.path === '/register') && isAuthenticated()) {
      next('/')
    } else {
      next()
    }
  }
})

export default router