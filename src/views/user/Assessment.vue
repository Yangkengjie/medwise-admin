<template>
  <div class="cognitive-assessment-container">
    <el-card class="box-card">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- Tab 1: Assessment Question Bank Management -->
        <el-tab-pane label="测评题库管理" name="questions">
          <div class="header-actions">
            <el-button type="primary" icon="Plus" @click="handleAddQuestion">新增题目</el-button>
          </div>
          <el-table :data="questionList" border stripe v-loading="loading">
            <el-table-column prop="title" label="题目标题" min-width="250" />
            <el-table-column prop="dimension" label="测评维度" width="150" align="center" />
            <el-table-column prop="optionsCount" label="选项数量" width="120" align="center" />
            <el-table-column prop="status" label="状态" width="120" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.status" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right" align="center">
              <template #default="{ row }">
                <el-button link type="primary" @click="handleEditQuestion(row)">编辑</el-button>
                <el-button link type="danger" @click="handleDeleteQuestion(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- Tab 2: Profile Result Management -->
        <el-tab-pane label="画像结果管理" name="results">
          <div class="results-layout">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-card shadow="never" header="画像类型分布">
                  <div ref="pieChartRef" style="height: 300px"></div>
                </el-card>
              </el-col>
              <el-col :span="16">
                <div class="filter-header">
                  <el-form :inline="true" :model="resultFilter">
                    <el-form-item label="画像类型">
                      <el-select v-model="resultFilter.type" placeholder="全部" clearable style="width: 150px">
                        <el-option v-for="t in profileTypes" :key="t" :label="t" :value="t" />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="时间范围">
                      <el-date-picker
                        v-model="resultFilter.timeRange"
                        type="daterange"
                        range-separator="至"
                        start-placeholder="开始"
                        end-placeholder="结束"
                        style="width: 240px"
                      />
                    </el-form-item>
                    <el-form-item>
                      <el-button type="primary" icon="Search" @click="fetchResults">查询</el-button>
                    </el-form-item>
                  </el-form>
                </div>
                <el-table :data="userResults" border stripe size="small">
                  <el-table-column prop="nickname" label="用户昵称" />
                  <el-table-column prop="school" label="学校" min-width="150" />
                  <el-table-column prop="type" label="画像类型" width="100" align="center" />
                  <el-table-column prop="time" label="测试时间" width="160" align="center" />
                  <el-table-column label="操作" width="120" align="center">
                    <template #default="{ row }">
                      <el-button link type="primary" @click="handleViewDetail(row)">查看详情</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- Question Edit Dialog -->
    <el-dialog v-model="questionDialogVisible" :title="isEditQuestion ? '编辑题目' : '新增题目'" width="600px">
      <el-form :model="questionForm" label-width="100px" ref="questionFormRef">
        <el-form-item label="题目标题" required>
          <el-input v-model="questionForm.title" placeholder="请输入题目标题" />
        </el-form-item>
        <el-form-item label="所属维度" required>
          <el-select v-model="questionForm.dimension" style="width: 100%">
            <el-option v-for="d in dimensions" :key="d" :label="d" :value="d" />
          </el-select>
        </el-form-item>
        <div class="options-section">
          <div class="section-header">
            <span>选项列表</span>
            <el-button type="primary" link icon="Plus" @click="addOption">添加选项</el-button>
          </div>
          <el-row v-for="(opt, idx) in questionForm.options" :key="idx" :gutter="10" class="option-item">
            <el-col :span="14">
              <el-input v-model="opt.label" placeholder="选项描述" />
            </el-col>
            <el-col :span="8">
              <el-input-number v-model="opt.score" :min="0" :max="10" placeholder="分值" style="width: 100%" />
            </el-col>
            <el-col :span="2">
              <el-button link type="danger" icon="Delete" @click="removeOption(idx)" />
            </el-col>
          </el-row>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="questionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitQuestion">确定</el-button>
      </template>
    </el-dialog>

    <!-- Detail Dialog (Radar Chart) -->
    <el-dialog v-model="detailVisible" title="用户画像详情" width="600px">
      <div v-if="currentResult" class="detail-container">
        <div class="user-info">
          <p><strong>用户：</strong> {{ currentResult.nickname }}</p>
          <p><strong>画像类型：</strong> {{ currentResult.type }}</p>
        </div>
        <div ref="radarChartRef" style="height: 400px"></div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import axios from 'axios'

const activeTab = ref('questions')
const loading = ref(false)
const dimensions = ['视觉型', '听觉型', '动手型', '综合型']
const profileTypes = dimensions

// Tab 1: Questions
const questionList = ref([])
const fetchQuestions = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/assessment/questions')
    questionList.value = res.data.data.list
  } finally {
    loading.value = false
  }
}

const questionDialogVisible = ref(false)
const isEditQuestion = ref(false)
const questionForm = ref({
  title: '',
  dimension: '视觉型',
  options: [{ label: '', score: 1 }]
})

const handleAddQuestion = () => {
  isEditQuestion.value = false
  questionForm.value = { title: '', dimension: '视觉型', options: [{ label: '', score: 1 }] }
  questionDialogVisible.value = true
}

const handleEditQuestion = (row: any) => {
  isEditQuestion.value = true
  questionForm.value = { ...row, options: [{ label: '选项A', score: 2 }, { label: '选项B', score: 1 }] }
  questionDialogVisible.value = true
}

const addOption = () => {
  questionForm.value.options.push({ label: '', score: 1 })
}

const removeOption = (idx: number) => {
  questionForm.value.options.splice(idx, 1)
}

const submitQuestion = () => {
  ElMessage.success('题目保存成功')
  questionDialogVisible.value = false
  fetchQuestions()
}

const handleDeleteQuestion = (row: any) => {
  ElMessageBox.confirm(`确定删除题目 ${row.title} 吗？`, '警告', { type: 'warning' }).then(() => {
    ElMessage.success('已删除')
    fetchQuestions()
  })
}

// Tab 2: Results
const pieChartRef = ref<HTMLElement>()
const radarChartRef = ref<HTMLElement>()
const userResults = ref([])
const resultFilter = ref({ type: '', timeRange: [] })
const detailVisible = ref(false)
const currentResult = ref<any>(null)

const fetchResults = async () => {
  const res = await axios.get('/api/assessment/results')
  userResults.value = res.data.data.userResults
  initPieChart(res.data.data.distribution)
}

const initPieChart = (data: any) => {
  if (!pieChartRef.value) return
  const chart = echarts.init(pieChartRef.value)
  chart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%', left: 'center' },
    series: [
      {
        name: '画像分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
        labelLine: { show: false },
        data: data
      }
    ]
  })
}

const handleViewDetail = (row: any) => {
  currentResult.value = row
  detailVisible.value = true
  nextTick(() => {
    initRadarChart(row.scores)
  })
}

const initRadarChart = (scores: any) => {
  if (!radarChartRef.value) return
  const chart = echarts.init(radarChartRef.value)
  chart.setOption({
    radar: {
      indicator: [
        { name: '视觉型', max: 100 },
        { name: '听觉型', max: 100 },
        { name: '动手型', max: 100 }
      ]
    },
    series: [
      {
        name: '能力画像',
        type: 'radar',
        data: [
          {
            value: [scores.visual, scores.auditory, scores.kinesthetic],
            name: '分数',
            areaStyle: { color: 'rgba(30, 58, 138, 0.5)' },
            lineStyle: { color: '#1e3a8a' },
            itemStyle: { color: '#1e3a8a' }
          }
        ]
      }
    ]
  })
}

onMounted(() => {
  fetchQuestions()
  fetchResults()
})
</script>

<style scoped lang="scss">
.cognitive-assessment-container {
  .header-actions {
    margin-bottom: 20px;
  }

  .results-layout {
    .filter-header {
      margin-bottom: 20px;
    }
  }

  .options-section {
    margin-top: 20px;
    border-top: 1px solid #eee;
    padding-top: 20px;
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      font-weight: bold;
    }
    .option-item {
      margin-bottom: 10px;
    }
  }

  .detail-container {
    .user-info {
      margin-bottom: 20px;
      padding: 10px;
      background: #f8f9fa;
      border-radius: 4px;
      p { margin: 5px 0; }
    }
  }
}
</style>
