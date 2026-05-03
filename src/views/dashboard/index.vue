<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="6" v-for="(item, index) in stats" :key="index">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">{{ item.label }}</div>
            <div class="stat-value">{{ item.value }}</div>
          </div>
          <el-icon class="stat-icon" :color="item.color"><component :is="item.icon" /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-20">
      <el-col :span="16">
        <el-card shadow="hover" header="活跃度趋势">
          <div ref="chartRef" style="height: 350px"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" header="最新动态">
          <el-timeline>
            <el-timeline-item
              v-for="(activity, index) in activities"
              :key="index"
              :timestamp="activity.timestamp"
              :type="activity.type"
            >
              {{ activity.content }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>

    <el-row class="mt-20">
      <el-col :span="24">
        <el-card shadow="hover" header="热门课程体系">
          <el-table :data="courses" stripe style="width: 100%">
            <el-table-column prop="title" label="课程名称" />
            <el-table-column prop="category" label="分类" width="120" />
            <el-table-column prop="author" label="负责人" width="120" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === '已发布' ? 'success' : 'info'">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="150" />
            <el-table-column label="操作" width="120">
              <template #default>
                <el-button link type="primary">编辑</el-button>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios'

const chartRef = ref<HTMLElement>()
const stats = ref([
  { label: '累计用户', value: '0', icon: 'User', color: '#409eff' },
  { label: '课程总量', value: '0', icon: 'Notebook', color: '#67c23a' },
  { label: '训练人次', value: '0', icon: 'Monitor', color: '#e6a23c' },
  { label: '活跃率', value: '0', icon: 'PieChart', color: '#f56c6c' }
])

const courses = ref([])
const activities = [
  { content: '《中医诊断学》版本更新', timestamp: '2024-03-22', type: 'primary' },
  { content: '新增病证训练模组', timestamp: '2024-03-21', type: 'success' },
  { content: '系统安全审计完成', timestamp: '2024-03-20', type: 'info' }
]

const initChart = () => {
  if (!chartRef.value) return
  const myChart = echarts.init(chartRef.value)
  myChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
    yAxis: { type: 'value' },
    series: [{
      data: [820, 932, 901, 934, 1290, 1330, 1320],
      type: 'line',
      smooth: true,
      color: '#1e3a8a',
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(30, 58, 138, 0.3)' },
          { offset: 1, color: 'rgba(30, 58, 138, 0)' }
        ])
      }
    }]
  })
}

const fetchData = async () => {
  try {
    const statRes = await axios.get('/api/dashboard/stats')
    const { userCount, courseCount, trainingCount, activeRate } = statRes.data.data
    stats.value[0].value = userCount.toLocaleString()
    stats.value[1].value = courseCount.toString()
    stats.value[2].value = trainingCount.toLocaleString()
    stats.value[3].value = activeRate

    const courseRes = await axios.get('/api/courses/list')
    courses.value = courseRes.data.data.list
  } catch (error) {
    console.error('Failed to fetch data', error)
  }
}

onMounted(() => {
  initChart()
  fetchData()
})
</script>

<style scoped lang="scss">
.dashboard-container {
  .stat-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;

    .stat-content {
      .stat-label {
        font-size: 14px;
        color: #909399;
        margin-bottom: 8px;
      }
      .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #303133;
      }
    }
    .stat-icon {
      font-size: 40px;
      opacity: 0.8;
    }
  }

  .mt-20 {
    margin-top: 20px;
  }
}
</style>
