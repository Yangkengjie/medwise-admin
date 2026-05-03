<template>
  <div class="messages-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="title">消息中心</h2>
        <p class="subtitle">管理站内通知与公众号同步消息，监控推送触达及点击转化情况</p>
      </div>
      <el-button type="primary" icon="Plus" @click="handleCreatePush">新建推送任务</el-button>
    </div>

    <div class="content-layout">
      <!-- Left: Templates -->
      <div class="template-section">
        <div class="section-header">
          <span class="section-title">消息模板库</span>
          <el-button link type="primary" icon="Setting">管理模板</el-button>
        </div>
        <el-scrollbar>
          <div class="template-list">
            <div 
              v-for="item in templates" 
              :key="item.id" 
              class="template-item"
              @click="applyTemplate(item)"
            >
              <div class="item-header">
                <el-tag size="small" :type="item.type === '站内通知' ? '' : 'success'">{{ item.type }}</el-tag>
                <span class="item-name">{{ item.name }}</span>
              </div>
              <p class="item-content">{{ item.content }}</p>
            </div>
          </div>
        </el-scrollbar>
      </div>

      <!-- Right: Records -->
      <div class="record-section">
        <div class="section-header">
          <span class="section-title">消息发送记录</span>
          <div class="filter-group">
            <el-input v-model="searchQuery" placeholder="搜索标题" prefix-icon="Search" clearable style="width: 200px" />
          </div>
        </div>
        
        <el-table :data="records" border stripe v-loading="loading">
          <el-table-column prop="title" label="消息标题" min-width="180" show-overflow-tooltip />
          <el-table-column prop="time" label="发送时间" width="160" />
          <el-table-column prop="scope" label="推送范围" width="150" />
          <el-table-column label="推送效果" width="220">
            <template #default="{ row }">
              <div class="stat-group">
                <div class="stat-item">
                  <span class="label">送达</span>
                  <span class="val">{{ row.delivered.toLocaleString() }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">点击</span>
                  <span class="val">{{ row.clicks.toLocaleString() }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">转化</span>
                  <span class="val primary">{{ ((row.clicks / row.delivered) * 100).toFixed(1) }}%</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right" align="center">
            <template #default>
              <el-button link type="primary">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- Create Push Dialog -->
    <el-dialog v-model="dialogVisible" title="新建消息推送任务" width="650px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="110px">
        <el-form-item label="消息标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入推送标题" />
        </el-form-item>
        
        <el-form-item label="消息正文" prop="content">
          <el-input 
            v-model="form.content" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入正文。支持变量：{username} 会替换为用户昵称" 
          />
          <div class="variable-hint">
            常用变量：<el-button link type="primary" size="small" @click="insertVar('{username}')">{username}</el-button>
          </div>
        </el-form-item>

        <el-form-item label="跳转链接" prop="link">
          <el-input v-model="form.link" placeholder="小程序页面路径，如：/pages/course/detail?id=1" />
        </el-form-item>

        <el-form-item label="同步推送">
          <el-checkbox v-model="form.syncWechat">同步发送公众号模板消息</el-checkbox>
          <el-input 
            v-if="form.syncWechat" 
            v-model="form.templateId" 
            placeholder="请输入公众号模板消息 ID" 
            style="margin-top: 10px"
          />
        </el-form-item>

        <el-form-item label="推送范围" prop="scope">
          <el-select v-model="form.scopeType" placeholder="选择范围类型" style="width: 150px">
            <el-option label="全量用户" value="all" />
            <el-option label="按学校" value="school" />
            <el-option label="按年级" value="grade" />
            <el-option label="按画像类型" value="portrait" />
          </el-select>
          <el-select 
            v-if="form.scopeType !== 'all'" 
            v-model="form.scopeValues" 
            multiple 
            collapse-tags
            placeholder="选择具体值" 
            style="flex: 1; margin-left: 10px"
          >
            <el-option v-for="opt in scopeOptions[form.scopeType as keyof typeof scopeOptions]" :key="opt" :label="opt" :value="opt" />
          </el-select>
        </el-form-item>

        <el-form-item label="定时发送">
          <el-switch v-model="form.isScheduled" />
          <el-date-picker
            v-if="form.isScheduled"
            v-model="form.scheduledTime"
            type="datetime"
            placeholder="选择发送时间"
            style="margin-left: 15px"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="pushLoading" @click="submitPush">立即创建任务</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

interface MessageTemplate {
  id: number
  type: string
  name: string
  content: string
}

interface MessageRecord {
  id: number
  title: string
  time: string
  scope: string
  delivered: number
  clicks: number
}

const loading = ref(false)
const pushLoading = ref(false)
const dialogVisible = ref(false)
const searchQuery = ref('')
const templates = ref<MessageTemplate[]>([])
const records = ref<MessageRecord[]>([])
const formRef = ref()

interface PushForm {
  title: string
  content: string
  link: string
  syncWechat: boolean
  templateId: string
  scopeType: 'all' | 'school' | 'grade' | 'portrait'
  scopeValues: string[]
  isScheduled: boolean
  scheduledTime: string | null
}

const form = reactive<PushForm>({
  title: '',
  content: '',
  link: '',
  syncWechat: false,
  templateId: '',
  scopeType: 'all',
  scopeValues: [],
  isScheduled: false,
  scheduledTime: null
})

const rules = {
  title: [{ required: true, message: '请输入消息标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入消息正文', trigger: 'blur' }],
  scopeType: [{ required: true, message: '请选择推送范围', trigger: 'change' }]
}

const scopeOptions = {
  school: ['北京中医药大学', '上海中医药大学', '广州中医药大学', '南京中医药大学'],
  grade: ['2020级', '2021级', '2022级', '2023级', '2024级'],
  portrait: ['视觉型学习者', '听觉型学习者', '动手型学习者', '综合型学习者']
}

const fetchData = async () => {
  loading.value = true
  try {
    const [tplRes, recRes] = await Promise.all([
      axios.get('/api/operation/message/templates'),
      axios.get('/api/operation/message/records')
    ])
    templates.value = tplRes.data.data
    records.value = recRes.data.data
  } finally {
    loading.value = false
  }
}

const handleCreatePush = () => {
  Object.assign(form, {
    title: '',
    content: '',
    link: '',
    syncWechat: false,
    templateId: '',
    scopeType: 'all',
    scopeValues: [],
    isScheduled: false,
    scheduledTime: null
  })
  dialogVisible.value = true
}

const applyTemplate = (item: MessageTemplate) => {
  form.title = item.name
  form.content = item.content
}

const insertVar = (variable: string) => {
  form.content += variable
}

const submitPush = async () => {
  await formRef.value.validate()
  pushLoading.value = true
  try {
    await axios.post('/api/operation/message/push', form)
    ElMessage.success('推送任务已提交，正在排队下发')
    dialogVisible.value = false
    fetchData()
  } finally {
    pushLoading.value = false
  }
}

onMounted(fetchData)
</script>

<style scoped lang="scss">
.messages-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;

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

  .content-layout {
    display: flex;
    gap: 24px;
    height: calc(100vh - 180px);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    .section-title {
      font-weight: bold;
      color: #1e293b;
      font-size: 16px;
    }
  }

  .template-section {
    width: 320px;
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 2px 12px rgba(0,0,0,0.05);

    .template-list {
      .template-item {
        padding: 12px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        margin-bottom: 12px;
        cursor: pointer;
        transition: all 0.2s;
        &:hover {
          border-color: #1e3a8a;
          background: #eff6ff;
        }

        .item-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          .item-name {
            font-size: 14px;
            font-weight: bold;
            color: #1e293b;
          }
        }
        .item-content {
          font-size: 12px;
          color: #64748b;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      }
    }
  }

  .record-section {
    flex: 1;
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.05);
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .stat-group {
      display: flex;
      justify-content: space-between;
      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        .label { font-size: 11px; color: #94a3b8; }
        .val { 
          font-size: 13px; 
          font-weight: bold; 
          color: #475569;
          &.primary { color: #1e3a8a; }
        }
      }
    }
  }

  .variable-hint {
    font-size: 12px;
    color: #94a3b8;
    margin-top: 4px;
  }
}
</style>
