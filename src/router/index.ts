import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Layout from '@/layout/index.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '首页', icon: 'House' }
      },
      // 内容中台
      {
        path: 'content',
        name: 'Content',
        meta: { title: '内容中台', icon: 'Files' },
        children: [
          { path: 'course', name: 'CourseSystem', component: () => import('@/views/content/CourseSystem.vue'), meta: { title: '课程体系管理' } },
          { path: 'graph', name: 'KnowledgeGraph', component: () => import('@/views/content/KnowledgeGraph.vue'), meta: { title: '知识图谱管理' } },
          { path: 'outline', name: 'Outline', component: () => import('@/views/content/Outline.vue'), meta: { title: '导图与大纲管理' } },
          { path: 'resource', name: 'Resource', component: () => import('@/views/content/Resource.vue'), meta: { title: '资源管理' } },
          { path: 'tags', name: 'Tags', component: () => import('@/views/content/Tags.vue'), meta: { title: '关键词与标签管理' } },
          { path: 'version', name: 'Version', component: () => import('@/views/content/Version.vue'), meta: { title: '版本与发布管理' } },
        ]
      },
      // 推演中台
      {
        path: 'deduction',
        name: 'Deduction',
        meta: { title: '推演中台', icon: 'Cpu' },
        children: [
          { path: 'qa', name: 'AIQA', component: () => import('@/views/deduction/AIQA.vue'), meta: { title: 'AI答疑配置' } },
          { path: 'training', name: 'Training', component: () => import('@/views/deduction/Training.vue'), meta: { title: '病证训练管理' } },
          { path: 'planning', name: 'Planning', component: () => import('@/views/deduction/Planning.vue'), meta: { title: '学习规划管理' } },
        ]
      },
      // 用户与画像中心
      {
        path: 'user',
        name: 'UserCenter',
        meta: { title: '用户与画像中心', icon: 'User' },
        children: [
          { path: 'profile', name: 'UserProfile', component: () => import('@/views/user/Profile.vue'), meta: { title: '用户档案' } },
          { path: 'assessment', name: 'Assessment', component: () => import('@/views/user/Assessment.vue'), meta: { title: '认知测评' } },
          { path: 'behavior-learning', name: 'LearningBehavior', component: () => import('@/views/user/LearningBehavior.vue'), meta: { title: '学习行为' } },
          { path: 'behavior-interaction', name: 'InteractionBehavior', component: () => import('@/views/user/InteractionBehavior.vue'), meta: { title: '互动行为' } },
        ]
      },
      // 进度与成就中心
      {
        path: 'achievement',
        name: 'Achievement',
        meta: { title: '进度与成就中心', icon: 'Trophy' },
        children: [
          { path: 'rules-progress', name: 'ProgressRules', component: () => import('@/views/achievement/ProgressRules.vue'), meta: { title: '进度规则' } },
          { path: 'rules-achievement', name: 'AchievementRules', component: () => import('@/views/achievement/AchievementRules.vue'), meta: { title: '成就规则' } },
          { path: 'rules-status', name: 'StatusRules', component: () => import('@/views/achievement/StatusRules.vue'), meta: { title: '状态规则' } },
          { path: 'reports', name: 'Reports', component: () => import('@/views/achievement/Reports.vue'), meta: { title: '报告管理' } },
          { path: 'monitor', name: 'Monitor', component: () => import('@/views/achievement/Monitor.vue'), meta: { title: '计划执行监控' } },
        ]
      },
      // 运营与服务中心
      {
        path: 'operation',
        name: 'Operation',
        meta: { title: '运营与服务中心', icon: 'Service' },
        children: [
          { path: 'home-config', name: 'HomeConfig', component: () => import('@/views/operation/HomeConfig.vue'), meta: { title: '首页配置' } },
          { path: 'recommend-config', name: 'RecommendConfig', component: () => import('@/views/operation/RecommendConfig.vue'), meta: { title: '推荐配置' } },
          { path: 'messages', name: 'Messages', component: () => import('@/views/operation/Messages.vue'), meta: { title: '消息中心' } },
          { path: 'content-service', name: 'ContentService', component: () => import('@/views/operation/ContentService.vue'), meta: { title: '内容服务' } },
          { path: 'community', name: 'Community', component: () => import('@/views/operation/Community.vue'), meta: { title: '社区治理' } },
          { path: 'tickets', name: 'Tickets', component: () => import('@/views/operation/Tickets.vue'), meta: { title: '客服工单' } },
        ]
      },
      // 院校合作中心
      {
        path: 'college',
        name: 'College',
        meta: { title: '院校合作中心', icon: 'School' },
        children: [
          { path: 'management', name: 'CollegeManagement', component: () => import('@/views/college/Management.vue'), meta: { title: '院校管理' } },
          { path: 'organization', name: 'TeachingOrg', component: () => import('@/views/college/Organization.vue'), meta: { title: '教学组织' } },
          { path: 'dashboard', name: 'TeachingDashboard', component: () => import('@/views/college/Board.vue'), meta: { title: '教学看板' } },
        ]
      },
      // 系统管理中心
      {
        path: 'system',
        name: 'System',
        meta: { title: '系统管理中心', icon: 'Setting' },
        children: [
          { path: 'account', name: 'AccountPerm', component: () => import('@/views/system/AccountPermissions.vue'), meta: { title: '账号权限' } },
          { path: 'config', name: 'SystemConfig', component: () => import('@/views/system/SystemConfig.vue'), meta: { title: '系统配置' } },
          { path: 'audit', name: 'LogAudit', component: () => import('@/views/system/Logs.vue'), meta: { title: '日志审计' } },
        ]
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
