<template>
  <div class="interaction-behavior-container">
    <el-card class="box-card">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- Tab 1: Collection Behavior Management -->
        <el-tab-pane label="收藏行为管理" name="favorites">
          <el-row :gutter="20" class="stats-row">
            <el-col :span="8">
              <el-card shadow="never" class="stat-card">
                <div class="stat-content">
                  <div class="label">总收藏数</div>
                  <div class="value">{{ favoriteStats.total }}</div>
                </div>
                <el-icon class="stat-icon" color="#409eff"><Star /></el-icon>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="never" class="stat-card">
                <div class="stat-content">
                  <div class="label">收藏评论数</div>
                  <div class="value">{{ favoriteStats.comments }}</div>
                </div>
                <el-icon class="stat-icon" color="#67c23a"><ChatLineSquare /></el-icon>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="never" class="stat-card">
                <div class="stat-content">
                  <div class="label">收藏 AI 回答数</div>
                  <div class="value">{{ favoriteStats.aiAnswers }}</div>
                </div>
                <el-icon class="stat-icon" color="#e6a23c"><Cpu /></el-icon>
              </el-card>
            </el-col>
          </el-row>

          <div class="filter-header mt-20">
            <el-form :inline="true" :model="favoriteFilter">
              <el-form-item label="用户昵称">
                <el-input v-model="favoriteFilter.nickname" placeholder="输入昵称搜索" clearable style="width: 200px" />
              </el-form-item>
              <el-form-item label="收藏类型">
                <el-select v-model="favoriteFilter.type" placeholder="全部" clearable style="width: 150px">
                  <el-option label="评论" value="评论" />
                  <el-option label="AI回答" value="AI回答" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" icon="Search" @click="fetchFavorites">查询</el-button>
              </el-form-item>
            </el-form>
          </div>

          <el-table :data="favoriteList" border stripe v-loading="loadingFavorites">
            <el-table-column prop="nickname" label="用户昵称" width="150" />
            <el-table-column prop="type" label="收藏类型" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="row.type === '评论' ? 'info' : 'warning'">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="summary" label="收藏内容摘要" min-width="300" show-overflow-tooltip />
            <el-table-column prop="time" label="收藏时间" width="180" align="center" />
          </el-table>
        </el-tab-pane>

        <!-- Tab 2: Comment Behavior Management -->
        <el-tab-pane label="评论行为管理" name="comments">
          <div class="filter-header">
            <el-form :inline="true" :model="commentFilter">
              <el-form-item label="用户昵称">
                <el-input v-model="commentFilter.nickname" placeholder="输入昵称搜索" clearable style="width: 200px" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" icon="Search" @click="fetchComments">查询</el-button>
              </el-form-item>
            </el-form>
          </div>

          <el-table
            :data="commentList"
            border
            stripe
            v-loading="loadingComments"
            :row-class-name="tableRowClassName"
          >
            <el-table-column prop="nickname" label="用户昵称" width="150" />
            <el-table-column prop="content" label="评论内容" min-width="250" show-overflow-tooltip />
            <el-table-column prop="target" label="所在知识点/课程" min-width="200" />
            <el-table-column prop="time" label="评论时间" width="160" align="center" />
            <el-table-column prop="likes" label="点赞数" width="100" align="center" sortable />
            <el-table-column prop="reports" label="被举报次数" width="120" align="center" sortable>
              <template #default="{ row }">
                <el-badge :value="row.reports" :hidden="row.reports === 0" type="danger">
                  <span>{{ row.reports }}</span>
                </el-badge>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" fixed="right" align="center">
              <template #default="{ row }">
                <el-button link type="primary" @click="handleCommentDetail(row)">详情</el-button>
                <el-button link type="primary">置顶</el-button>
                <el-button link type="danger" @click="handleHideComment(row)">隐藏</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- Comment Detail Dialog -->
    <el-dialog v-model="commentDetailVisible" title="评论详细信息" width="500px">
      <div v-if="currentComment" class="comment-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="发布者">{{ currentComment.nickname }}</el-descriptions-item>
          <el-descriptions-item label="发布时间">{{ currentComment.time }}</el-descriptions-item>
          <el-descriptions-item label="归属目标">{{ currentComment.target }}</el-descriptions-item>
          <el-descriptions-item label="互动数据">
            点赞 {{ currentComment.likes }} | 举报 {{ currentComment.reports }}
          </el-descriptions-item>
          <el-descriptions-item label="评论正文">
            <div class="comment-text">{{ currentComment.content }}</div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const activeTab = ref('favorites')

// Tab 1: Favorites
const loadingFavorites = ref(false)
const favoriteStats = ref({ total: 0, comments: 0, aiAnswers: 0 })
const favoriteFilter = ref({ nickname: '', type: '' })
const favoriteList = ref([])

const fetchFavoriteStats = async () => {
  const res = await axios.get('/api/interaction/favorites/stats')
  favoriteStats.value = res.data.data
}

const fetchFavorites = async () => {
  loadingFavorites.value = true
  try {
    const res = await axios.get('/api/interaction/favorites/list', { params: favoriteFilter.value })
    favoriteList.value = res.data.data.list
  } finally {
    loadingFavorites.value = false
  }
}

// Tab 2: Comments
const loadingComments = ref(false)
const commentFilter = ref({ nickname: '' })
const commentList = ref([])

const fetchComments = async () => {
  loadingComments.value = true
  try {
    const res = await axios.get('/api/interaction/comments/list', { params: commentFilter.value })
    commentList.value = res.data.data.list
  } finally {
    loadingComments.value = false
  }
}

const tableRowClassName = ({ row }: { row: any }) => {
  if (row.reports > 0) {
    return 'warning-row'
  }
  return ''
}

const commentDetailVisible = ref(false)
const currentComment = ref<any>(null)
const handleCommentDetail = (row: any) => {
  currentComment.value = row
  commentDetailVisible.value = true
}

const handleHideComment = (row: any) => {
  ElMessageBox.confirm(`确定要隐藏该评论吗？隐藏后用户将不可见。`, '提示', {
    type: 'warning'
  }).then(() => {
    ElMessage.success('评论已隐藏')
    fetchComments()
  })
}

onMounted(() => {
  fetchFavoriteStats()
  fetchFavorites()
  fetchComments()
})
</script>

<style scoped lang="scss">
.interaction-behavior-container {
  .stats-row {
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

  .mt-20 { margin-top: 20px; }

  .comment-detail {
    .comment-text {
      line-height: 1.6;
      color: #333;
      white-space: pre-wrap;
    }
  }
}

:deep(.warning-row) {
  --el-table-tr-bg-color: #fef0f0;
}
</style>
