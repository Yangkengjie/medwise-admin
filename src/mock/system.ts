import { MockMethod } from 'vite-plugin-mock'

export default [
  {
    url: '/api/system/admins',
    method: 'get',
    response: () => {
      return { code: 200, data: [{ id: 1, account: 'admin', name: '超级管理员', role: '超级管理员', lastLogin: '2024-03-27', status: '启用' }] }
    }
  },
  {
    url: '/api/system/roles',
    method: 'get',
    response: () => {
      return { code: 200, data: [{ id: 1, name: '超级管理员', description: '拥有所有权限' }] }
    }
  },
  {
    url: '/api/system/permission-tree',
    method: 'get',
    response: () => {
      return { code: 200, data: [{ id: 'content', label: '内容中台', children: [{ id: 'content_view', label: '查看内容' }] }] }
    }
  },
  {
    url: '/api/system/config',
    method: 'get',
    response: () => {
      return { code: 200, data: { upload: { maxSize: 10, allowedTypes: ['jpg'] }, search: { minChars: 2, pageSize: 20 }, ai: { timeout: 30, contextRounds: 5 }, notification: { dailyLimit: 100, wechatSwitch: true }, version: { latestVersion: '1.2.5', forceUpdate: false, updateTip: '提示' } } }
    }
  },
  {
    url: '/api/system/logs/operation',
    method: 'get',
    response: () => {
      return { code: 200, data: { list: [{ id: 1, time: '2024-03-27', user: 'admin', ip: '127.0.0.1', module: '内容中台', type: '删除', desc: '删除知识点' }], total: 1 } }
    }
  },
  {
    url: '/api/system/logs/login',
    method: 'get',
    response: () => {
      return { code: 200, data: { list: [{ id: 1, time: '2024-03-27', username: 'admin', ip: '127.0.0.1', status: '成功', reason: '-' }], total: 1 } }
    }
  }
] as MockMethod[]
