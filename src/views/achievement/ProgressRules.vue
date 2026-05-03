<template>
  <div class="progress-rules-container">
    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <span class="title">课程进度计算配置</span>
          <el-tag type="info">定义学习进度的计算口径</el-tag>
        </div>
      </template>

      <el-form :model="rulesForm" label-position="top" class="rules-form">
        <!-- 学习完成配置 -->
        <div class="config-section">
          <h4 class="section-title">1. 学习完成判定</h4>
          <p class="section-desc">满足以下任一条件即视为该知识点“已学习”</p>
          
          <el-form-item label="视频观看比例 (达到视频总时长的百分比)">
            <div class="slider-with-input">
              <el-slider v-model="rulesForm.videoPercent" :min="0" :max="100" class="slider" />
              <el-input-number v-model="rulesForm.videoPercent" :min="0" :max="100" controls-position="right" class="input-num" />
              <span class="unit">%</span>
            </div>
          </el-form-item>

          <el-form-item label="大纲停留时长 (在详情页面的连续停留秒数)">
            <div class="slider-with-input">
              <el-slider v-model="rulesForm.outlineSeconds" :min="5" :max="300" class="slider" />
              <el-input-number v-model="rulesForm.outlineSeconds" :min="5" :max="300" controls-position="right" class="input-num" />
              <span class="unit">秒</span>
            </div>
          </el-form-item>
        </div>

        <el-divider />

        <!-- 复习完成配置 -->
        <div class="config-section">
          <h4 class="section-title">2. 复习完成判定</h4>
          <p class="section-desc">主动点击“复习”按钮并完成一次标记更新</p>
          <el-form-item>
            <el-checkbox v-model="rulesForm.reviewActive" label="启用复习行为记录" size="large" border />
            <p class="hint">开启后，系统将追踪用户的复习点击流并计入周期复习进度</p>
          </el-form-item>
        </div>

        <el-divider />

        <!-- 掌握完成配置 -->
        <div class="config-section">
          <h4 class="section-title">3. 掌握完成判定</h4>
          <p class="section-desc">知识点最终状态标记为“掌握”</p>
          <el-form-item>
            <el-checkbox v-model="rulesForm.masteryRequired" label="强制要求掌握标记" size="large" border />
            <p class="hint">开启后，仅完成学习不代表掌握，必须用户手动或通过测评将其标记为“掌握”</p>
          </el-form-item>
        </div>

        <div class="footer-actions">
          <el-button type="primary" size="large" icon="Check" @click="handleSave">保存全局配置</el-button>
          <el-button size="large" icon="RefreshLeft" @click="handleRestore">恢复默认配置</el-button>
        </div>
      </el-form>
    </el-card>

    <el-card class="mt-20 info-card">
      <template #header>
        <div class="card-header">
          <span>配置生效说明</span>
        </div>
      </template>
      <ul class="usage-list">
        <li><strong>实时性：</strong> 配置保存后将立即应用于全量用户的实时学习行为计算。</li>
        <li><strong>追溯性：</strong> 进度计算口径的调整不会影响已产生的历史完成记录，仅对未来的行为生效。</li>
        <li><strong>权重说明：</strong> 进度百分比 = (已学习知识点数 / 总知识点数) * 100%。</li>
      </ul>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const rulesForm = ref({
  videoPercent: 80,
  outlineSeconds: 30,
  reviewActive: true,
  masteryRequired: true
})

const defaultRules = {
  videoPercent: 80,
  outlineSeconds: 30,
  reviewActive: true,
  masteryRequired: true
}

const fetchRules = async () => {
  try {
    const res = await axios.get('/api/achievement/progress-rules')
    rulesForm.value = res.data.data
  } catch (error) {
    console.error('Failed to fetch rules', error)
  }
}

const handleSave = async () => {
  try {
    const res = await axios.post('/api/achievement/progress-rules/save', rulesForm.value)
    ElMessage.success(res.data.message)
  } catch (error) {
    ElMessage.error('保存失败，请稍后重试')
  }
}

const handleRestore = () => {
  ElMessageBox.confirm(
    '确定要恢复到系统默认的进度计算口径吗？现有自定义配置将被覆盖。',
    '恢复默认',
    {
      confirmButtonText: '确认恢复',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    rulesForm.value = { ...defaultRules }
    ElMessage.success('已恢复默认配置')
  })
}

onMounted(fetchRules)
</script>

<style scoped lang="scss">
.progress-rules-container {
  max-width: 1000px;
  margin: 0 auto;

  .config-card {
    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      .title { font-size: 18px; font-weight: bold; color: #1e3a8a; }
    }
  }

  .rules-form {
    padding: 10px 20px;

    .config-section {
      .section-title {
        font-size: 16px;
        color: #333;
        margin-bottom: 8px;
      }
      .section-desc {
        font-size: 14px;
        color: #909399;
        margin-bottom: 20px;
      }
      .hint {
        font-size: 12px;
        color: #a8abb2;
        margin-top: 8px;
        line-height: 1.4;
      }
    }

    .slider-with-input {
      display: flex;
      align-items: center;
      gap: 20px;
      .slider { flex: 1; }
      .input-num { width: 120px; }
      .unit { color: #606266; width: 20px; }
    }
  }

  .footer-actions {
    margin-top: 40px;
    padding-top: 20px;
    display: flex;
    justify-content: center;
    gap: 20px;
  }

  .info-card {
    .usage-list {
      padding-left: 20px;
      li {
        margin-bottom: 12px;
        font-size: 14px;
        color: #606266;
        line-height: 1.6;
      }
    }
  }

  .mt-20 { margin-top: 20px; }
}
</style>
