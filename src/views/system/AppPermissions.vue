<template>
  <div class="app-permissions-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="title">应用权限配置</h2>
        <p class="subtitle">统一管理用户端小程序及管理端各角色的权限范围</p>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="main-tabs">
      <!-- Tab 1: 用户端权限配置 -->
      <el-tab-pane label="用户端权限配置" name="user">
        <!-- 卡片1: 必须项 -->
        <el-card shadow="never" class="mb-20">
          <template #header>
            <div class="card-header">
              <span class="header-title">
                <el-icon class="mr-4"><CircleCheck /></el-icon>基础必须项（默认开启，不可关闭）
              </span>
            </div>
          </template>
          <div class="mandatory-list">
            <div v-for="item in mandatoryPermissions" :key="item.title" class="permission-item">
              <div class="item-info">
                <span class="item-title">{{ item.title }}</span>
                <span class="item-desc">{{ item.desc }}</span>
              </div>
              <el-tag type="info" effect="plain">系统必需</el-tag>
            </div>
          </div>
        </el-card>

        <!-- 卡片2: 用户可选项 -->
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span class="header-title">
                <el-icon class="mr-4"><Setting /></el-icon>功能可选项（全局默认状态）
              </span>
              <el-tag type="warning" size="small">用户可在个人设置中覆盖此配置</el-tag>
            </div>
          </template>
          <el-table :data="optionalPermissions" border stripe>
            <el-table-column prop="label" label="功能项" width="200" />
            <el-table-column prop="desc" label="功能说明" min-width="300" />
            <el-table-column label="全局默认状态" width="150" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.enabled" />
              </template>
            </el-table-column>
          </el-table>
          <div class="footer-actions mt-20">
            <el-button type="primary" icon="Check" @click="handleSaveUserPerms">保存全局默认配置</el-button>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- Tab 2: 管理端权限配置 -->
      <el-tab-pane label="管理端权限配置" name="admin">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span class="header-title">
                <el-icon class="mr-4"><Avatar /></el-icon>管理端角色权限摘要
              </span>
              <el-button type="primary" link icon="Edit" @click="goToAccountPerms">前往角色权限管理</el-button>
            </div>
          </template>
          <el-table :data="adminRoles" border stripe v-loading="loading">
            <el-table-column prop="name" label="角色名称" width="150" />
            <el-table-column prop="menus" label="可见菜单" min-width="250">
              <template #default="{ row }">
                <div class="tag-group">
                  <el-tag v-for="menu in row.menus" :key="menu" size="small" class="mr-4 mb-4">{{ menu }}</el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="actions" label="操作权限摘要" min-width="350">
              <template #default="{ row }">
                <span class="action-summary">{{ row.actions }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center" fixed="right">
              <template #default>
                <el-button link type="primary" @click="goToAccountPerms">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { CircleCheck, Setting, Avatar, Check, Edit } from '@element-plus/icons-vue'
import axios from 'axios'

const router = useRouter()
const activeTab = ref('user')
const loading = ref(false)

const mandatoryPermissions = [
  { title: '用户账号基础信息同步', desc: '用于实现跨设备登录、头像昵称显示及个性化推荐基础。' },
  { title: '学习进度实时同步', desc: '确保用户在不同终端（如手机、Pad）的学习进度无缝衔接。' },
  { title: '数据备份权限', desc: '对用户主动创建的知识点编辑、关联、笔记等核心资产进行云端加密备份。' }
]

const optionalPermissions = ref([
  { id: 'startup_screen', label: '开启画面选择', enabled: true, desc: '支持用户选择进入 App 时显示首页或上次关闭的页面。' },
  { id: 'export_knowledge', label: '知识导出', enabled: true, desc: '允许用户将学习笔记或大纲导出为图片或 PDF 格式。' },
  { id: 'push_msg', label: '消息推送', enabled: true, desc: '系统主动发送学习提醒、计划更新等服务通知。' },
  { id: 'microphone', label: '麦克风权限', enabled: true, desc: '用于 AI 答疑时的语音输入功能。' },
  { id: 'album', label: '相册权限', enabled: true, desc: '用于上传个人头像、纠错反馈截图或知识点配图。' },
  { id: 'notification', label: '通知权限', enabled: true, desc: '控制系统弹窗及通知栏提醒的全局开关。' }
])

const adminRoles = ref([])

const fetchData = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/system/app-permissions/roles')
    adminRoles.value = res.data.data
  } finally {
    loading.value = false
  }
}

const handleSaveUserPerms = async () => {
  try {
    await axios.post('/api/system/app-permissions/user/save', optionalPermissions.value)
    ElMessage.success('用户端全局默认权限已更新')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const goToAccountPerms = () => {
  router.push('/system/account')
}

onMounted(fetchData)
</script>

<style scoped lang="scss">
.app-permissions-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;

  .page-header {
    margin-bottom: 24px;
    .title { font-size: 24px; color: #1e3a8a; margin: 0 0 8px; }
    .subtitle { color: #64748b; font-size: 14px; margin: 0; }
  }

  .main-tabs {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .header-title {
      font-weight: bold;
      color: #334155;
      display: flex;
      align-items: center;
    }
  }

  .mandatory-list {
    .permission-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #f1f5f9;
      &:last-child { border-bottom: none; }
      
      .item-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        .item-title { font-weight: 500; color: #1e293b; }
        .item-desc { font-size: 13px; color: #64748b; }
      }
    }
  }

  .tag-group {
    display: flex;
    flex-wrap: wrap;
  }

  .action-summary {
    font-size: 13px;
    color: #475569;
    line-height: 1.5;
  }

  .mb-20 { margin-bottom: 20px; }
  .mt-20 { margin-top: 20px; }
  .mr-4 { margin-right: 4px; }
  .mb-4 { margin-bottom: 4px; }
}
</style>
