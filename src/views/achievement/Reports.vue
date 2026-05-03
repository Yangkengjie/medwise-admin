<template>
  <div class="reports-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="title">学习报告模板管理</h2>
        <p class="subtitle">配置周报与月报的展示字段、排序及视觉样式，实时预览生成效果</p>
      </div>
      <el-button type="primary" icon="CircleCheck" @click="handleSave">保存全局模板</el-button>
    </div>

    <div class="content-layout">
      <!-- Left: Configuration -->
      <div class="config-panel">
        <el-tabs v-model="activeTab" class="custom-tabs">
          <el-tab-pane label="周报模板配置" name="weekly">
            <div class="config-section">
              <div class="section-title">字段展示与排序</div>
              <p class="section-desc">勾选需要展示的模块，并拖拽调整它们在报告中的先后顺序</p>
              
              <draggable 
                v-model="weeklyFields" 
                item-key="id" 
                handle=".drag-handle"
                ghost-class="ghost-item"
                class="field-list"
              >
                <template #item="{ element }">
                  <div class="field-item" :class="{ disabled: !element.enabled }">
                    <div class="drag-handle">
                      <el-icon><Rank /></el-icon>
                    </div>
                    <el-checkbox v-model="element.enabled" :label="element.label" />
                    <el-icon class="field-icon"><component :is="element.icon" /></el-icon>
                  </div>
                </template>
              </draggable>
            </div>
          </el-tab-pane>

          <el-tab-pane label="月报模板配置" name="monthly">
            <div class="config-section">
              <div class="section-title">字段展示与排序</div>
              <p class="section-desc">月报包含月度汇总数据及成就获得情况</p>
              
              <draggable 
                v-model="monthlyFields" 
                item-key="id" 
                handle=".drag-handle"
                ghost-class="ghost-item"
                class="field-list"
              >
                <template #item="{ element }">
                  <div class="field-item" :class="{ disabled: !element.enabled }">
                    <div class="drag-handle">
                      <el-icon><Rank /></el-icon>
                    </div>
                    <el-checkbox v-model="element.enabled" :label="element.label" />
                    <el-icon class="field-icon"><component :is="element.icon" /></el-icon>
                  </div>
                </template>
              </draggable>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- Right: Preview -->
      <div class="preview-panel">
        <div class="preview-header">
          <span>实时预览：{{ activeTab === 'weekly' ? '学习周报' : '学习月报' }}</span>
          <el-tag size="small" type="info" effect="plain">手机端效果模拟</el-tag>
        </div>
        
        <div class="phone-mockup">
          <div class="phone-screen">
            <div class="report-preview-content">
              <div class="report-title">
                <div class="user-info">
                  <el-avatar :size="40" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" />
                  <div class="meta">
                    <span class="name">中医爱好者小张</span>
                    <span class="date">{{ activeTab === 'weekly' ? '2024.03.20 - 2024.03.27' : '2024年03月' }}</span>
                  </div>
                </div>
                <h3>{{ activeTab === 'weekly' ? '本周学习报告' : '本月学习报告' }}</h3>
              </div>

              <div class="preview-modules">
                <div v-for="field in currentFields.filter(f => f.enabled)" :key="field.id" class="preview-module">
                  <div class="module-header">
                    <el-icon><component :is="field.icon" /></el-icon>
                    <span>{{ field.label }}</span>
                  </div>
                  <div class="module-body">
                    <template v-if="field.id === 'duration'">
                      <div class="big-num">12.5 <span>小时</span></div>
                      <div class="chart-placeholder duration-chart"></div>
                    </template>
                    <template v-else-if="field.id === 'kps'">
                      <div class="stats-row">
                        <div class="stat-item">
                          <span class="label">新增掌握</span>
                          <span class="val">24</span>
                        </div>
                        <div class="stat-item">
                          <span class="label">累计知识点</span>
                          <span class="val">156</span>
                        </div>
                      </div>
                    </template>
                    <template v-else-if="field.id === 'accuracy'">
                      <div class="accuracy-circle">
                        <el-progress type="circle" :percentage="85" :width="80" stroke-width="8" color="#1e3a8a" />
                        <div class="accuracy-label">综合正确率</div>
                      </div>
                    </template>
                    <template v-else-if="field.id === 'achievements'">
                      <div class="achievement-list">
                        <div class="badge-mini">🏅 初露锋芒</div>
                        <div class="badge-mini">📚 满腹经纶</div>
                      </div>
                    </template>
                    <template v-else>
                      <div class="placeholder-text">数据汇总统计图表展示区域...</div>
                    </template>
                  </div>
                </div>
              </div>

              <div class="report-footer">
                <p>学医智用 · 伴你成长</p>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=MedWise" alt="QR" class="qr-mini" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import draggable from 'vuedraggable'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const activeTab = ref('weekly')
const weeklyFields = ref<any[]>([])
const monthlyFields = ref<any[]>([])

const currentFields = computed(() => {
  return activeTab.value === 'weekly' ? weeklyFields.value : monthlyFields.value
})

const fetchTemplates = async () => {
  try {
    const res = await axios.get('/api/achievement/report-templates')
    weeklyFields.value = res.data.data.weekly
    monthlyFields.value = res.data.data.monthly
  } catch (error) {
    console.error('Failed to fetch templates:', error)
  }
}

const handleSave = async () => {
  try {
    await axios.post('/api/achievement/report-templates/save', {
      weekly: weeklyFields.value,
      monthly: monthlyFields.value
    })
    ElMessage.success('模板配置已保存并生效')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

onMounted(fetchTemplates)
</script>

<style scoped lang="scss">
.reports-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;

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

  .content-layout {
    display: flex;
    gap: 30px;
    height: calc(100vh - 180px);
  }

  .config-panel {
    flex: 1;
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    overflow-y: auto;

    .custom-tabs {
      :deep(.el-tabs__item) {
        font-size: 15px;
        font-weight: bold;
      }
    }

    .config-section {
      margin-top: 20px;
      .section-title {
        font-size: 16px;
        font-weight: bold;
        color: #303133;
        margin-bottom: 8px;
      }
      .section-desc {
        font-size: 13px;
        color: #909399;
        margin-bottom: 20px;
      }
    }

    .field-list {
      .field-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        margin-bottom: 12px;
        transition: all 0.2s;

        &:hover {
          border-color: #1e3a8a;
          background: #f1f5f9;
        }

        &.disabled {
          opacity: 0.6;
          background: #f1f5f9;
        }

        .drag-handle {
          cursor: move;
          color: #94a3b8;
          margin-right: 12px;
          display: flex;
          align-items: center;
        }

        .field-icon {
          margin-left: auto;
          font-size: 18px;
          color: #1e3a8a;
        }
      }

      .ghost-item {
        opacity: 0.5;
        background: #e0e7ff;
        border: 1px dashed #1e3a8a;
      }
    }
  }

  .preview-panel {
    width: 400px;
    background: #f1f5f9;
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;

    .preview-header {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      span {
        font-weight: bold;
        color: #475569;
      }
    }

    .phone-mockup {
      width: 320px;
      height: 640px;
      background: #1a1a1a;
      border-radius: 36px;
      padding: 12px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.2);
      position: relative;
      
      &::before {
        content: "";
        position: absolute;
        top: 25px;
        left: 50%;
        transform: translateX(-50%);
        width: 60px;
        height: 18px;
        background: #000;
        border-radius: 10px;
        z-index: 10;
      }

      .phone-screen {
        width: 100%;
        height: 100%;
        background: #fff;
        border-radius: 28px;
        overflow-y: auto;
        &::-webkit-scrollbar {
          width: 0;
        }

        .report-preview-content {
          padding: 24px 16px;
          
          .report-title {
            text-align: center;
            margin-bottom: 24px;
            .user-info {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 12px;
              margin-bottom: 12px;
              .meta {
                text-align: left;
                .name { font-weight: bold; font-size: 14px; display: block; }
                .date { font-size: 11px; color: #94a3b8; }
              }
            }
            h3 {
              color: #1e3a8a;
              font-size: 20px;
              margin: 0;
            }
          }

          .preview-module {
            background: #f8fafc;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 16px;
            border: 1px solid #f1f5f9;

            .module-header {
              display: flex;
              align-items: center;
              gap: 8px;
              color: #1e3a8a;
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 12px;
              .el-icon { font-size: 16px; }
            }

            .module-body {
              .big-num {
                font-size: 28px;
                font-weight: bold;
                color: #1e3a8a;
                span { font-size: 12px; color: #64748b; font-weight: normal; }
              }
              .chart-placeholder {
                height: 40px;
                background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
                background-size: 200% 100%;
                margin-top: 8px;
                border-radius: 4px;
              }
              .stats-row {
                display: flex;
                justify-content: space-between;
                .stat-item {
                  .label { font-size: 11px; color: #64748b; display: block; }
                  .val { font-size: 18px; font-weight: bold; color: #1e3a8a; }
                }
              }
              .accuracy-circle {
                text-align: center;
                .accuracy-label { font-size: 11px; color: #64748b; margin-top: 4px; }
              }
              .achievement-list {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                .badge-mini {
                  font-size: 11px;
                  background: #fff;
                  padding: 4px 8px;
                  border-radius: 20px;
                  border: 1px solid #e2e8f0;
                  color: #475569;
                }
              }
              .placeholder-text {
                font-size: 11px;
                color: #94a3b8;
                font-style: italic;
              }
            }
          }

          .report-footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px dashed #e2e8f0;
            p { font-size: 12px; color: #94a3b8; margin-bottom: 12px; }
            .qr-mini { width: 40px; height: 40px; opacity: 0.6; }
          }
        }
      }
    }
  }
}
</style>
