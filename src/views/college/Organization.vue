<template>
  <div class="organization-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="title">教学组织管理</h2>
        <p class="subtitle">管理各院校的教学单位（班级、专业、兴趣小组），监控小组学习进度</p>
      </div>
    </div>

    <div class="content-layout">
      <!-- Left: College Tree Selector -->
      <div class="college-selector">
        <div class="selector-header">
          <span>选择院校</span>
        </div>
        <el-input
          v-model="filterText"
          placeholder="搜索院校..."
          prefix-icon="Search"
          class="mb-10"
          clearable
        />
        <el-scrollbar>
          <el-tree
            ref="treeRef"
            :data="collegeTree"
            :props="defaultProps"
            highlight-current
            @node-click="handleNodeClick"
            :filter-node-method="filterNode"
          >
            <template #default="{ node, data }">
              <span class="custom-tree-node">
                <el-icon v-if="data.children"><School /></el-icon>
                <el-icon v-else><Location /></el-icon>
                <span>{{ node.label }}</span>
              </span>
            </template>
          </el-tree>
        </el-scrollbar>
      </div>

      <!-- Right: Groups & Details -->
      <div class="main-content" v-loading="loading">
        <template v-if="selectedCollege">
          <div class="section-header">
            <h3 class="college-name">{{ selectedCollege.name }} - 教学组织</h3>
            <el-button type="primary" icon="Plus" @click="handleAddGroup">新增分组</el-button>
          </div>

          <el-table :data="groupList" border stripe class="mb-20">
            <el-table-column prop="name" label="分组名称" min-width="150" />
            <el-table-column prop="type" label="分组类型" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getTypeTag(row.type)">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="studentCount" label="学生人数" width="100" align="center" />
            <el-table-column prop="createTime" label="创建时间" width="120" align="center" />
            <el-table-column label="操作" width="220" fixed="right" align="center">
              <template #default="{ row }">
                <el-button link type="primary" @click="viewDetails(row)">查看成员</el-button>
                <el-divider direction="vertical" />
                <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
                <el-divider direction="vertical" />
                <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- Group Details Area -->
          <div v-if="currentGroup" class="detail-section">
            <div class="detail-header">
              <span class="title">【{{ currentGroup.name }}】成员学习概况</span>
              <el-button link type="primary" icon="Download">导出成绩单</el-button>
            </div>
            <el-table :data="studentList" border size="small">
              <el-table-column prop="nickname" label="学生姓名" width="120" />
              <el-table-column prop="progress" label="计划完成率" width="180">
                <template #default="{ row }">
                  <el-progress :percentage="row.progress" :stroke-width="10" />
                </template>
              </el-table-column>
              <el-table-column prop="duration" label="累计时长(min)" width="120" align="center" />
              <el-table-column prop="lastStudy" label="最近学习" width="120" align="center" />
              <el-table-column label="操作" width="100" align="center">
                <template #default>
                  <el-button link type="primary">档案</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>
        <el-empty v-else description="请先在左侧选择一个院校以管理教学组织" :image-size="120" />
      </div>
    </div>

    <!-- Group Form Dialog -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑分组' : '新增分组'" 
      width="500px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="分组名称" prop="name">
          <el-input v-model="form.name" placeholder="如：2022级中医1班" />
        </el-form-item>
        <el-form-item label="分组类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio label="班级">班级</el-radio>
            <el-radio label="专业">专业</el-radio>
            <el-radio label="自定义">自定义</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="选择学生" prop="studentIds">
          <el-select 
            v-model="form.studentIds" 
            multiple 
            collapse-tags 
            placeholder="请选择学生" 
            style="width: 100%"
          >
            <el-option v-for="i in 10" :key="i" :label="`学生_${1000 + i}`" :value="1000 + i" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

interface CollegeNode {
  id?: number
  name: string
  children?: CollegeNode[]
}

interface OrgGroup {
  id: number
  name: string
  type: string
  studentCount: number
  createTime: string
}

interface Student {
  id: number
  nickname: string
  progress: number
  duration: number
  lastStudy: string
}

const loading = ref(false)
const submitting = ref(false)
const filterText = ref('')
const treeRef = ref()
const collegeTree = ref<CollegeNode[]>([])
const groupList = ref<OrgGroup[]>([])
const studentList = ref<Student[]>([])
const selectedCollege = ref<CollegeNode | null>(null)
const currentGroup = ref<OrgGroup | null>(null)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()

const defaultProps = {
  children: 'children',
  label: 'name'
}

interface GroupForm {
  id: number | null
  name: string
  type: string
  studentIds: number[]
}

const form = reactive<GroupForm>({
  id: null,
  name: '',
  type: '班级',
  studentIds: []
})

const rules = {
  name: [{ required: true, message: '请输入分组名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择分组类型', trigger: 'change' }],
  studentIds: [{ required: true, message: '请至少选择一个学生', trigger: 'change' }]
}

const filterNode = (value: string, data: CollegeNode) => {
  if (!value) return true
  return data.name.includes(value)
}

watch(filterText, (val) => {
  treeRef.value?.filter(val)
})

const fetchColleges = async () => {
  const res = await axios.get('/api/college/list')
  collegeTree.value = [
    { name: '中医药院校', children: res.data.data.list }
  ]
}

const handleNodeClick = (data: CollegeNode) => {
  if (data.children) return
  selectedCollege.value = data
  currentGroup.value = null
  fetchGroups()
}

const fetchGroups = async () => {
  if (!selectedCollege.value) return
  loading.value = true
  try {
    const res = await axios.get('/api/college/organization/groups', {
      params: { collegeId: selectedCollege.value.id }
    })
    groupList.value = res.data.data.list
  } finally {
    loading.value = false
  }
}

const viewDetails = async (row: OrgGroup) => {
  currentGroup.value = row
  const res = await axios.get('/api/college/organization/students', {
    params: { groupId: row.id }
  })
  studentList.value = res.data.data
}

const getTypeTag = (type: string) => {
  const map: Record<string, string> = { '班级': '', '专业': 'success', '自定义': 'warning' }
  return map[type] || ''
}

const handleAddGroup = () => {
  isEdit.value = false
  Object.assign(form, { id: null, name: '', type: '班级', studentIds: [] })
  dialogVisible.value = true
}

const handleEdit = (row: OrgGroup) => {
  isEdit.value = true
  Object.assign(form, { ...row, studentIds: [1001, 1002] })
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!selectedCollege.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    await axios.post('/api/college/organization/save', {
      ...form,
      collegeId: selectedCollege.value.id
    })
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchGroups()
  } finally {
    submitting.value = false
  }
}

const handleDelete = (row: OrgGroup) => {
  ElMessageBox.confirm(`确定要删除分组“${row.name}”吗？`, '删除确认', {
    type: 'warning'
  }).then(async () => {
    await axios.post('/api/college/organization/delete', { id: row.id })
    ElMessage.success('删除成功')
    if (currentGroup.value?.id === row.id) {
      currentGroup.value = null
    }
    fetchGroups()
  })
}

onMounted(fetchColleges)
</script>

<style scoped lang="scss">
.organization-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;

  .mb-10 { margin-bottom: 10px; }
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

  .content-layout {
    display: flex;
    gap: 24px;
    height: calc(100vh - 180px);
  }

  .college-selector {
    width: 280px;
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.05);
    display: flex;
    flex-direction: column;

    .selector-header {
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      &::before {
        content: "";
        width: 4px;
        height: 14px;
        background: #1e3a8a;
        border-radius: 2px;
      }
    }

    .custom-tree-node {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      .el-icon { color: #1e3a8a; }
    }
  }

  .main-content {
    flex: 1;
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.05);
    overflow-y: auto;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      .college-name {
        margin: 0;
        font-size: 18px;
        color: #1e293b;
      }
    }

    .detail-section {
      margin-top: 30px;
      padding-top: 24px;
      border-top: 1px dashed #e2e8f0;
      
      .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        .title {
          font-weight: bold;
          color: #1e3a8a;
          font-size: 15px;
        }
      }
    }
  }
}
</style>
