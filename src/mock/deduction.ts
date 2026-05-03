import { MockMethod } from 'vite-plugin-mock'

export default [
  {
    url: '/api/ai/styles',
    method: 'get',
    response: () => {
      return {
        code: 200,
        data: [
          { id: 1, name: '直接精准', prompt: '你是一个专业的中医专家。请直接、精准地回答：{question}。参考知识点：{knowledge_point}', enabled: true },
          { id: 2, name: '引导式对话', prompt: '你是一个循循善诱的中医老师。请先肯定学生的思考，再逐步引导其理解：{question}', enabled: true }
        ]
      }
    }
  },
  {
    url: '/api/ai/prompts',
    method: 'get',
    response: () => {
      return {
        code: 200,
        data: [
          { id: 1, scene: '答疑场景', name: '高级用户深度答疑', condition: '高级用户', prompt: '深度解析模式...', priority: 10 }
        ]
      }
    }
  },
  {
    url: '/api/ai/questions',
    method: 'get',
    response: () => {
      return {
        code: 200,
        data: [
          { id: 1, content: '阴阳平衡在养生中如何体现？', knowledgePoints: [101, 102], order: 1 }
        ]
      }
    }
  },
  {
    url: '/api/training/questions',
    method: 'get',
    response: () => {
      return {
        code: 200,
        data: {
          list: [
            { id: 601, title: '患者，男，45岁。咳嗽咳痰，痰粘稠色黄...', symptoms: ['咳嗽', '黄痰'], type: '八纲辨证', difficulty: '中等', courseId: 1, enabled: true }
          ],
          total: 1
        }
      }
    }
  },
  {
    url: '/api/training/templates',
    method: 'get',
    response: () => {
      return {
        code: 200,
        data: [
          { id: 1, name: '八纲辨证标准反馈', type: '八纲辨证', content: '你的答案：{user_answer}\n标准答案：{correct_answer}\n解析：{analysis}' }
        ]
      }
    }
  },
  {
    url: '/api/training/import-preview',
    method: 'post',
    response: () => {
      return {
        code: 200,
        data: [
          { title: '预览题目1：心悸气短...', symptoms: '心悸', type: '气血辨证', difficulty: '简单' }
        ]
      }
    }
  },
  {
    url: '/api/planning/templates',
    method: 'get',
    response: () => {
      return {
        code: 200,
        data: {
          list: [
            { id: 701, name: '中医考研冲刺规划', userProfiles: ['考研党'], target: '考研', period: '月', status: true, stages: [] }
          ],
          total: 1
        }
      }
    }
  }
] as MockMethod[]
