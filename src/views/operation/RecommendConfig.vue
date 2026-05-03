<template>
  <div class="recommend-config-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="title">学习推荐配置</h2>
        <p class="subtitle">配置每日学习建议的生成策略及其权重，优化用户个性化学习体验</p>
      </div>
    </div>

    <!-- Strategy Configuration Card -->
    <el-card class="config-card mb-20">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon><Operation /></el-icon>
            <span>每日学习建议策略配置</span>
          </div>
          <div class="total-weight" :class="{ 'weight-error': totalWeight !== 100 }">
            当前权重总和：<strong>{{ totalWeight }}%</strong>
            <span v-if="totalWeight !== 100" class="error-tip">
              （必须等于 100% 才能保存）
            </span>
            <el-icon v-else color="#67c23a" style="margin-left: 5px"><CircleCheck /></el-icon>
          </div>
        </div>
      </template>

      <div class="strategy-list">
        <div v-for="item in strategies" :key="item.id" class="strategy-item">
          <div class="strategy-main">
            <el-checkbox v-model="item.enabled" :label="item.label" size="large" />
            <div class="strategy-slider" v-if="item.enabled">
              <el-slider 
                v-model="item.weight" 
                :min="0" 
                :max="100" 
                :step="1"
                show-input
                input-size="small"
                @change="handleWeightChange"
              />
              <span class="weight-label">权重比例</span>
            </div>
            <div v-else class="strategy-disabled">策略已禁用</div>
          </div>
          <p class="strategy-desc">{{ getStrategyDesc(item.id) }}</p>
        </div>
      </div>

      <div class="config-footer">
        <el-button type="primary" size="large" icon="Check" :disabled="totalWeight !== 100" @click="handleSave">
          保存策略配置
        </el-button>
        <el-button size="large" icon="RefreshLeft" @click="fetchConfig">重置</el-button>
      </div>
    </el-card>

    <!-- Preview Area -->
    <el-card class="preview-card">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon><View /></el-icon>
            <span>推荐效果实时预览</span>
          </div>
        </div>
      </template>

      <div class="preview-search">
        <el-input
          v-model="previewUserId"
          placeholder="请输入用户 ID 进行模拟生成 (如: 12345)"
          style="width: 400px"
          clearable
        >
          <template #prepend>用户 ID</template>
        </el-input>
        <el-button type="success" icon="MagicStick" @click="handlePreview" :loading="previewLoading" style="margin-left: 12px">
          模拟生成今日建议
        </el-button>
      </div>

      <div class="preview-results" v-if="previewList.length > 0" v-loading="previewLoading">
        <div class="results-title">模拟生成结果：</div>
        <el-table :data="previewList" border stripe>
          <el-table-column label="推荐项" min-width="250">
            <template #default="{ row }">
              <div class="item-title">
                <el-tag size="small" :type="getTypeTag(row.type)" style="margin-right: 10px">
                  {{ getTypeText(row.type) }}
                </el-tag>
                <span>{{ row.title }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="reason" label="推荐理由" min-width="350">
            <template #default="{ row }">
              <span class="reason-text">{{ row.reason }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center">
            <template #default>
              <el-button link type="primary">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-empty v-else description="输入用户 ID 并点击按钮查看预览结果" :image-size="100" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

interface Strategy {
  id: string
  label: string
  enabled: boolean
  weight: number
}

interface PreviewItem {
  type: string
  title: string
  reason: string
}

const strategies = ref<Strategy[]>([])
const previewUserId = ref('')
const previewLoading = ref(false)
const previewList = ref<PreviewItem[]>([])

const totalWeight = computed(() => {
  return strategies.value
    .filter(s => s.enabled)
    .reduce((sum, s) => sum + s.weight, 0)
})

const getStrategyDesc = (id: string) => {
  const descs: Record<string, string> = {
    ebbinghaus: '根据科学的艾宾浩斯记忆曲线，自动安排已学知识点的复习频率。',
    weakness: '优先推送用户在测评和辨证训练中得分较低的知识模块。',
    exam: '结合用户设定的考研或考证目标，提升核心大纲知识点的出现频率。',
    exploration: '适当推送未曾接触过的新章节或跨学科知识点，拓宽学习视野。'
  }
  return descs[id] || ''
}

const getTypeText = (type: string) => {
  const map: Record<string, string> = {
    ebbinghaus: '遗忘复习',
    weakness: '薄弱强化',
    exam: '考点突破',
    exploration: '新学探索'
  }
  return map[type] || '其他'
}

const getTypeTag = (type: string) => {
  const map: Record<string, string> = {
    ebbinghaus: 'info',
    weakness: 'danger',
    exam: 'warning',
    exploration: 'success'
  }
  return map[type] || ''
}

const fetchConfig = async () => {
  try {
    const res = await axios.get('/api/operation/recommend-config')
    strategies.value = res.data.data.strategies
  } catch (error) {
    console.error('Failed to fetch config:', error)
  }
}

const handleWeightChange = () => {
  // Logic could be added here to auto-balance, but user requested manual configuration with validation
}

const handleSave = async () => {
  if (totalWeight.value !== 100) {
    ElMessage.error('权重总和必须等于 100%')
    return
  }
  try {
    await axios.post('/api/operation/recommend-config/save', strategies.value)
    ElMessage.success('推荐策略配置已保存')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const handlePreview = async () => {
  if (!previewUserId.value) {
    ElMessage.warning('请输入用户 ID')
    return
  }
  previewLoading.value = true
  try {
    const res = await axios.post('/api/operation/recommend-preview', {
      userId: previewUserId.value,
      strategies: strategies.value
    })
    previewList.value = res.data.data
  } catch (error) {
    ElMessage.error('生成预览失败')
  } finally {
    previewLoading.value = false
  }
}

onMounted(fetchConfig)
</script>

<style scoped lang="scss">
.recommend-config-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;

  .mb-20 { margin-bottom: 20px; }

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
    .header-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: bold;
      color: #1e293b;
      .el-icon { color: #1e3a8a; }
    }
    .total-weight {
      font-size: 14px;
      color: #64748b;
      strong {
        font-size: 18px;
        color: #1e3a8a;
        margin: 0 4px;
      }
      &.weight-error {
        color: #ef4444;
        strong { color: #ef4444; }
      }
      .error-tip { font-size: 12px; }
    }
  }

  .strategy-list {
    .strategy-item {
      padding: 20px;
      border-bottom: 1px solid #f1f5f9;
      &:last-child { border-bottom: none; }

      .strategy-main {
        display: flex;
        align-items: center;
        gap: 40px;
        margin-bottom: 8px;
        
        :deep(.el-checkbox) {
          width: 200px;
          margin-right: 0;
          .el-checkbox__label {
            font-weight: bold;
            font-size: 15px;
            color: #1e293b;
          }
        }

        .strategy-slider {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 20px;
          :deep(.el-slider) {
            flex: 1;
          }
          .weight-label {
            font-size: 12px;
            color: #94a3b8;
            white-space: nowrap;
          }
        }

        .strategy-disabled {
          flex: 1;
          font-size: 13px;
          color: #94a3b8;
          font-style: italic;
        }
      }

      .strategy-desc {
        font-size: 13px;
        color: #64748b;
        margin: 0;
        padding-left: 32px;
        line-height: 1.6;
      }
    }
  }

  .config-footer {
    padding: 30px 0 10px;
    display: flex;
    justify-content: center;
    gap: 20px;
  }

  .preview-search {
    display: flex;
    justify-content: center;
    margin-bottom: 30px;
    padding: 20px;
    background: #f8fafc;
    border-radius: 8px;
  }

  .preview-results {
    .results-title {
      font-size: 15px;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 16px;
    }
    .item-title {
      display: flex;
      align-items: center;
      font-weight: 500;
    }
    .reason-text {
      font-size: 13px;
      color: #64748b;
    }
  }
}
</style>
