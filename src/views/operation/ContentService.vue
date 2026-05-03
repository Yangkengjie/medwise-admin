<template>
  <div class="content-service-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="title">内容服务管理</h2>
        <p class="subtitle">管理 FAQ、学习攻略及“了解我们”图文页面内容</p>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="custom-tabs">
      <!-- Tab 1: FAQ Management -->
      <el-tab-pane label="FAQ 管理" name="faq">
        <el-card shadow="never">
          <div class="table-toolbar">
            <el-button type="primary" icon="Plus" @click="handleEditFaq()">新增问题</el-button>
          </div>
          <el-table :data="faqList" border stripe v-loading="loading">
            <el-table-column prop="title" label="问题标题" min-width="250" />
            <el-table-column prop="category" label="所属分类" width="150">
              <template #default="{ row }">
                <el-tag>{{ row.category }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="order" label="排序" width="80" align="center" />
            <el-table-column label="操作" width="150" align="center">
              <template #default="{ row }">
                <el-button link type="primary" @click="handleEditFaq(row)">编辑</el-button>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- Tab 2: Guides Management -->
      <el-tab-pane label="攻略管理" name="guides">
        <el-card shadow="never">
          <div class="table-toolbar">
            <el-button type="primary" icon="Plus" @click="handleEditGuide()">发布攻略</el-button>
          </div>
          <el-table :data="guideList" border stripe v-loading="loading">
            <el-table-column prop="title" label="攻略标题" min-width="250" />
            <el-table-column prop="status" label="状态" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === '已上架' ? 'success' : 'info'">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="author" label="发布人" width="150" />
            <el-table-column prop="createTime" label="创建时间" width="180" />
            <el-table-column label="操作" width="200" align="center">
              <template #default="{ row }">
                <el-button link type="primary" @click="handleEditGuide(row)">编辑</el-button>
                <el-button link :type="row.status === '已上架' ? 'warning' : 'success'">
                  {{ row.status === '已上架' ? '下架' : '上架' }}
                </el-button>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- Tab 3: About Us Management -->
      <el-tab-pane label="了解我们管理" name="about">
        <el-card shadow="never" class="about-card">
          <el-form :model="aboutForm" label-width="120px">
            <el-form-item label="页面正文">
              <el-input
                type="textarea"
                v-model="aboutForm.content"
                :rows="15"
                placeholder="请输入页面正文内容（支持简单 HTML 标签）"
              />
            </el-form-item>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="config-group">
                  <div class="group-title">“加入我们”配置</div>
                  <el-form-item label="按钮文案">
                    <el-input v-model="aboutForm.joinText" placeholder="如：加入我们" />
                  </el-form-item>
                  <el-form-item label="跳转链接">
                    <el-input v-model="aboutForm.joinLink" placeholder="请输入链接" />
                  </el-form-item>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="config-group">
                  <div class="group-title">“联系我们”配置</div>
                  <el-form-item label="按钮文案">
                    <el-input v-model="aboutForm.contactText" placeholder="如：联系我们" />
                  </el-form-item>
                  <el-form-item label="跳转链接">
                    <el-input v-model="aboutForm.contactLink" placeholder="请输入链接" />
                  </el-form-item>
                </div>
              </el-col>
            </el-row>
            
            <div class="form-actions">
              <el-button type="primary" size="large" @click="handleSaveAbout">保存并发布页面</el-button>
            </div>
          </el-form>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- FAQ Edit Dialog -->
    <el-dialog v-model="faqDialogVisible" :title="faqForm.id ? '编辑 FAQ' : '新增 FAQ'" width="800px">
      <el-form :model="faqForm" label-width="100px">
        <el-form-item label="问题标题">
          <el-input v-model="faqForm.title" placeholder="请输入问题标题" />
        </el-form-item>
        <el-form-item label="所属分类">
          <el-select v-model="faqForm.category" placeholder="选择分类" style="width: 200px">
            <el-option label="常见问题" value="常见问题" />
            <el-option label="新手攻略" value="新手攻略" />
            <el-option label="个性化实现" value="个性化实现" />
            <el-option label="推荐功能" value="推荐功能" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序权重">
          <el-input-number v-model="faqForm.order" :min="1" />
        </el-form-item>
        <el-form-item label="回答正文">
          <el-input
            type="textarea"
            v-model="faqForm.content"
            :rows="10"
            placeholder="请输入回答正文内容..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="faqDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveFaq">确定保存</el-button>
      </template>
    </el-dialog>

    <!-- Guide Edit Dialog -->
    <el-dialog v-model="guideDialogVisible" :title="guideForm.id ? '编辑攻略' : '发布新攻略'" width="900px">
      <el-form :model="guideForm" label-width="100px">
        <el-form-item label="攻略标题">
          <el-input v-model="guideForm.title" placeholder="请输入攻略标题" />
        </el-form-item>
        <el-form-item label="攻略正文">
          <el-input
            type="textarea"
            v-model="guideForm.content"
            :rows="15"
            placeholder="请输入攻略正文内容..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="guideDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveGuide">确定发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const activeTab = ref('faq')
const loading = ref(false)
const faqList = ref([])
const guideList = ref([])

// FAQ Logic
const faqDialogVisible = ref(false)
const faqForm = reactive({
  id: null,
  title: '',
  category: '常见问题',
  order: 1,
  content: ''
})

const handleEditFaq = (row?: any) => {
  if (row) {
    Object.assign(faqForm, row)
  } else {
    Object.assign(faqForm, { id: null, title: '', category: '常见问题', order: 1, content: '' })
  }
  faqDialogVisible.value = true
}

const saveFaq = async () => {
  await axios.post('/api/operation/content/save', faqForm)
  ElMessage.success('FAQ 已保存')
  faqDialogVisible.value = false
  fetchFaq()
}

// Guide Logic
const guideDialogVisible = ref(false)
const guideForm = reactive({
  id: null,
  title: '',
  content: ''
})

const handleEditGuide = (row?: any) => {
  if (row) {
    Object.assign(guideForm, row)
  } else {
    Object.assign(guideForm, { id: null, title: '', content: '' })
  }
  guideDialogVisible.value = true
}

const saveGuide = async () => {
  await axios.post('/api/operation/content/save', guideForm)
  ElMessage.success('攻略已保存')
  guideDialogVisible.value = false
  fetchGuides()
}

// About Us Logic
const aboutForm = reactive({
  content: '',
  joinText: '',
  joinLink: '',
  contactText: '',
  contactLink: ''
})

const handleSaveAbout = async () => {
  await axios.post('/api/operation/content/save', aboutForm)
  ElMessage.success('关于我们页面已发布')
}

// Data Fetching
const fetchFaq = async () => {
  const res = await axios.get('/api/operation/content/faq/list')
  faqList.value = res.data.data
}

const fetchGuides = async () => {
  const res = await axios.get('/api/operation/content/guides/list')
  guideList.value = res.data.data
}

const fetchAbout = async () => {
  const res = await axios.get('/api/operation/content/about')
  Object.assign(aboutForm, res.data.data)
}

const fetchData = async () => {
  loading.value = true
  try {
    await Promise.all([fetchFaq(), fetchGuides(), fetchAbout()])
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<style scoped lang="scss">
.content-service-container {
  padding: 20px;
  max-width: 1200px;
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

  .editor-wrapper {
    border: 1px solid #ccc;
    z-index: 100;
    &.mini {
      border-radius: 4px;
    }
  }

  .config-group {
    background: #f8fafc;
    padding: 20px;
    border-radius: 8px;
    margin-top: 20px;
    .group-title {
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 16px;
      font-size: 14px;
      border-left: 3px solid #1e3a8a;
      padding-left: 10px;
    }
  }

  .form-actions {
    display: flex;
    justify-content: center;
    margin-top: 40px;
    padding-bottom: 20px;
  }

  .about-card {
    :deep(.el-card__body) {
      padding: 30px;
    }
  }
}
</style>
