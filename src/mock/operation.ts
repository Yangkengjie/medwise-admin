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
