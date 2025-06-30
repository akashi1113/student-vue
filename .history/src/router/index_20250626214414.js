import { createRouter, createWebHistory } from 'vue-router'
import KnowledgeList from '../views/KnowledgeList.vue'
import KnowledgeDetail from '../views/KnowledgeDetail.vue'
import ScoreManage from '../views/score_manage/ScoreManage.vue'
import LearningEvaluation from '../views/learning_evaluation/LearningEvaluation.vue'

const routes = [
  {
    path: '/',
    name: 'KnowledgeList',
    component: KnowledgeList
  },
  {
    path: '/knowledge/:id',
    name: 'KnowledgeDetail',
    component: KnowledgeDetail
  },
  {
    path: '/score-manage',
    name: 'ScoreManage',
    component: ScoreManage
  },
  {
    path: '/learning-evaluation',
    name: 'LearningEvaluation',
    component: LearningEvaluation
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
