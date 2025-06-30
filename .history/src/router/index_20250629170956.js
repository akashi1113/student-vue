// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'

// 现有组件
import KnowledgeList from '../views/KnowledgeList.vue'
import KnowledgeDetail from '../views/KnowledgeDetail.vue'
import ScoreManage from '../views/score_manage/ScoreManage.vue'
import LearningEvaluation from '../views/learning_evaluation/LearningEvaluation.vue'

// 新增的登录注册组件
const Login = () => import('../views/Login.vue')
const Register = () => import('../views/Register.vue')

// 检查用户是否已登录
function isAuthenticated() {
  const userInfo = localStorage.getItem('userInfo')
  return !!userInfo
}

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      title: '登录',
      requiresAuth: false
    }
  },
  {
    path: '/register',
    name: 'Register',
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
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 智能化在线教学支持服务平台`
  }
  
  // 检查是否需要登录
  if (to.meta.requiresAuth) {
    if (isAuthenticated()) {
      next()
    } else {
      ElMessage.warning('请先登录')
      next({
        path: '/login',
        query: { redirect: to.fullPath } // 保存用户想要访问的页面
      })
    }
  } else {
    // 如果已登录用户访问登录或注册页面，重定向到首页
    if ((to.path === '/login' || to.path === '/register') && isAuthenticated()) {
      next('/')
    } else {
      next()
    }
  }
})

export default router