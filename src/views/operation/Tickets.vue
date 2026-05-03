<template>
  <div class="tickets-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="title">客服工单管理</h2>
        <p class="subtitle">受理并处理用户的咨询、建议及投诉，提升平台服务质量</p>
      </div>
    </div>

    <!-- Filters -->
    <el-card shadow="never" class="filter-card mb-20">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="工单类型">
          <el-select v-model="filterForm.type" placeholder="全部类型" clearable style="width: 120px">
            <el-option label="咨询" value="咨询" />
            <el-option label="建议" value="建议" />
            <el-option label="反馈" value="反馈" />
            <el-option label="投诉" value="投诉" />
          </el-select>
        </el-form-item>
        <el-form-item label="工单状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="待处理" value="待处理" />
            <el-option label="处理中" value="处理中" />
            <el-option label="已解决" value="已解决" />
            <el-option label="已关闭" value="已关闭" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchTickets">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Table -->
    <el-card shadow="never">
      <el-table :data="ticketList" border stripe v-loading="loading">
        <el-table-column prop="id" label="工单编号" width="140" />
        <el-table-column prop="nickname" label="用户昵称" width="120" />
        <el-table-column prop="type" label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="工单标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" effect="dark">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" align="center" />
        <el-table-column prop="handler" label="处理人" width="100" align="center" />
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDetail(row)">处理</el-button>
            <el-button link type="primary" @click="handleAssign(row)">分配</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination background layout="total, prev, pager, next" :total="total" :page-size="20" />
      </div>
    </el-card>

    <!-- Detail Drawer -->
    <el-drawer
      v-model="drawerVisible"
      :title="`工单处理 - ${currentTicket?.id}`"
      size="800px"
      direction="rtl"
      destroy-on-close
    >
      <div v-if="currentTicket" class="drawer-layout">
        <!-- Left: Conversation History -->
        <div class="chat-section">
          <div class="section-title">对话历史</div>
          <el-scrollbar>
            <div class="chat-list">
              <div 
                v-for="(chat, index) in currentTicket.history" 
                :key="index" 
                class="chat-item"
                :class="chat.role"
              >
                <div class="chat-meta">
                  <span class="role">{{ chat.role === 'user' ? currentTicket.nickname : '客服' }}</span>
                  <span class="time">{{ chat.time }}</span>
                </div>
                <div class="chat-bubble">{{ chat.content }}</div>
              </div>
            </div>
          </el-scrollbar>
        </div>

        <!-- Right: Handle Actions -->
        <div class="action-section">
          <div class="section-title">工单回复与处置</div>
          
          <div class="form-item">
            <div class="label">常用回复模板：</div>
            <el-select v-model="selectedTemplate" placeholder="选择预设回复" @change="applyTemplate" style="width: 100%">
              <el-option v-for="tpl in replyTemplates" :key="tpl" :label="tpl" :value="tpl" />
            </el-select>
          </div>

          <div class="form-item">
            <div class="label">回复内容：</div>
            <el-input 
              v-model="replyContent" 
              type="textarea" 
              :rows="5" 
              placeholder="请输入对用户的回复内容..." 
            />
          </div>

          <div class="form-item">
            <div class="label">更新工单状态：</div>
            <el-radio-group v-model="ticketAction.status" size="small">
              <el-radio-button label="处理中" />
              <el-radio-button label="已解决" />
              <el-radio-button label="已关闭" />
            </el-radio-group>
          </div>

          <div class="form-item">
            <div class="label">内部处理备注：</div>
            <el-input 
              v-model="ticketAction.note" 
              type="textarea" 
              :rows="3" 
              placeholder="仅管理员可见的备注信息..." 
            />
          </div>

          <div class="action-footer">
            <el-button type="primary" size="large" @click="submitReply" :loading="submitting">发送回复并提交更新</el-button>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- Assign Dialog -->
    <el-dialog v-model="assignVisible" title="分配工单" width="400px">
      <el-form label-width="80px">
        <el-form-item label="工单编号">
          <span>{{ selectedTicket?.id }}</span>
        </el-form-item>
        <el-form-item label="处理人">
          <el-select v-model="assignHandler" placeholder="请选择处理人" style="width: 100%">
            <el-option v-for="admin in adminList" :key="admin.id" :label="admin.name" :value="admin.name" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAssign">确定分配</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

interface ChatHistory {
  role: 'user' | 'admin'
  time: string
  content: string
}

interface Ticket {
  id: string
  nickname: string
  type: string
  title: string
  status: string
  createTime: string
  handler: string
  history?: ChatHistory[]
}

interface Admin {
  id: number
  name: string
}

const loading = ref(false)
const submitting = ref(false)
const ticketList = ref<Ticket[]>([])
const total = ref(0)
const drawerVisible = ref(false)
const currentTicket = ref<Ticket | null>(null)
const replyContent = ref('')
const selectedTemplate = ref('')
const assignVisible = ref(false)
const selectedTicket = ref<Ticket | null>(null)
const assignHandler = ref('')
const adminList = ref<Admin[]>([])

const filterForm = reactive({
  type: '',
  status: '',
  dateRange: []
})

const ticketAction = reactive({
  status: '处理中',
  note: ''
})

const replyTemplates = [
  '您好，您的问题已收到，我们正在核实，请耐心等待回复。',
  '非常抱歉给您带来了不便，关于您反馈的问题，我们已在处理中。',
  '感谢您的宝贵建议，我们已反馈给相关产品部门，后续会持续优化。',
  '您好，关于该问题，建议您尝试清除缓存或重新登录后再次查看。'
]

const getTypeTag = (type: string) => {
  const map: Record<string, string> = { '咨询': '', '建议': 'success', '反馈': 'warning', '投诉': 'danger' }
  return map[type] || ''
}

const getStatusTag = (status: string) => {
  const map: Record<string, string> = { '待处理': 'danger', '处理中': 'warning', '已解决': 'success', '已关闭': 'info' }
  return map[status] || ''
}

const fetchTickets = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/operation/tickets/list', { params: filterForm })
    ticketList.value = res.data.data.list
    total.value = res.data.data.total
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filterForm.type = ''
  filterForm.status = ''
  filterForm.dateRange = []
  fetchTickets()
}

const handleDetail = async (row: Ticket) => {
  try {
    const res = await axios.get(`/api/operation/tickets/detail/${row.id}`)
    currentTicket.value = res.data.data
    replyContent.value = ''
    selectedTemplate.value = ''
    ticketAction.status = row.status === '待处理' ? '处理中' : row.status
    ticketAction.note = ''
    drawerVisible.value = true
  } catch (error) {
    ElMessage.error('获取工单详情失败')
  }
}

const applyTemplate = (val: string) => {
  replyContent.value = val
}

const submitReply = async () => {
  if (!replyContent.value || !currentTicket.value) {
    ElMessage.warning('请输入回复内容')
    return
  }
  submitting.value = true
  try {
    await axios.post('/api/operation/tickets/reply', {
      id: currentTicket.value.id,
      content: replyContent.value,
      status: ticketAction.status,
      note: ticketAction.note
    })
    ElMessage.success('处理成功')
    drawerVisible.value = false
    fetchTickets()
  } finally {
    submitting.value = false
  }
}

const handleAssign = (row: Ticket) => {
  selectedTicket.value = row
  assignHandler.value = row.handler === '-' ? '' : row.handler
  assignVisible.value = true
}

const fetchAdmins = async () => {
  const res = await axios.get('/api/operation/admins')
  adminList.value = res.data.data
}

const submitAssign = async () => {
  if (!assignHandler.value || !selectedTicket.value) {
    ElMessage.warning('请选择处理人')
    return
  }
  try {
    await axios.post('/api/operation/tickets/assign', {
      id: selectedTicket.value.id,
      handler: assignHandler.value
    })
    ElMessage.success('工单分配成功')
    assignVisible.value = false
    fetchTickets()
  } catch (error) {
    ElMessage.error('分配失败')
  }
}

onMounted(() => {
  fetchTickets()
  fetchAdmins()
})
</script>

<style scoped lang="scss">
.tickets-container {
  padding: 20px;
  max-width: 1400px;
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

  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .drawer-layout {
    display: flex;
    height: 100%;
    gap: 20px;
    padding: 0 20px 20px;

    .section-title {
      font-weight: bold;
      font-size: 16px;
      color: #1e293b;
      margin-bottom: 16px;
      border-left: 4px solid #1e3a8a;
      padding-left: 10px;
    }

    .chat-section {
      flex: 1.2;
      background: #f8fafc;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      
      .chat-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .chat-item {
        max-width: 90%;
        .chat-meta {
          font-size: 12px;
          margin-bottom: 4px;
          .role { font-weight: bold; margin-right: 8px; }
          .time { color: #94a3b8; }
        }
        .chat-bubble {
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.5;
        }

        &.user {
          align-self: flex-start;
          .chat-bubble { background: #fff; border: 1px solid #e2e8f0; color: #334155; }
        }
        &.system {
          align-self: center;
          .chat-bubble { background: #f1f5f9; color: #64748b; font-size: 12px; }
          .chat-meta { text-align: center; }
        }
        &.admin {
          align-self: flex-end;
          .chat-bubble { background: #1e3a8a; color: #fff; }
          .chat-meta { text-align: right; }
        }
      }
    }

    .action-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      
      .form-item {
        margin-bottom: 20px;
        .label { font-size: 14px; font-weight: bold; color: #475569; margin-bottom: 8px; }
      }

      .action-footer {
        margin-top: auto;
        padding-top: 20px;
        .el-button { width: 100%; }
      }
    }
  }
}
</style>
