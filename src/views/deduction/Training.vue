<template>
  <div class="training-management-container">
    <el-card class="box-card">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- Tab 1: Disease Training Question Bank -->
        <el-tab-pane label="病证题库管理" name="questions">
          <div class="filter-header">
            <el-form :inline="true" :model="filterForm">
              <el-form-item label="辨证类型">
                <el-select v-model="filterForm.type" placeholder="全部" clearable style="width: 150px">
                  <el-option v-for="t in types" :key="t" :label="t" :value="t" />
                </el-select>
              </el-form-item>
              <el-form-item label="难度">
                <el-select v-model="filterForm.difficulty" placeholder="全部" clearable style="width: 120px">
                  <el-option v-for="d in difficulties" :key="d" :label="d" :value="d" />
                </el-select>
              </el-form-item>
              <el-form-item label="所属课程">
                <el-select v-model="filterForm.courseId" placeholder="全部" clearable style="width: 180px">
                  <el-option v-for="c in courses" :key="c.id" :label="c.label" :value="c.id" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" icon="Search" @click="fetchQuestions">查询</el-button>
                <el-button type="primary" icon="Plus" @click="handleAddQuestion">新增题目</el-button>
                <el-button type="success" icon="Upload" @click="handleImportClick">批量导入</el-button>
              </el-form-item>
            </el-form>
          </div>

          <el-table :data="questionList" border stripe v-loading="loading">
            <el-table-column prop="title" label="题干" min-width="250" show-overflow-tooltip />
            <el-table-column prop="symptoms" label="症状标签" width="180">
              <template #default="{ row }">
                <el-tag v-for="s in row.symptoms" :key="s" size="small" style="margin-right: 4px">{{ s }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="辨证类型" width="120" align="center" />
            <el-table-column prop="difficulty" label="难度等级" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getDifficultyType(row.difficulty)">{{ row.difficulty }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="enabled" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.enabled" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right" align="center">
              <template #default="{ row }">
                <el-button link type="primary" @click="handleEditQuestion(row)">编辑</el-button>
                <el-button link type="danger" @click="handleDeleteQuestion(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :total="total"
              layout="total, prev, pager, next"
              @current-change="fetchQuestions"
            />
          </div>
        </el-tab-pane>

        <!-- Tab 2: Feedback Templates -->
        <el-tab-pane label="标准答案与反馈模板管理" name="templates">
          <div class="template-header">
            <el-button type="primary" icon="Plus" @click="handleAddTemplate">新增模板</el-button>
          </div>
          <el-table :data="templateList" border stripe>
            <el-table-column prop="name" label="模板名称" width="200" />
            <el-table-column prop="type" label="适用辨证类型" width="150" />
            <el-table-column prop="content" label="模板内容" show-overflow-tooltip />
            <el-table-column label="操作" width="150" align="center">
              <template #default="{ row }">
                <el-button link type="primary" @click="handleEditTemplate(row)">编辑</el-button>
                <el-button link type="danger" @click="handleDeleteTemplate(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- Question Dialog -->
    <el-dialog v-model="questionDialogVisible" :title="isEditQuestion ? '编辑题目' : '新增题目'" width="800px">
      <el-form :model="questionForm" label-width="100px" ref="questionFormRef" :rules="questionRules">
        <el-form-item label="所属课程" prop="courseId">
          <el-select v-model="questionForm.courseId" style="width: 100%">
            <el-option v-for="c in courses" :key="c.id" :label="c.label" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="辨证类型" prop="type">
          <el-select v-model="questionForm.type" style="width: 100%">
            <el-option v-for="t in types" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="难度等级" prop="difficulty">
          <el-select v-model="questionForm.difficulty" style="width: 100%">
            <el-option v-for="d in difficulties" :key="d" :label="d" :value="d" />
          </el-select>
        </el-form-item>
        <el-form-item label="题干" prop="title">
          <el-input type="textarea" v-model="questionForm.title" :rows="5" placeholder="请输入题干内容..." />
        </el-form-item>
        <el-form-item label="症状标签">
          <el-select
            v-model="questionForm.symptoms"
            multiple
            filterable
            allow-create
            placeholder="请输入症状标签"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="标准答案" prop="answer">
          <el-input type="textarea" v-model="questionForm.answer" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="questionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitQuestion">确定</el-button>
      </template>
    </el-dialog>

    <!-- Import Dialog -->
    <el-dialog v-model="importVisible" title="批量导入 CSV" width="700px">
      <el-upload
        class="upload-demo"
        drag
        action="#"
        :auto-upload="false"
        @change="handleFileChange"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将 CSV 文件拖到此处，或<em>点击上传</em>
        </div>
      </el-upload>
      
      <div v-if="importPreviewList.length > 0" class="preview-section">
        <h4>数据预览 (前 5 条)</h4>
        <el-table :data="importPreviewList" size="small" border>
          <el-table-column prop="title" label="题干" show-overflow-tooltip />
          <el-table-column prop="type" label="类型" width="100" />
          <el-table-column prop="difficulty" label="难度" width="80" />
        </el-table>
      </div>
      
      <template #footer>
        <el-button @click="importVisible = false">取消</el-button>
        <el-button type="primary" :disabled="importPreviewList.length === 0" @click="confirmImport">确认导入</el-button>
      </template>
    </el-dialog>

    <!-- Template Dialog -->
    <el-dialog v-model="templateDialogVisible" :title="isEditTemplate ? '编辑模板' : '新增模板'" width="600px">
      <el-form :model="templateForm" label-width="100px">
        <el-form-item label="模板名称" required>
          <el-input v-model="templateForm.name" />
        </el-form-item>
        <el-form-item label="适用类型" required>
          <el-select v-model="templateForm.type" style="width: 100%">
            <el-option v-for="t in types" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="模板内容">
          <el-input type="textarea" v-model="templateForm.content" :rows="6" />
          <div class="variable-helper">
            常用变量：
            <el-tag v-for="v in ['{user_answer}', '{correct_answer}', '{analysis}']" 
              :key="v" size="small" class="v-tag" @click="templateForm.content += v">
              {{ v }}
            </el-tag>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="templateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTemplate">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import axios from 'axios'

interface TrainingQuestion {
  id: number
  title: string
  symptoms: string[]
  type: string
  difficulty: string
  enabled: boolean
  courseId: number
  answer: string
}

interface TrainingTemplate {
  id: number
  name: string
  type: string
  content: string
}

interface Course {
  id: number
  label: string
}

const activeTab = ref('questions')
const loading = ref(false)
const types = ['八纲辨证', '气血辨证', '脏腑辨证', '六经辨证', '卫气营血辨证']
const difficulties = ['简单', '中等', '困难']
const courses = ref<Course[]>([])

// Tab 1: Questions
const questionList = ref<TrainingQuestion[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const filterForm = ref({ type: '', difficulty: '', courseId: '' })

const fetchQuestions = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/training/questions', { params: { ...filterForm.value, page: currentPage.value } })
    questionList.value = res.data.data.list
    total.value = res.data.data.total
  } finally {
    loading.value = false
  }
}

const getDifficultyType = (d: string) => {
  if (d === '简单') return 'success'
  if (d === '中等') return 'warning'
  return 'danger'
}

const questionDialogVisible = ref(false)
const isEditQuestion = ref(false)
const questionForm = ref<Partial<TrainingQuestion>>({ title: '', symptoms: [], type: '', difficulty: '简单', courseId: undefined, answer: '' })
const questionRules = {
  courseId: [{ required: true, message: '请选择课程', trigger: 'change' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  title: [{ required: true, message: '请输入题干', trigger: 'blur' }]
}

const handleAddQuestion = () => {
  isEditQuestion.value = false
  questionForm.value = { title: '', symptoms: [], type: types[0], difficulty: '简单', courseId: undefined, answer: '' }
  questionDialogVisible.value = true
}

const handleEditQuestion = (row: TrainingQuestion) => {
  isEditQuestion.value = true
  questionForm.value = { ...row }
  questionDialogVisible.value = true
}

const submitQuestion = () => {
  ElMessage.success('题目已保存')
  questionDialogVisible.value = false
  fetchQuestions()
}

const handleDeleteQuestion = (row: TrainingQuestion) => {
  ElMessageBox.confirm(`确定删除题目吗？`, '警告', { type: 'warning' }).then(() => {
    ElMessage.success('已删除')
    fetchQuestions()
  })
}

// Tab 2: Templates
const templateList = ref<TrainingTemplate[]>([])
const templateDialogVisible = ref(false)
const isEditTemplate = ref(false)
const templateForm = ref<Partial<TrainingTemplate>>({ name: '', type: types[0], content: '' })

const fetchTemplates = async () => {
  const res = await axios.get('/api/training/templates')
  templateList.value = res.data.data
}

const handleAddTemplate = () => {
  isEditTemplate.value = false
  templateForm.value = { name: '', type: types[0], content: '' }
  templateDialogVisible.value = true
}

const handleEditTemplate = (row: TrainingTemplate) => {
  isEditTemplate.value = true
  templateForm.value = { ...row }
  templateDialogVisible.value = true
}

const submitTemplate = () => {
  ElMessage.success('模板已保存')
  templateDialogVisible.value = false
  fetchTemplates()
}

const handleDeleteTemplate = (row: TrainingTemplate) => {
  ElMessageBox.confirm(`确定删除模板 ${row.name} 吗？`, '警告', { type: 'warning' }).then(() => {
    ElMessage.success('已删除')
    fetchTemplates()
  })
}

// Import
const importVisible = ref(false)
const importPreviewList = ref<Partial<TrainingQuestion>[]>([])
const handleImportClick = () => {
  importPreviewList.value = []
  importVisible.value = true
}

const handleFileChange = (file: any) => {
  // Mock preview
  importPreviewList.value = [
    { title: '病人恶寒发热，头痛无汗...', type: '八纲辨证', difficulty: '中等' },
    { title: '患者面色苍白，神疲乏力...', type: '气血辨证', difficulty: '简单' }
  ]
}

const confirmImport = () => {
  ElMessage.success('数据导入成功')
  importVisible.value = false
  fetchQuestions()
}

const fetchCourses = async () => {
  const res = await axios.get('/api/training/courses')
  courses.value = res.data.data
}

onMounted(() => {
  fetchQuestions()
  fetchTemplates()
  fetchCourses()
})
</script>

<style scoped lang="scss">
.training-management-container {
  .filter-header {
    margin-bottom: 20px;
  }
  
  .template-header {
    margin-bottom: 20px;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .preview-section {
    margin-top: 20px;
    h4 { margin-bottom: 10px; color: #606266; }
  }

  .variable-helper {
    margin-top: 8px;
    font-size: 12px;
    color: #909399;
    .v-tag { cursor: pointer; margin-right: 8px; &:hover { border-color: #409eff; } }
  }
}
</style>
