import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import { tomatoStore } from '@/store/tomatoStore'

// 组件导入
import KnowledgeList from '../views/KnowledgeList.vue'
import KnowledgeDetail from '../views/KnowledgeDetail.vue'
import ScoreManage from '../views/score_manage/ScoreManage.vue'
import LearningEvaluation from '../views/learning_evaluation/LearningEvaluation.vue'

// 来自index.ts的组件
import NoteView from '@/views/NoteView.vue'
import ExperimentListView from '@/views/experiment/ExperimentListView.vue'
import ExperimentConducting from '@/views/experiment/ExperimentConducting.vue'
import ReportView from '@/views/experiment/ReportView.vue'
// import ReportGenerator from '@/views/experiment/'

import Home from '../views/Home.vue'
import StudentHomework from '@/views/homework/student/StudentHomework.vue'
import TeacherHomework from '@/views/homework/teacher/TeacherHomework.vue'
import ChatInterface from '@/views/ChatInterface.vue';


// 动态导入组件
const Login = () => import('../views/UserLogin.vue')
const Register = () => import('../views/UserRegister.vue')
const ExperimentDetailView = () => import('@/views/experiment/ExperimentDetailView.vue')
const ExperimentBookingView = () => import('@/views/experiment/ExperimentBookingView.vue')

// 新增组件导入
const HomePage = () => import('../views/courseAndVideo/HomePage.vue')
const CourseDetail = () => import('../views/courseAndVideo/CourseDetail.vue')
const VideoDetail = () => import('../views/courseAndVideo/VideoDetail.vue')
const AdminPanel = () => import('../views/manager/AdminPanel.vue')
const ForumPage = () => import('../views/post/ForumPage.vue')
const PostDetail = () => import('../views/post/PostDetail.vue')
const HotPostsPage = () => import('@/views/post/HotPostsPage.vue')

// 认证检查函数
function isAuthenticated() {
  const userInfo = localStorage.getItem('userInfo')
  return !!userInfo
}

// 获取用户角色
function getUserRole() {
  const role = localStorage.getItem('role')
  if (role) {
    try {
      return role || '学生'
    } catch (e) {
      return '学生'
    }
  }
  return null
}

// 检查用户权限
function hasPermission(requiredRoles, userRole) {
  if (!requiredRoles || requiredRoles.length === 0) {
    return true
  }
  return requiredRoles.includes(userRole)
}

const routes = [
  // ================= 原有路由 =================
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      requiresAuth: true,
      title: '首页'
    }
  },
  // 添加智能聊天路由
  {
    path: '/ai-chat',
    name: 'AIChat',
    component: ChatInterface,
    meta: {
      title: '智学助手',
      requiresAuth: true,
      roles: ['学生', '教师', '管理员'] // 根据需求设置权限
    }
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
  {
    path: '/teacher/exams',
    name: 'TeacherExamManagement',
    component: () => import('@/views/exam/teacher/ExamManagement.vue'),
    meta: {
      title: '考试管理',
      requiresAuth: true,
      roles: ['教师', '管理员']
    }
  },
  // 考试预约系统路由
  {
    path: '/exam-booking/my-bookings',
    name: 'MyBookings',
    component: () => import('@/views/exam/student/MyBookings.vue'),
    meta: {
      title: '我的预约',
      requiresAuth: true,
      roles: ['学生']
    }
  },
  {
    path: '/exam-booking/notifications',
    name: 'ExamNotifications',
    component: () => import('@/views/exam/student/Notifications.vue'),
    meta: {
      title: '考试通知',
      requiresAuth: true,
      roles: ['学生']
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
      roles: ['学生']
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
      roles: ['教师', '管理员']
    }
  },
  {
    path: '/exam-booking/booking-management',
    name: 'BookingManagement',
    component: () => import('@/views/exam/teacher/BookingManagement.vue'),
    meta: {
      title: '预约管理',
      requiresAuth: true,
      roles: ['教师', '管理员']
    }
  },
  {
    path: '/teacher/exams/create',
    name: 'ExamCreate',
    component: () => import('@/views/exam/teacher/ExamCreate.vue'),
    meta: {
      title: '创建考试',
      requiresAuth: true,
      roles: ['教师', '管理员']
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
  //     roles: ['教师', '管理员']
  //   }
  // },

  // ============================== 原有路由继续 ==============================

  // 学生作业页面
  {
    path: '/student/homework',
    name: 'StudentHomework',
    component: StudentHomework,
    meta: {
      requiresAuth: true,
      roles: ['学生']
    }
  },

  // 教师作业页面
  {
    path: '/teacher/homework',
    name: 'TeacherHomework',
    component: TeacherHomework,
    meta: {
      requiresAuth: true,
      roles: ['教师']
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
    path: '/homework/:homeworkId/submission',
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
    meta: {
      title: '实验操作',
      requiresAuth: true
    }
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
    component: () => import('@/views/experiment/ExperimentBookingView.vue'),
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
    path: '/experiment/conducting/:experimentId',
    name: 'ExperimentConducting',
    component: ExperimentConducting,
    props: true,
    meta: { title: '实验操作' }
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
  // 教师端路由
  {
    path: '/teacher/experimentList',
    name: 'TeacherExperimentList',
    component: () => import('@/views/experiment/Teacher_ExperimentList.vue'),
    meta: {
      title: '实验管理',
      requiresAuth: true,
      roles: ['教师', '管理员']
    }
  },
  {
    path: '/teacher/experiment/:id/template',
    name: 'ExperimentTemplate',
    component: () => import('@/views/experiment/ExperimentTemplate.vue'),
    meta: {
      title: '实验模板管理',
      requiresAuth: true,
      roles: ['教师', '管理员']
    }
  },
  {
    path: '/time-slot/:id',
    name: 'TimeSlotManagement-experiment',
    component: () => import('@/views/experiment/TimeSlotManagement.vue'),
    props: true,
    meta: {
      requiresAuth: true,
      roles: ['教师', '管理员']
    }
  },
  {
    path: '/teacher/experiment/approvals',
    name: 'BookingApproval',
    component: () => import('@/views/experiment/BookingApproval.vue'),
    meta: {
      title: '预约审批',
      requiresAuth: true,
      roles: ['教师', '管理员']
    }
  },
  {
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
  },
  {
    path: '/experiment/:experimentId/reports',
    name: 'ExperimentReports',
    component: () => import('@/views/experiment/ReportView.vue'),
    meta: {
      title: '实验报告',
      roles: ['教师'],
      requiresAuth: true
    },
    props: true
  },

  // ================= 新增路由 =================
  {
    path: '/course-home', // 课程首页（学生可见）
    name: 'CourseHome',
    component: HomePage,
    meta: {
      title: '课程首页',
      requiresAuth: true,
      roles: ['学生'] // 仅学生可见
    }
  },
  {
    path: '/forum', // 社区论坛（所有人可见）
    name: 'Forum',
    component: ForumPage,
    meta: {
      title: '社区论坛',
      requiresAuth: true // 登录后可见
    }
  },
  {
    path: '/post/:id', // 帖子详情
    name: 'PostDetail',
    component: PostDetail,
    props: true,
    meta: {
      title: '帖子详情',
      requiresAuth: true
    }
  },
  {
    path: '/course/:id', // 课程详情
    name: 'CourseDetail',
    component: CourseDetail,
    props: true,
    meta: {
      title: '课程详情',
      requiresAuth: true
    }
  },
  {
    path: '/video/:id', // 视频详情
    name: 'VideoDetail',
    component: VideoDetail,
    props: true,
    meta: {
      title: '视频详情',
      requiresAuth: true
    }
  },
  {
    path: '/admin', // 管理后台（仅管理员可见）
    name: 'AdminPanel',
    component: AdminPanel,
    meta: {
      title: '管理后台',
      requiresAuth: true
    }
  },
  {
    path: '/hot-posts', // 热门帖子
    name: 'HotPosts',
    component: HotPostsPage,
    meta: {
      title: '热门帖子',
      requiresAuth: true
    }
  }

]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 修改后的路由守卫（移除了管理员特殊检查）
router.beforeEach((to, from, next) => {
  // 1. 设置标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 智能化在线教学支持服务平台`
  }

  // 2. 番茄钟检查（论坛相关页面）
  if (['Forum', 'PostDetail', 'HotPosts'].includes(to.name) && tomatoStore.value.isRunning) {
    ElMessage.warning('番茄钟专注期间，社区论坛已禁止访问')
    next(false)
    return
  }

  // 3. 检查登录状态和角色权限
  if (to.meta.requiresAuth) {
    if (isAuthenticated()) {
      // 检查角色权限（如果有设置roles）
      if (to.meta.roles) {
        const userRole = getUserRole()
        if (!hasPermission(to.meta.roles, userRole)) {
          ElMessage.error('您没有权限访问此页面')
          next('/')
          return
        }
      }
      next()
    } else {
      ElMessage.warning('请先登录')
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }
  } else {
    // 如果用户已登录，访问登录/注册页面则重定向到首页
    if ((to.path === '/login' || to.path === '/register') && isAuthenticated()) {
      next('/')
    } else {
      next()
    }
  }
})

export default router