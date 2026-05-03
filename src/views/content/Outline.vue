<template>
  <div class="outline-management-container">
    <div class="top-section">
      <el-card class="box-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>导图结构管理</span>
            <div class="actions">
              <el-button type="primary" icon="Plus" @click="addNode">新增根节点</el-button>
              <el-button type="success" icon="View" @click="handlePreview">整体预览</el-button>
            </div>
          </div>
        </template>
        <div class="tree-wrapper">
          <el-tree
            ref="treeRef"
            :data="outlineTree"
            node-key="id"
            draggable
            default-expand-all
            highlight-current
            @node-click="handleNodeClick"
            @node-drop="handleDrop"
          >
            <template #default="{ node, data }">
              <span class="custom-tree-node">
                <span class="label">{{ node.label }}</span>
                <span class="actions">
                  <el-button link type="primary" icon="Plus" @click.stop="addChildNode(data)" />
                  <el-button link type="danger" icon="Delete" @click.stop="removeNode(node, data)" />
                </span>
              </span>
            </template>
          </el-tree>
        </div>
      </el-card>
    </div>

    <div class="bottom-section" v-if="selectedNode">
      <el-card class="box-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>大纲内容管理 - {{ selectedNode.label }}</span>
            <el-button type="primary" @click="saveOutline">保存修改</el-button>
          </div>
        </template>
        <el-form :model="outlineForm" label-width="80px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="显示顺序">
                <el-input-number v-model="outlineForm.order" :min="1" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="注解说明">
                <el-input v-model="outlineForm.note" placeholder="请输入注解" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="大纲正文">
            <el-input
              type="textarea"
              v-model="outlineForm.content"
              :rows="15"
              placeholder="请输入大纲正文内容（支持简单 HTML 标签）"
            />
          </el-form-item>
        </el-form>
      </el-card>
    </div>
    <div v-else class="empty-bottom">
      <el-empty description="请从上方选择一个节点进行编辑" />
    </div>

    <!-- Preview Dialog -->
    <el-dialog v-model="previewVisible" title="大纲预览 (模拟用户端)" width="1000px" top="5vh" destroy-on-close>
      <div class="preview-content">
        <div class="preview-sidebar">
          <div class="sidebar-header">目录导航</div>
          <el-tree 
            :data="outlineTree" 
            default-expand-all 
            :expand-on-click-node="false"
            @node-click="handlePreviewNodeClick"
          />
        </div>
        <div class="preview-main">
          <div v-if="previewNode" class="preview-body">
            <h2 class="preview-title">{{ previewNode.label }}</h2>
            <div class="preview-meta">
              <span>顺序: {{ previewNode.order || 1 }}</span>
              <span v-if="previewNode.note">注解: {{ previewNode.note }}</span>
            </div>
            <div class="preview-rich-text" v-html="previewNode.content || '<p style=\'color:#999\'>该节点暂无正文内容</p>'"></div>
            <div v-if="previewNode.note" class="preview-note-box">
              <div class="note-title">节点注解</div>
              <div class="note-content">{{ previewNode.note }}</div>
            </div>
          </div>
          <el-empty v-else description="请点击左侧目录查看节点详情" />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

interface OutlineNode {
  id: number
  label: string
  content?: string
  note?: string
  order?: number
  children?: OutlineNode[]
}

const outlineTree = ref<OutlineNode[]>([])
const selectedNode = ref<OutlineNode | null>(null)
const previewNode = ref<OutlineNode | null>(null)
const previewVisible = ref(false)

const outlineForm = ref({
  order: 1,
  note: '',
  content: ''
})

const fetchTree = async () => {
  const res = await axios.get('/api/outline/tree')
  outlineTree.value = res.data.data
}

const handleNodeClick = (data: OutlineNode) => {
  selectedNode.value = data
  outlineForm.value = {
    order: data.order || 1,
    note: data.note || '',
    content: data.content || ''
  }
}

const handlePreviewNodeClick = (data: OutlineNode) => {
  previewNode.value = data
}

const handleDrop = () => {
  ElMessage.success('结构顺序已调整')
}

const addNode = () => {
  const id = Date.now()
  const newNode = { id, label: '新大纲节点', children: [], order: outlineTree.value.length + 1 }
  outlineTree.value.push(newNode)
  ElMessage.success('已新增根节点')
}

const addChildNode = (parent: OutlineNode) => {
  if (!parent.children) parent.children = []
  const id = Date.now()
  const newNode = { id, label: '新子节点', children: [], order: parent.children.length + 1 }
  parent.children.push(newNode)
  ElMessage.success(`已为 [${parent.label}] 添加子节点`)
}

const removeNode = (node: any, data: OutlineNode) => {
  ElMessageBox.confirm(`确定要永久删除节点 [${data.label}] 及其所有子节点吗？`, '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const parent = node.parent
    const children = parent.data.children || parent.data
    const index = children.findIndex((d: any) => d.id === data.id)
    children.splice(index, 1)
    if (selectedNode.value?.id === data.id) {
      selectedNode.value = null
    }
    ElMessage.success('节点已删除')
  })
}

const saveOutline = async () => {
  if (selectedNode.value) {
    selectedNode.value.content = outlineForm.value.content
    selectedNode.value.note = outlineForm.value.note
    selectedNode.value.order = outlineForm.value.order
    
    // 同步更新 tree data 中的原始数据
    const updateNodeInData = (nodes: OutlineNode[]) => {
      for (const node of nodes) {
        if (node.id === selectedNode.value?.id) {
          node.content = outlineForm.value.content
          node.note = outlineForm.value.note
          node.order = outlineForm.value.order
          return true
        }
        if (node.children && updateNodeInData(node.children)) return true
      }
      return false
    }
    updateNodeInData(outlineTree.value)

    try {
      await axios.post('/api/outline/update', {
        id: selectedNode.value.id,
        ...outlineForm.value
      })
      ElMessage.success('内容已保存至服务器')
    } catch (error) {
      ElMessage.warning('本地已更新（模拟保存成功）')
    }
  }
}

const handlePreview = () => {
  previewNode.value = selectedNode.value
  previewVisible.value = true
}

onMounted(fetchTree)
</script>

<style scoped lang="scss">
.outline-management-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: calc(100vh - 120px);
  overflow-y: auto;
  padding: 10px;

  .top-section {
    flex: 0 0 45%;
    min-height: 350px;
    
    .tree-wrapper {
      padding: 10px;
      height: 300px;
      overflow-y: auto;
    }
  }

  .bottom-section {
    flex: 0 0 50%;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
    color: #333;
  }

  .custom-tree-node {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 8px;
    font-size: 14px;
    
    .actions {
      display: none;
    }
    
    &:hover .actions {
      display: inline-flex;
      gap: 5px;
    }
  }

  .empty-bottom {
    background: #fff;
    border-radius: 4px;
    padding: 60px;
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px dashed #dcdfe6;
  }
}

.preview-content {
  display: flex;
  gap: 0;
  height: 650px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  
  .preview-sidebar {
    width: 280px;
    border-right: 1px solid #e4e7ed;
    background: #fff;
    display: flex;
    flex-direction: column;

    .sidebar-header {
      padding: 15px;
      font-weight: bold;
      background: #f0f2f5;
      border-bottom: 1px solid #e4e7ed;
      color: #1e3a8a;
    }

    .el-tree {
      flex: 1;
      padding: 10px;
      overflow-y: auto;
    }
  }
  
  .preview-main {
    flex: 1;
    padding: 30px;
    overflow-y: auto;
    background: #fff;
    
    .preview-body {
      max-width: 800px;
      margin: 0 auto;
    }

    .preview-title {
      color: #303133;
      font-size: 24px;
      margin-bottom: 10px;
      padding-bottom: 15px;
      border-bottom: 2px solid #1e3a8a;
    }

    .preview-meta {
      font-size: 13px;
      color: #909399;
      margin-bottom: 25px;
      display: flex;
      gap: 20px;
    }
    
    .preview-rich-text {
      line-height: 1.8;
      font-size: 16px;
      color: #444;
      white-space: pre-wrap;
      margin-bottom: 40px;
    }
    
    .preview-note-box {
      margin-top: 40px;
      padding: 20px;
      background: #fdf6ec;
      border: 1px solid #faecd8;
      border-radius: 8px;
      
      .note-title {
        color: #e6a23c;
        font-weight: bold;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        &::before {
          content: '';
          display: inline-block;
          width: 4px;
          height: 16px;
          background: #e6a23c;
          margin-right: 8px;
          border-radius: 2px;
        }
      }

      .note-content {
        color: #666;
        font-size: 14px;
      }
    }
  }
}
</style>

