import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type Role = '超级管理员' | '内容编辑' | '运营客服' | '院校管理员' | '只读分析员'

export const useUserStore = defineStore('user', () => {
  const currentRole = ref<Role>('超级管理员')
  const username = ref('admin')

  const setRole = (role: Role) => {
    currentRole.value = role
    if (role === '超级管理员') username.value = 'admin'
    else if (role === '内容编辑') username.value = 'editor_user'
    else if (role === '运营客服') username.value = 'service_user'
    else if (role === '院校管理员') username.value = 'college_user'
    else username.value = 'readonly_user'
  }

  // Permission check logic
  const hasPermission = (routePath: string) => {
    if (currentRole.value === '超级管理员') return true
    
    const rolePermissions: Record<Role, string[]> = {
      '超级管理员': ['*'],
      '内容编辑': ['content', 'deduction'],
      '运营客服': ['operation', 'user'],
      '院校管理员': ['college'],
      '只读分析员': ['dashboard', 'content', 'deduction', 'user', 'achievement', 'operation', 'college', 'system']
    }

    const allowedModules = rolePermissions[currentRole.value] || []
    
    // Check if any part of the path matches allowed modules
    const pathSegments = routePath.split('/').filter(s => s)
    if (pathSegments.length === 0) return true // dashboard or root
    
    const module = pathSegments[0]
    if (module === 'dashboard') return true
    
    return allowedModules.includes(module)
  }

  // Action permission check (for buttons)
  const canOperate = computed(() => {
    return currentRole.value !== '只读分析员'
  })

  return {
    currentRole,
    username,
    setRole,
    hasPermission,
    canOperate
  }
})
