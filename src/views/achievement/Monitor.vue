<template>
  <div class="monitor-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="title">计划执行监控</h2>
        <p class="subtitle">监控全站学习计划的制定情况、执行进度及任务达成质量</p>
      </div>
      <div class="header-right">
        <el-button icon="Download">导出监控报告</el-button>
        <el-button type="primary" icon="Refresh" @click="fetchAllData">刷新数据</el-button>
      </div>
    </div>

    <!-- Filters -->
    <el-card class="filter-card mb-20">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="时间范围">
          <el-radio-group v-model="filterForm.timeRange" size="default">
            <el-radio-button label="week">本周</el-radio-button>
            <el-radio-button label="month">本月</el-radio-button>
            <el-radio-button label="custom">自定义</el-radio-button>
          </el-radio-group>
          <el-date-picker
            v-if="filterForm.timeRange === 'custom'"
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="default"
            style="margin-left: 12px; width: 240px"
          />
        </el-form-item>
        <el-form-item label="用户群体">
          <el-select v-model="filterForm.school" placeholder="按学校" clearable style="width: 180px">
            <el-option label="全部学校" value="" />
            <el-option label="北京中医药大学" value="bj" />
            <el-option label="上海中医药大学" value="sh" />
          </el-select>
          <el-select v-model="filterForm.grade" placeholder="按年级" clearable style="width: 120px; margin-left: 10px">
            <el-option label="2021级" value="2021" />
            <el-option label="2022级" value="2022" />
            <el-option label="2023级" value="2023" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchAllData">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Stats Cards -->
    <el-row :gutter="20" class="mb-20">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="label">计划制定人数</div>
              <div class="value">{{ stats.planCount.toLocaleString() }}</div>
              <div class="trend up">
                <el-icon><CaretTop /></el-icon> 12% 较上周
              </div>
            </div>
            <div class="stat-icon purple">
              <el-icon><EditPen /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="label">计划完成率</div>
              <div class="value">{{ stats.completionRate }}%</div>
              <div class="trend up">
                <el-icon><CaretTop /></el-icon> 5.2% 较上周
              </div>
            </div>
            <div class="stat-icon blue">
              <el-icon><CircleCheck /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="label">平均任务达成率</div>
              <div class="value">{{ stats.taskAchievementRate }}%</div>
              <div class="trend down">
                <el-icon><CaretBottom /></el-icon> 2.1% 较上周
              </div>
            </div>
            <div class="stat-icon orange">
              <el-icon><Histogram /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts -->
    <el-row :gutter="20" class="mb-20">
      <el-col :span="14">
        <el-card shadow="hover" header="每日计划完成率趋势 (近30天)">
          <div ref="lineChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card shadow="hover" header="未完成任务堆积分布 (按课程分类)">
          <div ref="barChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Table -->
    <el-card shadow="hover">
      <template #header>
        <div class="table-header">
          <span>计划完成率低的用户 Top 20</span>
          <el-tag type="danger" effect="plain">需关注群体</el-tag>
        </div>
      </template>
      <el-table :data="lowPerformers" border stripe v-loading="loading">
        <el-table-column type="index" label="排名" width="70" align="center" />
        <el-table-column prop="nickname" label="用户昵称" min-width="120" />
        <el-table-column prop="school" label="所属院校" min-width="150" />
        <el-table-column prop="planName" label="当前计划" min-width="180" />
        <el-table-column prop="completionRate" label="计划完成率" width="150" align="center">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.completionRate" 
              :status="row.completionRate < 20 ? 'exception' : 'warning'" 
              :stroke-width="10"
            />
          </template>
        </el-table-column>
        <el-table-column label="任务进度" width="120" align="center">
          <template #default="{ row }">
            {{ row.finishedTasks }} / {{ row.totalTasks }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetails(row)">查看计划详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Details Dialog -->
    <el-dialog v-model="detailsVisible" title="计划执行详情" width="600px">
      <div v-if="selectedUser" class="user-plan-details">
        <div class="detail-header">
          <el-avatar :size="50" icon="UserFilled" />
          <div class="info">
            <h4>{{ selectedUser.nickname }}</h4>
            <p>{{ selectedUser.school }} · {{ selectedUser.grade }}</p>
          </div>
        </div>
        <el-divider />
        <div class="detail-content">
          <div class="item">
            <span class="label">当前计划：</span>
            <span class="val">{{ selectedUser.planName }}</span>
          </div>
          <div class="item">
            <span class="label">完成进度：</span>
            <span class="val">{{ selectedUser.completionRate }}%</span>
          </div>
          <div class="item">
            <span class="label">未完成核心：</span>
            <div class="tags">
              <el-tag size="small" type="danger">阴阳学说</el-tag>
              <el-tag size="small" type="danger">五行生克</el-tag>
              <el-tag size="small" type="danger">脏腑辨证</el-tag>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const detailsVisible = ref(false)

interface FilterForm {
  timeRange: string
  dateRange: any[]
  school: string
  grade: string
}

interface Stats {
  planCount: number
  completionRate: number
  taskAchievementRate: number
}

interface Performer {
  id: number
  nickname: string
  school: string
  planName: string
  completionRate: number
  finishedTasks: number
  totalTasks: number
  grade?: string
}

const selectedUser = ref<Performer | null>(null)

const filterForm = reactive<FilterForm>({
  timeRange: 'week',
  dateRange: [],
  school: '',
  grade: ''
})

const stats = ref<Stats>({
  planCount: 0,
  completionRate: 0,
  taskAchievementRate: 0
})

const lowPerformers = ref<Performer[]>([])

const lineChartRef = ref<HTMLElement | null>(null)
const barChartRef = ref<HTMLElement | null>(null)
let lineChart: echarts.ECharts | null = null
let barChart: echarts.ECharts | null = null

const initCharts = () => {
  if (lineChartRef.value) {
    lineChart = echarts.init(lineChartRef.value)
  }
  if (barChartRef.value) {
    barChart = echarts.init(barChartRef.value)
  }
}

const updateLineChart = (data: { dates: string[], rates: number[] }) => {
  if (!lineChart) return
  lineChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.dates,
      axisLabel: { color: '#94a3b8' }
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '{value}%', color: '#94a3b8' },
      splitLine: { lineStyle: { type: 'dashed' } }
    },
    series: [{
      name: '完成率',
      type: 'line',
      data: data.rates,
      smooth: true,
      showSymbol: false,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(30, 58, 138, 0.3)' },
          { offset: 1, color: 'rgba(30, 58, 138, 0)' }
        ])
      },
      lineStyle: { color: '#1e3a8a', width: 3 }
    }]
  })
}

const updateBarChart = (data: { category: string, count: number }[]) => {
  if (!barChart) return
  barChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#94a3b8' },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'category',
      data: data.map(item => item.category),
      axisLabel: { color: '#475569' }
    },
    series: [{
      name: '未完成任务数',
      type: 'bar',
      data: data.map(item => item.count),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
          { offset: 0, color: '#1e3a8a' },
          { offset: 1, color: '#3b82f6' }
        ]),
        borderRadius: [0, 4, 4, 0]
      },
      barWidth: 20
    }]
  })
}

const fetchAllData = async () => {
  loading.value = true
  try {
    const [statsRes, trendsRes, incompleteRes, performersRes] = await Promise.all([
      axios.get('/api/achievement/monitor/stats'),
      axios.get('/api/achievement/monitor/trends'),
      axios.get('/api/achievement/monitor/incomplete-tasks'),
      axios.get('/api/achievement/monitor/low-performers')
    ])
    
    stats.value = statsRes.data.data
    updateLineChart(trendsRes.data.data)
    updateBarChart(incompleteRes.data.data)
    lowPerformers.value = performersRes.data.data
  } catch (error) {
    ElMessage.error('获取监控数据失败')
  } finally {
    loading.value = false
  }
}

const viewDetails = (row: Performer) => {
  selectedUser.value = row
  detailsVisible.value = true
}

const handleResize = () => {
  lineChart?.resize()
  barChart?.resize()
}

onMounted(() => {
  initCharts()
  fetchAllData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  lineChart?.dispose()
  barChart?.dispose()
})
</script>

<style scoped lang="scss">
.monitor-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;

  .mb-20 { margin-bottom: 20px; }

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

  .stat-card {
    .stat-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .stat-info {
        .label { font-size: 14px; color: #64748b; margin-bottom: 8px; }
        .value { font-size: 24px; font-weight: bold; color: #1e293b; margin-bottom: 4px; }
        .trend {
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
          &.up { color: #10b981; }
          &.down { color: #ef4444; }
        }
      }

      .stat-icon {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        &.purple { background: #f5f3ff; color: #7c3aed; }
        &.blue { background: #eff6ff; color: #2563eb; }
        &.orange { background: #fff7ed; color: #ea580c; }
      }
    }
  }

  .chart-container {
    height: 350px;
  }

  .table-header {
    display: flex;
    align-items: center;
    gap: 12px;
    span { font-weight: bold; }
  }

  .user-plan-details {
    .detail-header {
      display: flex;
      align-items: center;
      gap: 16px;
      h4 { margin: 0 0 4px; font-size: 18px; }
      p { margin: 0; font-size: 13px; color: #64748b; }
    }
    .detail-content {
      .item {
        margin-bottom: 15px;
        display: flex;
        align-items: flex-start;
        .label { color: #64748b; width: 80px; flex-shrink: 0; }
        .val { font-weight: 500; color: #1e293b; }
        .tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
      }
    }
  }
}
</style>
