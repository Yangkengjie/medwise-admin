<template>
  <div class="version-management-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>内容版本管理</span>
          <el-button type="primary" icon="Plus">创建新版本</el-button>
        </div>
      </template>

      <el-table :data="versionList" v-loading="loading" border stripe style="width: 100%">
        <el-table-column prop="version" label="版本号" width="120" />
        <el-table-column prop="scope" label="涉及范围" min-width="200" />
        <el-table-column prop="status" label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" align="center" />
        <el-table-column prop="operator" label="操作人" width="120" align="center" />
        <el-table-column label="操作" width="350" fixed="right" align="center">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === '草稿'" 
              link type="primary" 
              @click="handleUpdateStatus(row, '已审核')"
            >提交审核</el-button>
            <el-button 
              v-if="row.status === '已审核'" 
              link type="success" 
              @click="handleUpdateStatus(row, '已发布')"
            >审核通过</el-button>
            <el-button 
              v-if="row.status === '已审核' || row.status === '已发布'" 
              link type="primary" 
              @click="handlePublish(row)"
            >发布</el-button>
            <el-button 
              v-if="row.status === '已发布'" 
              link type="warning" 
              @click="handleRollback(row)"
            >回滚</el-button>
            <el-button link type="primary">详情</el-button>
            <el-button v-if="row.status === '草稿'" link type="danger">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="fetchVersions"
        />
      </div>
    </el-card>

    <!-- Publish Confirm Dialog -->
    <el-dialog v-model="publishDialogVisible" title="确认发布" width="500px">
      <div class="publish-confirm-content">
        <el-alert
          title="发布操作将使该版本内容对所有终端用户可见，请谨慎操作！"
          type="warning"
          show-icon
          :closable="false"
        />
        <div class="impact-info">
          <p><strong>发布版本：</strong> {{ currentVersion?.version }}</p>
          <p><strong>影响范围：</strong> {{ currentVersion?.scope }}</p>
          <p><strong>预计同步时间：</strong> 约 1-3 分钟</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="publishDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmPublish">确认发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const versionList = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const fetchVersions = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/versions/list')
    versionList.value = res.data.data.list
    total.value = res.data.data.total
  } finally {
    loading.value = false
  }
}

const getStatusType = (status: string) => {
  switch (status) {
    case '草稿': return 'info'
    case '已审核': return 'warning'
    case '已发布': return 'success'
    default: return 'info'
  }
}

const handleUpdateStatus = async (row: any, newStatus: string) => {
  const actionText = newStatus === '已审核' ? '提交审核' : '审核通过'
  ElMessageBox.confirm(`确定要执行“${actionText}”操作吗？`, '提示', { type: 'info' }).then(async () => {
    await axios.post('/api/versions/updateStatus', { id: row.id, status: newStatus })
    ElMessage.success(`${actionText}成功`)
    fetchVersions()
  })
}

// Publish logic
const publishDialogVisible = ref(false)
const currentVersion = ref<any>(null)

const handlePublish = (row: any) => {
  currentVersion.value = row
  publishDialogVisible.value = true
}

const confirmPublish = async () => {
  await axios.post('/api/versions/updateStatus', { id: currentVersion.value.id, status: '已发布' })
  ElMessage.success('发布指令已下发')
  publishDialogVisible.value = false
  fetchVersions()
}

// Rollback logic
const handleRollback = (row: any) => {
  ElMessageBox.confirm(
    `确定要回滚版本 ${row.version} 到上一版本吗？此操作将被记录到审计日志。`,
    '危险操作',
    { 
      confirmButtonText: '确定回滚',
      cancelButtonText: '取消',
      type: 'error' 
    }
  ).then(async () => {
    await axios.post('/api/versions/rollback', { id: row.id })
    ElMessage.warning('版本已回滚，相关记录已存入日志')
    fetchVersions()
  })
}

onMounted(fetchVersions)
</script>

<style scoped lang="scss">
.version-management-container {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .publish-confirm-content {
    .impact-info {
      margin-top: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 4px;
      p {
        margin: 8px 0;
        font-size: 14px;
        color: #606266;
      }
    }
  }
}
</style>
