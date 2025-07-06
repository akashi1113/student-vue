import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'

// 来自index.js的组件
import KnowledgeList from '../views/KnowledgeList.vue'
import KnowledgeDetail from '../views/KnowledgeDetail.vue'
import ScoreManage from '../views/score_manage/ScoreManage.vue'
import LearningEvaluation from '../views/learning_evaluation/LearningEvaluation.vue'

// 来自index.ts的组件
import NoteView from '@/views/NoteView.vue'
import ExperimentListView from '@/views/experiment/ExperimentListView.vue'
import ExperimentConducting from '@/views/experiment/ExperimentConducting.vue'
import ReportView from '@/views/experiment/ReportView.vue'

// 动态导入组件
const Login = () => import('../views/UserLogin.vue')
const Register = () => import('../views/UserRegister.vue')
const ExperimentDetailView = () => import('@/views/experiment/ExperimentDetailView.vue')
const ExperimentBookingView = () => import('@/views/experiment/ExperimentBookingView.vue')

// 来自index.js的认证检查
function isAuthenticated() {
  const userInfo = localStorage.getItem('userInfo')
  return !!userInfo
}

const routes = [
  {
    path: '/',
    // redirect: '/exams'
    // redirect: '/teacher/exams/create'
    // redirect: '/exam-booking/time-slot-management'
    // redirect: '/exam-booking/booking-management'
    // redirect: '/experimentList'
    // redirect: '/homework'
  },
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
    path: '/knowledge',
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
    component: () => import('@/views/exam/student/ExamList.vue'),
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
    component: () => import('@/views/exam/student/ExamTaking.vue'),
    props: true,
    meta: {
      title: '参加考试',
      requiresAuth: true
    }
  },
  {
    path: '/exams/:examId/result',
    name: 'ExamResult',
    component: () => import('@/views/exam/student/ExamResult.vue'),
    props: true,
    meta: {
      title: '考试结果',
      requiresAuth: true
    }
  },

  // ============================== 考试预约系统路由 ==============================

  {
    path: '/exam-booking/my-bookings',
    name: 'MyBookings',
    component: () => import('@/views/exam/student/MyBookings.vue'),
    meta: {
      title: '我的预约',
      requiresAuth: true,
      roles: ['STUDENT']
    }
  },
  {
    path: '/exam-booking/notifications',
    name: 'ExamNotifications',
    component: () => import('@/views/exam/student/Notifications.vue'),
    meta: {
      title: '考试通知',
      requiresAuth: true,
      roles: ['STUDENT']
    }
  },
  {
    path: '/exam-booking/details/:bookingId',
    name: 'BookingDetails',
    component: () => import('@/views/exam/BookingDetails.vue'),
    props: true,
    meta: {
      title: '预约详情',
      requiresAuth: true,
      roles: ['STUDENT']
    }
  },

  // 教师/管理员端考试预约管理路由
  {
    path: '/exam-booking/time-slot-management',
    name: 'TimeSlotManagement',
    component: () => import('@/views/exam/teacher/TimeSlotManagement.vue'),
    meta: {
      title: '时间段管理',
      requiresAuth: true,
      roles: ['TEACHER', 'ADMIN']
    }
  },
  {
    path: '/exam-booking/booking-management',
    name: 'BookingManagement',
    component: () => import('@/views/exam/teacher/BookingManagement.vue'),
    meta: {
      title: '预约管理',
      requiresAuth: true,
      roles: ['TEACHER', 'ADMIN']
    }
  },

  // 在现有路由中添加教师考试管理路由
  // {
  //   path: '/teacher/exams',
  //   name: 'TeacherExamManagement',
  //   component: () => import('@/views/exam/teacher/ExamManagement.vue'),
  //   meta: {
  //     title: '考试管理',
  //     requiresAuth: true,
  //     roles: ['TEACHER', 'ADMIN']
  //   }
  // },
  {
    path: '/teacher/exams/create',
    name: 'ExamCreate',
    component: () => import('@/views/exam/teacher/ExamCreate.vue'),
    meta: {
      title: '创建考试',
      requiresAuth: true,
      roles: ['TEACHER', 'ADMIN']
    }
  },
  // {
  //   path: '/teacher/exams/:examId/edit',
  //   name: 'ExamEdit',
  //   component: () => import('@/views/exam/teacher/ExamEdit.vue'),
  //   props: true,
  //   meta: {
  //     title: '编辑考试',
  //     requiresAuth: true,
  //     roles: ['TEACHER', 'ADMIN']
  //   }
  // },

  // ============================== 原有路由继续 ==============================

  // 作业系统路由
  {
    path: '/homework',
    name: 'HomeworkList',
    component: () => import('@/views/homework/student/HomeworkList.vue'),
    meta: {
      title: '作业列表',
      requiresAuth: true
    }
  },
  {
    path: '/homework/create',
    name: 'HomeworkCreate',
    component: () => import('@/views/homework/teacher/HomeworkCreate.vue'),
    meta: {
      title: '创建作业',
      requiresAuth: true
    }
  },
  {
    path: '/homework/:homeworkId',
    name: 'HomeworkDetail',
    component: () => import('@/views/homework/student/HomeworkDetail.vue'),
    props: true,
    meta: {
      title: '作业详情',
      requiresAuth: true
    }
  },
  {
    path: '/homework/:homeworkId/submit',
    name: 'HomeworkSubmit',
    component: () => import('@/views/homework/student/HomeworkSubmit.vue'),
    props: true,
    meta: {
      title: '提交作业',
      requiresAuth: true
    }
  },
  {
    path: '/homework/:homeworkId/submissions',
    name: 'HomeworkSubmissions',
    component: () => import('@/views/homework/teacher/HomeworkSubmissions.vue'),
    props: true,
    meta: {
      title: '作业提交情况',
      requiresAuth: true
    }
  },
  {
    path: '/homework/submission/:submissionId/grade',
    name: 'HomeworkGrade',
    component: () => import('@/views/homework/teacher/HomeworkGrade.vue'),
    props: true,
    meta: {
      title: '作业评分',
      requiresAuth: true
    }
  },
  {
    path: '/homework/my-submissions',
    name: 'MySubmissions',
    component: () => import('@/views/homework/student/MySubmissions.vue'),
    meta: {
      title: '我的提交',
      requiresAuth: true
    }
  },
  {
    path: '/homework/:homeworkId/submission/student/:userId',
    name: 'StudentSubmissionDetail',
    component: () => import('@/views/homework/student/StudentSubmissionDetail.vue'),
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
    component: () => import('@/views/homework/teacher/CourseHomework.vue'),
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
    meta: {
      title: '学习笔记',
      requiresAuth: true
    }
  },

  {
    path: '/experimentList',
    name: 'ExperimentList',
    component: ExperimentListView,
    props: true,
    meta: {
      title: '实验项目库',
      requiresAuth: true
    }
  },
  {
    path: '/experiment/conducting/:experimentId',
    name: 'ExperimentConducting',
    component: ExperimentConducting,
    props: true,
    meta: { title: '实验操作' }
  },
  {
    path: '/experiment/:id',
    name: 'ExperimentDetail',
    component: ExperimentDetailView,
    props: true,
    meta: {
      title: '实验详情',
      requiresAuth: true
    }
  },
  {
    path: '/booking/:id',
    name: 'ExperimentBooking',
    component: ExperimentBookingView,
    props: true,
    meta: {
      title: '预约实验',
      requiresAuth: true
    }
  },
  {
    path: '/report',
    name: 'Report',
    component: ReportView,
    props: true,
    meta: {
      title: '实验报告',
      requiresAuth: true
    }
  },
  {
    path: '/audit/report',
    name: 'AuditReport',
    component: () => import('@/views/audit/AuditReport.vue'),
    meta: {
      title: '日志审计报表',
      requiresAuth: false
    }
  },
  {
<<<<<<< HEAD
    path: '/ai/recommendation-history',
    name: 'RecommendationHistory',
    component: () => import('@/views/ai/RecommendationHistory.vue'),
    meta: {
      title: 'AI推荐历史',
      requiresAuth: true
    }
  },
  {
    path: '/analytics',
    name: 'AnalyticsDashboard',
    component: () => import('@/views/analytics/AnalyticsDashboard.vue'),
    meta: {
      title: '教师分析中心',
      requiresAuth: true
    }
=======
    path: '/experiment/:experimentId/reports',
    name: 'ExperimentReports',
    component: () => import('@/views/experiment/ReportView.vue'),
    meta: { title: '实验报告', roles: ['teacher'] },
    props: true
>>>>>>> 005d2914a279dae0edda3bb9641268beb870e216
  }

]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 获取用户角色的辅助函数
function getUserRole() {
  const userInfo = localStorage.getItem('userInfo')
  if (userInfo) {
    try {
      const user = JSON.parse(userInfo)
      return user.role || user.userType || 'STUDENT' // 根据你的用户数据结构调整
    } catch (e) {
      return 'STUDENT'
    }
  }
  return null
}

// 检查用户权限的辅助函数
function hasPermission(requiredRoles, userRole) {
  if (!requiredRoles || requiredRoles.length === 0) {
    return true
  }
  return requiredRoles.includes(userRole)
}

// 合并路由守卫逻辑
// router.beforeEach((to, from, next) => {
//   // 来自index.js的标题设置
//   if (to.meta.title) {
//     document.title = `${to.meta.title} - 智能化在线教学支持服务平台`
//   }
//
//   // 来自index.js的认证检查
//   if (to.meta.requiresAuth) {
//     if (isAuthenticated()) {
//       // 检查角色权限
//       if (to.meta.roles) {
//         const userRole = getUserRole()
//         if (!hasPermission(to.meta.roles, userRole)) {
//           ElMessage.error('您没有权限访问此页面')
//           next('/')
//           return
//         }
//       }
//       next()
//     } else {
//       ElMessage.warning('请先登录')
//       next({
//         path: '/login',
//         query: { redirect: to.fullPath }
//       })
//     }
//   } else {
//     // 来自index.js的重定向逻辑
//     if ((to.path === '/login' || to.path === '/register') && isAuthenticated()) {
//       next('/')
//     } else {
//       next()
//     }
//   }
// })

export default router