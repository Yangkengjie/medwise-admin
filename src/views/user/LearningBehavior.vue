<template>
  <div class="learning-behavior-container">
    <el-card class="search-card">
      <div class="filter-header">
        <el-input
          v-model="searchQuery"
          placeholder="输入用户昵称或 ID 搜索轨迹"
          prefix-icon="Search"
          clearable
          style="width: 300px"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
        
        <div class="filter-options" v-if="hasSearched">
          <el-select v-model="filterType" placeholder="行为类型" clearable style="width: 150px">
            <el-option label="知识点学习" value="study" />
            <el-option label="掌握度变更" value="mastery" />
            <el-option label="学习笔记" value="note" />
            <el-option label="辨证训练" value="training" />
            <el-option label="AI 答疑" value="ai_qa" />
          </el-select>
          <el-date-picker
            v-model="timeRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
        </div>
      </div>
    </el-card>

    <div v-if="hasSearched" class="timeline-wrapper" v-loading="loading">
      <el-empty v-if="behaviors.length === 0" description="暂无相关行为记录" />
      <el-timeline v-else>
        <el-timeline-item
          v-for="item in behaviors"
          :key="item.id"
          :timestamp="item.time"
          placement="top"
          :type="getTimelineItemType(item.type)"
        >
          <el-card shadow="hover" class="behavior-card">
            <!-- Study Record -->
            <div v-if="item.type === 'study'" class="behavior-content study">
              <div class="behavior-header">
                <el-tag size="small" type="primary">知识点学习</el-tag>
                <span class="kp-name">{{ item.content.kp }}</span>
              </div>
              <div class="behavior-body">
                <span>停留时长：<strong>{{ item.content.duration }}</strong></span>
                <el-divider direction="vertical" />
                <span>状态：<el-tag size="small" :type="item.content.status === '完成' ? 'success' : 'info'">{{ item.content.status }}</el-tag></span>
              </div>
            </div>

            <!-- Mastery Change -->
            <div v-else-if="item.type === 'mastery'" class="behavior-content mastery">
              <div class="behavior-header">
                <el-tag size="small" type="warning">掌握度变更</el-tag>
                <span class="kp-name">{{ item.content.kp }}</span>
              </div>
              <div class="behavior-body">
                <span class="status-change">
                  {{ item.content.from }} 
                  <el-icon><Right /></el-icon> 
                  <strong>{{ item.content.to }}</strong>
                </span>
              </div>
            </div>

            <!-- Note Record -->
            <div v-else-if="item.type === 'note'" class="behavior-content note">
              <div class="behavior-header">
                <el-tag size="small" type="success">学习笔记</el-tag>
                <span class="kp-name">{{ item.content.kp }}</span>
              </div>
              <div class="behavior-body">
                <p class="note-summary">“ {{ item.content.summary }} ”</p>
              </div>
            </div>

            <!-- Training Record -->
            <div v-else-if="item.type === 'training'" class="behavior-content training">
              <div class="behavior-header">
                <el-tag size="small" type="danger">辨证训练</el-tag>
                <span class="title-text">{{ item.content.title }}</span>
              </div>
              <div class="behavior-body">
                <div class="result-info">
                  <span>用户答案：<strong>{{ item.content.userAnswer }}</strong></span>
                  <el-tag 
                    class="ml-10" 
                    size="small" 
                    :type="item.content.isCorrect ? 'success' : 'danger'"
                  >{{ item.content.isCorrect ? '正确' : '错误' }}</el-tag>
                </div>
              </div>
            </div>

            <!-- AI QA Record -->
            <div v-else-if="item.type === 'ai_qa'" class="behavior-content ai-qa">
              <div class="behavior-header">
                <el-tag size="small" color="#1e3a8a" style="color: #fff">AI 答疑</el-tag>
                <span class="question-text">{{ item.content.question }}</span>
              </div>
              <div class="behavior-body">
                <span>对话轮次：<strong>{{ item.content.turns }} 轮</strong></span>
                <el-button link type="primary" class="ml-10">查看对话详情</el-button>
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </div>

    <div v-else class="empty-state">
      <el-empty description="请输入用户昵称或 ID 开启学习轨迹溯源" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import axios from 'axios'

interface BehaviorItem {
  id: number
  time: string
  type: 'study' | 'mastery' | 'note' | 'training' | 'ai_qa'
  content: any
}

const searchQuery = ref('')
const hasSearched = ref(false)
const loading = ref(false)
const filterType = ref('')
const timeRange = ref<any[]>([])
const behaviors = ref<BehaviorItem[]>([])

const handleSearch = async () => {
  if (!searchQuery.value) return
  loading.value = true
  hasSearched.value = true
  try {
    const res = await axios.get('/api/users/behavior', { 
      params: { query: searchQuery.value, type: filterType.value } 
    })
    behaviors.value = res.data.data
  } finally {
    loading.value = false
  }
}

watch([filterType, timeRange], () => {
  if (hasSearched.value) handleSearch()
})

const getTimelineItemType = (type: string) => {
  switch (type) {
    case 'study': return 'primary'
    case 'mastery': return 'warning'
    case 'note': return 'success'
    case 'training': return 'danger'
    case 'ai_qa': return 'info'
    default: return ''
  }
}
</script>

<style scoped lang="scss">
.learning-behavior-container {
  .search-card {
    margin-bottom: 20px;
    .filter-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      .filter-options {
        display: flex;
        gap: 12px;
      }
    }
  }

  .timeline-wrapper {
    padding: 10px 20px;
    max-width: 900px;
    margin: 0 auto;
  }

  .behavior-card {
    .behavior-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      .kp-name, .title-text, .question-text {
        font-weight: bold;
        color: #303133;
      }
    }

    .behavior-body {
      font-size: 14px;
      color: #606266;
      
      .status-change {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #e6a23c;
      }

      .note-summary {
        font-style: italic;
        background: #f8f9fa;
        padding: 10px;
        border-radius: 4px;
        margin: 0;
      }

      .ml-10 { margin-left: 10px; }
    }
  }

  .empty-state {
    margin-top: 100px;
  }
}
</style>
