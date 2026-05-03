<template>
  <div class="college-management-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="title">院校管理</h2>
        <p class="subtitle">管理合作院校的授权信息、课程权限及知识点可见范围</p>
      </div>
      <el-button type="primary" icon="Plus" @click="handleAdd">新增院校</el-button>
    </div>

    <!-- Table Card -->
    <el-card shadow="never">
      <el-table :data="collegeList" border stripe v-loading="loading">
        <el-table-column prop="name" label="院校名称" min-width="180" />
        <el-table-column prop="code" label="院校编码" width="120" align="center" />
        <el-table-column prop="status" label="合作状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="courseCount" label="开通课程数" width="120" align="center" />
        <el-table-column prop="scope" label="可见知识点范围" width="150" align="center" />
        <el-table-column prop="expiryDate" label="到期时间" width="150" align="center" />
        <el-table-column label="操作" width="240" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-divider direction="vertical" />
            <el-button link type="success" @click="handleRenew(row)">续期</el-button>
            <el-divider direction="vertical" />
            <el-button 
              link 
              :type="row.status === '已停用' ? 'primary' : 'danger'" 
              @click="toggleStatus(row)"
            >
              {{ row.status === '已停用' ? '启用' : '停用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Add/Edit Dialog -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑院校信息' : '新增院校'" 
      width="650px"
      destroy-on-close
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="院校名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入院校名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="院校编码" prop="code">
              <el-input v-model="form.code" placeholder="如：BUCM001" :disabled="isEdit" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="合作状态" prop="status">
              <el-select v-model="form.status" placeholder="选择状态" style="width: 100%">
                <el-option label="试运行" value="试运行" />
                <el-option label="正式" value="正式" />
                <el-option label="已到期" value="已到期" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="有效期至" prop="expiryDate">
              <el-date-picker 
                v-model="form.expiryDate" 
                type="date" 
                placeholder="选择日期" 
                style="width: 100%" 
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="课程开通" prop="courses">
          <el-select 
            v-model="form.courses" 
            multiple 
            collapse-tags 
            placeholder="请勾选开通课程" 
            style="width: 100%"
          >
            <el-option v-for="c in courseOptions" :key="c.id" :label="c.label" :value="c.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="知识点可见性" prop="scope">
          <el-radio-group v-model="form.scope">
            <el-radio label="全部可见">全部可见</el-radio>
            <el-radio label="按课程可见">按课程可见</el-radio>
            <el-radio label="自定义白名单">自定义白名单</el-radio>
          </el-radio-group>
          <div v-if="form.scope === '自定义白名单'" class="whitelist-box">
            <el-input 
              v-model="form.whitelist" 
              type="textarea" 
              placeholder="请输入知识点 ID，多个 ID 用逗号分隔" 
              :rows="3"
            />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">确定保存</el-button>
      </template>
    </el-dialog>

    <!-- Renew Dialog -->
    <el-dialog v-model="renewVisible" title="院校合作续期" width="400px">
      <div class="renew-info" v-if="selectedRow">
        <p><strong>院校：</strong>{{ selectedRow.name }}</p>
        <p><strong>原到期时间：</strong>{{ selectedRow.expiryDate }}</p>
      </div>
      <el-form label-width="100px" style="margin-top: 20px">
        <el-form-item label="新到期时间">
          <el-date-picker 
            v-model="newExpiryDate" 
            type="date" 
            placeholder="选择日期" 
            style="width: 100%" 
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="renewVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRenew">确认续期</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

interface College {
  id: number
  name: string
  code: string
  status: string
  courseCount: number
  scope: string
  expiryDate: string
  courses?: number[]
  whitelist?: string
}

interface CourseOption {
  id: number
  label: string
}

const loading = ref(false)
const submitting = ref(false)
const collegeList = ref<College[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const courseOptions = ref<CourseOption[]>([])

interface CollegeForm {
  id: number | null
  name: string
  code: string
  status: string
  expiryDate: string
  courses: number[]
  scope: string
  whitelist: string
}

const form = reactive<CollegeForm>({
  id: null,
  name: '',
  code: '',
  status: '正式',
  expiryDate: '',
  courses: [],
  scope: '全部可见',
  whitelist: ''
})

const rules = {
  name: [{ required: true, message: '请输入院校名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入院校编码', trigger: 'blur' }],
  status: [{ required: true, message: '请选择合作状态', trigger: 'change' }],
  expiryDate: [{ required: true, message: '请选择有效期', trigger: 'change' }],
  courses: [{ required: true, message: '请至少选择一门课程', trigger: 'change' }]
}

const renewVisible = ref(false)
const selectedRow = ref<College | null>(null)
const newExpiryDate = ref('')

const fetchColleges = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/college/list')
    collegeList.value = res.data.data.list
  } finally {
    loading.value = false
  }
}

const fetchCourses = async () => {
  const res = await axios.get('/api/courses/tree')
  courseOptions.value = res.data.data.map((c: any) => ({ id: c.id, label: c.label }))
}

const getStatusTag = (status: string) => {
  const map: Record<string, string> = { '正式': 'success', '试运行': 'warning', '已到期': 'danger', '已停用': 'info' }
  return map[status] || ''
}

const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, { id: null, name: '', code: '', status: '正式', expiryDate: '', courses: [], scope: '全部可见', whitelist: '' })
  dialogVisible.value = true
}

const handleEdit = (row: College) => {
  isEdit.value = true
  Object.assign(form, { ...row, courses: [1, 2] }) // Mock course IDs
  dialogVisible.value = true
}

const submitForm = async () => {
  await formRef.value.validate()
  submitting.value = true
  try {
    await axios.post('/api/college/save', form)
    ElMessage.success('操作成功')
    dialogVisible.value = false
    fetchColleges()
  } finally {
    submitting.value = false
  }
}

const handleRenew = (row: College) => {
  selectedRow.value = row
  newExpiryDate.value = ''
  renewVisible.value = true
}

const submitRenew = async () => {
  if (!newExpiryDate.value || !selectedRow.value) {
    ElMessage.warning('请选择新的到期日期')
    return
  }
  await axios.post('/api/college/renew', { id: selectedRow.value.id, date: newExpiryDate.value })
  ElMessage.success('续期成功')
  renewVisible.value = false
  fetchColleges()
}

const toggleStatus = (row: College) => {
  const action = row.status === '已停用' ? '启用' : '停用'
  ElMessageBox.confirm(`确定要${action}院校“${row.name}”吗？`, '状态变更确认', {
    type: action === '停用' ? 'warning' : 'info'
  }).then(async () => {
    await axios.post('/api/college/status', { id: row.id, status: action === '启用' ? '正式' : '已停用' })
    ElMessage.success(`${action}成功`)
    fetchColleges()
  })
}

onMounted(() => {
  fetchColleges()
  fetchCourses()
})
</script>

<style scoped lang="scss">
.college-management-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
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

  .whitelist-box {
    margin-top: 10px;
    width: 100%;
  }

  .renew-info {
    font-size: 14px;
    color: #475569;
    p { margin: 8px 0; }
  }
}
</style>
