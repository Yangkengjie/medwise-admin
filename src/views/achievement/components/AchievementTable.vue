<template>
  <el-table :data="data" border stripe class="achievement-table">
    <el-table-column prop="name" label="成就名称" min-width="150" fixed="left" />
    <el-table-column prop="description" label="描述文案" min-width="250">
      <template #default="{ row }">
        <span class="description-text">{{ row.description }}</span>
      </template>
    </el-table-column>
    <el-table-column prop="condition" label="触发条件" min-width="200" />
    <el-table-column prop="threshold" label="触发阈值" width="150" align="center">
      <template #default="{ row }">
        <el-input-number 
          v-model="row.threshold" 
          :min="0" 
          :step="row.step || 1" 
          size="small" 
          controls-position="right"
        />
      </template>
    </el-table-column>
    <el-table-column prop="icon" label="徽章图标" width="100" align="center">
      <template #default="{ row }">
        <el-image :src="row.icon" class="badge-icon" :preview-src-list="[row.icon]" fit="contain" preview-teleported />
      </template>
    </el-table-column>
    <el-table-column prop="status" label="状态" width="100" align="center">
      <template #default="{ row }">
        <el-switch v-model="row.status" />
      </template>
    </el-table-column>
    <el-table-column label="操作" width="100" fixed="right" align="center">
      <template #default="{ row }">
        <el-button link type="primary" @click="$emit('edit', row)">编辑</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">
defineProps<{
  data: any[]
}>()

defineEmits(['edit'])
</script>

<style scoped lang="scss">
.achievement-table {
  .description-text {
    font-size: 13px;
    color: #606266;
    font-style: italic;
  }
  .badge-icon {
    width: 36px;
    height: 36px;
    background: #f8fafc;
    border-radius: 4px;
    padding: 2px;
  }
}
</style>
