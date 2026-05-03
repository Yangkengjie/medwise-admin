<template>
  <div class="learning-planning-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>学习规划模板管理</span>
          <el-button type="primary" icon="Plus" @click="handleAdd">新增模板</el-button>
        </div>
      </template>

      <el-table :data="templateList" border stripe v-loading="loading">
        <el-table-column prop="name" label="模板名称" min-width="180" />
        <el-table-column prop="userProfiles" label="适用画像" width="200">
          <template #default="{ row }">
            <el-tag v-for="tag in row.userProfiles" :key="tag" size="small" class="mr-4">{{ tag }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="target" label="适用目标" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getTargetType(row.target)">{{ row.target }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="period" label="规划周期" width="100" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.status" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="success" @click="handlePreview(row)">预览效果</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Add/Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑模板' : '新增模板'" width="900px" top="5vh">
      <el-form :model="form" label-width="100px" ref="formRef" :rules="rules">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="模板名称" prop="name">
              <el-input v-model="form.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="适用目标" prop="target">
              <el-select v-model="form.target" style="width: 100%">
                <el-option label="考研" value="考研" />
                <el-option label="期末" value="期末" />
                <el-option label="兴趣学习" value="兴趣学习" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="适用画像" prop="userProfiles">
              <el-select v-model="form.userProfiles" multiple filterable allow-create style="width: 100%">
                <el-option label="考研党" value="考研党" />
                <el-option label="基础扎实" value="基础扎实" />
                <el-option label="兴趣爱好者" value="兴趣爱好者" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规划周期" prop="period">
              <el-radio-group v-model="form.period">
                <el-radio-button label="周">按周</el-radio-button>
                <el-radio-button label="月">按月</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <div class="stages-config">
          <div class="section-header">
            <h4>阶段规划详情</h4>
            <el-button type="primary" link icon="Plus" @click="addStage">添加阶段</el-button>
          </div>
          
          <div v-for="(stage, index) in form.stages" :key="index" class="stage-item">
            <div class="stage-header">
              <span class="stage-no">阶段 {{ index + 1 }}</span>
              <el-button link type="danger" icon="Delete" @click="removeStage(index)" />
            </div>
            <el-row :gutter="20">
              <el-col :span="10">
                <el-form-item label="阶段名称">
                  <el-input v-model="stage.name" placeholder="如：第一阶段 基础巩固" />
                </el-form-item>
              </el-col>
              <el-col :span="10">
                <el-form-item label="预估时长">
                  <el-input-number v-model="stage.duration" :min="1" />
                  <span class="ml-8">天</span>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="关联知识点">
              <el-select
                v-model="stage.kps"
                multiple
                filterable
                placeholder="请选择核心知识点"
                style="width: 100%"
              >
                <el-option
                  v-for="kp in allKPs"
                  :key="kp.id"
                  :label="kp.title"
                  :value="kp.id"
                />
              </el-select>
            </el-form-item>
          </div>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存模板</el-button>
      </template>
    </el-dialog>

    <!-- Preview Dialog -->
    <el-dialog v-model="previewVisible" title="规划效果预览 (用户端视图)" width="600px" custom-class="preview-dialog">
      <div class="preview-user-view" v-if="currentPreview">
        <div class="preview-header">
          <h3>{{ currentPreview.name }}</h3>
          <div class="meta">
            <el-tag size="small">{{ currentPreview.target }}</el-tag>
            <el-tag size="small" type="info">{{ currentPreview.period }}度规划</el-tag>
          </div>
        </div>
        
        <el-timeline class="preview-timeline">
          <el-timeline-item
            v-for="(stage, index) in currentPreview.stages"
            :key="index"
            :timestamp="'预计耗时：' + stage.duration + ' 天'"
            placement="top"
            type="primary"
          >
            <el-card shadow="hover" class="stage-preview-card">
              <h4>{{ stage.name }}</h4>
              <div class="kp-list">
                <div v-for="kpId in stage.kps" :key="kpId" class="kp-item">
                  <el-icon><Notebook /></el-icon>
                  <span>{{ getKPName(kpId) }}</span>
                </div>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

interface PlanningStage {
  name: string
  duration: number
  kps: number[]
}

interface PlanningTemplate {
  id?: number
  name: string
  userProfiles: string[]
  target: string
  period: string
  status: boolean
  stages: PlanningStage[]
}

interface KnowledgePoint {
  id: number
  title: string
}

const templateList = ref<PlanningTemplate[]>([])
const loading = ref(false)
const allKPs = ref<KnowledgePoint[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const previewVisible = ref(false)
const currentPreview = ref<PlanningTemplate | null>(null)

const form = ref<PlanningTemplate>({
  name: '',
  userProfiles: [],
  target: '考研',
  period: '月',
  status: true,
  stages: [
    { name: '', duration: 7, kps: [] }
  ]
})

const rules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  target: [{ required: true, message: '请选择目标', trigger: 'change' }]
}

const fetchTemplates = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/planning/templates')
    templateList.value = res.data.data.list
  } finally {
    loading.value = false
  }
}

const fetchKPs = async () => {
  const res = await axios.get('/api/knowledge/all')
  allKPs.value = res.data.data
}

const getKPName = (id: number) => {
  const kp = allKPs.value.find((k: KnowledgePoint) => k.id === id)
  return kp ? kp.title : id
}

const getTargetType = (target: string) => {
  if (target === '考研') return 'danger'
  if (target === '期末') return 'warning'
  return 'success'
}

const handleAdd = () => {
  isEdit.value = false
  form.value = {
    name: '',
    userProfiles: [],
    target: '考研',
    period: '月',
    status: true,
    stages: [{ name: '', duration: 7, kps: [] }]
  }
  dialogVisible.value = true
}

const handleEdit = (row: PlanningTemplate) => {
  isEdit.value = true
  form.value = JSON.parse(JSON.stringify(row))
  dialogVisible.value = true
}

const addStage = () => {
  form.value.stages.push({ name: '', duration: 7, kps: [] })
}

const removeStage = (index: number) => {
  form.value.stages.splice(index, 1)
}

const submitForm = () => {
  ElMessage.success('规划模板已保存')
  dialogVisible.value = false
  fetchTemplates()
}

const handleDelete = (row: PlanningTemplate) => {
  ElMessageBox.confirm(`确定删除模板 ${row.name} 吗？`, '警告', { type: 'warning' }).then(() => {
    ElMessage.success('已删除')
    fetchTemplates()
  })
}

const handlePreview = (row: PlanningTemplate) => {
  currentPreview.value = row
  previewVisible.value = true
}

onMounted(() => {
  fetchTemplates()
  fetchKPs()
})
</script>

<style scoped lang="scss">
.learning-planning-container {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .mr-4 { margin-right: 4px; }
  .ml-8 { margin-left: 8px; }

  .stages-config {
    margin-top: 30px;
    border-top: 1px solid #eee;
    padding-top: 20px;
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      h4 { margin: 0; color: #1e3a8a; }
    }

    .stage-item {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 15px;
      border: 1px solid #ebeef5;

      .stage-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 15px;
        .stage-no { font-weight: bold; color: #606266; }
      }
    }
  }
}

.preview-user-view {
  .preview-header {
    text-align: center;
    margin-bottom: 30px;
    h3 { color: #1e3a8a; margin-bottom: 10px; }
    .meta { display: flex; justify-content: center; gap: 10px; }
  }

  .preview-timeline {
    padding-left: 10px;
    .stage-preview-card {
      h4 { margin: 0 0 10px; color: #303133; }
      .kp-list {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        .kp-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: #666;
        }
      }
    }
  }
}
</style>
