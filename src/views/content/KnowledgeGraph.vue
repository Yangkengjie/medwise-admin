<template>
  <div class="knowledge-graph-container">
    <el-card class="box-card" :body-style="{ padding: '20px', height: 'calc(100vh - 160px)', display: 'flex', gap: '20px' }">
      <!-- Left: Course Tree -->
      <div class="tree-section">
        <div class="tree-header">
          <span class="title">课程目录</span>
        </div>
        <el-scrollbar>
          <el-tree
            ref="treeRef"
            :data="courseTree"
            :props="defaultProps"
            node-key="id"
            highlight-current
            default-expand-all
            @node-click="handleNodeClick"
          >
            <template #default="{ data }">
              <span class="custom-tree-node">
                <el-icon v-if="data.type === 'course'"><Notebook /></el-icon>
                <el-icon v-else-if="data.type === 'chapter'"><Files /></el-icon>
                <el-icon v-else><Document /></el-icon>
                {{ data.label }}
              </span>
            </template>
          </el-tree>
        </el-scrollbar>
      </div>

      <!-- Right: Knowledge Point Table -->
      <div class="content-section">
        <div class="table-header">
          <div class="search-form">
            <el-input v-model="searchForm.title" placeholder="按标题搜索" clearable style="width: 200px" />
            <el-input v-model="searchForm.keyword" placeholder="按关键词搜索" clearable style="width: 200px" />
            <el-button type="primary" icon="Search" @click="fetchKnowledgeList">查询</el-button>
          </div>
          <el-button type="primary" icon="Plus" @click="handleAdd" v-operable>新增知识点</el-button>
        </div>

        <el-table :data="knowledgeList" v-loading="loading" border stripe style="width: 100%">
          <el-table-column prop="title" label="标题" min-width="150" />
          <el-table-column prop="importance" label="重要度" width="150">
            <template #default="{ row }">
              <el-rate v-model="row.importance" disabled />
            </template>
          </el-table-column>
          <el-table-column prop="tags" label="关键词" min-width="180">
            <template #default="{ row }">
              <el-tag v-for="tag in row.tags" :key="tag" size="small" style="margin-right: 4px">{{ tag }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
              <el-button link type="primary" @click="handleEditRelation(row)">编辑关系</el-button>
              <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            layout="total, prev, pager, next"
            @current-change="fetchKnowledgeList"
          />
        </div>
      </div>
    </el-card>

    <!-- Knowledge Point Dialog -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑知识点' : '新增知识点'" width="800px">
      <el-form :model="form" label-width="100px" ref="formRef" :rules="rules">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="重要度">
          <el-rate v-model="form.importance" />
        </el-form-item>
        <el-form-item label="关键词">
          <el-select
            v-model="form.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请选择或输入关键词"
          >
            <el-option label="阴阳" value="阴阳" />
            <el-option label="五行" value="五行" />
          </el-select>
        </el-form-item>
        <el-form-item label="正文">
          <el-input type="textarea" v-model="form.content" :rows="10" placeholder="请输入正文内容..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- Relation Management Dialog -->
    <el-dialog v-model="relationDialogVisible" title="编辑关系管理" width="600px">
      <el-form :model="relationForm" label-width="120px">
        <el-form-item label="前置知识">
          <el-select
            v-model="relationForm.pre"
            multiple
            filterable
            remote
            :remote-method="searchKnowledge"
            placeholder="搜索并选择知识点"
            style="width: 100%"
          >
            <el-option
              v-for="item in allKnowledge"
              :key="item.id"
              :label="item.title"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="包含关系">
          <el-select
            v-model="relationForm.contains"
            multiple
            filterable
            remote
            :remote-method="searchKnowledge"
            placeholder="搜索并选择子知识点"
            style="width: 100%"
          >
            <el-option
              v-for="item in allKnowledge"
              :key="item.id"
              :label="item.title"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="病证关联">
          <el-select
            v-model="relationForm.syndrome"
            multiple
            filterable
            allow-create
            placeholder="输入并关联病证"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="方药关联">
          <el-select
            v-model="relationForm.medicine"
            multiple
            filterable
            allow-create
            placeholder="输入并关联方药"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="relationDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRelation">保存关系</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

interface KnowledgePoint {
  id: number
  title: string
  importance: number
  tags: string[]
  content: string
  relations?: {
    pre: number[]
    contains: number[]
    syndrome: string[]
    medicine: string[]
  }
}

// Tree logic
const courseTree = ref<any[]>([])
const defaultProps = { children: 'children', label: 'label' }
const fetchTree = async () => {
  const res = await axios.get('/api/courses/tree')
  courseTree.value = res.data.data
}

// Table logic
const knowledgeList = ref<KnowledgePoint[]>([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchForm = ref({ title: '', keyword: '' })

const fetchKnowledgeList = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/knowledge/list', {
      params: { ...searchForm.value, page: currentPage.value, size: pageSize.value }
    })
    knowledgeList.value = res.data.data.list
    total.value = res.data.data.total
  } finally {
    loading.value = false
  }
}

const handleNodeClick = (data: any) => {
  // Filter by category in real app
  fetchKnowledgeList()
}

// Form logic
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref<Partial<KnowledgePoint>>({
  title: '',
  importance: 3,
  tags: [],
  content: ''
})
const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }]
}

const handleAdd = () => {
  isEdit.value = false
  form.value = { title: '', importance: 3, tags: [], content: '' }
  dialogVisible.value = true
}

const handleEdit = (row: KnowledgePoint) => {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

const submitForm = async () => {
  ElMessage.success('操作成功')
  dialogVisible.value = false
  fetchKnowledgeList()
}

const handleDelete = (row: KnowledgePoint) => {
  ElMessageBox.confirm(`确定删除知识点 ${row.title} 吗？`, '警告', { type: 'warning' }).then(() => {
    ElMessage.success('删除成功')
    fetchKnowledgeList()
  })
}

// Relation logic
const relationDialogVisible = ref(false)
const relationForm = ref<{
  pre: number[]
  contains: number[]
  syndrome: string[]
  medicine: string[]
}>({
  pre: [],
  contains: [],
  syndrome: [],
  medicine: []
})
const allKnowledge = ref<KnowledgePoint[]>([])

const handleEditRelation = (row: KnowledgePoint) => {
  relationForm.value = row.relations ? { ...row.relations } : { pre: [], contains: [], syndrome: [], medicine: [] }
  relationDialogVisible.value = true
  searchKnowledge('')
}

const searchKnowledge = async (query: string) => {
  const res = await axios.get('/api/knowledge/all')
  allKnowledge.value = res.data.data
}

const submitRelation = () => {
  ElMessage.success('关系保存成功')
  relationDialogVisible.value = false
}

onMounted(() => {
  fetchTree()
  fetchKnowledgeList()
})
</script>

<style scoped lang="scss">
.knowledge-graph-container {
  height: 100%;

  .tree-section {
    width: 300px;
    border-right: 1px solid #ebeef5;
    padding-right: 20px;
    display: flex;
    flex-direction: column;

    .tree-header {
      margin-bottom: 15px;
      .title { font-weight: bold; color: #303133; }
    }
    
    .custom-tree-node {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
    }
  }

  .content-section {
    flex: 1;
    display: flex;
    flex-direction: column;

    .table-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;

      .search-form {
        display: flex;
        gap: 12px;
      }
    }

    .pagination {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
}

:deep(.w-e-text-container) {
  background-color: transparent !important;
}
</style>
