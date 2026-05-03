<template>
  <div class="achievement-rules-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>成就勋章规则管理</span>
          <el-button type="primary" icon="Plus" @click="handleAdd">新增成就</el-button>
        </div>
      </template>

      <el-table :data="ruleList" border stripe v-loading="loading">
        <el-table-column prop="name" label="成就名称" min-width="150" />
        <el-table-column prop="type" label="成就类型" width="150" align="center" />
        <el-table-column prop="condition" label="触发条件" min-width="200" />
        <el-table-column prop="icon" label="徽章图标" width="120" align="center">
          <template #default="{ row }">
            <el-image :src="row.icon" class="badge-icon" :preview-src-list="[row.icon]" fit="contain" />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.status" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Achievement Dialog -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑成就' : '新增成就'" width="600px">
      <el-form :model="form" label-width="100px" ref="formRef" :rules="rules">
        <el-form-item label="成就名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入成就名称" />
        </el-form-item>
        <el-form-item label="描述文案" prop="description">
          <el-input type="textarea" v-model="form.description" :rows="2" placeholder="展示给用户的成就描述" />
        </el-form-item>
        <el-form-item label="成就类型" prop="type">
          <el-select v-model="form.type" style="width: 100%" @change="handleTypeChange">
            <el-option v-for="t in types" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>

        <!-- Dynamic Trigger Conditions -->
        <div class="trigger-config" v-if="form.type">
          <el-divider content-position="left">触发条件配置</el-divider>
          
          <template v-if="form.type === '学习天数'">
            <el-form-item label="目标天数">
              <el-input-number v-model="form.threshold" :min="1" />
              <span class="ml-10">天</span>
            </el-form-item>
            <el-form-item label="计算模式">
              <el-radio-group v-model="form.mode">
                <el-radio label="reset">断签重算 (连续)</el-radio>
                <el-radio label="accumulate">累计天数</el-radio>
              </el-radio-group>
            </el-form-item>
          </template>

          <template v-else-if="form.type === '完成科目'">
            <el-form-item label="完成课程数">
              <el-input-number v-model="form.threshold" :min="1" />
              <span class="ml-10">门</span>
            </el-form-item>
          </template>

          <template v-else-if="form.type === '计划达成'">
            <el-form-item label="达成次数">
              <el-input-number v-model="form.threshold" :min="1" />
              <span class="ml-10">次</span>
            </el-form-item>
          </template>

          <template v-else-if="form.type === '评论互动'">
            <el-form-item label="高赞阈值">
              <el-input-number v-model="form.threshold" :min="1" />
              <span class="ml-10">赞</span>
              <p class="hint">单条评论获得点赞数达到此阈值时触发</p>
            </el-form-item>
          </template>
        </div>

        <el-form-item label="徽章图标">
          <el-upload
            class="avatar-uploader"
            action="#"
            :show-file-list="false"
            :auto-upload="false"
            @change="handleIconChange"
          >
            <img v-if="form.icon" :src="form.icon" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="form.status" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存成就</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const loading = ref(false)
const ruleList = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const types = ['学习天数', '完成科目', '计划达成', '评论互动']

const form = ref({
  id: null,
  name: '',
  description: '',
  type: '学习天数',
  threshold: 1,
  mode: 'reset',
  icon: '',
  status: true
})

const rules = {
  name: [{ required: true, message: '请输入成就名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }]
}

const fetchRules = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/achievement/rules')
    ruleList.value = res.data.data.list
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  form.value = {
    id: null,
    name: '',
    description: '',
    type: '学习天数',
    threshold: 1,
    mode: 'reset',
    icon: '',
    status: true
  }
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  form.value = { ...row, threshold: row.threshold || 1, mode: row.mode || 'reset' }
  dialogVisible.value = true
}

const handleTypeChange = () => {
  if (form.value.type === '评论互动') {
    form.value.threshold = 10
  } else {
    form.value.threshold = 1
  }
}

const handleIconChange = (file: any) => {
  form.value.icon = URL.createObjectURL(file.raw)
}

const submitForm = async () => {
  await axios.post('/api/achievement/rules/save', form.value)
  ElMessage.success('成就规则已保存')
  dialogVisible.value = false
  fetchRules()
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确定删除成就“${row.name}”吗？`, '警告', { type: 'warning' }).then(() => {
    ElMessage.success('已删除')
    fetchRules()
  })
}

onMounted(fetchRules)
</script>

<style scoped lang="scss">
.achievement-rules-container {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .badge-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #f5f7fa;
    padding: 4px;
  }

  .ml-10 { margin-left: 10px; }

  .trigger-config {
    margin-bottom: 20px;
    .hint {
      font-size: 12px;
      color: #909399;
      margin-top: 4px;
      line-height: 1.4;
    }
  }

  .avatar-uploader {
    :deep(.el-upload) {
      border: 1px dashed #d9d9d9;
      border-radius: 50%;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: var(--el-transition-duration-fast);
      &:hover { border-color: #409eff; }
    }
    .avatar { width: 80px; height: 80px; display: block; object-fit: contain; }
    .avatar-uploader-icon {
      font-size: 28px;
      color: #8c939d;
      width: 80px;
      height: 80px;
      text-align: center;
      line-height: 80px;
    }
  }
}
</style>
