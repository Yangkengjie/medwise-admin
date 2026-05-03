<template>
  <el-container class="layout-container">
    <el-aside width="240px" class="aside">
      <div class="logo">
        <el-icon :size="24" color="#fff"><MedicineBox /></el-icon>
        <span>学医智用·管理端</span>
      </div>
      <el-scrollbar>
        <el-menu
          :default-active="activeMenu"
          class="el-menu-vertical"
          :collapse="isCollapse"
          background-color="#001529"
          text-color="#fff"
          active-text-color="#409eff"
          router
        >
          <template v-for="route in menuRoutes" :key="route.path">
            <el-sub-menu v-if="route.children" :index="route.path">
              <template #title>
                <el-icon v-if="route.meta?.icon">
                  <component :is="route.meta.icon" />
                </el-icon>
                <span>{{ route.meta?.title }}</span>
              </template>
              <el-menu-item
                v-for="child in route.children"
                :key="child.path"
                :index="resolvePath(route.path, child.path)"
              >
                {{ child.meta?.title }}
              </el-menu-item>
            </el-sub-menu>
            <el-menu-item v-else :index="route.path">
              <el-icon v-if="route.meta?.icon">
                <component :is="route.meta.icon" />
              </el-icon>
              <template #title>{{ route.meta?.title }}</template>
            </el-menu-item>
          </template>
        </el-menu>
      </el-scrollbar>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="isCollapse = !isCollapse">
            <Expand v-if="isCollapse" />
            <Fold v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentRouteTitle">{{ currentRouteTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown trigger="click" @command="handleRoleSwitch">
            <span class="user-info">
              <el-avatar :size="32" icon="UserFilled" />
              <div class="user-meta">
                <span class="username">{{ userStore.username }}</span>
                <span class="role-tag">{{ userStore.currentRole }}</span>
              </div>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <div class="debug-header">切换角色查看 (调试用)</div>
                <el-dropdown-item command="超级管理员">超级管理员</el-dropdown-item>
                <el-dropdown-item command="内容编辑">内容编辑</el-dropdown-item>
                <el-dropdown-item command="运营客服">运营客服</el-dropdown-item>
                <el-dropdown-item command="院校管理员">院校管理员</el-dropdown-item>
                <el-dropdown-item command="只读分析员">只读分析员</el-dropdown-item>
                <el-dropdown-item divided>个人中心</el-dropdown-item>
                <el-dropdown-item>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore, Role } from '@/store/user'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const isCollapse = ref(false)

const activeMenu = computed(() => route.path)
const currentRouteTitle = computed(() => route.meta.title as string)

const menuRoutes = computed(() => {
  const rootRoute = router.options.routes.find(r => r.path === '/')
  const children = rootRoute?.children || []
  
  // Filter routes based on permissions
  return children.filter(route => {
    const fullPath = route.path.startsWith('/') ? route.path : `/${route.path}`
    return userStore.hasPermission(fullPath)
  })
})

const resolvePath = (parentPath: string, childPath: string) => {
  if (parentPath === '/') return `/${childPath}`
  return `/${parentPath}/${childPath}`.replace(/\/+/g, '/')
}

const handleRoleSwitch = (role: Role) => {
  if (['个人中心', '退出登录'].includes(role as any)) return
  userStore.setRole(role)
  ElMessage.success(`已切换至【${role}】视角`)
  // If current route is not allowed for the new role, redirect to dashboard
  if (!userStore.hasPermission(route.path)) {
    router.push('/dashboard')
  }
}
</script>

<style scoped lang="scss">
.layout-container {
  height: 100vh;
}

.aside {
  background-color: #001529;
  transition: width 0.3s;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    padding: 0 20px;
    gap: 12px;
    color: #fff;
    font-weight: bold;
    font-size: 18px;
    background: #002140;
    white-space: nowrap;
  }
}

.header {
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 20px;

    .collapse-btn {
      font-size: 20px;
      cursor: pointer;
    }
  }

  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background 0.2s;
      &:hover { background: #f5f7fa; }
      
      .user-meta {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
        .username {
          font-size: 14px;
          font-weight: bold;
          color: #303133;
        }
        .role-tag {
          font-size: 11px;
          color: #1e3a8a;
          margin-top: 2px;
        }
      }
    }
  }

  .debug-header {
    background: #fdf6ec;
    color: #e6a23c;
    font-weight: bold;
    padding: 8px 12px;
    font-size: 12px;
    border-bottom: 1px solid #faecd8;
  }
}

.main {
  background-color: #f0f2f5;
  padding: 20px;
}

/* fade-transform */
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.5s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
