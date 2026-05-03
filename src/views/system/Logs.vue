<template>
  <div class="logs-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="title">日志审计</h2>
        <p class="subtitle">记录并审计系统内的所有关键操作与登录行为，确保数据安全可追溯</p>
      </div>
      <el-button type="success" icon="Download" @click="handleExport">导出日志为 CSV</el-button>
    </div>

    <el-tabs v-model="activeTab" class="custom-tabs" @tab-change="handleTabChange">
      <!-- Tab 1: Operation Logs -->
      <el-tab-pane label="操作日志" name="operation">
        <el-card shadow="never" class="filter-card mb-20">
          <el-form :inline="true" :model="opFilter">
            <el-form-item label="操作时间">
              <el-date-picker
                v-model="opFilter.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width: 240px"
              />
            </el-form-item>
            <el-form-item label="操作人">
              <el-input v-model="opFilter.user" placeholder="输入用户名" clearable style="width: 150px" />
            </el-form-item>
            <el-form-item label="操作模块">
              <el-select v-model="opFilter.module" placeholder="全部模块" clearable style="width: 150px">
                <el-option label="内容中台" value="内容中台" />
                <el-option label="推演中台" value="推演中台" />
                <el-option label="运营服务" value="运营服务" />
                <el-option label="系统管理" value="系统管理" />
              </el-select>
            </el-form-item>
            <el-form-item label="操作类型">
              <el-select v-model="opFilter.type" placeholder="全部类型" clearable style="width: 120px">
                <el-option label="新增" value="新增" />
                <el-option label="编辑" value="编辑" />
                <el-option label="删除" value="删除" />
                <el-option label="发布" value="发布" />
                <el-option label="回滚" value="回滚" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="fetchOpLogs">查询</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never">
          <el-table :data="opLogs" border stripe v-loading="loading">
            <el-table-column prop="time" label="操作时间" width="180" align="center" />
            <el-table-column prop="user" label="操作人" width="120" />
            <el-table-column prop="ip" label="IP 地址" width="140" align="center" />
            <el-table-column prop="module" label="操作模块" width="120" align="center">
              <template #default="{ row }">
                <el-tag effect="plain">{{ row.module }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="操作类型" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getOpTypeTag(row.type)">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="desc" label="操作描述" min-width="300" />
          </el-table>
          <div class="pagination-container">
            <el-pagination background layout="total, prev, pager, next" :total="opTotal" :page-size="20" />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- Tab 2: Login Logs -->
      <el-tab-pane label="登录日志" name="login">
        <el-card shadow="never" class="filter-card mb-20">
          <el-form :inline="true" :model="loginFilter">
            <el-form-item label="登录时间">
              <el-date-picker
                v-model="loginFilter.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width: 240px"
              />
            </el-form-item>
            <el-form-item label="用户名">
              <el-input v-model="loginFilter.username" placeholder="输入用户名" clearable style="width: 150px" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="loginFilter.status" placeholder="全部状态" clearable style="width: 120px">
                <el-option label="成功" value="成功" />
                <el-option label="失败" value="失败" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="fetchLoginLogs">查询</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never">
          <el-table :data="loginLogs" border stripe v-loading="loading">
            <el-table-column prop="time" label="登录时间" width="180" align="center" />
            <el-table-column prop="username" label="用户名" width="150" />
            <el-table-column prop="ip" label="IP 地址" width="150" align="center" />
            <el-table-column prop="status" label="登录状态" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === '成功' ? 'success' : 'danger'">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="失败原因" min-width="200">
              <template #default="{ row }">
                <span :class="row.status === '失败' ? 'text-danger' : 'text-info'">{{ row.reason }}</span>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-container">
            <el-pagination background layout="total, prev, pager, next" :total="loginTotal" :page-size="20" />
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const activeTab = ref('operation')
const loading = ref(false)

// Operation Logs Data
const opLogs = ref([])
const opTotal = ref(0)
const opFilter = reactive({
  dateRange: [],
  user: '',
  module: '',
  type: ''
})

// Login Logs Data
const loginLogs = ref([])
const loginTotal = ref(0)
const loginFilter = reactive({
  dateRange: [],
  username: '',
  status: ''
})

const getOpTypeTag = (type: string) => {
  const map: Record<string, string> = {
    '新增': 'success',
    '编辑': 'warning',
    '删除': 'danger',
    '发布': '',
    '回滚': 'info'
  }
  return map[type] || ''
}

const fetchOpLogs = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/system/logs/operation', { params: opFilter })
    opLogs.value = res.data.data.list
    opTotal.value = res.data.data.total
  } finally {
    loading.value = false
  }
}

const fetchLoginLogs = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/system/logs/login', { params: loginFilter })
    loginLogs.value = res.data.data.list
    loginTotal.value = res.data.data.total
  } finally {
    loading.value = false
  }
}

const handleTabChange = (name: string) => {
  if (name === 'operation') fetchOpLogs()
  else fetchLoginLogs()
}

const handleExport = () => {
  ElMessage.success(`正在导出${activeTab.value === 'operation' ? '操作' : '登录'}日志为 CSV 文件...`)
}

onMounted(() => {
  fetchOpLogs()
})
</script>

<style scoped lang="scss">
.logs-container {
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

  .text-danger { color: #f56c6c; }
  .text-info { color: #909399; }
}
</style>
