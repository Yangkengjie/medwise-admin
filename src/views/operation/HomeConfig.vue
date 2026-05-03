<template>
  <div class="home-config-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="title">首页卡片配置</h2>
        <p class="subtitle">管理用户端首页卡片的展示顺序、启用状态及样式风格</p>
      </div>
      <el-button type="primary" icon="Promotion" @click="handleSave">保存并发布</el-button>
    </div>

    <div class="content-layout">
      <!-- Left: Card List & Config -->
      <div class="config-section">
        <div class="section-title">
          <span>卡片排列与配置</span>
          <el-tooltip content="按住左侧手柄可拖拽调整卡片在首页的上下展示顺序">
            <el-icon class="help-icon"><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>

        <draggable 
          v-model="cardList" 
          item-key="id" 
          handle=".drag-handle"
          ghost-class="ghost-card"
          class="card-list"
        >
          <template #item="{ element }">
            <div class="config-card" :class="{ disabled: !element.enabled }">
              <div class="drag-handle">
                <el-icon><Rank /></el-icon>
              </div>
              
              <div class="card-info">
                <div class="card-title-row">
                  <el-icon class="card-icon"><component :is="element.icon" /></el-icon>
                  <span class="card-name">{{ element.title }}</span>
                  <el-switch 
                    v-model="element.enabled" 
                    active-text="已启用" 
                    inactive-text="已停用"
                    inline-prompt
                    style="margin-left: auto"
                  />
                </div>
                <p class="card-desc">{{ element.description }}</p>
                
                <div class="card-options" v-if="element.id === 'status'">
                  <span class="option-label">展示模式：</span>
                  <el-radio-group v-model="element.mode" size="small">
                    <el-radio-button label="compact">紧凑模式</el-radio-button>
                    <el-radio-button label="full">完整模式</el-radio-button>
                  </el-radio-group>
                </div>
              </div>
            </div>
          </template>
        </draggable>
      </div>

      <!-- Right: Live Preview -->
      <div class="preview-section">
        <div class="preview-header">
          <span>首页效果实时预览</span>
          <el-tag size="small" type="success" effect="plain">用户端预览</el-tag>
        </div>

        <div class="phone-frame">
          <div class="phone-inner">
            <div class="app-header">
              <span class="app-title">学医智用</span>
              <el-icon><User /></el-icon>
            </div>
            
            <div class="preview-content">
              <div v-for="card in activeCards" :key="card.id" class="preview-card-item">
                <!-- Search Box Preview -->
                <div v-if="card.id === 'search'" class="preview-search">
                  <el-icon><Search /></el-icon>
                  <span>搜索课程、知识点、古籍...</span>
                </div>

                <!-- Continue Learning Preview -->
                <div v-else-if="card.id === 'continue'" class="preview-continue">
                  <div class="p-header">继续学习</div>
                  <div class="p-body">
                    <div class="course-cover"></div>
                    <div class="course-info">
                      <div class="c-title">中医基础理论 - 阴阳五行</div>
                      <div class="c-progress">已学 45%</div>
                    </div>
                  </div>
                </div>

                <!-- Suggestions Preview -->
                <div v-else-if="card.id === 'suggestions'" class="preview-suggestions">
                  <div class="p-header">今日建议</div>
                  <div class="suggestion-chips">
                    <div class="chip">复习：五行生克</div>
                    <div class="chip">练习：辨证训练</div>
                  </div>
                </div>

                <!-- Status Card Preview -->
                <div v-else-if="card.id === 'status'" class="preview-status" :class="card.mode">
                  <div class="status-top">
                    <span class="status-name">融会贯通</span>
                    <el-tag size="small" type="warning" effect="dark">LV.4</el-tag>
                  </div>
                  <div class="status-details" v-if="card.mode === 'full'">
                    <div class="detail-item">
                      <span class="v">120</span>
                      <span class="l">今日分钟</span>
                    </div>
                    <div class="detail-item">
                      <span class="v">14</span>
                      <span class="l">连续天数</span>
                    </div>
                  </div>
                  <div class="status-progress">
                    <div class="bar"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="app-footer">
              <div class="footer-item active"><el-icon><House /></el-icon><span>首页</span></div>
              <div class="footer-item"><el-icon><Notebook /></el-icon><span>学习</span></div>
              <div class="footer-item"><el-icon><User /></el-icon><span>我的</span></div>
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

interface HomeCard {
  id: string
  title: string
  description: string
  icon: string
  enabled: boolean
  mode?: 'compact' | 'full'
}

const cardList = ref<HomeCard[]>([])

const activeCards = computed(() => {
  return cardList.value.filter(card => card.enabled)
})

const fetchConfig = async () => {
  try {
    const res = await axios.get('/api/operation/home-config')
    cardList.value = res.data.data
  } catch (error) {
    console.error('Failed to fetch config:', error)
  }
}

const handleSave = async () => {
  try {
    await axios.post('/api/operation/home-config/save', cardList.value)
    ElMessage({
      message: '首页配置已保存并发布，全端即时生效',
      type: 'success',
      duration: 3000
    })
  } catch (error) {
    ElMessage.error('发布失败')
  }
}

onMounted(fetchConfig)
</script>

<style scoped lang="scss">
.home-config-container {
  padding: 20px;
  max-width: 1200px;
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
    gap: 40px;
    align-items: flex-start;
  }

  .config-section {
    flex: 1;
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: bold;
      color: #303133;
      margin-bottom: 20px;
      .help-icon {
        font-size: 14px;
        color: #909399;
        cursor: help;
      }
    }
  }

  .card-list {
    .config-card {
      display: flex;
      gap: 16px;
      padding: 20px;
      background: #fff;
      border: 1px solid #e4e7ed;
      border-radius: 12px;
      margin-bottom: 16px;
      transition: all 0.3s;
      box-shadow: 0 2px 8px rgba(0,0,0,0.02);

      &:hover {
        border-color: #1e3a8a;
        box-shadow: 0 4px 12px rgba(30, 58, 138, 0.08);
      }

      &.disabled {
        background: #f8fafc;
        opacity: 0.7;
      }

      .drag-handle {
        cursor: move;
        color: #909399;
        padding-top: 4px;
      }

      .card-info {
        flex: 1;
        .card-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
          .card-icon {
            font-size: 18px;
            color: #1e3a8a;
          }
          .card-name {
            font-weight: bold;
            font-size: 16px;
            color: #1e293b;
          }
        }
        .card-desc {
          font-size: 13px;
          color: #64748b;
          margin: 0 0 16px;
          line-height: 1.5;
        }
        .card-options {
          background: #f1f5f9;
          padding: 10px 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          .option-label {
            font-size: 12px;
            color: #475569;
            margin-right: 12px;
          }
        }
      }
    }

    .ghost-card {
      opacity: 0.5;
      background: #e0e7ff;
      border: 2px dashed #1e3a8a;
    }
  }

  .preview-section {
    width: 360px;
    background: #f8fafc;
    border-radius: 16px;
    padding: 24px;
    position: sticky;
    top: 20px;

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      span {
        font-weight: bold;
        color: #475569;
        font-size: 14px;
      }
    }

    .phone-frame {
      background: #1a1a1a;
      border-radius: 36px;
      padding: 10px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.15);
      
      .phone-inner {
        background: #f1f5f9;
        border-radius: 28px;
        height: 600px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        position: relative;

        .app-header {
          padding: 20px 16px 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fff;
          .app-title {
            font-size: 18px;
            font-weight: bold;
            color: #1e3a8a;
          }
          .el-icon { font-size: 20px; color: #64748b; }
        }

        .preview-content {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          &::-webkit-scrollbar { width: 0; }

          .preview-card-item {
            margin-bottom: 16px;
          }

          .preview-search {
            background: #fff;
            padding: 12px 16px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
            color: #94a3b8;
            font-size: 13px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.03);
          }

          .preview-continue {
            background: #fff;
            padding: 12px;
            border-radius: 12px;
            .p-header { font-size: 13px; font-weight: bold; color: #1e293b; margin-bottom: 10px; }
            .p-body {
              display: flex;
              gap: 12px;
              .course-cover {
                width: 60px;
                height: 40px;
                background: #e2e8f0;
                border-radius: 4px;
              }
              .course-info {
                .c-title { font-size: 12px; font-weight: bold; color: #1e3a8a; margin-bottom: 4px; }
                .c-progress { font-size: 11px; color: #94a3b8; }
              }
            }
          }

          .preview-suggestions {
            background: #fff;
            padding: 12px;
            border-radius: 12px;
            .p-header { font-size: 13px; font-weight: bold; color: #1e293b; margin-bottom: 10px; }
            .suggestion-chips {
              display: flex;
              gap: 8px;
              .chip {
                background: #f1f5f9;
                padding: 6px 10px;
                border-radius: 15px;
                font-size: 11px;
                color: #475569;
              }
            }
          }

          .preview-status {
            background: #1e3a8a;
            padding: 16px;
            border-radius: 12px;
            color: #fff;
            
            .status-top {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;
              .status-name { font-size: 16px; font-weight: bold; }
            }
            
            .status-details {
              display: flex;
              gap: 24px;
              margin-bottom: 12px;
              .detail-item {
                .v { font-size: 18px; font-weight: bold; display: block; }
                .l { font-size: 10px; opacity: 0.7; }
              }
            }
            
            .status-progress {
              height: 4px;
              background: rgba(255,255,255,0.2);
              border-radius: 2px;
              .bar {
                width: 70%;
                height: 100%;
                background: #fff;
                border-radius: 2px;
              }
            }

            &.compact {
              padding: 12px 16px;
              .status-top { margin-bottom: 0; }
              .status-progress { display: none; }
            }
          }
        }

        .app-footer {
          height: 60px;
          background: #fff;
          display: flex;
          justify-content: space-around;
          align-items: center;
          border-top: 1px solid #f1f5f9;
          .footer-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            color: #94a3b8;
            .el-icon { font-size: 20px; }
            span { font-size: 10px; }
            &.active { color: #1e3a8a; }
          }
        }
      }
    }
  }
}
</style>
