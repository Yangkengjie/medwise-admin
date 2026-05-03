<template>
  <div class="system-config-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="title">系统全局配置</h2>
        <p class="subtitle">管理系统运行参数、AI 策略、通知限制及小程序版本更新等全局设定</p>
      </div>
      <div class="header-right">
        <el-button type="primary" icon="Check" @click="handleSave" :loading="saving">保存配置</el-button>
      </div>
    </div>

    <div class="config-content" v-loading="loading">
      <el-form :model="configForm" label-width="180px" label-position="left">
        <!-- Upload Configuration -->
        <el-card class="config-card mb-20" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><Upload /></el-icon>
              <span>上传限制</span>
            </div>
          </template>
          <el-form-item label="图片最大大小 (MB)">
            <el-input-number v-model="configForm.upload.maxSize" :min="1" :max="50" />
            <span class="item-tip">控制用户端及管理端图片上传的上限</span>
          </el-form-item>
          <el-form-item label="允许的文件类型">
            <el-select
              v-model="configForm.upload.allowedTypes"
              multiple
              filterable
              allow-create
              default-first-option
              placeholder="请选择或输入文件扩展名"
              style="width: 400px"
            >
              <el-option label="jpg" value="jpg" />
              <el-option label="png" value="png" />
              <el-option label="jpeg" value="jpeg" />
              <el-option label="pdf" value="pdf" />
              <el-option label="doc" value="doc" />
              <el-option label="docx" value="docx" />
            </el-select>
          </el-form-item>
        </el-card>

        <!-- Search Configuration -->
        <el-card class="config-card mb-20" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><Search /></el-icon>
              <span>搜索配置</span>
            </div>
          </template>
          <el-form-item label="模糊搜索最小匹配字符数">
            <el-input-number v-model="configForm.search.minChars" :min="1" :max="10" />
            <span class="item-tip">达到该字符数后才触发后端检索，降低服务器压力</span>
          </el-form-item>
          <el-form-item label="搜索结果分页条数">
            <el-input-number v-model="configForm.search.pageSize" :min="5" :max="100" :step="5" />
          </el-form-item>
        </el-card>

        <!-- AI Configuration -->
        <el-card class="config-card mb-20" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><MagicStick /></el-icon>
              <span>AI 配置</span>
            </div>
          </template>
          <el-form-item label="AI 回答超时时间 (秒)">
            <el-input-number v-model="configForm.ai.timeout" :min="5" :max="120" />
          </el-form-item>
          <el-form-item label="对话上下文轮数">
            <el-input-number v-model="configForm.ai.contextRounds" :min="1" :max="20" />
            <span class="item-tip">携带的历史对话轮数，轮数越多上下文理解越准，但也更消耗 Token</span>
          </el-form-item>
        </el-card>

        <!-- Notification Configuration -->
        <el-card class="config-card mb-20" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><Bell /></el-icon>
              <span>通知配置</span>
            </div>
          </template>
          <el-form-item label="消息推送每日上限">
            <el-input-number v-model="configForm.notification.dailyLimit" :min="0" :max="1000" />
            <span class="item-tip">单用户每日接收站内推送的最大数量（0 为不限制）</span>
          </el-form-item>
          <el-form-item label="公众号模板消息默认开关">
            <el-switch v-model="configForm.notification.wechatSwitch" active-text="开启" inactive-text="关闭" />
          </el-form-item>
        </el-card>

        <!-- Version Information -->
        <el-card class="config-card mb-20" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><Refresh /></el-icon>
              <span>版本信息</span>
            </div>
          </template>
          <el-form-item label="小程序最新版本号">
            <el-input v-model="configForm.version.latestVersion" placeholder="如: 1.2.5" style="width: 200px" />
          </el-form-item>
          <el-form-item label="强制更新开关">
            <el-switch v-model="configForm.version.forceUpdate" active-text="强制" inactive-text="非强制" />
            <span class="item-tip">开启后，低于最新版本的用户必须更新后才能进入系统</span>
          </el-form-item>
          <el-form-item label="更新提示文案">
            <el-input
              v-model="configForm.version.updateTip"
              type="textarea"
              :rows="3"
              placeholder="请输入更新提示内容..."
              style="width: 500px"
            />
          </el-form-item>
        </el-card>
      </el-form>

      <div class="config-footer">
        <el-button type="danger" plain icon="RefreshLeft" @click="handleReset">恢复默认配置</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const loading = ref(false)
const saving = ref(false)

const configForm = reactive({
  upload: {
    maxSize: 10,
    allowedTypes: []
  },
  search: {
    minChars: 2,
    pageSize: 20
  },
  ai: {
    timeout: 30,
    contextRounds: 5
  },
  notification: {
    dailyLimit: 100,
    wechatSwitch: true
  },
  version: {
    latestVersion: '',
    forceUpdate: false,
    updateTip: ''
  }
})

const fetchConfig = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/system/config')
    Object.assign(configForm, res.data.data)
  } catch (error) {
    ElMessage.error('获取系统配置失败')
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  saving.value = true
  try {
    await axios.post('/api/system/config/save', configForm)
    ElMessage.success('系统配置已成功保存')
  } catch (error) {
    ElMessage.error('保存配置失败')
  } finally {
    saving.value = false
  }
}

const handleReset = () => {
  ElMessageBox.confirm(
    '确定要恢复系统默认配置吗？该操作将覆盖当前所有设定且不可撤销。',
    '恢复默认配置',
    {
      confirmButtonText: '确定恢复',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    loading.value = true
    try {
      await axios.post('/api/system/config/reset')
      ElMessage.success('已成功恢复默认配置')
      fetchConfig()
    } catch (error) {
      ElMessage.error('恢复默认配置失败')
    } finally {
      loading.value = false
    }
  })
}

onMounted(fetchConfig)
</script>

<style scoped lang="scss">
.system-config-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;

  .mb-20 { margin-bottom: 20px; }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    .title {
      font-size: 20px;
      font-weight: bold;
      color: #1e3a8a;
      margin: 0 0 4px;
    }
    .subtitle {
      font-size: 13px;
      color: #909399;
      margin: 0;
    }
  }

  .config-card {
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: bold;
      color: #1e3a8a;
      .el-icon { font-size: 18px; }
    }
  }

  .item-tip {
    font-size: 12px;
    color: #94a3b8;
    margin-left: 15px;
    font-style: italic;
  }

  .config-footer {
    display: flex;
    justify-content: center;
    padding: 30px 0 50px;
    border-top: 1px dashed #e2e8f0;
  }
}
</style>
