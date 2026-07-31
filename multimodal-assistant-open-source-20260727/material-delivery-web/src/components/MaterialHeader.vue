<script setup lang="ts">
import {
  ArrowRight,
  DataAnalysis,
  FolderOpened,
  RefreshRight,
} from '@element-plus/icons-vue'

import type { ScenarioType } from '@/types/delivery'
import type { RecognitionMode } from '@/types/recognition'

interface Props {
  materialId: string
  materialName: string
  grade: string
  specification: string
  currentStatusText: string
  scenarioType: ScenarioType
  recognitionMode: RecognitionMode
  isBusy?: boolean
}

withDefaults(defineProps<Props>(), {
  isBusy: false,
})

const emit = defineEmits<{
  'scenario-change': [scenario: ScenarioType]
  'recognition-mode-change': [mode: RecognitionMode]
  'open-archive': []
  reset: []
}>()
</script>

<template>
  <header class="material-header">
    <div class="platform-identity">
      <div class="platform-icon" aria-hidden="true">
        <el-icon><DataAnalysis /></el-icon>
      </div>

      <div class="platform-copy">
        <div class="platform-name">
          建筑材料可信交付智能核验平台
        </div>
        <div class="platform-subtitle">
          MATERIAL TRUSTED DELIVERY
        </div>
      </div>

      <span
        class="mode-badge"
        :class="{ real: recognitionMode === 'REAL' }"
      >
        {{ recognitionMode === 'REAL' ? '真实模型模式' : 'Mock 演示模式' }}
      </span>
    </div>

    <div class="material-summary">
      <div class="material-main">
        <button
          type="button"
          class="material-id"
          title="打开材料数字档案"
          @click="emit('open-archive')"
        >
          <el-icon><FolderOpened /></el-icon>
          {{ materialId }}
        </button>
        <strong>{{ materialName }}</strong>
        <button
          type="button"
          class="archive-entry"
          @click="emit('open-archive')"
        >
          查看数字档案
          <el-icon><ArrowRight /></el-icon>
        </button>
      </div>

      <div class="material-meta">
        <span>牌号 <b>{{ grade }}</b></span>
        <span class="meta-divider" aria-hidden="true"></span>
        <span>规格 <b>{{ specification }}</b></span>
        <span class="meta-divider" aria-hidden="true"></span>
        <span class="current-status">
          <i aria-hidden="true"></i>
          {{ currentStatusText }}
        </span>
      </div>
    </div>

    <div class="header-actions">
      <div class="recognition-mode-switch" aria-label="识别模式切换">
        <button
          type="button"
          :class="{ active: recognitionMode === 'MOCK' }"
          :disabled="isBusy"
          title="使用本地确定性演示数据"
          @click="emit('recognition-mode-change', 'MOCK')"
        >
          Mock
        </button>
        <button
          type="button"
          class="real-mode-button"
          :class="{ active: recognitionMode === 'REAL' }"
          :disabled="isBusy"
          title="通过本地网关调用多模态大模型"
          @click="emit('recognition-mode-change', 'REAL')"
        >
          Real
        </button>
      </div>

      <div class="scenario-switch" aria-label="演示案例切换">
        <button
          type="button"
          class="scenario-button"
          :class="{ active: scenarioType === 'NORMAL' }"
          :disabled="isBusy"
          @click="emit('scenario-change', 'NORMAL')"
        >
          正常交付案例
        </button>
        <button
          type="button"
          class="scenario-button abnormal"
          :class="{ active: scenarioType === 'ABNORMAL' }"
          :disabled="isBusy"
          @click="emit('scenario-change', 'ABNORMAL')"
        >
          异常交付案例
        </button>
      </div>

      <el-button
        class="reset-button"
        :icon="RefreshRight"
        @click="emit('reset')"
      >
        重新演示
      </el-button>
    </div>
  </header>
</template>

<style scoped>
.material-header {
  display: grid;
  min-height: 72px;
  grid-template-columns: minmax(330px, 0.9fr) minmax(400px, 1.15fr) auto;
  align-items: center;
  gap: 22px;
  padding: 10px 18px;
  border: 1px solid var(--platform-border-color);
  background: var(--platform-panel-background);
  box-shadow: var(--platform-panel-shadow);
}

.platform-identity,
.material-main,
.material-meta,
.header-actions,
.scenario-switch,
.recognition-mode-switch {
  display: flex;
  align-items: center;
}

.platform-identity {
  min-width: 0;
  gap: 11px;
}

.platform-icon {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  place-items: center;
  border: 1px solid #d2e2ec;
  border-radius: 5px;
  color: #fff;
  background: var(--platform-primary-color);
  font-size: 21px;
}

.platform-copy {
  min-width: 0;
}

.platform-name {
  overflow: hidden;
  color: var(--platform-title-color);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.platform-subtitle {
  margin-top: 2px;
  color: var(--platform-placeholder-text-color);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.16em;
}

.mode-badge {
  flex: 0 0 auto;
  padding: 3px 7px;
  border: 1px solid #e1e6eb;
  border-radius: 3px;
  color: var(--platform-placeholder-text-color);
  background: #f7f9fa;
  font-size: 11px;
  white-space: nowrap;
}

.mode-badge.real {
  border-color: #c8dce8;
  color: var(--platform-primary-color);
  background: #eef6fa;
}

.material-summary {
  min-width: 0;
  padding-left: 18px;
  border-left: 1px solid #e3e8ed;
}

.material-main {
  min-width: 0;
  gap: 10px;
}

.material-main strong {
  min-width: 0;
  overflow: hidden;
  color: var(--platform-title-color);
  font-size: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-id {
  display: inline-flex;
  height: 25px;
  flex: 0 0 auto;
  align-items: center;
  gap: 4px;
  padding: 0 6px;
  border: 1px solid #c9dce8;
  border-radius: 3px;
  color: var(--platform-primary-color);
  background: #f2f7fa;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.material-id:hover,
.material-id:focus-visible {
  border-color: #8fb3ca;
  background: #e9f2f7;
  outline: none;
}

.archive-entry {
  display: inline-flex;
  height: 24px;
  flex: 0 0 auto;
  align-items: center;
  gap: 2px;
  margin-left: auto;
  padding: 0;
  border: 0;
  color: var(--platform-primary-color);
  background: transparent;
  font-size: 10px;
  font-weight: 650;
  white-space: nowrap;
}

.archive-entry:hover,
.archive-entry:focus-visible {
  color: var(--platform-primary-hover-color);
  text-decoration: underline;
  outline: none;
}

.material-meta {
  gap: 10px;
  margin-top: 7px;
  color: var(--platform-secondary-text-color);
  font-size: 12px;
  white-space: nowrap;
}

.material-meta b {
  color: var(--platform-regular-text-color);
  font-weight: 650;
}

.meta-divider {
  width: 1px;
  height: 11px;
  background: #dfe5ea;
}

.current-status {
  display: inline-flex;
  align-items: center;
  color: var(--platform-primary-color);
  font-weight: 600;
}

.current-status i {
  width: 6px;
  height: 6px;
  margin-right: 6px;
  border-radius: 50%;
  background: var(--platform-primary-color);
  box-shadow: 0 0 0 3px rgb(31 95 139 / 12%);
}

.header-actions {
  justify-content: flex-end;
  gap: 10px;
}

.scenario-switch {
  padding: 3px;
  border: 1px solid var(--platform-border-color);
  border-radius: 5px;
  background: #f4f6f8;
}

.recognition-mode-switch {
  padding: 3px;
  border: 1px solid #cfd9e0;
  border-radius: 5px;
  background: #f4f6f8;
}

.recognition-mode-switch button {
  height: 30px;
  padding: 0 8px;
  border: 0;
  border-radius: 3px;
  color: var(--platform-secondary-text-color);
  background: transparent;
  font-size: 11px;
}

.recognition-mode-switch button:hover:not(:disabled) {
  color: var(--platform-primary-color);
  background: #fff;
}

.recognition-mode-switch button.active {
  color: var(--platform-primary-color);
  background: #fff;
  box-shadow: 0 1px 4px rgb(31 41 55 / 10%);
  font-weight: 700;
}

.recognition-mode-switch .real-mode-button.active {
  color: var(--platform-success-color);
}

.recognition-mode-switch button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.scenario-button {
  height: 30px;
  padding: 0 11px;
  border: 0;
  border-radius: 3px;
  color: var(--platform-secondary-text-color);
  background: transparent;
  font-size: 12px;
  transition:
    color 0.15s ease,
    background-color 0.15s ease,
    box-shadow 0.15s ease;
}

.scenario-button:hover:not(:disabled) {
  color: var(--platform-primary-color);
  background: #fff;
}

.scenario-button.active {
  color: var(--platform-primary-color);
  background: #fff;
  box-shadow: 0 1px 4px rgb(31 41 55 / 10%);
  font-weight: 650;
}

.scenario-button.abnormal.active {
  color: var(--platform-danger-color);
}

.scenario-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.reset-button {
  --el-button-hover-text-color: var(--platform-primary-color);
  --el-button-hover-border-color: #9cbcd1;
  --el-button-hover-bg-color: #f2f7fa;
  height: 38px;
}

@media (max-width: 1280px) {
  .material-header {
    grid-template-columns: minmax(305px, 0.82fr) minmax(360px, 1fr) auto;
    gap: 14px;
    padding-right: 12px;
    padding-left: 14px;
  }

  .platform-name {
    font-size: 15px;
  }

  .mode-badge {
    display: none;
  }

  .scenario-button {
    padding: 0 8px;
  }

  .reset-button {
    padding: 8px 10px;
  }
}
</style>
