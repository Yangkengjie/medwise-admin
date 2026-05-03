<template>
  <div class="user-profile-container">
    <!-- Stats Cards -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6" v-for="item in stats" :key="item.label">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="label">{{ item.label }}</div>
            <div class="value">{{ item.value.toLocaleString() }}</div>
          </div>
          <el-icon class="stat-icon" :style="{ color: item.color }"><component :is="item.icon" /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <!-- User List Table -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <div class="filter-form">
            <el-input v-model="filter.nickname" placeholder="昵称" clearable style="width: 150px" />
            <el-select v-model="filter.school" placeholder="所属学校" clearable style="width: 180px">
              <el-option label="北京中医药大学" value="北京中医药大学" />
              <el-option label="上海中医药大学" value="上海中医药大学" />
              <el-option label="广州中医药大学" value="广州中医药大学" />
            </el-select>
            <el-select v-model="filter.grade" placeholder="年级" clearable style="width: 120px">
              <el-option v-for="g in ['2021级', '2022级', '2023级', '2024级']" :key="g" :label="g" :value="g" />
            </el-select>
            <el-date-picker
              v-model="filter.regTimeRange"
              type="daterange"
              range-separator="至"
              start-placeholder="注册开始"
              end-placeholder="注册结束"
              style="width: 260px"
            />
            <el-button type="primary" icon="Search" @click="fetchUserList">查询</el-button>
          </div>
        </div>
      </template>

      <el-table :data="userList" v-loading="loading" border stripe>
        <el-table-column prop="nickname" label="昵称" min-width="150" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="school" label="学校" min-width="180" />
        <el-table-column prop="grade" label="年级" width="100" align="center" />
        <el-table-column prop="major" label="专业" width="120" />
        <el-table-column prop="phone" label="手机号" width="120" align="center" />
        <el-table-column prop="regTime" label="注册时间" width="120" align="center" />
        <el-table-column prop="lastActive" label="最近活跃" width="160" align="center" />
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDetail(row)">查看详情</el-button>
            <el-button link type="danger" @click="handleFix(row)">资料修正</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="fetchUserList"
        />
      </div>
    </el-card>

    <!-- User Detail Drawer -->
    <el-drawer
      v-model="drawerVisible"
      title="用户档案详情"
      size="500px"
      destroy-on-close
    >
      <div v-if="userDetail" class="user-detail-content">
        <div class="detail-section">
          <h4 class="section-title">个人基础资料</h4>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="昵称">{{ userDetail.nickname }}</el-descriptions-item>
            <el-descriptions-item label="姓名">{{ userDetail.name }}</el-descriptions-item>
            <el-descriptions-item label="性别">{{ userDetail.gender }}</el-descriptions-item>
            <el-descriptions-item label="生日">{{ userDetail.birthday }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ userDetail.phone }}</el-descriptions-item>
            <el-descriptions-item label="电子邮箱">{{ userDetail.email }}</el-descriptions-item>
            <el-descriptions-item label="所属院校">{{ userDetail.school }}</el-descriptions-item>
            <el-descriptions-item label="专业年级">{{ userDetail.major }} / {{ userDetail.grade }}</el-descriptions-item>
            <el-descriptions-item label="个人简介">{{ userDetail.intro }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section mt-20">
          <h4 class="section-title">学习偏好设置</h4>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="学习模式">
              <el-tag>{{ userDetail.preferences.studyMode }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="关注领域">
              <el-tag v-for="area in userDetail.preferences.focusArea" :key="area" size="small" class="mr-4">{{ area }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="每日目标">{{ userDetail.preferences.dailyGoal }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-drawer>

    <!-- Fix Dialog -->
    <el-dialog v-model="fixDialogVisible" title="资料违规修正" width="400px">
      <el-form :model="fixForm" label-width="80px">
        <el-form-item label="昵称">
          <el-input v-model="fixForm.nickname" placeholder="请输入修正后的昵称" />
        </el-form-item>
        <el-form-item label="个人简介">
          <el-input type="textarea" v-model="fixForm.intro" :rows="3" placeholder="如涉及违规可在此清空或修改" />
        </el-form-item>
        <el-alert
          title="修正操作将直接更新用户资料，请确认内容符合社区规范。"
          type="info"
          show-icon
          :closable="false"
        />
      </el-form>
      <template #footer>
        <el-button @click="fixDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitFix">确认修正</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const loading = ref(false)
const stats = ref([
  { label: '总用户数', value: 0, icon: 'User', color: '#409eff' },
  { label: '今日新增', value: 0, icon: 'Plus', color: '#67c23a' },
  { label: '活跃用户', value: 0, icon: 'TrendCharts', color: '#e6a23c' },
  { label: '院校分布', value: 0, icon: 'School', color: '#f56c6c' }
])

const filter = ref({
  nickname: '',
  school: '',
  grade: '',
  regTimeRange: []
})

const userList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const fetchStats = async () => {
  const res = await axios.get('/api/users/stats')
  const { totalUsers, todayNew, activeUsers, collegeCount } = res.data.data
  stats.value[0].value = totalUsers
  stats.value[1].value = todayNew
  stats.value[2].value = activeUsers
  stats.value[3].value = collegeCount
}

const fetchUserList = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/users/list', { params: { ...filter.value, page: currentPage.value } })
    userList.value = res.data.data.list
    total.value = res.data.data.total
  } finally {
    loading.value = false
  }
}

// Detail Drawer
const drawerVisible = ref(false)
const userDetail = ref<any>(null)
const handleDetail = async (row: any) => {
  const res = await axios.get(`/api/users/detail/${row.id}`)
  userDetail.value = res.data.data
  drawerVisible.value = true
}

// Fix Dialog
const fixDialogVisible = ref(false)
const fixForm = ref({ id: null, nickname: '', intro: '' })
const handleFix = (row: any) => {
  fixForm.value = { id: row.id, nickname: row.nickname, intro: row.intro || '' }
  fixDialogVisible.value = true
}
const submitFix = async () => {
  await axios.post('/api/users/update', fixForm.value)
  ElMessage.success('资料已修正，已实时生效')
  fixDialogVisible.value = false
  fetchUserList()
}

onMounted(() => {
  fetchStats()
  fetchUserList()
})
</script>

<style scoped lang="scss">
.user-profile-container {
  .stats-row {
    margin-bottom: 20px;
    .stat-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      .stat-content {
        .label { font-size: 14px; color: #909399; margin-bottom: 8px; }
        .value { font-size: 24px; font-weight: bold; color: #303133; }
      }
      .stat-icon { font-size: 36px; opacity: 0.8; }
    }
  }

  .filter-form {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .user-detail-content {
    .section-title {
      border-left: 4px solid #1e3a8a;
      padding-left: 10px;
      margin-bottom: 15px;
      color: #333;
    }
    .mt-20 { margin-top: 20px; }
    .mr-4 { margin-right: 4px; }
  }
}
</style>
