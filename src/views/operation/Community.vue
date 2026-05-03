<template>
  <div class="community-governance-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="title">社区治理</h2>
        <p class="subtitle">审核社区评论、处理举报内容，维护绿色健康的医学交流环境</p>
      </div>
    </div>

    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <el-radio-group v-model="filterStatus" @change="fetchComments">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="pending">待审核</el-radio-button>
            <el-radio-button label="reported">被举报</el-radio-button>
          </el-radio-group>
          
          <div class="batch-actions" v-if="selectedIds.length > 0">
            <span class="selected-tip">已选 {{ selectedIds.length }} 项</span>
            <el-button type="warning" size="small" @click="handleBatch('hide')">批量隐藏</el-button>
            <el-button type="danger" size="small" @click="handleBatch('delete')">批量删除</el-button>
          </div>
        </div>
      </template>

      <el-table 
        :data="commentList" 
        border 
        stripe 
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="nickname" label="用户昵称" width="150" />
        <el-table-column prop="content" label="评论内容" min-width="250">
          <template #default="{ row }">
            <div class="comment-content-cell">
              <span class="content-text">{{ truncateContent(row.content) }}</span>
              <el-tag v-if="row.reports > 0" size="small" type="danger" effect="plain" class="reported-tag">
                被举报 {{ row.reports }} 次
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="target" label="所属知识点" width="200" show-overflow-tooltip />
        <el-table-column prop="time" label="发布时间" width="170" align="center" />
        <el-table-column prop="likes" label="点赞数" width="100" align="center">
          <template #default="{ row }">
            <span class="likes-count"><el-icon><Pointer /></el-icon> {{ row.likes }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button link type="primary" @click="handleAction(row, 'pass')">通过</el-button>
              <el-button link type="warning" @click="handleAction(row, 'hide')">隐藏</el-button>
              <el-button link type="danger" @click="handleAction(row, 'delete')">删除</el-button>
              <el-button link type="success" @click="handleAction(row, 'top')">置顶</el-button>
              <el-divider direction="vertical" v-if="row.reports > 0" />
              <el-button 
                v-if="row.reports > 0" 
                link 
                type="danger" 
                class="detail-btn"
                @click="showReportDetail(row)"
              >
                举报详情
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="total"
          :page-size="20"
        />
      </div>
    </el-card>

    <!-- Report Detail Dialog -->
    <el-dialog v-model="reportDialogVisible" title="举报详情" width="550px">
      <div v-if="currentComment" class="report-info">
        <div class="original-comment">
          <div class="label">原评论内容：</div>
          <div class="text">{{ currentComment.content }}</div>
        </div>
        <el-divider />
        <div class="report-list">
          <div class="label">举报记录：</div>
          <div v-for="(report, index) in currentComment.reportDetails" :key="index" class="report-record-item">
            <div class="record-meta">
              <span class="user">{{ report.user }}</span>
              <span class="time">{{ report.time }}</span>
            </div>
            <div class="reason">原因：<el-tag size="small" type="danger">{{ report.reason }}</el-tag></div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

interface ReportDetail {
  user: string
  time: string
  reason: string
}

interface Comment {
  id: number
  nickname: string
  content: string
  reports: number
  target: string
  time: string
  likes: number
  reportDetails?: ReportDetail[]
}

const loading = ref(false)
const filterStatus = ref('all')
const commentList = ref<Comment[]>([])
const total = ref(0)
const selectedIds = ref<number[]>([])
const reportDialogVisible = ref(false)
const currentComment = ref<Comment | null>(null)

const fetchComments = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/operation/community/comments', {
      params: { status: filterStatus.value }
    })
    commentList.value = res.data.data.list
    total.value = res.data.data.total
  } catch (error) {
    ElMessage.error('获取评论列表失败')
  } finally {
    loading.value = false
  }
}

const truncateContent = (content: string) => {
  return content.length > 50 ? content.slice(0, 50) + '...' : content
}

const handleSelectionChange = (selection: Comment[]) => {
  selectedIds.value = selection.map(item => item.id)
}

const handleAction = (row: Comment, action: string) => {
  const actionTextMap: Record<string, string> = {
    pass: '通过审核',
    hide: '隐藏评论',
    delete: '删除评论',
    top: '置顶评论'
  }
  const actionText = actionTextMap[action]

  ElMessageBox.confirm(`确定要${actionText}吗？`, '操作确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: action === 'delete' ? 'warning' : 'info'
  }).then(async () => {
    await axios.post('/api/operation/community/comments/batch', {
      ids: [row.id],
      action
    })
    ElMessage.success(`操作成功：${actionText}`)
    fetchComments()
  })
}

const handleBatch = (action: string) => {
  const actionText = action === 'delete' ? '删除' : '隐藏'
  ElMessageBox.confirm(`确定要批量${actionText}选中的 ${selectedIds.value.length} 项吗？`, '批量操作确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await axios.post('/api/operation/community/comments/batch', {
      ids: selectedIds.value,
      action
    })
    ElMessage.success(`批量${actionText}成功`)
    fetchComments()
  })
}

const showReportDetail = (row: Comment) => {
  currentComment.value = row
  reportDialogVisible.value = true
}

onMounted(fetchComments)
</script>

<style scoped lang="scss">
.community-governance-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;

  .page-header {
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

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .batch-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      .selected-tip {
        font-size: 13px;
        color: #64748b;
      }
    }
  }

  .comment-content-cell {
    display: flex;
    flex-direction: column;
    gap: 6px;
    .content-text {
      color: #334155;
      line-height: 1.5;
    }
    .reported-tag {
      align-self: flex-start;
      font-weight: bold;
    }
  }

  .likes-count {
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    .el-icon { font-size: 14px; }
  }

  .action-buttons {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    .detail-btn {
      font-weight: bold;
    }
  }

  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .report-info {
    .label {
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 8px;
    }
    .original-comment {
      .text {
        padding: 12px;
        background: #f8fafc;
        border-radius: 6px;
        color: #475569;
        font-style: italic;
        font-size: 13px;
      }
    }
    .report-list {
      .report-record-item {
        padding: 12px;
        border-bottom: 1px solid #f1f5f9;
        &:last-child { border-bottom: none; }
        .record-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          .user { font-weight: bold; color: #1e3a8a; font-size: 13px; }
          .time { color: #94a3b8; font-size: 12px; }
        }
        .reason {
          font-size: 13px;
          color: #64748b;
        }
      }
    }
  }
}
</style>
