# 学医智用 · 管理端 (MedWise Admin)

基于 Vue 3 + TypeScript + Vite + Element Plus 构建的中医智能化教育管理平台后台系统。

## 🚀 快速开始

### 环境依赖
- Node.js 16.x +
- npm 8.x +

### 安装与启动
由于环境限制，安装依赖时请使用以下命令：
```bash
npm install --cache D:\xyzy2\.npm-cache --legacy-peer-deps
```

启动开发服务器：
```bash
npm run dev
```

### 默认账号
- **用户名**: `admin`
- **密码**: `admin123` (Mock 环境下暂不强制校验)

## 🗺️ 路由与模块对应表

| 一级菜单 | 二级菜单 | 路由路径 | 功能说明 |
| :--- | :--- | :--- | :--- |
| **内容中台** | 课程体系管理 | `/content/courses` | 管理课程-章节-节三级树形结构 |
| | 知识图谱管理 | `/content/knowledge` | 管理知识点详情及关联关系 |
| | 导图与大纲管理 | `/content/outline` | 脑图式教学大纲编辑与预览 |
| | 资源管理 | `/content/resource` | 图文、古籍、文献素材库管理 |
| | 关键词与标签管理 | `/content/tags` | 全局标签池维护与合并 |
| | 版本与发布管理 | `/content/version` | 内容审核、发布与一键回滚 |
| **推演中台** | AI 答疑配置 | `/deduction/ai-qa` | 配置 AI 回复风格与 Prompt 模板 |
| | 病证训练管理 | `/deduction/training` | 临床病证案例库与反馈模板 |
| | 学习规划管理 | `/deduction/planning` | 针对不同画像的阶梯式学习计划 |
| **用户与画像** | 用户档案 | `/user/profile` | 学生基础信息与个性化偏好查看 |
| | 认知测评 | `/user/assessment` | 学习风格测评题库与结果分析 |
| | 学习行为 | `/user/behavior` | 全量学习轨迹时间轴追踪 |
| | 互动行为 | `/user/interaction` | 收藏、评论、点赞行为审计 |
| **进度与成就** | 进度规则 | `/achievement/progress` | 配置课程/知识点完成度的计算权重 |
| | 成就规则 | `/achievement/rules` | 勋章、证书触发条件与视觉管理 |
| | 状态规则 | `/achievement/status` | 每日学习等级（如“初窥门径”）配置 |
| | 报告管理 | `/achievement/reports` | 周报、月报展示字段与排序配置 |
| | 计划执行监控 | `/achievement/monitor` | 全站计划完成率看板与异常预警 |
| **运营与服务** | 首页配置 | `/operation/home` | 移动端首页模块开关与拖拽排序 |
| | 推荐配置 | `/operation/recommend` | 个性化推荐算法权重配比与仿真 |
| | 消息中心 | `/operation/messages` | 站内信与公众号模板消息推送 |
| | 内容服务 | `/operation/content` | FAQ、攻略及“关于我们”图文管理 |
| | 社区治理 | `/operation/community` | 评论审核、举报处理与置顶管理 |
| | 客服工单 | `/operation/tickets` | 用户反馈受理、回复与指派流转 |
| **院校合作** | 院校管理 | `/college/management` | 合作伙伴授权、有效期与范围控制 |
| | 教学组织 | `/college/organization` | 院校内班级、专业及兴趣小组管理 |
| | 教学看板 | `/college/board` | 针对特定院校的教学质量大数据分析 |
| **系统管理** | 账号权限 | `/system/account` | 管理员账号增删改查与角色权限树 |
| | 系统配置 | `/system/config` | 全局参数（上传、AI、版本）设定 |
| | 日志审计 | `/system/logs` | 操作日志与登录日志全量追踪 |

## 🛠️ 开发规范说明

- **权限控制**: 系统采用角色访问控制（RBAC）。
  - 超级管理员：全量权限。
  - 内容编辑：内容中台 + 推演中台。
  - 运营客服：运营服务 + 用户画像（只读）。
  - 院校管理员：院校合作中心。
  - 只读分析员：全模块只读，不显示操作按钮。
- **调试入口**: 点击右上角头像下拉菜单，可实时切换不同角色视角进行调试。
- **Mock 数据**: 所有模拟数据位于 `src/mock` 目录下，按业务模块分文件存放。
- **主题样式**: 全局医学深蓝主题配置于 `src/styles/element/index.scss`。
