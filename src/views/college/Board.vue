<template>
  <div class="teaching-board-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="title">教学看板</h2>
        <p class="subtitle">全方位监控院校教学进度、学生画像分布及辨证训练成效</p>
      </div>
      <div class="header-right">
        <el-radio-group v-model="viewType" size="default" @change="fetchBoardData" class="mr-15">
          <el-radio-button label="semester">当前学期</el-radio-button>
          <el-radio-button label="history">全部历史</el-radio-button>
        </el-radio-group>
        <el-button type="success" icon="Download" @click="handleExport">导出报表 Excel</el-button>
      </div>
    </div>

    <!-- College Selector -->
    <el-card shadow="never" class="selector-card mb-20">
      <el-form :inline="true">
        <el-form-item label="院校选择">
          <el-select 
            v-model="selectedCollegeId" 
            placeholder="请选择院校查看报表" 
            style="width: 300px"
            @change="fetchBoardData"
          >
            <el-option v-for="item in colleges" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="selectedCollegeId">
          <el-tag type="info" effect="plain">数据更新于：{{ updateTime }}</el-tag>
        </el-form-item>
      </el-form>
    </el-card>

    <div v-if="selectedCollegeId" v-loading="loading">
      <!-- Report Card 1: Course Activity -->
      <el-card shadow="hover" class="report-card mb-20">
        <template #header>
          <div class="card-header">
            <span class="title"><el-icon><Monitor /></el-icon> 课程使用活跃度报表</span>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="10">
            <el-table :data="boardData?.courseStats" size="small" border stripe>
              <el-table-column prop="name" label="课程名称" min-width="120" />
              <el-table-column prop="learners" label="学习人数" width="90" align="center" />
              <el-table-column prop="avgDuration" label="人均时长(min)" width="110" align="center" />
              <el-table-column prop="activity" label="活跃率" width="80" align="center">
                <template #default="{ row }">
                  <span :class="row.activity > 80 ? 'text-success' : ''">{{ row.activity }}%</span>
                </template>
              </el-table-column>
            </el-table>
          </el-col>
          <el-col :span="14">
            <div ref="activityChartRef" class="chart-container"></div>
          </el-col>
        </el-row>
      </el-card>

      <!-- Report Card 2: User Portrait -->
      <el-card shadow="hover" class="report-card mb-20">
        <template #header>
          <div class="card-header">
            <span class="title"><el-icon><User /></el-icon> 用户画像与分布报表</span>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="12">
            <div ref="portraitChartRef" class="chart-container"></div>
          </el-col>
          <el-col :span="12">
            <div ref="gradeChartRef" class="chart-container"></div>
          </el-col>
        </el-row>
      </el-card>

      <!-- Report Card 3: Deduction Training -->
      <el-card shadow="hover" class="report-card">
        <template #header>
          <div class="card-header">
            <span class="title"><el-icon><Odometer /></el-icon> 辨证训练参与报表</span>
          </div>
        </template>
        <el-row :gutter="20" class="mb-20">
          <el-col :span="6">
            <div class="stats-item">
              <div class="label">参与人数</div>
              <div class="value">{{ boardData?.trainingStats.participants.toLocaleString() }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stats-item">
              <div class="label">完成总题数</div>
              <div class="value">{{ boardData?.trainingStats.totalQuestions.toLocaleString() }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stats-item">
              <div class="label">平均正确率</div>
              <div class="value text-success">{{ boardData?.trainingStats.avgAccuracy }}%</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stats-item">
              <div class="label">人均题数</div>
              <div class="value" v-if="boardData">{{ (boardData.trainingStats.totalQuestions / boardData.trainingStats.participants).toFixed(1) }}</div>
            </div>
          </el-col>
        </el-row>
        <div ref="trainingTrendChartRef" class="chart-container large"></div>
      </el-card>
    </div>

    <el-empty v-else description="请选择院校以查看教学看板报表" :image-size="150" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const viewType = ref('semester')
const selectedCollegeId = ref(null)
const colleges = ref<any[]>([])

interface BoardData {
  courseStats: { name: string; learners: number; avgDuration: number; activity: number }[]
  portraitDist: { name: string; value: number }[]
  gradeDist: { categories: string[]; data: number[] }
  trainingStats: {
    participants: number
    totalQuestions: number
    avgAccuracy: number
    trend: { dates: string[]; counts: number[] }
  }
  activityTrend: { dates: string[]; rates: number[] }
}

const boardData = ref<BoardData | null>(null)
const updateTime = ref(new Date().toLocaleString())

// Chart Refs
const activityChartRef = ref<HTMLElement | null>(null)
const portraitChartRef = ref<HTMLElement | null>(null)
const gradeChartRef = ref<HTMLElement | null>(null)
const trainingTrendChartRef = ref<HTMLElement | null>(null)

let charts: echarts.ECharts[] = []

const fetchColleges = async () => {
  const res = await axios.get('/api/college/list')
  colleges.value = res.data.data.list
}

const fetchBoardData = async () => {
  if (!selectedCollegeId.value) return
  loading.value = true
  try {
    const res = await axios.get('/api/college/board/stats', {
      params: { collegeId: selectedCollegeId.value, viewType: viewType.value }
    })
    boardData.value = res.data.data
    updateTime.value = new Date().toLocaleString()
    nextTick(() => {
      initCharts()
    })
  } finally {
    loading.value = false
  }
}

const initCharts = () => {
  if (!boardData.value) return
  disposeCharts()
  
  if (activityChartRef.value) {
    const activityChart = echarts.init(activityChartRef.value)
    activityChart.setOption({
      title: { text: '活跃率趋势 (%)', textStyle: { fontSize: 14, color: '#64748b' } },
      tooltip: { trigger: 'axis' },
      grid: { top: 40, right: 20, bottom: 30, left: 40 },
      xAxis: { type: 'category', data: boardData.value.activityTrend.dates },
      yAxis: { type: 'value', min: 0, max: 100 },
      series: [{
        data: boardData.value.activityTrend.rates,
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.1 },
        lineStyle: { color: '#1e3a8a', width: 3 },
        itemStyle: { color: '#1e3a8a' }
      }]
    })
    charts.push(activityChart)
  }

  if (portraitChartRef.value) {
    const portraitChart = echarts.init(portraitChartRef.value)
    portraitChart.setOption({
      title: { text: '用户画像分布', left: 'center', textStyle: { fontSize: 14, color: '#64748b' } },
      tooltip: { trigger: 'item' },
      legend: { bottom: '5%', left: 'center' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data: boardData.value.portraitDist,
        color: ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd']
      }]
    })
    charts.push(portraitChart)
  }

  if (gradeChartRef.value) {
    const gradeChart = echarts.init(gradeChartRef.value)
    gradeChart.setOption({
      title: { text: '年级分布 (人数)', left: 'center', textStyle: { fontSize: 14, color: '#64748b' } },
      tooltip: { trigger: 'axis' },
      grid: { top: 40, right: 20, bottom: 60, left: 50 },
      xAxis: { type: 'category', data: boardData.value.gradeDist.categories },
      yAxis: { type: 'value' },
      series: [{
        data: boardData.value.gradeDist.data,
        type: 'bar',
        barWidth: 30,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#1e3a8a' },
            { offset: 1, color: '#60a5fa' }
          ]),
          borderRadius: [5, 5, 0, 0]
        }
      }]
    })
    charts.push(gradeChart)
  }

  if (trainingTrendChartRef.value) {
    const trainingChart = echarts.init(trainingTrendChartRef.value)
    trainingChart.setOption({
      title: { text: '参与人次趋势', textStyle: { fontSize: 14, color: '#64748b' } },
      tooltip: { trigger: 'axis' },
      grid: { top: 40, right: 20, bottom: 30, left: 50 },
      xAxis: { type: 'category', data: boardData.value.trainingStats.trend.dates },
      yAxis: { type: 'value' },
      series: [{
        name: '参与人次',
        data: boardData.value.trainingStats.trend.counts,
        type: 'line',
        smooth: true,
        lineStyle: { color: '#10b981', width: 3 },
        itemStyle: { color: '#10b981' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(16, 185, 129, 0.2)' },
            { offset: 1, color: 'transparent' }
          ])
        }
      }]
    })
    charts.push(trainingChart)
  }
}

const disposeCharts = () => {
  charts.forEach(chart => chart.dispose())
  charts = []
}

const handleExport = () => {
  ElMessage.success('正在导出院校教学报表，请稍候...')
}

const handleResize = () => {
  charts.forEach(chart => chart.resize())
}

onMounted(() => {
  fetchColleges()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  disposeCharts()
})
</script>

<style scoped lang="scss">
.teaching-board-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;

  .mb-20 { margin-bottom: 20px; }
  .mr-15 { margin-right: 15px; }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
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

  .selector-card {
    :deep(.el-card__body) {
      padding: 15px 20px;
    }
    .el-form-item { margin-bottom: 0; }
  }

  .report-card {
    .card-header {
      .title {
        font-weight: bold;
        color: #1e293b;
        display: flex;
        align-items: center;
        gap: 8px;
        .el-icon { color: #1e3a8a; }
      }
    }
  }

  .chart-container {
    height: 300px;
    &.large {
      height: 350px;
    }
  }

  .stats-item {
    text-align: center;
    padding: 20px;
    background: #f8fafc;
    border-radius: 8px;
    .label {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 8px;
    }
    .value {
      font-size: 24px;
      font-weight: bold;
      color: #1e293b;
    }
    .text-success { color: #10b981; }
  }

  .text-success { color: #10b981; }
}
</style>
