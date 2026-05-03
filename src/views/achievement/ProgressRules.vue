<template>
  <div class="progress-rules-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="title">进度规则管理</h2>
        <p class="subtitle">配置学习、复习、掌握的计算口径及展示层级</p>
      </div>
      <el-button type="primary" size="large" icon="Check" @click="handleSave">保存全局配置</el-button>
    </div>

    <!-- 卡片1: 课程进度计算口径配置 -->
    <el-card class="config-card mb-20" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon><Calendar /></el-icon>
            <span>课程进度计算口径配置</span>
          </div>
          <el-button type="primary" link @click="handleBatchSetup">
            <el-icon class="mr-4"><Setting /></el-icon>应用到全部课程
          </el-button>
        </div>
      </template>

      <el-table :data="courseRules" border stripe v-loading="loading" class="rule-table">
        <el-table-column prop="name" label="课程名称" min-width="180" fixed="left" />
        
        <el-table-column label="学习完成判定" align="center">
          <template #default="{ row }">
            <div class="threshold-input">
              <span>大纲停留 ≥</span>
              <el-input-number 
                v-model="row.learningThreshold" 
                :min="1" 
                :max="3600" 
                size="small"
                controls-position="right"
              />
              <span>秒</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="复习完成判定" align="center" width="180">
          <template #default="{ row }">
            <el-switch
              v-model="row.reviewComplete"
              active-text="启用"
              inactive-text="关闭"
              inline-prompt
            />
            <span class="column-hint">标记复习按钮</span>
          </template>
        </el-table-column>

        <el-table-column label="掌握完成判定" align="center" width="180">
          <template #default="{ row }">
            <el-switch
              v-model="row.masteryComplete"
              active-text="启用"
              inactive-text="关闭"
              inline-prompt
            />
            <span class="column-hint">掌握状态标记</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 卡片2: 进度展示层级配置 -->
    <el-card class="config-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon><View /></el-icon>
            <span>进度展示层级配置</span>
          </div>
        </div>
      </template>

      <div class="display-config-content">
        <div class="config-item">
          <div class="item-label">1. 展示层级开关</div>
          <div class="level-switches">
            <div v-for="level in displayConfig.levels" :key="level.id" class="level-box">
              <span class="level-name">{{ level.label }}</span>
              <el-switch v-model="level.enabled" />
            </div>
          </div>
        </div>

        <el-divider />

        <div class="config-item">
          <div class="item-label">2. 进度展示字段</div>
          <el-checkbox-group v-model="displayConfig.fields" class="mb-20">
            <el-checkbox label="learning">学习进度</el-checkbox>
            <el-checkbox label="review">复习进度</el-checkbox>
            <el-checkbox label="mastery">掌握进度</el-checkbox>
          </el-checkbox-group>
          
          <div class="item-sub-label">展示模式</div>
          <el-radio-group v-model="displayConfig.mergeMode">
            <el-radio label="independent">独立显示百分比</el-radio>
            <el-radio label="merged">合并为综合进度</el-radio>
          </el-radio-group>
          <div class="mode-hint" v-if="displayConfig.mergeMode === 'merged'">
            * 综合进度将根据已勾选字段的加权平均值计算展示
          </div>
        </div>
      </div>
    </el-card>

    <!-- 批量设置弹窗 -->
    <el-dialog v-model="batchDialogVisible" title="批量设置计算口径" width="450px">
      <el-form label-width="120px">
        <el-form-item label="大纲停留阈值">
          <el-input-number v-model="batchForm.learningThreshold" :min="1" controls-position="right" />
          <span class="ml-10">秒</span>
        </el-form-item>
        <el-form-item label="复习完成判定">
          <el-switch v-model="batchForm.reviewComplete" />
        </el-form-item>
        <el-form-item label="掌握完成判定">
          <el-switch v-model="batchForm.masteryComplete" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmBatchSetup">应用到所有课程</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Calendar, View, Setting } from '@element-plus/icons-vue'
import axios from 'axios'

interface CourseRule {
  id: number
  name: string
  learningThreshold: number
  reviewComplete: boolean
  masteryComplete: boolean
}

interface DisplayLevel {
  id: string
  label: string
  enabled: boolean
}

interface DisplayConfig {
  levels: DisplayLevel[]
  fields: string[]
  mergeMode: 'independent' | 'merged'
}

const loading = ref(false)
const courseRules = ref<CourseRule[]>([])
const displayConfig = reactive<DisplayConfig>({
  levels: [
    { id: 'subject', label: '单个科目', enabled: true },
    { id: 'tcm', label: '中医总体', enabled: true },
    { id: 'wm', label: '西医总体', enabled: true },
    { id: 'overall', label: '总体', enabled: true }
  ],
  fields: ['learning', 'review', 'mastery'],
  mergeMode: 'independent'
})

// 批量设置逻辑
const batchDialogVisible = ref(false)
const batchForm = reactive({
  learningThreshold: 30,
  reviewComplete: true,
  masteryComplete: true
})

const handleBatchSetup = () => {
  batchDialogVisible.value = true
}

const confirmBatchSetup = () => {
  courseRules.value.forEach(row => {
    row.learningThreshold = batchForm.learningThreshold
    row.reviewComplete = batchForm.reviewComplete
    row.masteryComplete = batchForm.masteryComplete
  })
  batchDialogVisible.value = false
  ElMessage.success('已批量更新所有课程配置')
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/achievement/progress-rules')
    if (res.data.data.courseRules) {
      courseRules.value = res.data.data.courseRules
      Object.assign(displayConfig, res.data.data.displayConfig)
    } else {
      // 降级处理，获取课程列表并初始化默认规则
      const courseRes = await axios.get('/api/courses/list')
      courseRules.value = courseRes.data.data.list.map((c: any) => ({
        id: c.id,
        name: c.title,
        learningThreshold: 30,
        reviewComplete: true,
        masteryComplete: true
      }))
    }
  } catch (error) {
    console.error('Failed to fetch data', error)
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  try {
    await axios.post('/api/achievement/progress-rules/save', {
      courseRules: courseRules.value,
      displayConfig
    })
    ElMessage.success('进度规则配置已保存，全局生效')
  } catch (error) {
    ElMessage.error('保存失败，请稍后重试')
  }
}

onMounted(fetchData)
</script>

<style scoped lang="scss">
.progress-rules-container {
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
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      .header-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: bold;
        color: #334155;
        .el-icon { color: #3b82f6; }
      }
    }
  }

  .rule-table {
    .threshold-input {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      .el-input-number { width: 90px; }
    }
    .column-hint {
      display: block;
      font-size: 12px;
      color: #94a3b8;
      margin-top: 4px;
    }
  }

  .display-config-content {
    padding: 10px;
    
    .config-item {
      .item-label {
        font-weight: bold;
        color: #475569;
        margin-bottom: 20px;
      }
      .item-sub-label {
        font-size: 14px;
        color: #64748b;
        margin-bottom: 12px;
      }
    }

    .level-switches {
      display: flex;
      flex-wrap: wrap;
      gap: 30px;
      
      .level-box {
        background: #f8fafc;
        padding: 15px 25px;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        border: 1px solid #f1f5f9;
        min-width: 120px;
        
        .level-name {
          font-weight: 500;
          color: #334155;
        }
      }
    }

    .mode-hint {
      font-size: 12px;
      color: #3b82f6;
      margin-top: 10px;
      background: #eff6ff;
      padding: 8px 12px;
      border-radius: 4px;
      display: inline-block;
    }
  }

  .mb-20 { margin-bottom: 20px; }
  .mr-4 { margin-right: 4px; }
  .ml-10 { margin-left: 10px; }
}
</style>

