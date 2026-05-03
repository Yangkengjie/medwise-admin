import { MockMethod } from 'vite-plugin-mock'

export default [
  {
    url: '/api/courses/list',
    method: 'get',
    response: () => {
      return {
        code: 200,
        data: {
          total: 100,
          list: Array.from({ length: 10 }).map((_, index) => ({
            id: index + 1,
            title: `医学基础课程 - ${index + 1}`,
            category: '中医基础',
            status: index % 2 === 0 ? '已发布' : '草稿',
            createTime: '2024-03-20',
            author: '张医生'
          }))
        }
      }
    }
  },
  {
    url: '/api/courses/tree',
    method: 'get',
    response: () => {
      return {
        code: 200,
        data: [
          {
            id: 1,
            label: '中医基础理论',
            type: 'course',
            order: 1,
            enabled: true,
            cover: 'https://placeholder.com/150',
            children: [
              {
                id: 11,
                label: '第一章 绪论',
                type: 'chapter',
                order: 1,
                enabled: true,
                children: [
                  { id: 111, label: '第一节 中医学的理论体系', type: 'section', order: 1, enabled: true },
                  { id: 112, label: '第二节 中医学的发展概况', type: 'section', order: 2, enabled: true }
                ]
              },
              {
                id: 12,
                label: '第二章 阴阳五行',
                type: 'chapter',
                order: 2,
                enabled: true,
                children: [
                  { id: 121, label: '第一节 阴阳学说', type: 'section', order: 1, enabled: true },
                  { id: 122, label: '第二节 五行学说', type: 'section', order: 2, enabled: true }
                ]
              }
            ]
          }
        ]
      }
    }
  },
  {
    url: '/api/courses/node',
    method: 'post',
    response: ({ body }: any) => {
      return { code: 200, message: '操作成功', data: { id: Math.floor(Math.random() * 1000) } }
    }
  },
  {
    url: '/api/courses/node/:id',
    method: 'delete',
    response: () => {
      return { code: 200, message: '删除成功' }
    }
  },
  {
    url: '/api/knowledge/list',
    method: 'get',
    response: ({ query }: any) => {
      const { title = '', keyword = '' } = query
      const list = [
        { id: 101, title: '阴阳的基本概念', content: '<p>阴阳是中国古代哲学的一对范畴...</p>', importance: 5, tags: ['阴阳', '基础理论'], courseId: 1, chapterId: 12, sectionId: 121, relations: { pre: [102], contains: [], syndrome: ['肾虚'], medicine: ['六味地黄丸'] } },
        { id: 102, title: '阴阳的对立制约', content: '<p>阴阳双方在一定限度内...</p>', importance: 4, tags: ['阴阳', '相互关系'], courseId: 1, chapterId: 12, sectionId: 121, relations: { pre: [], contains: [], syndrome: [], medicine: [] } }
      ]
      return {
        code: 200,
        data: {
          list: list.filter(item => item.title.includes(title) && (keyword === '' || item.tags.includes(keyword))),
          total: 2
        }
      }
    }
  },
  {
    url: '/api/knowledge/all',
    method: 'get',
    response: () => {
      return {
        code: 200,
        data: [
          { id: 101, title: '阴阳的基本概念' },
          { id: 102, title: '阴阳的对立制约' },
          { id: 103, title: '阴阳的互根互用' }
        ]
      }
    }
  },
  {
    url: '/api/outline/tree',
    method: 'get',
    response: () => {
      return {
        code: 200,
        data: [
          {
            id: 201,
            label: '中医学导论',
            children: [
              { id: 202, label: '医学的历史渊源', content: '<h3>中医学历史</h3><p>追溯到先秦时期...</p>', note: '重要历史节点', order: 1 },
              { id: 203, label: '核心哲学思想', content: '<h3>精气学说</h3><p>精气是构成宇宙的本原...</p>', note: '需结合哲学背景讲解', order: 2 }
            ]
          }
        ]
      }
    }
  },
  {
    url: '/api/outline/update',
    method: 'post',
    response: () => {
      return { code: 200, message: '保存成功' }
    }
  },
  {
    url: '/api/resources/list',
    method: 'get',
    response: ({ query }: any) => {
      const { type = 'image' } = query
      const data: any = {
        image: [
          { id: 301, name: '人体经络穴位图', url: 'https://img.js.design/assets/smartFill/img342164da898908.jpg', type: 'image', size: '1.2MB', createTime: '2024-03-25' }
        ],
        classic: [
          { id: 311, name: '《黄帝内经·素问》', source: '上古中医典籍', content: '阴阳者，天地之道也...', type: 'classic', createTime: '2024-03-25' }
        ],
        literature: [
          { id: 321, name: '现代针灸镇痛机制研究', source: '《中医杂志》2023年第5期', content: '本研究探讨了针刺对内源性阿片肽的影响...', type: 'literature', createTime: '2024-03-25' }
        ]
      }
      return { code: 200, data: data[type] || [] }
    }
  },
  {
    url: '/api/resources/save',
    method: 'post',
    response: () => {
      return { code: 200, message: '保存成功' }
    }
  },
  {
    url: '/api/tags/list',
    method: 'get',
    response: ({ query }: any) => {
      const { name = '' } = query
      const list = [
        { id: 401, name: '阴阳', knowledgeCount: 15, usageCount: 120 },
        { id: 402, name: '五行', knowledgeCount: 12, usageCount: 95 }
      ]
      return {
        code: 200,
        data: { list: list.filter(item => item.name.includes(name)), total: list.length }
      }
    }
  },
  {
    url: '/api/tags/save',
    method: 'post',
    response: () => {
      return { code: 200, message: '操作成功' }
    }
  },
  {
    url: '/api/tags/merge',
    method: 'post',
    response: () => {
      return { code: 200, message: '合并成功' }
    }
  },
  {
    url: '/api/versions/list',
    method: 'get',
    response: () => {
      return {
        code: 200,
        data: {
          list: [
            { id: 501, version: 'v1.2.0', scope: '全量知识图谱', status: '已发布', createTime: '2024-03-25 10:00', operator: '张三' }
          ],
          total: 1
        }
      }
    }
  },
  {
    url: '/api/versions/updateStatus',
    method: 'post',
    response: () => {
      return { code: 200, message: '状态更新成功' }
    }
  },
  {
    url: '/api/versions/rollback',
    method: 'post',
    response: () => {
      return { code: 200, message: '版本回滚成功，已记录日志' }
    }
  }
] as MockMethod[]
