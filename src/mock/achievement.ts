import { MockMethod } from 'vite-plugin-mock'

export default [
  {
    url: '/api/achievement/progress-rules',
    method: 'get',
    response: () => {
      return { code: 200, data: { videoPercent: 80, outlineSeconds: 30, reviewActive: true, masteryRequired: true } }
    }
  },
  {
    url: '/api/achievement/progress-rules/save',
    method: 'post',
    response: () => {
      return { code: 200, message: '配置保存成功，已实时生效' }
    }
  },
  {
    url: '/api/achievement/rules',
    method: 'get',
    response: () => {
      return {
        code: 200,
        data: {
          list: [{ id: 1, name: '初露锋芒', type: '学习天数', condition: '连续学习3天', icon: 'https://placeholder.com/150', status: true, threshold: 3 }],
          total: 1
        }
      }
    }
  },
  {
    url: '/api/achievement/rules/save',
    method: 'post',
    response: () => {
      return { code: 200, message: '成就规则保存成功' }
    }
  },
  {
    url: '/api/achievement/status-levels',
    method: 'get',
    response: () => {
      const list = [
        { id: 1, name: '初窥门径', minDuration: 30, days: 1 },
        { id: 2, name: '略有小成', minDuration: 60, days: 3 }
      ]
      return { code: 200, data: list }
    }
  },
  {
    url: '/api/achievement/status-levels/save',
    method: 'post',
    response: () => {
      return { code: 200, message: '状态等级配置已保存，全局生效' }
    }
  },
  {
    url: '/api/achievement/report-templates',
    method: 'get',
    response: () => {
      return {
        code: 200,
        data: {
          weekly: [{ id: 'duration', label: '学习时长统计', enabled: true, icon: 'Clock' }],
          monthly: [{ id: 'duration', label: '学习时长统计', enabled: true, icon: 'Clock' }]
        }
      }
    }
  },
  {
    url: '/api/achievement/report-templates/save',
    method: 'post',
    response: () => {
      return { code: 200, message: '模板配置已保存' }
    }
  },
  {
    url: '/api/achievement/monitor/stats',
    method: 'get',
    response: () => {
      return { code: 200, data: { planCount: 8540, completionRate: 68.5, taskAchievementRate: 72.3 } }
    }
  },
  {
    url: '/api/achievement/monitor/trends',
    method: 'get',
    response: () => {
      return { code: 200, data: { dates: ['2024-03-21', '2024-03-22'], rates: [65, 70] } }
    }
  },
  {
    url: '/api/achievement/monitor/incomplete-tasks',
    method: 'get',
    response: () => {
      return { code: 200, data: [{ category: '中医基础', count: 450 }] }
    }
  },
  {
    url: '/api/achievement/monitor/low-performers',
    method: 'get',
    response: () => {
      return { code: 200, data: [{ id: 1, nickname: '学习者_1001', school: '北京中医药大学', completionRate: 15, totalTasks: 50, finishedTasks: 7 }] }
    }
  }
] as MockMethod[]
