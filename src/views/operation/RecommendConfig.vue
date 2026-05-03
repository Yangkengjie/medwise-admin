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

    <!-- Learning Suggestion Template Card -->
    <el-card class="config-card mb-20">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon><Calendar /></el-icon>
            <span>每日学习建议模板配置</span>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTemplateTab" type="border-card">
        <!-- Single Day Template -->
        <el-tab-pane label="单日学习模板" name="daily">
          <el-form :model="templateForm.daily" label-width="120px" class="template-form">
            <el-form-item label="建议科目">
              <el-select v-model="templateForm.daily.subjects" multiple placeholder="选择建议学习的课程" style="width: 100%">
                <el-option v-for="c in courseOptions" :key="c.id" :label="c.label" :value="c.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="建议时长">
              <el-input-number v-model="templateForm.daily.duration" :min="1" />
              <span class="ml-10">分钟</span>
            </el-form-item>
            <el-form-item label="内容比例">
              <div class="ratio-slider">
                <span class="label">新学 {{ 100 - templateForm.daily.reviewRatio }}%</span>
                <el-slider v-model="templateForm.daily.reviewRatio" :min="0" :max="100" class="slider" />
                <span class="label">复习 {{ templateForm.daily.reviewRatio }}%</span>
              </div>
            </el-form-item>
            <el-form-item label="建议内容描述">
              <el-input type="textarea" v-model="templateForm.daily.description" :rows="3" placeholder="例如：今日建议复习气血辨证章节" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- Weekly Template -->
        <el-tab-pane label="每周学习模板" name="weekly">
          <el-form :model="templateForm.weekly" label-width="120px" class="template-form">
            <el-form-item label="建议科目">
              <el-select v-model="templateForm.weekly.subjects" multiple placeholder="默认建议科目" style="width: 100%">
                <el-option v-for="c in courseOptions" :key="c.id" :label="c.label" :value="c.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="建议时长">
              <el-input-number v-model="templateForm.weekly.duration" :min="1" />
              <span class="ml-10">分钟</span>
            </el-form-item>
            
            <div class="weekly-strategies">
              <div class="strategy-header">每日策略分配</div>
              <el-table :data="templateForm.weekly.days" border size="small">
                <el-table-column prop="day" label="星期" width="100" align="center" />
                <el-table-column label="建议策略">
                  <template #default="{ row }">
                    <el-input v-model="row.strategy" size="small" placeholder="请输入该日的学习策略" />
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <el-form-item label="建议内容描述" class="mt-20">
              <el-input type="textarea" v-model="templateForm.weekly.description" :rows="2" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- Monthly Template -->
        <el-tab-pane label="每月学习模板" name="monthly">
          <el-form :model="templateForm.monthly" label-width="120px" class="template-form">
            <el-form-item label="建议科目">
              <el-select v-model="templateForm.monthly.subjects" multiple placeholder="全月核心科目" style="width: 100%">
                <el-option v-for="c in courseOptions" :key="c.id" :label="c.label" :value="c.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="建议时长">
              <el-input-number v-model="templateForm.monthly.duration" :min="1" />
              <span class="ml-10">分钟</span>
            </el-form-item>

            <div class="monthly-phases">
              <div class="phase-item">
                <div class="phase-label">月初侧重点 (1-10日)</div>
                <el-input v-model="templateForm.monthly.early" placeholder="如：新内容学习" />
              </div>
              <div class="phase-item">
                <div class="phase-label">月中侧重点 (11-20日)</div>
                <el-input v-model="templateForm.monthly.mid" placeholder="如：知识点串联" />
              </div>
              <div class="phase-item">
                <div class="phase-label">月末侧重点 (21-31日)</div>
                <el-input v-model="templateForm.monthly.late" placeholder="如：总复习与自测" />
              </div>
            </div>

            <el-form-item label="建议内容描述" class="mt-20">
              <el-input type="textarea" v-model="templateForm.monthly.description" :rows="2" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <div class="config-footer">
        <el-button type="success" size="large" icon="Check" @click="handleSaveTemplates">
          保存模板配置
        </el-button>
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
import { ref, computed, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Operation, View, Calendar, MagicStick, Check, RefreshLeft, CircleCheck } from '@element-plus/icons-vue'
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

interface CourseOption {
  id: number
  label: string
}

const strategies = ref<Strategy[]>([])
const previewUserId = ref('')
const previewLoading = ref(false)
const previewList = ref<PreviewItem[]>([])

const activeTemplateTab = ref('daily')
const courseOptions = ref<CourseOption[]>([])

const templateForm = reactive({
  daily: {
    subjects: [],
    duration: 30,
    reviewRatio: 50,
    description: ''
  },
  weekly: {
    subjects: [],
    duration: 200,
    description: '',
    days: [
      { day: '周一', strategy: '新课开启' },
      { day: '周二', strategy: '深度钻研' },
      { day: '周三', strategy: '难点攻克' },
      { day: '周四', strategy: '中期回顾' },
      { day: '周五', strategy: '扩展阅读' },
      { day: '周六', strategy: '专题自测' },
      { day: '周日', strategy: '周总结与休息' }
    ]
  },
  monthly: {
    subjects: [],
    duration: 1000,
    description: '',
    early: '基础知识构建',
    mid: '考点专项强化',
    late: '全真模拟与查漏补缺'
  }
})

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
    const [configRes, coursesRes, templatesRes] = await Promise.all([
      axios.get('/api/operation/recommend-config'),
      axios.get('/api/courses/tree'),
      axios.get('/api/operation/recommend-templates')
    ])
    strategies.value = configRes.data.data.strategies
    courseOptions.value = coursesRes.data.data.map((c: any) => ({ id: c.id, label: c.label }))
    if (templatesRes.data.data) {
      Object.assign(templateForm, templatesRes.data.data)
    }
  } catch (error) {
    console.error('Failed to fetch config:', error)
  }
}

const handleWeightChange = () => {
  // Logic could be added here to auto-balance
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

const handleSaveTemplates = async () => {
  try {
    await axios.post('/api/operation/recommend-templates/save', templateForm)
    ElMessage.success('每日学习建议模板已保存，将结合用户画像生成个性化建议')
  } catch (error) {
    ElMessage.error('保存模板失败')
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
      strategies: strategies.value,
      templates: templateForm
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

  .template-form {
    padding: 10px;
    .ratio-slider {
      display: flex;
      align-items: center;
      gap: 15px;
      width: 100%;
      .slider { flex: 1; }
      .label { font-size: 12px; color: #64748b; min-width: 60px; }
    }
  }

  .weekly-strategies {
    margin: 10px 0 20px 120px;
    .strategy-header {
      font-size: 14px;
      font-weight: bold;
      color: #475569;
      margin-bottom: 12px;
    }
  }

  .monthly-phases {
    margin: 10px 0 20px 120px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    .phase-label {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 8px;
    }
  }

  .ml-10 { margin-left: 10px; }
  .mt-20 { margin-top: 20px; }
}
</style>
