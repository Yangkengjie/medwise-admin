<template>
  <div class="resource-management-container">
    <el-card class="box-card" :body-style="{ padding: '20px', height: 'calc(100vh - 160px)', display: 'flex', gap: '20px' }">
      <!-- Left: Knowledge Tree -->
      <div class="tree-section">
        <div class="search-bar">
          <el-input
            v-model="filterText"
            placeholder="搜索知识点"
            prefix-icon="Search"
            clearable
          />
        </div>
        <el-scrollbar>
          <el-tree
            ref="treeRef"
            :data="courseTree"
            :props="defaultProps"
            node-key="id"
            highlight-current
            default-expand-all
            :filter-node-method="filterNode"
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

      <!-- Right: Resource Tabs -->
      <div class="content-section">
        <div class="section-header" v-if="selectedNode">
          <h3>关联资源：{{ selectedNode.label }}</h3>
          <el-button type="primary" icon="Plus" @click="handleAddResource">新增资源</el-button>
        </div>
        <el-tabs v-model="activeTab" @tab-click="handleTabClick" v-if="selectedNode">
          <el-tab-pane label="图片资源" name="image">
            <el-row :gutter="20" class="resource-grid">
              <el-col :span="6" v-for="item in resourceList" :key="item.id">
                <el-card shadow="hover" class="resource-card">
                  <el-image 
                    :src="item.url" 
                    fit="cover" 
                    class="resource-img"
                    :preview-src-list="[item.url]"
                  />
                  <div class="resource-info">
                    <span class="name">{{ item.name }}</span>
                    <div class="actions">
                      <el-button link type="primary" icon="Edit" @click="handleEdit(item)" />
                      <el-button link type="primary" icon="Link" @click="handleRelate(item)" />
                      <el-button link type="danger" icon="Delete" @click="handleDelete(item)" />
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </el-tab-pane>
          <el-tab-pane label="古籍引用" name="classic">
            <el-table :data="resourceList" border stripe>
              <el-table-column prop="name" label="名称" width="200" />
              <el-table-column prop="source" label="来源标注" width="200" />
              <el-table-column prop="content" label="正文内容" show-overflow-tooltip />
              <el-table-column label="操作" width="180" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
                  <el-button link type="primary" @click="handleRelate(row)">关联</el-button>
                  <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="现代研究文献" name="literature">
            <el-table :data="resourceList" border stripe>
              <el-table-column prop="name" label="标题" width="200" />
              <el-table-column prop="source" label="刊载/来源" width="200" />
              <el-table-column prop="content" label="摘要/正文" show-overflow-tooltip />
              <el-table-column label="操作" width="180" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
                  <el-button link type="primary" @click="handleRelate(row)">关联</el-button>
                  <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
        <el-empty v-else description="请从左侧选择知识点以查看或管理其资源" />
      </div>
    </el-card>

    <!-- Resource Dialog -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑资源' : '新增资源'" width="600px">
      <el-form :model="resourceForm" label-width="100px" ref="formRef">
        <el-form-item label="资源名称" required>
          <el-input v-model="resourceForm.name" placeholder="请输入资源名称" />
        </el-form-item>
        
        <template v-if="activeTab === 'image'">
          <el-form-item label="上传图片">
            <el-upload
              class="avatar-uploader"
              action="#"
              :show-file-list="false"
              :auto-upload="false"
              @change="handleImageChange"
            >
              <img v-if="resourceForm.url" :src="resourceForm.url" class="avatar" />
              <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
            </el-upload>
          </el-form-item>
        </template>
        
        <template v-else>
          <el-form-item label="来源标注" required>
            <el-input v-model="resourceForm.source" placeholder="例如：卷一·阴阳离合论篇第六" />
          </el-form-item>
          <el-form-item label="正文/摘要" required>
            <el-input type="textarea" v-model="resourceForm.content" :rows="5" placeholder="请输入正文内容" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitResource">确定</el-button>
      </template>
    </el-dialog>

    <!-- Relate Dialog -->
    <el-dialog v-model="relateDialogVisible" title="关联到其他知识点" width="400px">
      <el-scrollbar height="400px">
        <el-tree
          :data="courseTree"
          show-checkbox
          node-key="id"
          ref="relateTreeRef"
          :props="defaultProps"
        />
      </el-scrollbar>
      <template #footer>
        <el-button @click="relateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRelate">确认关联</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox, ElTree } from 'element-plus'
import axios from 'axios'

interface Resource {
  id: number | null
  name: string
  url?: string
  source?: string
  content?: string
}

const filterText = ref('')
const treeRef = ref<InstanceType<typeof ElTree>>()
const courseTree = ref<any[]>([])
const selectedNode = ref<any>(null)
const activeTab = ref('image')
const resourceList = ref<Resource[]>([])
const loading = ref(false)

const defaultProps = { children: 'children', label: 'label' }

watch(filterText, (val) => {
  treeRef.value?.filter(val)
})

const filterNode = (value: string, data: any) => {
  if (!value) return true
  return data.label.includes(value)
}

const fetchTree = async () => {
  const res = await axios.get('/api/courses/tree')
  courseTree.value = res.data.data
}

const fetchResources = async () => {
  if (!selectedNode.value) return
  loading.value = true
  try {
    const res = await axios.get('/api/resources/list', {
      params: { type: activeTab.value, knowledgeId: selectedNode.value.id }
    })
    resourceList.value = res.data.data
  } finally {
    loading.value = false
  }
}

const handleNodeClick = (data: any) => {
  selectedNode.value = data
  fetchResources()
}

const handleTabClick = () => {
  fetchResources()
}

// Resource Form Logic
const dialogVisible = ref(false)
const isEdit = ref(false)
const resourceForm = ref<Resource>({
  id: null,
  name: '',
  url: '',
  source: '',
  content: ''
})

const handleAddResource = () => {
  isEdit.value = false
  resourceForm.value = { id: null, name: '', url: '', source: '', content: '' }
  dialogVisible.value = true
}

const handleEdit = (item: Resource) => {
  isEdit.value = true
  resourceForm.value = { ...item }
  dialogVisible.value = true
}

const handleImageChange = (file: any) => {
  // Simulate image upload
  resourceForm.value.url = URL.createObjectURL(file.raw)
}

const submitResource = async () => {
  await axios.post('/api/resources/save', resourceForm.value)
  ElMessage.success('操作成功')
  dialogVisible.value = false
  fetchResources()
}

const handleDelete = (item: Resource) => {
  ElMessageBox.confirm(`确定删除资源 ${item.name} 吗？`, '警告', { type: 'warning' }).then(() => {
    ElMessage.success('删除成功')
    fetchResources()
  })
}

// Relate Logic
const relateDialogVisible = ref(false)
const relateTreeRef = ref<InstanceType<typeof ElTree>>()
const handleRelate = (item: Resource) => {
  relateDialogVisible.value = true
}
const submitRelate = () => {
  ElMessage.success('关联成功')
  relateDialogVisible.value = false
}

onMounted(() => {
  fetchTree()
})
</script>

<style scoped lang="scss">
.resource-management-container {
  height: 100%;

  .tree-section {
    width: 300px;
    border-right: 1px solid #ebeef5;
    padding-right: 20px;
    display: flex;
    flex-direction: column;
    
    .search-bar { margin-bottom: 15px; }
    .custom-tree-node { display: flex; align-items: center; gap: 6px; font-size: 14px; }
  }

  .content-section {
    flex: 1;
    display: flex;
    flex-direction: column;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      h3 { margin: 0; color: #1e3a8a; }
    }

    .resource-grid {
      margin-top: 10px;
      .resource-card {
        margin-bottom: 20px;
        .resource-img {
          width: 100%;
          height: 150px;
          border-radius: 4px;
        }
        .resource-info {
          padding: 10px 0 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          .name {
            font-size: 14px;
            font-weight: bold;
            color: #303133;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .actions {
            display: flex;
            justify-content: flex-end;
          }
        }
      }
    }
  }
}

.avatar-uploader {
  :deep(.el-upload) {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    &:hover { border-color: #409eff; }
  }
  .avatar { width: 178px; height: 178px; display: block; object-fit: cover; }
  .avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 178px;
    height: 178px;
    text-align: center;
    line-height: 178px;
  }
}
</style>
