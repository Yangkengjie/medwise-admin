import { MockMethod } from 'vite-plugin-mock'

export default [
  {
    url: '/api/dashboard/stats',
    method: 'get',
    response: () => {
      return {
        code: 200,
        data: {
          userCount: 12540,
          courseCount: 450,
          trainingCount: 2840,
          activeRate: '85%'
        }
      }
    }
  }
] as MockMethod[]
