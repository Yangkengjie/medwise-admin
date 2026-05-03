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
  },
  {
    url: '/api/system/app-permissions/roles',
    method: 'get',
    response: () => {
      return {
        code: 200,
        data: [
          { name: '超级管理员', menus: ['全部菜单'], actions: '系统全功能最高权限，包含系统配置、账号授权、审计清理等核心模块。' },
          { name: '内容编辑', menus: ['内容中台', '推演中台'], actions: '负责知识点、大纲、资源的发布与维护；配置 AI 答疑逻辑及学习规划模板。' },
          { name: '运营客服', menus: ['运营与服务中心', '用户与画像中心'], actions: '处理用户工单反馈与社区举报；查看用户基本档案并执行禁言、标记黑名单等操作。' },
          { name: '只读分析员', menus: ['数据看板', '日志审计', '用户与画像中心'], actions: '查看用户学习时长、内容偏好等脱敏统计数据；查阅系统操作日志，无修改权限。' }
        ]
      }
    }
  },
  {
    url: '/api/system/app-permissions/user/save',
    method: 'post',
    response: () => {
      return { code: 200, message: '用户端权限保存成功' }
    }
  }
] as MockMethod[]
