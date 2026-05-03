import { MockMethod } from 'vite-plugin-mock'

export default [
  {
    url: '/api/college/list',
    method: 'get',
    response: () => {
      return {
        code: 200,
        data: {
          list: [{ id: 1, name: '北京中医药大学', code: 'BUCM001', status: '正式', courseCount: 15, scope: '全部可见', expiryDate: '2025-12-31' }],
          total: 1
        }
      }
    }
  },
  {
    url: '/api/college/organization/groups',
    method: 'get',
    response: () => {
      return { code: 200, data: { list: [{ id: 1, name: '2022级中医1班', type: '班级', studentCount: 45, createTime: '2022-09-01' }], total: 1 } }
    }
  },
  {
    url: '/api/college/board/stats',
    method: 'get',
    response: () => {
      return {
        code: 200,
        data: {
          courseStats: [{ name: '中医基础理论', learners: 1200, avgDuration: 450, activity: 85 }],
          portraitDist: [{ name: '视觉型', value: 450 }],
          gradeDist: { categories: ['2021级'], data: [280] },
          trainingStats: { participants: 1560, totalQuestions: 45000, avgAccuracy: 78.5, trend: { dates: ['03-21'], counts: [450] } },
          activityTrend: { dates: ['03-21'], rates: [65] }
        }
      }
    }
  }
] as MockMethod[]
