<template>
  <div id="app">
    <div class="app-header">
      <h1>CSU学生管理系统</h1>
    </div>
    <nav>
      <router-link to="/exams">考试中心</router-link> |
      <router-link to="/student/homework">作业中心</router-link> |
      <router-link to="/experimentList">实验中心</router-link> |
      <router-link to="/knowledge">知识库</router-link> |
      <router-link to="/score-manage">我的成绩</router-link> |
      <router-link to="/learning-evaluation">学习效果评价</router-link> |
      <router-link to="/ai/recommendation-history">AI推荐历史</router-link> |
      <router-link to="/audit/report">日志审计</router-link> |
      <router-link to="/analytics">教师分析</router-link>
    </nav>
    <div class="app-main">
      <router-view />
    </div>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.app-header {
  background: #409eff;
  color: white;
  padding: 20px;
  text-align: center;
}

.app-main {
  padding: 20px;
}
</style>