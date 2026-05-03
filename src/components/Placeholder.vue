<template>
  <div class="placeholder-container">
    <el-card shadow="never">
      <el-empty :description="title + ' 正在开发中...'">
        <el-button type="primary" @click="$router.back()">返回上一页</el-button>
      </el-empty>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const title = computed(() => route.meta.title as string || '页面')
</script>

<style scoped>
.placeholder-container {
  padding: 20px;
}
</style>
