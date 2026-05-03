<template>
  <div class="status-rules-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">每日学习状态等级配置</span>
            <p class="subtitle">定义不同学习投入度对应的状态等级，影响用户端“今日学习状态”展示</p>
          </div>
          <el-button type="primary" icon="Plus" @click="handleAdd">新增等级</el-button>
        </div>
      </template>

      <el-alert
        title="规则说明：列表已根据“最低学习时长”和“连续天数”自动从小到大排序。系统在计算时将从高等级向低等级匹配，用户满足的首个最高等级即为今日状态。"
        type="info"
        show-icon
        :closable="false"
        style="margin-bottom: 20px"
      />

      <el-table :data="statusList" border stripe v-loading="loading" class="custom-table">
        <el-table-column type="index" label="等级权重" width="100" align="center">
          <template #default="scope">
            <div class="level-badge" :class="'level-' + (scope.$index % 5)">
              LV.{{ scope.$index + 1 }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="状态名称" min-width="180">
          <template #default="{ row }">
            <div class="status-name-wrapper">
              <el-icon class="status-icon"><Monitor /></el-icon>
              <span class="status-name">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="minDuration" label="所需最低学习时长" width="220" align="center">
          <template #header>
            <div class="column-header">
              <span>最低学习时长</span>
              <el-tooltip content="单日累计有效学习时长（分钟）">
                <el-icon><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <template #default="{ row }">
            <span class="highlight-val">{{ row.minDuration }}</span>
            <span class="unit"> 分钟</span>
          </template>
        </el-table-column>
        <el-table-column prop="days" label="所需连续学习天数" width="220" align="center">
          <template #header>
            <div class="column-header">
              <span>连续学习天数</span>
              <el-tooltip content="需连续达到时长要求的最低天数">
                <el-icon><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <template #default="{ row }">
            <span class="highlight-val">{{ row.days }}</span>
            <span class="unit"> 天</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-divider direction="vertical" />
            <el-button link type="danger" icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="preview-card" v-if="statusList.length > 0">
        <div class="preview-title">用户端预览效果 (模拟)</div>
        <div class="status-display-grid">
          <div v-for="(item, index) in statusList.slice(0, 3)" :key="index" class="preview-item">
            <div class="preview-label">今日状态：{{ item.name }}</div>
            <div class="preview-desc">已连续学习 {{ item.days }} 天，今日时长 {{ item.minDuration }}min</div>
            <div class="preview-progress">
              <div class="progress-bar" :style="{ width: (index + 1) * 30 + '%', backgroundColor: '#1e3a8a' }"></div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Status Level Dialog -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑状态等级' : '新增状态等级'" width="450px">
      <el-form :model="form" label-width="120px" ref="formRef" :rules="rules">
        <el-form-item label="状态名称" prop="name">
          <el-input v-model="form.name" placeholder="如：融会贯通" />
        </el-form-item>
        <el-form-item label="最低学习时长" prop="minDuration">
          <el-input-number v-model="form.minDuration" :min="1" :max="1440" style="width: 100%" />
          <p class="input-hint">单日累计学习时长（分钟）</p>
        </el-form-item>
        <el-form-item label="连续学习天数" prop="days">
          <el-input-number v-model="form.days" :min="1" :max="365" style="width: 100%" />
          <p class="input-hint">需连续达标的天数要求</p>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认并生效</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const loading = ref(false)
const statusList = ref<any[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()

const form = ref({
  id: null,
  name: '',
  minDuration: 30,
  days: 1
})

const rules = {
  name: [{ required: true, message: '请输入状态名称', trigger: 'blur' }],
  minDuration: [{ required: true, message: '请输入最低时长', trigger: 'blur' }],
  days: [{ required: true, message: '请输入连续天数', trigger: 'blur' }]
}

const fetchStatusLevels = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/achievement/status-levels')
    // Ensure frontend also handles sorting to be safe
    statusList.value = res.data.data.sort((a: any, b: any) => 
      a.minDuration - b.minDuration || a.days - b.days
    )
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  form.value = { id: null, name: '', minDuration: 30, days: 1 }
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确定删除等级“${row.name}”吗？此操作将导致依赖此规则的等级计算失效。`, '警告', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await axios.delete(`/api/achievement/status-levels/${row.id}`)
    ElMessage.success('等级已移除')
    fetchStatusLevels()
  })
}

const submitForm = async () => {
  await formRef.value.validate()
  await axios.post('/api/achievement/status-levels/save', form.value)
  ElMessage.success('配置已更新，全局缓存已刷新')
  dialogVisible.value = false
  fetchStatusLevels()
}

onMounted(fetchStatusLevels)
</script>

<style scoped lang="scss">
.status-rules-container {
  max-width: 1100px;
  margin: 0 auto;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    .title {
      font-size: 18px;
      font-weight: bold;
      color: #1e3a8a;
      display: block;
      margin-bottom: 4px;
    }
    .subtitle {
      font-size: 13px;
      color: #909399;
      margin: 0;
    }
  }

  .status-name {
    font-weight: bold;
    color: #303133;
  }

  .status-name-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    .status-icon {
      color: #1e3a8a;
      font-size: 16px;
    }
  }

  .level-badge {
    width: 60px;
    height: 24px;
    line-height: 24px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
    color: #fff;
    margin: 0 auto;
    
    &.level-0 { background-color: #909399; }
    &.level-1 { background-color: #409eff; }
    &.level-2 { background-color: #67c23a; }
    &.level-3 { background-color: #e6a23c; }
    &.level-4 { background-color: #f56c6c; }
  }

  .column-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    .el-icon {
      font-size: 14px;
      color: #909399;
      cursor: help;
    }
  }

  .highlight-val {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 16px;
    font-weight: bold;
    color: #1e3a8a;
  }

  .unit {
    font-size: 12px;
    color: #909399;
  }

  .preview-card {
    margin-top: 30px;
    padding: 20px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px dashed #cbd5e1;

    .preview-title {
      font-size: 14px;
      font-weight: bold;
      color: #64748b;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      &::before {
        content: "";
        width: 4px;
        height: 14px;
        background: #1e3a8a;
        margin-right: 8px;
        border-radius: 2px;
      }
    }

    .status-display-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }

    .preview-item {
      background: #fff;
      padding: 15px;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      
      .preview-label {
        font-size: 15px;
        font-weight: bold;
        color: #1e3a8a;
        margin-bottom: 8px;
      }
      
      .preview-desc {
        font-size: 12px;
        color: #64748b;
        margin-bottom: 12px;
      }

      .preview-progress {
        height: 6px;
        background: #f1f5f9;
        border-radius: 3px;
        overflow: hidden;
        .progress-bar {
          height: 100%;
          transition: width 0.3s ease;
        }
      }
    }
  }

  .input-hint {
    font-size: 12px;
    color: #a8abb2;
    margin: 4px 0 0;
    line-height: 1;
  }
}
</style>
