<template>
  <div class="tags-management-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-input
              v-model="searchQuery"
              placeholder="搜索标签名称"
              prefix-icon="Search"
              clearable
              style="width: 250px"
              @input="handleSearch"
            />
          </div>
          <div class="header-right">
            <el-button type="primary" icon="Plus" @click="handleAdd">新增标签</el-button>
            <el-button type="warning" icon="Connection" @click="handleMerge">合并标签</el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="tagList"
        v-loading="loading"
        border
        stripe
        style="width: 100%"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="name" label="标签名称" min-width="150" />
        <el-table-column prop="knowledgeCount" label="关联知识点数量" width="180" sortable="custom" align="center" />
        <el-table-column prop="usageCount" label="使用次数" width="150" sortable="custom" align="center">
          <template #default="{ row }">
            <el-tag :type="row.usageCount > 100 ? 'danger' : 'info'">{{ row.usageCount }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
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
          @current-change="fetchTags"
        />
      </div>
    </el-card>

    <!-- Add/Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑标签' : '新增标签'" width="400px">
      <el-form :model="tagForm" label-width="80px" ref="formRef" :rules="rules">
        <el-form-item label="标签名称" prop="name">
          <el-input v-model="tagForm.name" placeholder="请输入标签名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- Merge Dialog -->
    <el-dialog v-model="mergeDialogVisible" title="合并重复标签" width="500px">
      <el-alert
        title="注意：合并后，标签 A 的所有关联将自动迁移到标签 B，且标签 A 将被删除。"
        type="warning"
        show-icon
        :closable="false"
        style="margin-bottom: 20px"
      />
      <el-form :model="mergeForm" label-width="100px">
        <el-form-item label="待合并标签 A" required>
          <el-select v-model="mergeForm.sourceId" placeholder="选择被合并的标签" style="width: 100%">
            <el-option
              v-for="item in allTags"
              :key="item.id"
              :label="item.name"
              :value="item.id"
              :disabled="item.id === mergeForm.targetId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="目标标签 B" required>
          <el-select v-model="mergeForm.targetId" placeholder="选择合并到的目标标签" style="width: 100%">
            <el-option
              v-for="item in allTags"
              :key="item.id"
              :label="item.name"
              :value="item.id"
              :disabled="item.id === mergeForm.sourceId"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="mergeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitMerge">确认合并</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

interface Tag {
  id: number | null
  name: string
  knowledgeCount: number
  usageCount: number
}

const tagList = ref<Tag[]>([])
const allTags = ref<Tag[]>([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchQuery = ref('')
const sortProp = ref('')
const sortOrder = ref('')

const fetchTags = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/tags/list', {
      params: {
        name: searchQuery.value,
        page: currentPage.value,
        size: pageSize.value,
        prop: sortProp.value,
        order: sortOrder.value
      }
    })
    tagList.value = res.data.data.list
    total.value = res.data.data.total
    
    // For merge select
    const allRes = await axios.get('/api/tags/list', { params: { size: 1000 } })
    allTags.value = allRes.data.data.list
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchTags()
}

const handleSortChange = ({ prop, order }: { prop: string, order: string }) => {
  sortProp.value = prop
  sortOrder.value = order
  fetchTags()
}

// Form logic
const dialogVisible = ref(false)
const isEdit = ref(false)
const tagForm = ref<Partial<Tag>>({ id: null, name: '' })
const rules = {
  name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }]
}

const handleAdd = () => {
  isEdit.value = false
  tagForm.value = { id: null, name: '' }
  dialogVisible.value = true
}

const handleEdit = (row: Tag) => {
  isEdit.value = true
  tagForm.value = { ...row }
  dialogVisible.value = true
}

const submitForm = async () => {
  await axios.post('/api/tags/save', tagForm.value)
  ElMessage.success('操作成功')
  dialogVisible.value = false
  fetchTags()
}

const handleDelete = (row: Tag) => {
  ElMessageBox.confirm(`确定删除标签 ${row.name} 吗？`, '警告', { type: 'warning' }).then(() => {
    ElMessage.success('删除成功')
    fetchTags()
  })
}

// Merge logic
const mergeDialogVisible = ref(false)
const mergeForm = ref<{ sourceId: number | null, targetId: number | null }>({ sourceId: null, targetId: null })

const handleMerge = () => {
  mergeForm.value = { sourceId: null, targetId: null }
  mergeDialogVisible.value = true
}

const submitMerge = async () => {
  if (!mergeForm.value.sourceId || !mergeForm.value.targetId) {
    return ElMessage.warning('请选择要合并的标签')
  }
  await axios.post('/api/tags/merge', mergeForm.value)
  ElMessage.success('合并成功')
  mergeDialogVisible.value = false
  fetchTags()
}

onMounted(fetchTags)
</script>

<style scoped lang="scss">
.tags-management-container {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
