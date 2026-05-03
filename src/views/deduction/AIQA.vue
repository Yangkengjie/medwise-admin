<template>
  <div class="ai-qa-config-container">
    <el-card class="box-card">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- Tab 1: Answer Style Template Management -->
        <el-tab-pane label="回答风格模板管理" name="styles">
          <div class="style-list">
            <el-collapse v-model="activeStyles">
              <el-collapse-item v-for="style in styles" :key="style.id" :name="style.id">
                <template #title>
                  <div class="style-item-header">
                    <span class="style-name">{{ style.name }}</span>
                    <el-switch
                      v-model="style.enabled"
                      @click.stop
                      active-text="启用"
                      inactive-text="停用"
                    />
                  </div>
                </template>
                <div class="style-editor">
                  <el-form label-position="top">
                    <el-form-item label="Prompt 模板">
                      <el-input
                        type="textarea"
                        v-model="style.prompt"
                        :rows="5"
                        placeholder="请输入提示词模板"
                      />
                      <div class="variable-tags">
                        <span class="label">常用变量：</span>
                        <el-tag 
                          v-for="v in ['{question}', '{knowledge_point}']" 
                          :key="v" 
                          size="small" 
                          class="v-tag"
                          @click="insertVariable(style, v)"
                        >{{ v }}</el-tag>
                      </div>
                    </el-form-item>
                    <el-form-item>
                      <el-button type="primary" @click="saveStyle(style)">保存修改</el-button>
                    </el-form-item>
                  </el-form>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-tab-pane>

        <!-- Tab 2: Prompt Template Management -->
        <el-tab-pane label="Prompt 模板管理" name="prompts">
          <div class="prompt-mgmt">
            <div class="header-actions">
              <el-button type="primary" icon="Plus" @click="handleAddPrompt">新增模板</el-button>
            </div>
            <div v-for="scene in scenes" :key="scene" class="scene-group">
              <h3 class="scene-title">{{ scene }}</h3>
              <el-table :data="getPromptsByScene(scene)" border stripe>
                <el-table-column prop="name" label="模板名称" width="180" />
                <el-table-column prop="condition" label="适用条件" width="150" />
                <el-table-column prop="prompt" label="Prompt 内容" show-overflow-tooltip />
                <el-table-column prop="priority" label="优先级" width="100" align="center" sortable />
                <el-table-column label="操作" width="150" align="center">
                  <template #default="{ row }">
                    <el-button link type="primary" @click="handleEditPrompt(row)">编辑</el-button>
                    <el-button link type="danger" @click="handleDeletePrompt(row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>

        <!-- Tab 3: Recommended Questions Management -->
        <el-tab-pane label="推荐问题管理" name="questions">
          <div class="question-mgmt">
            <div class="header-actions">
              <div class="left">
                <el-button type="primary" icon="Plus" @click="handleAddQuestion">新增问题</el-button>
                <el-button type="success" icon="Upload" @click="handleImport">批量导入</el-button>
              </div>
            </div>
            <el-table :data="questions" border stripe>
              <el-table-column prop="content" label="问题内容" min-width="250" />
              <el-table-column prop="knowledgePoints" label="关联知识点" min-width="200">
                <template #default="{ row }">
                  <el-tag 
                    v-for="kp in row.knowledgePoints" 
                    :key="kp" 
                    size="small" 
                    class="kp-tag"
                  >{{ getKPName(kp) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="order" label="展示顺序" width="100" align="center" sortable />
              <el-table-column label="操作" width="150" align="center">
                <template #default="{ row }">
                  <el-button link type="primary" @click="handleEditQuestion(row)">编辑</el-button>
                  <el-button link type="danger" @click="handleDeleteQuestion(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- Prompt Edit Dialog -->
    <el-dialog v-model="promptDialogVisible" :title="isEditPrompt ? '编辑模板' : '新增模板'" width="600px">
      <el-form :model="promptForm" label-width="100px" ref="promptFormRef" :rules="promptRules">
        <el-form-item label="适用场景" prop="scene">
          <el-select v-model="promptForm.scene" style="width: 100%">
            <el-option v-for="s in scenes" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="promptForm.name" />
        </el-form-item>
        <el-form-item label="适用条件" prop="condition">
          <el-input v-model="promptForm.condition" placeholder="例如：高级用户" />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-input-number v-model="promptForm.priority" :min="1" />
        </el-form-item>
        <el-form-item label="Prompt 内容" prop="prompt">
          <el-input type="textarea" v-model="promptForm.prompt" :rows="6" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="promptDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPrompt">确定</el-button>
      </template>
    </el-dialog>

    <!-- Question Edit Dialog -->
    <el-dialog v-model="questionDialogVisible" :title="isEditQuestion ? '编辑问题' : '新增问题'" width="600px">
      <el-form :model="questionForm" label-width="100px" ref="questionFormRef" :rules="questionRules">
        <el-form-item label="问题内容" prop="content">
          <el-input type="textarea" v-model="questionForm.content" :rows="3" />
        </el-form-item>
        <el-form-item label="关联知识点" prop="knowledgePoints">
          <el-select
            v-model="questionForm.knowledgePoints"
            multiple
            filterable
            placeholder="请选择知识点"
            style="width: 100%"
          >
            <el-option
              v-for="kp in allKnowledgePoints"
              :key="kp.id"
              :label="kp.title"
              :value="kp.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="展示顺序" prop="order">
          <el-input-number v-model="questionForm.order" :min="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="questionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitQuestion">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

interface StyleTemplate {
  id: number
  name: string
  enabled: boolean
  prompt: string
}

interface PromptTemplate {
  id: number
  scene: string
  name: string
  condition: string
  prompt: string
  priority: number
}

interface QuestionItem {
  id: number
  content: string
  knowledgePoints: number[]
  order: number
}

interface KnowledgePoint {
  id: number
  title: string
}

const activeTab = ref('styles')
const activeStyles = ref([1])

// Tab 1: Styles
const styles = ref<StyleTemplate[]>([])
const fetchStyles = async () => {
  const res = await axios.get('/api/ai/styles')
  styles.value = res.data.data
}
const insertVariable = (style: StyleTemplate, variable: string) => {
  style.prompt += variable
}
const saveStyle = (style: StyleTemplate) => {
  ElMessage.success(`风格“${style.name}”已保存`)
}

// Tab 2: Prompts
const scenes = ['答疑场景', '学习规划场景', '辨证训练场景']
const prompts = ref<PromptTemplate[]>([])
const fetchPrompts = async () => {
  const res = await axios.get('/api/ai/prompts')
  prompts.value = res.data.data
}
const getPromptsByScene = (scene: string) => {
  return prompts.value.filter((p: PromptTemplate) => p.scene === scene)
}

const promptDialogVisible = ref(false)
const isEditPrompt = ref(false)
const promptForm = ref<Partial<PromptTemplate>>({ scene: '', name: '', condition: '', prompt: '', priority: 1 })
const promptRules = {
  scene: [{ required: true, message: '请选择场景', trigger: 'change' }],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  prompt: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

const handleAddPrompt = () => {
  isEditPrompt.value = false
  promptForm.value = { scene: '答疑场景', name: '', condition: '', prompt: '', priority: 1 }
  promptDialogVisible.value = true
}

const handleEditPrompt = (row: PromptTemplate) => {
  isEditPrompt.value = true
  promptForm.value = { ...row }
  promptDialogVisible.value = true
}

const submitPrompt = () => {
  ElMessage.success('模板已保存')
  promptDialogVisible.value = false
  fetchPrompts()
}

const handleDeletePrompt = (row: PromptTemplate) => {
  ElMessageBox.confirm(`确定删除模板 ${row.name} 吗？`, '警告', { type: 'warning' }).then(() => {
    ElMessage.success('已删除')
    fetchPrompts()
  })
}

// Tab 3: Questions
const questions = ref<QuestionItem[]>([])
const allKnowledgePoints = ref<KnowledgePoint[]>([])
const fetchQuestions = async () => {
  const res = await axios.get('/api/ai/questions')
  questions.value = res.data.data
}
const fetchKPs = async () => {
  const res = await axios.get('/api/knowledge/all')
  allKnowledgePoints.value = res.data.data
}
const getKPName = (id: number) => {
  const kp = allKnowledgePoints.value.find((k: KnowledgePoint) => k.id === id)
  return kp ? kp.title : id
}

const questionDialogVisible = ref(false)
const isEditQuestion = ref(false)
const questionForm = ref<Partial<QuestionItem>>({ content: '', knowledgePoints: [], order: 1 })
const questionRules = {
  content: [{ required: true, message: '请输入问题内容', trigger: 'blur' }],
  knowledgePoints: [{ required: true, message: '请选择关联知识点', trigger: 'change' }]
}

const handleAddQuestion = () => {
  isEditQuestion.value = false
  questionForm.value = { content: '', knowledgePoints: [], order: 1 }
  questionDialogVisible.value = true
}

const handleEditQuestion = (row: QuestionItem) => {
  isEditQuestion.value = true
  questionForm.value = { ...row }
  questionDialogVisible.value = true
}

const submitQuestion = () => {
  ElMessage.success('问题已保存')
  questionDialogVisible.value = false
  fetchQuestions()
}

const handleDeleteQuestion = (row: any) => {
  ElMessageBox.confirm(`确定删除该问题吗？`, '警告', { type: 'warning' }).then(() => {
    ElMessage.success('已删除')
    fetchQuestions()
  })
}

const handleImport = () => {
  ElMessage.success('批量导入成功（模拟）')
}

onMounted(() => {
  fetchStyles()
  fetchPrompts()
  fetchQuestions()
  fetchKPs()
})
</script>

<style scoped lang="scss">
.ai-qa-config-container {
  .style-item-header {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-right: 20px;
    
    .style-name {
      font-weight: bold;
      font-size: 15px;
    }
  }

  .style-editor {
    padding: 10px 20px;
    background: #fcfcfc;
    
    .variable-tags {
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
      .label { font-size: 12px; color: #909399; }
      .v-tag { cursor: pointer; &:hover { border-color: #409eff; } }
    }
  }

  .scene-group {
    margin-bottom: 30px;
    .scene-title {
      border-left: 4px solid #1e3a8a;
      padding-left: 12px;
      margin-bottom: 15px;
      font-size: 16px;
      color: #333;
    }
  }

  .header-actions {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .kp-tag {
    margin: 2px;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
