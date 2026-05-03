<template>
  <div class="status-rules-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="title">每日学习状态等级配置</h2>
        <p class="subtitle">根据用户每日学习时长，自动匹配对应状态等级和趣味文案。</p>
      </div>
      <div class="header-actions">
        <el-button icon="RefreshRight" @click="handleRestoreDefault">恢复默认配置</el-button>
        <el-button type="primary" icon="Check" @click="handleSaveAll">保存配置</el-button>
      </div>
    </div>

    <el-card shadow="never" class="config-card">
      <template #header>
        <div class="card-header">
          <span>等级配置列表</span>
          <el-button type="primary" link icon="Plus" @click="handleAdd">新增等级</el-button>
        </div>
      </template>

      <el-table :data="statusList" border stripe v-loading="loading">
        <el-table-column label="等级" width="80" align="center">
          <template #default="scope">
            <span class="level-tag">LV.{{ scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="name" label="状态名称" width="150">
          <template #default="{ row }">
            <el-input v-model="row.name" placeholder="状态名称" />
          </template>
        </el-table-column>

        <el-table-column label="时长区间 (分钟)" min-width="280">
          <template #default="{ row, $index }">
            <div class="duration-range">
              <el-input-number 
                v-model="row.minDuration" 
                :min="0" 
                :controls="false"
                class="range-input"
                @change="handleDurationChange"
              />
              <span class="separator">至</span>
              <el-input-number 
                v-if="$index < statusList.length - 1"
                v-model="row.maxDuration" 
                :min="row.minDuration" 
                :controls="false"
                class="range-input"
                @change="handleDurationChange"
              />
              <span v-else class="no-limit">∞ (无上限)</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="description" label="状态趣味文案" min-width="300">
          <template #default="{ row }">
            <el-input v-model="row.description" placeholder="请输入趣味文案" />
          </template>
        </el-table-column>

        <el-table-column label="操作" width="100" align="center">
          <template #default="{ $index }">
            <el-button 
              link 
              type="danger" 
              icon="Delete" 
              @click="handleDelete($index)"
              :disabled="statusList.length <= 1"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="validation-tips" v-if="validationError">
        <el-alert :title="validationError" type="error" show-icon :closable="false" />
      </div>
    </el-card>

    <div class="preview-section">
      <div class="preview-title">用户端效果预览</div>
      <div class="preview-grid">
        <div v-for="(item, index) in statusList" :key="index" class="preview-card-item">
          <div class="item-icon">
            <el-icon v-if="index === 0"><IceTea /></el-icon>
            <el-icon v-else-if="index === 1"><Sugar /></el-icon>
            <el-icon v-else-if="index === 2"><Coffee /></el-icon>
            <el-icon v-else-if="index === 3"><Moon /></el-icon>
            <el-icon v-else><Sunrise /></el-icon>
          </div>
          <div class="item-content">
            <div class="item-name">{{ item.name || '未命名' }}</div>
            <div class="item-range">{{ item.minDuration }} - {{ index === statusList.length - 1 ? '∞' : item.maxDuration }} min</div>
            <div class="item-desc">“{{ item.description || '暂无文案' }}”</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Check, RefreshRight, IceTea, Sugar, Coffee, Moon, Sunrise } from '@element-plus/icons-vue'
import axios from 'axios'

interface StatusLevel {
  id?: number | string
  name: string
  minDuration: number
  maxDuration: number | null
  description: string
}

const loading = ref(false)
const statusList = ref<StatusLevel[]>([])
const validationError = ref('')

const defaultLevels: StatusLevel[] = [
  { name: '浮生偷闲', minDuration: 0, maxDuration: 14, description: '偷得浮生一刻闲' },
  { name: '渐入佳境', minDuration: 15, maxDuration: 44, description: '我要学习喵！' },
  { name: '腹有初藏', minDuration: 45, maxDuration: 89, description: '我爱学习喵！' },
  { name: '青灯伴卷', minDuration: 90, maxDuration: 149, description: '书山学海，黄卷青灯' },
  { name: '高歌夜半雪压庐', minDuration: 150, maxDuration: null, description: '读书之乐何处寻，数点梅花天地心' }
]

const fetchData = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/achievement/status-rules')
    if (res.data.data && res.data.data.length > 0) {
      statusList.value = res.data.data
    } else {
      statusList.value = JSON.parse(JSON.stringify(defaultLevels))
    }
  } catch (error) {
    statusList.value = JSON.parse(JSON.stringify(defaultLevels))
  } finally {
    loading.value = false
  }
}

const handleDurationChange = () => {
  statusList.value.sort((a, b) => a.minDuration - b.minDuration)
  validateRules()
}

const validateRules = () => {
  validationError.value = ''
  for (let i = 0; i < statusList.value.length; i++) {
    const current = statusList.value[i]
    
    // 校验 min < max
    if (current.maxDuration !== null && current.minDuration >= current.maxDuration) {
      validationError.value = `等级 ${i + 1} 的最低时长不能大于或等于最高时长`
      return false
    }

    // 校验区间重叠
    if (i > 0) {
      const prev = statusList.value[i - 1]
      if (prev.maxDuration !== null && current.minDuration <= prev.maxDuration) {
        validationError.value = `等级 ${i} 与等级 ${i + 1} 的时长区间存在重叠`
        return false
      }
    }
  }
  return true
}

const handleAdd = () => {
  const lastLevel = statusList.value[statusList.value.length - 1]
  const newMin = (lastLevel.maxDuration || lastLevel.minDuration) + 1
  
  // 将原最后一个等级变为有限区间
  if (lastLevel.maxDuration === null) {
    lastLevel.maxDuration = newMin + 29
  }

  statusList.value.push({
    id: Date.now(),
    name: '新等级',
    minDuration: newMin + 30,
    maxDuration: null,
    description: '新等级文案'
  })
  handleDurationChange()
}

const handleDelete = (index: number) => {
  statusList.value.splice(index, 1)
  // 确保最后一个等级始终是无上限
  if (statusList.value.length > 0) {
    statusList.value[statusList.value.length - 1].maxDuration = null
  }
  handleDurationChange()
}

const handleRestoreDefault = () => {
  ElMessageBox.confirm('确定要恢复默认的 5 个等级配置吗？当前修改将丢失。', '恢复默认').then(() => {
    statusList.value = JSON.parse(JSON.stringify(defaultLevels))
    validateRules()
    ElMessage.success('已恢复默认配置')
  })
}

const handleSaveAll = async () => {
  if (!validateRules()) {
    ElMessage.error(validationError.value)
    return
  }
  
  try {
    await axios.post('/api/achievement/status-rules/save', statusList.value)
    ElMessage.success('状态等级规则已保存并生效')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

onMounted(fetchData)
</script>

<style scoped lang="scss">
.status-rules-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    .title { font-size: 24px; color: #1e3a8a; margin: 0 0 8px 0; }
    .subtitle { color: #64748b; margin: 0; font-size: 14px; }
  }

  .config-card {
    margin-bottom: 30px;
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: bold;
    }
  }

  .level-tag {
    background: #eff6ff;
    color: #1e3a8a;
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: bold;
    font-size: 12px;
  }

  .duration-range {
    display: flex;
    align-items: center;
    gap: 12px;
    .range-input { width: 100px; }
    .separator { color: #94a3b8; font-size: 13px; }
    .no-limit { color: #3b82f6; font-weight: bold; font-size: 13px; }
  }

  .validation-tips { margin-top: 20px; }

  .preview-section {
    background: #f8fafc;
    padding: 30px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;

    .preview-title {
      font-weight: bold;
      color: #334155;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      &::before {
        content: "";
        width: 4px;
        height: 18px;
        background: #1e3a8a;
        margin-right: 10px;
        border-radius: 2px;
      }
    }

    .preview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 20px;
    }

    .preview-card-item {
      background: #fff;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
      text-align: center;
      transition: transform 0.2s;
      &:hover { transform: translateY(-5px); }

      .item-icon {
        font-size: 32px;
        color: #3b82f6;
        margin-bottom: 12px;
      }
      .item-name { font-weight: bold; color: #1e293b; margin-bottom: 6px; }
      .item-range { font-size: 12px; color: #64748b; margin-bottom: 10px; }
      .item-desc { font-size: 13px; color: #475569; font-style: italic; line-height: 1.4; }
    }
  }
}

:deep(.el-input-number .el-input__inner) { text-align: center; }
</style>

