import { MockMethod } from 'vite-plugin-mock'

export default [
  {
    url: '/api/users/stats',
    method: 'get',
    response: () => {
      return {
        code: 200,
        data: { totalUsers: 25840, todayNew: 125, activeUsers: 3420, collegeCount: 45 }
      }
    }
  },
  {
    url: '/api/users/list',
    method: 'get',
    response: ({ query }: any) => {
      const { nickname = '' } = query
      const list = [
        { id: 1, nickname: '中医爱好者小张', name: '张伟', school: '北京中医药大学', grade: '2022级', major: '中医学', phone: '13800138000', regTime: '2023-09-01', lastActive: '2024-03-27 10:30', status: '正常' }
      ]
      return {
        code: 200,
        data: { list: list.filter(item => item.nickname.includes(nickname)), total: list.length }
      }
    }
  },
  {
    url: '/api/users/detail/:id',
    method: 'get',
    response: ({ params }: any) => {
      return {
        code: 200,
        data: { id: params.id, nickname: '中医爱好者小张', name: '张伟', avatar: '', school: '北京中医药大学', grade: '2022级', major: '中医学', preferences: { studyMode: '规划模式', focusArea: ['中药学'], dailyGoal: '60分钟' } }
      }
    }
  },
  {
    url: '/api/users/update',
    method: 'post',
    response: () => {
      return { code: 200, message: '资料已修正' }
    }
  },
  {
    url: '/api/assessment/questions',
    method: 'get',
    response: () => {
      return {
        code: 200,
        data: {
          list: [{ id: 801, title: '在学习新知识时，你更倾向于？', dimension: '视觉型', optionsCount: 4, status: true }],
          total: 1
        }
      }
    }
  },
  {
    url: '/api/assessment/results',
    method: 'get',
    response: () => {
      return {
        code: 200,
        data: {
          distribution: [{ value: 35, name: '视觉型' }, { value: 28, name: '听觉型' }],
          userResults: [{ id: 1, nickname: '中医爱好者小张', school: '北京中医药大学', type: '视觉型', time: '2024-03-25 10:00', scores: { visual: 85, auditory: 40, kinesthetic: 30 } }]
        }
      }
    }
  },
  {
    url: '/api/users/behavior',
    method: 'get',
    response: () => {
      return {
        code: 200,
        data: [
          { id: 1, type: 'study', time: '2024-03-27 15:30', content: { kp: '阴阳的基本概念', duration: '15分钟', status: '完成' } }
        ]
      }
    }
  },
  {
    url: '/api/interaction/favorites/stats',
    method: 'get',
    response: () => {
      return { code: 200, data: { total: 1250, comments: 450, aiAnswers: 800 } }
    }
  },
  {
    url: '/api/interaction/favorites/list',
    method: 'get',
    response: () => {
      return { code: 200, data: { list: [{ id: 1, nickname: '小李', type: '评论', summary: '这篇文章讲得非常透彻...', time: '2024-03-27 10:00' }] } }
    }
  },
  {
    url: '/api/interaction/comments/list',
    method: 'get',
    response: () => {
      return { code: 200, data: { list: [{ id: 101, nickname: '老中医', content: '关于麻黄汤的用法...', target: '知识点：麻黄汤', time: '2024-03-27 11:00', likes: 25, reports: 0 }] } }
    }
  }
] as MockMethod[]
