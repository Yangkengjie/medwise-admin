<template>
  <div class="achievement-rules-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="title">成就规则管理</h2>
        <p class="subtitle">配置勋章体系、触发阈值及展示文案</p>
      </div>
      <el-button type="primary" size="large" icon="Check" @click="handleSaveAll">保存全部修改</el-button>
    </div>

    <el-tabs v-model="activeTab" class="main-tabs">
      <!-- Tab 1: 连续学习类 -->
      <el-tab-pane label="连续学习类" name="learning">
        <el-card shadow="never" class="tab-card">
          <template #header>
            <div class="card-header">
              <span>连续学习成就配置</span>
              <div class="header-actions">
                <el-checkbox v-model="globalConfig.breakReset">支持断签重算</el-checkbox>
                <el-checkbox v-model="globalConfig.cumulative">支持累计并存</el-checkbox>
              </div>
            </div>
          </template>
          <AchievementTable :data="data.learning" @edit="handleEdit" />
        </el-card>
      </el-tab-pane>

      <!-- Tab 2: 按科目类 -->
      <el-tab-pane label="按科目类" name="subject">
        <el-card shadow="never" class="tab-card">
          <AchievementTable :data="data.subject" @edit="handleEdit" />
        </el-card>
      </el-tab-pane>

      <!-- Tab 3: 按规划类 -->
      <el-tab-pane label="按规划类" name="planning">
        <el-card shadow="never" class="tab-card">
          <AchievementTable :data="data.planning" @edit="handleEdit" />
        </el-card>
      </el-tab-pane>

      <!-- Tab 4: 按知识库类 -->
      <el-tab-pane label="按知识库类" name="knowledge">
        <el-tabs v-model="subTabKnowledge" type="border-card" class="sub-tabs">
          <el-tab-pane label="评论类" name="comment">
            <div class="mb-20" v-if="subTabKnowledge === 'comment'">
              <span class="mr-10">点赞阈值 N:</span>
              <el-input-number v-model="globalConfig.commentLikeThreshold" :min="1" size="small" />
            </div>
            <AchievementTable :data="data.knowledge.comment" @edit="handleEdit" />
          </el-tab-pane>
          <el-tab-pane label="关联数类" name="relation">
            <AchievementTable :data="data.knowledge.relation" @edit="handleEdit" />
          </el-tab-pane>
          <el-tab-pane label="知识学习数类" name="study">
            <AchievementTable :data="data.knowledge.study" @edit="handleEdit" />
          </el-tab-pane>
          <el-tab-pane label="学习时长类" name="duration">
            <AchievementTable :data="data.knowledge.duration" @edit="handleEdit" />
          </el-tab-pane>
        </el-tabs>
      </el-tab-pane>

      <!-- Tab 5: 与 AI 互动类 -->
      <el-tab-pane label="与 AI 互动类" name="ai">
        <el-tabs v-model="subTabAI" type="border-card" class="sub-tabs">
          <el-tab-pane label="提问类" name="question">
            <AchievementTable :data="data.ai.question" @edit="handleEdit" />
          </el-tab-pane>
          <el-tab-pane label="准确偏差类" name="accuracy">
            <AchievementTable :data="data.ai.accuracy" @edit="handleEdit" />
          </el-tab-pane>
          <el-tab-pane label="综合类" name="comprehensive">
            <AchievementTable :data="data.ai.comprehensive" @edit="handleEdit" />
          </el-tab-pane>
          <el-tab-pane label="所问之事类" name="whatasked">
            <AchievementTable :data="data.ai.whatasked" @edit="handleEdit" />
          </el-tab-pane>
        </el-tabs>
      </el-tab-pane>
    </el-tabs>

    <!-- Edit Dialog -->
    <el-dialog v-model="dialogVisible" title="编辑成就规则" width="600px" destroy-on-close>
      <el-form :model="editingForm" label-width="100px" v-if="editingForm">
        <el-form-item label="成就名称">
          <el-input v-model="editingForm.name" />
        </el-form-item>
        <el-form-item label="描述文案">
          <el-input type="textarea" v-model="editingForm.description" :rows="3" />
        </el-form-item>
        <el-form-item label="触发阈值">
          <el-input-number v-model="editingForm.threshold" :step="editingForm.step || 1" :min="0" />
        </el-form-item>
        <el-form-item label="徽章图标">
          <el-upload
            class="badge-uploader"
            action="#"
            :show-file-list="false"
            :auto-upload="false"
            @change="handleIconChange"
          >
            <img v-if="editingForm.icon" :src="editingForm.icon" class="badge-preview-big" />
            <el-icon v-else class="uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="editingForm.status" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmEdit">确定修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, Plus, Calendar, Setting, View } from '@element-plus/icons-vue'
import axios from 'axios'
import AchievementTable from './components/AchievementTable.vue'

const activeTab = ref('learning')
const subTabKnowledge = ref('comment')
const subTabAI = ref('question')
const loading = ref(false)
const dialogVisible = ref(false)

const data = reactive({
  learning: [],
  subject: [],
  planning: [],
  knowledge: { comment: [], relation: [], study: [], duration: [] },
  ai: { question: [], accuracy: [], comprehensive: [], whatasked: [] }
})

const globalConfig = reactive({
  breakReset: true,
  cumulative: true,
  commentLikeThreshold: 10
})

const editingForm = ref(null)
let currentDataList = null

const fetchData = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/achievement/rules')
    Object.assign(data, res.data.data)
    Object.assign(globalConfig, res.data.data.config)
  } finally {
    loading.value = false
  }
}

const handleEdit = (row: any) => {
  editingForm.value = { ...row }
  dialogVisible.value = true
}

const confirmEdit = () => {
  // Find and update in data object
  const updateInList = (list: any[]) => {
    const index = list.findIndex(item => item.id === editingForm.value.id)
    if (index !== -1) {
      list[index] = { ...editingForm.value }
      return true
    }
    return false
  }

  // Deep search and update
  let found = updateInList(data.learning) || updateInList(data.subject) || updateInList(data.planning)
  if (!found) {
    for (const key in data.knowledge) {
      if (updateInList(data.knowledge[key])) { found = true; break }
    }
  }
  if (!found) {
    for (const key in data.ai) {
      if (updateInList(data.ai[key])) { found = true; break }
    }
  }

  dialogVisible.value = false
  ElMessage.success('本地修改已保存，请点击页面顶部按钮提交生效')
}

const handleIconChange = (file: any) => {
  editingForm.value.icon = URL.createObjectURL(file.raw)
}

const handleSaveAll = async () => {
  try {
    await axios.post('/api/achievement/rules/save', { data, config: globalConfig })
    ElMessage.success('所有成就规则已成功发布并生效')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

onMounted(fetchData)
</script>

<style scoped lang="scss">
.achievement-rules-container {
  padding: 20px;
  max-width: 1300px;
  margin: 0 auto;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    .title { font-size: 24px; color: #1e3a8a; margin: 0 0 8px 0; }
    .subtitle { color: #64748b; margin: 0; font-size: 14px; }
  }

  .main-tabs {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
  }

  .tab-card {
    border: none;
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: bold;
    }
  }

  .sub-tabs {
    margin-top: 10px;
  }

  .badge-uploader {
    .badge-preview-big {
      width: 100px;
      height: 100px;
      object-fit: contain;
      border: 1px dashed #dcdfe6;
      border-radius: 8px;
    }
    .uploader-icon {
      font-size: 28px;
      color: #8c939d;
      width: 100px;
      height: 100px;
      line-height: 100px;
      text-align: center;
      border: 1px dashed #dcdfe6;
      border-radius: 8px;
    }
  }

  .mb-20 { margin-bottom: 20px; }
  .mr-10 { margin-right: 10px; }
}
</style>
