<template>
  <div class="course-system-container">
    <el-card class="box-card" :body-style="{ padding: '20px', height: 'calc(100vh - 160px)', display: 'flex', gap: '20px' }">
      <!-- Left: Tree Navigation -->
      <div class="tree-section">
        <div class="search-bar">
          <el-input
            v-model="filterText"
            placeholder="搜索课程名称"
            prefix-icon="Search"
            clearable
          />
        </div>
        <div class="tree-header">
          <span class="title">目录结构</span>
          <el-button type="primary" link icon="Plus" @click="handleAddNode(null)" v-operable>新增课程</el-button>
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
            <template #default="{ node, data }">
              <div class="custom-tree-node">
                <span class="node-label">
                  <el-icon v-if="data.type === 'course'"><Notebook /></el-icon>
                  <el-icon v-else-if="data.type === 'chapter'"><Files /></el-icon>
                  <el-icon v-else><Document /></el-icon>
                  {{ node.label }}
                </span>
                <span class="node-actions" v-operable>
                  <el-button
                    v-if="data.type !== 'section'"
                    link
                    type="primary"
                    icon="Plus"
                    @click.stop="handleAddNode(data)"
                  />
                  <el-button
                    link
                    type="primary"
                    icon="Edit"
                    @click.stop="handleEditNode(data)"
                  />
                  <el-button
                    link
                    type="danger"
                    icon="Delete"
                    @click.stop="handleDeleteNode(node, data)"
                  />
                </span>
              </div>
            </template>
          </el-tree>
        </el-scrollbar>
      </div>

      <!-- Right: Content Area -->
      <div class="content-section">
        <div v-if="selectedNode && selectedNode.type === 'course'" class="course-detail">
          <div class="section-header">
            <h3>{{ selectedNode.label }} - 章节列表</h3>
            <el-button type="primary" icon="Plus" @click="handleAddNode(selectedNode)">新增章节</el-button>
          </div>
          <el-alert title="可通过拖拽下方卡片进行章节排序" type="info" show-icon :closable="false" style="margin-bottom: 20px" />
          
          <draggable
            v-model="chapters"
            item-key="id"
            @end="handleDragEnd"
            class="chapter-list"
            handle=".drag-handle"
          >
            <template #item="{ element }">
              <div class="chapter-item">
                <div class="drag-handle"><el-icon><Operation /></el-icon></div>
                <div class="chapter-info">
                  <span class="chapter-name">{{ element.label }}</span>
                  <span class="chapter-meta">排序: {{ element.order }} | 状态: {{ element.enabled ? '已启用' : '已禁用' }}</span>
                </div>
                <div class="chapter-actions">
                  <el-button link type="primary" icon="Edit" @click="handleEditNode(element)">编辑</el-button>
                  <el-button link type="danger" icon="Delete" @click="handleDeleteNode(null, element)">删除</el-button>
                </div>
              </div>
            </template>
          </draggable>
        </div>

        <div v-else-if="selectedNode" class="node-preview">
          <el-empty :description="'正在查看 ' + selectedNode.label">
            <template #default>
              <el-descriptions :title="selectedNode.type === 'chapter' ? '章节详情' : '节详情'" border :column="1">
                <el-descriptions-item label="名称">{{ selectedNode.label }}</el-descriptions-item>
                <el-descriptions-item label="类型">{{ selectedNode.type }}</el-descriptions-item>
                <el-descriptions-item label="排序">{{ selectedNode.order }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                  <el-tag :type="selectedNode.enabled ? 'success' : 'danger'">{{ selectedNode.enabled ? '已启用' : '已禁用' }}</el-tag>
                </el-descriptions-item>
              </el-descriptions>
            </template>
          </el-empty>
        </div>

        <div v-else class="empty-state">
          <el-empty description="请从左侧选择课程进行查看或管理" />
        </div>
      </div>
    </el-card>

    <!-- Node Form Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑节点' : '新增节点'"
      width="500px"
    >
      <el-form :model="form" label-width="80px" ref="formRef" :rules="rules">
        <el-form-item label="名称" prop="label">
          <el-input v-model="form.label" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="排序" prop="order">
          <el-input-number v-model="form.order" :min="1" />
        </el-form-item>
        <el-form-item label="封面图" v-if="form.type === 'course'">
          <el-upload
            class="avatar-uploader"
            action="#"
            :show-file-list="false"
            :auto-upload="false"
          >
            <img v-if="form.cover" :src="form.cover" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ElTree, ElMessageBox, ElMessage } from 'element-plus'
import draggable from 'vuedraggable'
import axios from 'axios'

interface NodeData {
  id: number
  label: string
  type: 'course' | 'chapter' | 'section'
  order: number
  enabled: boolean
  cover?: string
  children?: NodeData[]
}

const filterText = ref('')
const treeRef = ref<InstanceType<typeof ElTree>>()
const courseTree = ref<NodeData[]>([])
const chapters = ref<NodeData[]>([])
const selectedNode = ref<NodeData | null>(null)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()

const form = ref<Partial<NodeData>>({
  label: '',
  order: 1,
  enabled: true,
  type: 'course',
  cover: ''
})

const rules = {
  label: [{ required: true, message: '请输入名称', trigger: 'blur' }]
}

const defaultProps = {
  children: 'children',
  label: 'label'
}

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

const handleNodeClick = (data: NodeData) => {
  selectedNode.value = data
  if (data.type === 'course') {
    chapters.value = data.children || []
  }
}

const handleAddNode = (parent: NodeData | null) => {
  isEdit.value = false
  form.value = {
    label: '',
    order: 1,
    enabled: true,
    type: parent ? (parent.type === 'course' ? 'chapter' : 'section') : 'course',
    cover: ''
  }
  dialogVisible.value = true
}

const handleEditNode = (data: NodeData) => {
  isEdit.value = true
  form.value = { ...data }
  dialogVisible.value = true
}

const handleDeleteNode = (node: any, data: NodeData) => {
  ElMessageBox.confirm(`确定要删除 ${data.label} 吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await axios.delete(`/api/courses/node/${data.id}`)
    ElMessage.success('删除成功')
    fetchTree()
    if (selectedNode.value?.id === data.id) {
      selectedNode.value = null
    }
  })
}

const submitForm = async () => {
  await formRef.value.validate()
  await axios.post('/api/courses/node', form.value)
  ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
  dialogVisible.value = false
  fetchTree()
}

const handleDragEnd = () => {
  ElMessage.success('排序更新成功')
  // In real app, send new order to backend
}

onMounted(() => {
  fetchTree()
})
</script>

<style scoped lang="scss">
.course-system-container {
  height: 100%;

  .tree-section {
    width: 350px;
    border-right: 1px solid #ebeef5;
    padding-right: 20px;
    display: flex;
    flex-direction: column;

    .search-bar {
      margin-bottom: 15px;
    }

    .tree-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      
      .title {
        font-weight: bold;
        color: #303133;
      }
    }

    .custom-tree-node {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 14px;
      padding-right: 8px;

      .node-label {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .node-actions {
        opacity: 0;
        transition: opacity 0.2s;
      }

      &:hover {
        .node-actions {
          opacity: 1;
        }
      }
    }
  }

  .content-section {
    flex: 1;
    overflow-y: auto;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h3 {
        margin: 0;
        color: #1e3a8a;
      }
    }

    .chapter-list {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .chapter-item {
        display: flex;
        align-items: center;
        padding: 15px;
        background: #fff;
        border: 1px solid #ebeef5;
        border-radius: 8px;
        transition: all 0.3s;

        &:hover {
          box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
          border-color: #409eff;
        }

        .drag-handle {
          cursor: move;
          margin-right: 15px;
          color: #909399;
        }

        .chapter-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;

          .chapter-name {
            font-weight: bold;
            color: #303133;
          }

          .chapter-meta {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }
}

.avatar-uploader {
  .avatar {
    width: 120px;
    height: 120px;
    display: block;
    object-fit: cover;
  }
  
  :deep(.el-upload) {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--el-transition-duration-fast);

    &:hover {
      border-color: var(--el-color-primary);
    }
  }
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 120px;
  height: 120px;
  text-align: center;
  line-height: 120px;
}
</style>
