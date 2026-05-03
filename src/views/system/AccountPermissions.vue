<template>
  <div class="account-permissions-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="title">账号权限管理</h2>
        <p class="subtitle">管理系统管理员账号及其对应的功能与菜单操作权限</p>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="custom-tabs">
      <!-- Tab 1: Admin Account Management -->
      <el-tab-pane label="管理员账号管理" name="admins">
        <el-card shadow="never">
          <div class="table-toolbar">
            <el-button type="primary" icon="Plus" @click="handleAddAdmin">新增管理员</el-button>
          </div>
          <el-table :data="adminList" border stripe v-loading="loading">
            <el-table-column prop="account" label="账号" width="150" />
            <el-table-column prop="name" label="姓名" width="120" />
            <el-table-column prop="role" label="所属角色" width="150">
              <template #default="{ row }">
                <el-tag effect="plain">{{ row.role }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="lastLogin" label="最后登录时间" width="180" align="center" />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === '启用' ? 'success' : 'danger'">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="250" fixed="right" align="center">
              <template #default="{ row }">
                <el-button link type="primary" @click="handleEditAdmin(row)">编辑角色</el-button>
                <el-divider direction="vertical" />
                <el-button link type="warning" @click="handleResetPassword(row)">重置密码</el-button>
                <el-divider direction="vertical" />
                <el-button 
                  link 
                  :type="row.status === '启用' ? 'danger' : 'success'" 
                  @click="toggleAdminStatus(row)"
                >
                  {{ row.status === '启用' ? '停用' : '启用' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- Tab 2: Role Permission Management -->
      <el-tab-pane label="角色权限管理" name="roles">
        <div class="role-permission-layout">
          <!-- Left: Role List -->
          <div class="role-list-section">
            <div class="section-title">系统角色列表</div>
            <div 
              v-for="role in roleList" 
              :key="role.id" 
              class="role-item"
              :class="{ active: selectedRoleId === role.id }"
              @click="handleRoleClick(role)"
            >
              <div class="role-name">{{ role.name }}</div>
              <div class="role-desc">{{ role.description }}</div>
            </div>
          </div>

          <!-- Right: Permission Tree -->
          <div class="permission-tree-section" v-if="selectedRoleId">
            <div class="permission-header">
              <span class="title">正在配置：{{ selectedRoleName }} 权限</span>
              <div class="tree-actions">
                <el-button size="small" @click="selectAllPermissions">全选</el-button>
                <el-button size="small" @click="resetPermissions">清空</el-button>
                <el-button type="primary" size="small" icon="Check" @click="savePermissions">保存权限配置</el-button>
              </div>
            </div>
            
            <div class="tree-wrapper">
              <el-tree
                ref="permissionTreeRef"
                :data="permissionTree"
                show-checkbox
                node-key="id"
                default-expand-all
                :props="{ label: 'label', children: 'children' }"
              />
            </div>
          </div>
          <el-empty v-else description="请从左侧选择一个角色以配置权限" style="flex: 1" />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- Admin Form Dialog -->
    <el-dialog 
      v-model="adminDialogVisible" 
      :title="adminForm.id ? '编辑管理员' : '新增管理员'" 
      width="500px"
    >
      <el-form :model="adminForm" :rules="adminRules" ref="adminFormRef" label-width="100px">
        <el-form-item label="账号" prop="account">
          <el-input v-model="adminForm.account" placeholder="请输入登录账号" :disabled="!!adminForm.id" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!adminForm.id">
          <el-input v-model="adminForm.password" type="password" show-password placeholder="请输入登录密码" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="adminForm.name" placeholder="请输入管理员姓名" />
        </el-form-item>
        <el-form-item label="所属角色" prop="role">
          <el-select v-model="adminForm.role" placeholder="请选择角色" style="width: 100%">
            <el-option v-for="role in roleList" :key="role.id" :label="role.name" :value="role.name" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adminDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdminForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

interface AdminAccount {
  id: number | null
  account: string
  name: string
  role: string
  lastLogin: string
  status: '启用' | '停用'
  password?: string
}

interface Role {
  id: number
  name: string
  description: string
}

interface PermissionNode {
  id: string
  label: string
  children?: PermissionNode[]
}

const activeTab = ref('admins')
const loading = ref(false)
const adminList = ref<AdminAccount[]>([])
const roleList = ref<Role[]>([])
const permissionTree = ref<PermissionNode[]>([])
const selectedRoleId = ref<number | null>(null)
const selectedRoleName = ref('')
const permissionTreeRef = ref()

// Admin Form Logic
const adminDialogVisible = ref(false)
const adminFormRef = ref()
const adminForm = reactive<Partial<AdminAccount>>({
  id: null,
  account: '',
  password: '',
  name: '',
  role: ''
})

const adminRules = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const fetchData = async () => {
  loading.value = true
  try {
    const [adminsRes, rolesRes, treeRes] = await Promise.all([
      axios.get('/api/system/admins'),
      axios.get('/api/system/roles'),
      axios.get('/api/system/permission-tree')
    ])
    adminList.value = adminsRes.data.data
    roleList.value = rolesRes.data.data
    permissionTree.value = treeRes.data.data
  } finally {
    loading.value = false
  }
}

const handleAddAdmin = () => {
  Object.assign(adminForm, { id: null, account: '', password: '', name: '', role: '' })
  adminDialogVisible.value = true
}

const handleEditAdmin = (row: AdminAccount) => {
  Object.assign(adminForm, { ...row, password: '***' })
  adminDialogVisible.value = true
}

const submitAdminForm = async () => {
  await adminFormRef.value.validate()
  await axios.post('/api/system/save-admin', adminForm)
  ElMessage.success('管理员信息已保存')
  adminDialogVisible.value = false
  fetchData()
}

const handleResetPassword = (row: AdminAccount) => {
  ElMessageBox.prompt(`正在重置账号 ${row.account} 的密码`, '密码重置', {
    confirmButtonText: '确定重置',
    cancelButtonText: '取消',
    inputPlaceholder: '请输入新密码',
    inputType: 'password'
  }).then(({ value }) => {
    ElMessage.success('密码已成功重置')
  })
}

const toggleAdminStatus = (row: AdminAccount) => {
  const action = row.status === '启用' ? '停用' : '启用'
  ElMessageBox.confirm(`确定要${action}管理员账号 ${row.account} 吗？`, '状态变更确认').then(async () => {
    ElMessage.success(`账号已${action}`)
    fetchData()
  })
}

// Role Permission Logic
const handleRoleClick = (role: Role) => {
  selectedRoleId.value = role.id
  selectedRoleName.value = role.name
  // Mock random permissions
  const keys = ['content_view', 'deduction_view', 'operation_msg']
  setTimeout(() => {
    permissionTreeRef.value?.setCheckedKeys(keys)
  }, 0)
}

const selectAllPermissions = () => {
  const allIds: string[] = []
  const traverse = (nodes: PermissionNode[]) => {
    nodes.forEach(node => {
      allIds.push(node.id)
      if (node.children) traverse(node.children)
    })
  }
  traverse(permissionTree.value)
  permissionTreeRef.value?.setCheckedKeys(allIds)
}

const resetPermissions = () => {
  permissionTreeRef.value?.setCheckedKeys([])
}

const savePermissions = async () => {
  const checkedKeys = permissionTreeRef.value?.getCheckedKeys()
  await axios.post('/api/system/save-role-permissions', {
    roleId: selectedRoleId.value,
    permissions: checkedKeys
  })
  ElMessage.success('权限配置已保存并生效')
}

onMounted(fetchData)
</script>

<style scoped lang="scss">
.account-permissions-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;

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

  .table-toolbar {
    margin-bottom: 16px;
  }

  .role-permission-layout {
    display: flex;
    gap: 24px;
    height: calc(100vh - 220px);
    
    .role-list-section {
      width: 320px;
      background: #fff;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      padding: 16px;
      overflow-y: auto;

      .section-title {
        font-weight: bold;
        color: #1e293b;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #f1f5f9;
      }

      .role-item {
        padding: 16px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        margin-bottom: 12px;
        border: 1px solid transparent;
        background: #f8fafc;

        &:hover {
          background: #eff6ff;
          border-color: #bfdbfe;
        }

        &.active {
          background: #eff6ff;
          border-color: #1e3a8a;
          .role-name { color: #1e3a8a; }
        }

        .role-name {
          font-weight: bold;
          font-size: 15px;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .role-desc {
          font-size: 12px;
          color: #64748b;
          line-height: 1.4;
        }
      }
    }

    .permission-tree-section {
      flex: 1;
      background: #fff;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      padding: 20px;
      display: flex;
      flex-direction: column;

      .permission-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #f1f5f9;
        .title {
          font-weight: bold;
          color: #1e3a8a;
        }
        .tree-actions {
          display: flex;
          gap: 10px;
        }
      }

      .tree-wrapper {
        flex: 1;
        overflow-y: auto;
        :deep(.el-tree-node__content) {
          height: 36px;
        }
      }
    }
  }
}
</style>
