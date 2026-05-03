import { MockMethod } from 'vite-plugin-mock'

export default [
  {
    url: '/api/achievement/progress-rules',
    method: 'get',
    response: () => {
      return {
        code: 200,
        data: {
          courseRules: [
            { id: 1, name: '中医基础理论', learningThreshold: 30, reviewComplete: true, masteryComplete: true },
            { id: 2, name: '中医诊断学', learningThreshold: 30, reviewComplete: true, masteryComplete: true },
            { id: 3, name: '中药学', learningThreshold: 45, reviewComplete: true, masteryComplete: false },
            { id: 4, name: '方剂学', learningThreshold: 60, reviewComplete: false, masteryComplete: true },
            { id: 5, name: '中医内科学', learningThreshold: 30, reviewComplete: true, masteryComplete: true }
          ],
          displayConfig: {
            levels: [
              { id: 'subject', label: '单个科目', enabled: true },
              { id: 'tcm', label: '中医总体', enabled: true },
              { id: 'wm', label: '西医总体', enabled: false },
              { id: 'overall', label: '总体', enabled: true }
            ],
            fields: ['learning', 'review'],
            mergeMode: 'independent'
          }
        }
      }
    }
  },
  {
    url: '/api/achievement/progress-rules/save',
    method: 'post',
    response: () => {
      return { code: 200, message: '进度规则配置已保存，全量用户实时生效' }
    }
  },
  {
    url: '/api/achievement/rules',
    method: 'get',
    response: () => {
      const generateIcon = (name: string) => `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`
      
      const learning = [
        { id: 1, name: '一日萌芽', description: 'XXX年X月X日，你开始了学习', condition: '累计学习1天', threshold: 1, icon: generateIcon('sprout'), status: true, step: 1 },
        { id: 2, name: '三日凝思', description: '静心凝思，必有所得', condition: '累计学习3天', threshold: 3, icon: generateIcon('reflection'), status: true, step: 1 },
        { id: 3, name: '七日筑基', description: '筑基七日，更上层楼', condition: '累计学习7天', threshold: 7, icon: generateIcon('foundation'), status: true, step: 1 },
        { id: 4, name: '学习达人Ⅰ', description: '坚持就是胜利', condition: '累计学习30天', threshold: 30, icon: generateIcon('expert1'), status: true, step: 1 },
        { id: 5, name: '学习达人Ⅱ', description: '持之以恒的修行', condition: '累计学习50天', threshold: 50, icon: generateIcon('expert2'), status: true, step: 1 },
        { id: 6, name: '学习达人Ⅲ', description: '卓越的学习品质', condition: '累计学习100天', threshold: 100, icon: generateIcon('expert3'), status: true, step: 1 },
        { id: 7, name: '半载躬行', description: '半载春秋，躬行不辍', condition: '累计学习180天', threshold: 180, icon: generateIcon('halfyear'), status: true, step: 1 },
        { id: 8, name: '岁久功成', description: '年复一年，终成大器', condition: '累计学习365天', threshold: 365, icon: generateIcon('fullyear'), status: true, step: 1 }
      ]

      const subject = [
        { id: 11, name: '初出茅庐', description: '第一个科目的印记', condition: '开启1个科目的学习', threshold: 1, icon: generateIcon('newbie'), status: true, step: 1 },
        { id: 12, name: '营养均衡Ⅰ', description: '博采众长', condition: '开启5个科目的学习', threshold: 5, icon: generateIcon('balanced1'), status: true, step: 1 },
        { id: 13, name: '营养均衡Ⅱ', description: '学识渐丰', condition: '开启10个科目的学习', threshold: 10, icon: generateIcon('balanced2'), status: true, step: 1 },
        { id: 14, name: '营养均衡Ⅲ', description: '知识海洋的探索者', condition: '开启20个科目的学习', threshold: 20, icon: generateIcon('balanced3'), status: true, step: 1 },
        { id: 15, name: '六边形战士Ⅰ', description: '中西合璧，初步达成', condition: '完成中医、西医科目各至少2门', threshold: 2, icon: generateIcon('warrior1'), status: true, step: 1 },
        { id: 16, name: '六边形战士Ⅱ', description: '中西贯通，进阶之路', condition: '完成中医、西医科目各至少4门', threshold: 4, icon: generateIcon('warrior2'), status: true, step: 1 },
        { id: 17, name: '六边形战士Ⅲ', description: '全能医者，巅峰境界', condition: '完成中医、西医科目各至少6门', threshold: 6, icon: generateIcon('warrior3'), status: true, step: 1 }
      ]

      const planning = [
        { id: 21, name: '今日KPI达成', description: '今日事今日毕', condition: '完成每日任务', threshold: 1, icon: generateIcon('kpi'), status: true, step: 1 },
        { id: 22, name: '完美的周计划', description: '整整一周的自律', condition: '一周内完成所有每日任务', threshold: 7, icon: generateIcon('week'), status: true, step: 1 },
        { id: 23, name: '完美的月计划', description: '自律已成为本能', condition: '一个月内完成所有每日任务', threshold: 30, icon: generateIcon('month'), status: true, step: 1 },
        { id: 24, name: '自律达人Ⅰ', description: '自律的一小步', condition: '达成5个日计划', threshold: 5, icon: generateIcon('discipline1'), status: true, step: 1 },
        { id: 25, name: '自律达人Ⅴ', description: '自律的一大步', condition: '达成1000个日计划', threshold: 1000, icon: generateIcon('discipline5'), status: true, step: 1 },
        { id: 26, name: '计划大师Ⅰ', description: '运筹帷幄', condition: '累计达成2次“完美的周计划”', threshold: 2, icon: generateIcon('master1'), status: true, step: 1 },
        { id: 27, name: '计划大师·2 Ⅰ', description: '决胜千里', condition: '累计达成2次“完美的月计划”', threshold: 2, icon: generateIcon('master2-1'), status: true, step: 1 }
      ]

      const knowledge = {
        comment: [
          { id: 31, name: '神秘高冷', description: '有人说ta话不多，也有人说ta只是害羞', condition: '评论数=1', threshold: 1, icon: generateIcon('mysterious'), status: true, step: 1 },
          { id: 32, name: '掀起水花', description: '只是讲几句', condition: '评论数=50', threshold: 50, icon: generateIcon('waves'), status: true, step: 1 },
          { id: 33, name: '略有耳闻', description: '鉴定为话痨体质', condition: '评论数=200', threshold: 200, icon: generateIcon('familiar'), status: true, step: 1 },
          { id: 34, name: '前辈的密言Ⅰ', description: '你的见解得到了认可', condition: '20条评论点赞数达到10', threshold: 20, icon: generateIcon('secret1'), status: true, step: 1 }
        ],
        relation: [
          { id: 41, name: '阿巴阿巴', description: '天线宝宝也要好好学习！', condition: '主动创建关联数达到10', threshold: 10, icon: generateIcon('aba'), status: true, step: 1 },
          { id: 42, name: '灵智初开', description: '嗯？嗯嗯嗯？', condition: '主动创建关联数达到100', threshold: 100, icon: generateIcon('initial'), status: true, step: 1 },
          { id: 43, name: '大脑迷宫', description: '迷迷糊糊才不是我的作风！', condition: '主动创建关联数达到500', threshold: 500, icon: generateIcon('maze'), status: true, step: 1 }
        ],
        study: [
          { id: 51, name: '清澈的眼神', description: '初学者的好奇', condition: '学习知识点数达到N', threshold: 0, icon: generateIcon('clear'), status: true, step: 1 },
          { id: 52, name: '花前坐Ⅰ', description: '静心求学', condition: '学习知识点数达到N', threshold: 0, icon: generateIcon('flower1'), status: true, step: 1 },
          { id: 53, name: '学富五车Ⅰ', description: '博大精深', condition: '学习知识点数达到N', threshold: 0, icon: generateIcon('wealth1'), status: true, step: 1 }
        ],
        duration: [
          { id: 61, name: '神农Ⅰ', description: '尝百草之志', condition: '中药学学习时长超过1小时', threshold: 1, icon: generateIcon('shennong1'), status: true, step: 0.5 },
          { id: 62, name: '伤寒Ⅰ', description: '辩证之始', condition: '伤寒论学习时长超过1小时', threshold: 1, icon: generateIcon('shanghan1'), status: true, step: 0.5 },
          { id: 63, name: '内经Ⅰ', description: '岐黄之本', condition: '内经学习时长超过1小时', threshold: 1, icon: generateIcon('neijing1'), status: true, step: 0.5 },
          { id: 64, name: '金匮Ⅰ', description: '医圣之方', condition: '金匮要略学习时长超过1小时', threshold: 1, icon: generateIcon('jingui1'), status: true, step: 0.5 }
        ]
      }

      const ai = {
        question: [
          { id: 71, name: '十个为什么', description: '探索的起点', condition: '累计询问10个问题', threshold: 10, icon: generateIcon('10whys'), status: true, step: 1 },
          { id: 72, name: '一百个为什么', description: '好奇心的驱动', condition: '累计询问100个问题', threshold: 100, icon: generateIcon('100whys'), status: true, step: 1 },
          { id: 73, name: '一万个为什么Ⅰ', description: '求知的巅峰', condition: '累计询问500个问题', threshold: 500, icon: generateIcon('10000whys1'), status: true, step: 1 }
        ],
        accuracy: [
          { id: 81, name: '探索者Ⅰ', description: '在偏差中成长', condition: 'AI回答偏差累计10次', threshold: 10, icon: generateIcon('explorer1'), status: true, step: 1 },
          { id: 82, name: '领悟者Ⅰ', description: '捕捉智慧的火花', condition: 'AI回答准确累计10次', threshold: 10, icon: generateIcon('comprehender1'), status: true, step: 1 }
        ],
        comprehensive: [
          { id: 91, name: '日月同辉Ⅰ', description: '偏差与准确并存', condition: '同时达成“探索者Ⅰ”和“领悟者Ⅰ”', threshold: 1, icon: generateIcon('sunmoon1'), status: true, step: 1 }
        ],
        whatasked: [
          { id: 101, name: '思辨Ⅰ', description: '敢于质疑', condition: '反驳AI 10次', threshold: 10, icon: generateIcon('speculation1'), status: true, step: 1 },
          { id: 102, name: '列文虎克Ⅰ', description: '细节决定成败', condition: '注重细节追问10次', threshold: 10, icon: generateIcon('leeuwenhoek1'), status: true, step: 1 },
          { id: 103, name: '辩证Ⅰ', description: '洞察病机', condition: '问辨证相关问题10次', threshold: 10, icon: generateIcon('dialectics1'), status: true, step: 1 }
        ]
      }

      return {
        code: 200,
        data: {
          learning,
          subject,
          planning,
          knowledge,
          ai,
          config: {
            breakReset: true,
            cumulative: true,
            commentLikeThreshold: 10
          }
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
