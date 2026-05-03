import { MockMethod } from 'vite-plugin-mock'

export default [
  {
    url: '/api/operation/home-config',
    method: 'get',
    response: () => {
      return { code: 200, data: [{ id: 'search', title: '全局搜索框', description: '支持课程搜索', enabled: true, mode: 'default', icon: 'Search' }] }
    }
  },
  {
    url: '/api/operation/home-config/save',
    method: 'post',
    response: () => {
      return { code: 200, message: '首页配置已保存' }
    }
  },
  {
    url: '/api/operation/recommend-config',
    method: 'get',
    response: () => {
      return { code: 200, data: { strategies: [{ id: 'ebbinghaus', label: '艾宾浩斯', enabled: true, weight: 100 }] } }
    }
  },
  {
    url: '/api/operation/recommend-config/save',
    method: 'post',
    response: () => {
      return { code: 200, message: '策略已保存' }
    }
  },
  {
    url: '/api/operation/recommend-templates',
    method: 'get',
    response: () => {
      return {
        code: 200,
        data: {
          daily: { subjects: [1, 2], duration: 45, reviewRatio: 40, description: '根据画像，今日重点攻克诊断学。' },
          weekly: { 
            subjects: [1, 3], 
            duration: 300, 
            description: '本周进入深度学习阶段。',
            days: [
              { day: '周一', strategy: '新课开启' },
              { day: '周二', strategy: '深度钻研' },
              { day: '周三', strategy: '难点攻克' },
              { day: '周四', strategy: '中期回顾' },
              { day: '周五', strategy: '扩展阅读' },
              { day: '周六', strategy: '专题自测' },
              { day: '周日', strategy: '周总结与休息' }
            ]
          },
          monthly: { 
            subjects: [1, 2, 3, 4], 
            duration: 1200, 
            description: '月度计划：从基础到模拟。',
            early: '基础知识构建',
            mid: '考点专项强化',
            late: '全真模拟与查漏补缺'
          }
        }
      }
    }
  },
  {
    url: '/api/operation/recommend-templates/save',
    method: 'post',
    response: () => {
      return { code: 200, message: '模板保存成功' }
    }
  },
  {
    url: '/api/operation/recommend-preview',
    method: 'post',
    response: () => {
      return {
        code: 200,
        data: [
          { type: 'ebbinghaus', title: '《中医诊断学》舌诊复习', reason: '符合艾宾浩斯第 3 天复习周期' },
          { type: 'weakness', title: '气血津液辨证专项练习', reason: '上周测评正确率低于 60%' },
          { type: 'exploration', title: '中医内科学导论', reason: '基于月度初期建议：开启新科目' }
        ]
      }
    }
  },
  {
    url: '/api/operation/message/templates',
    method: 'get',
    response: () => {
      return { code: 200, data: [{ id: 1, name: '学习提醒', type: '站内通知', content: '亲爱的{username}...' }] }
    }
  },
  {
    url: '/api/operation/message/records',
    method: 'get',
    response: () => {
      return { code: 200, data: [{ id: 101, title: '春季养生', time: '2024-03-20', scope: '全量', delivered: 1000, clicks: 100 }] }
    }
  },
  {
    url: '/api/operation/message/push',
    method: 'post',
    response: () => {
      return { code: 200, message: '推送已提交' }
    }
  },
  {
    url: '/api/operation/content/faq/list',
    method: 'get',
    response: () => {
      return { code: 200, data: [{ id: 1, title: '如何学习？', category: '新手攻略', order: 1, content: '...' }] }
    }
  },
  {
    url: '/api/operation/content/guides/list',
    method: 'get',
    response: () => {
      return { code: 200, data: [{ id: 1, title: '入门指南', status: '已上架', createTime: '2024-03-20', author: 'admin' }] }
    }
  },
  {
    url: '/api/operation/content/about',
    method: 'get',
    response: () => {
      return { code: 200, data: { content: '关于我们...', joinText: '加入', joinLink: '#', contactText: '联系', contactLink: '#' } }
    }
  },
  {
    url: '/api/operation/community/comments',
    method: 'get',
    response: () => {
      return { code: 200, data: { list: [{ id: 1, nickname: '用户1', content: '好评', target: '知识点A', time: '2024-03-27', likes: 10, reports: 0 }], total: 1 } }
    }
  },
  {
    url: '/api/operation/tickets/list',
    method: 'get',
    response: () => {
      return { code: 200, data: { list: [{ id: 'TK001', nickname: '用户1', type: '咨询', title: '有问题', status: '待处理', createTime: '2024-03-27', handler: '-' }], total: 1 } }
    }
  },
  {
    url: '/api/operation/tickets/detail/:id',
    method: 'get',
    response: () => {
      return { code: 200, data: { id: 'TK001', history: [] } }
    }
  }
] as MockMethod[]
