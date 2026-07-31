<script setup lang="ts">
import {
  Clock,
  Connection,
  DocumentChecked,
  InfoFilled,
  Van,
  Warning,
} from '@element-plus/icons-vue'
import { computed } from 'vue'

import type {
  TransportStatus,
  TransportTrajectoryPoint,
} from '@/types/delivery'

interface Props {
  materialId: string
  transportStatus: TransportStatus
  progress: number
  anomalyCount: number
  currentPoint: TransportTrajectoryPoint | null
  canStart: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  start: []
}>()

const vehicleStatusText = computed(() =>
  props.transportStatus === 'RUNNING' ? '运输行驶中' : '等待发车',
)

const riskStatusText = computed(() => {
  if (props.anomalyCount > 0) {
    return `已发现 ${props.anomalyCount} 项异常`
  }

  return props.transportStatus === 'RUNNING'
    ? '实时规则监测中'
    : '尚未开始分析'
})
</script>

<template>
  <aside class="transport-panel" aria-labelledby="transport-panel-title">
    <header class="panel-header">
      <div class="stage-number">02</div>
      <div>
        <div class="eyebrow">TRANSPORT MONITOR</div>
        <h2 id="transport-panel-title">运输状态监控</h2>
      </div>
      <span class="stage-badge">当前阶段</span>
    </header>

    <div class="ready-banner">
      <div class="ready-icon">
        <el-icon><DocumentChecked /></el-icon>
      </div>
      <div>
        <strong>
          {{
            transportStatus === 'RUNNING'
              ? '材料运输任务执行中'
              : '材料数字档案已建立'
          }}
        </strong>
        <p>
          {{
            transportStatus === 'RUNNING'
              ? `当前已完成 ${progress}% 行程，轨迹规则正在实时分析。`
              : '出厂材料信息已完成核验，可以进入运输准备阶段。'
          }}
        </p>
      </div>
    </div>

    <dl class="status-list">
      <div>
        <dt>
          <el-icon><DocumentChecked /></el-icon>
          材料档案
        </dt>
        <dd class="material-id">{{ materialId }}</dd>
      </div>
      <div>
        <dt>
          <el-icon><Van /></el-icon>
          车辆状态
        </dt>
        <dd>
          <span
            class="status-dot"
            :class="transportStatus === 'RUNNING' ? 'running' : 'waiting'"
          ></span>
          {{ vehicleStatusText }}
        </dd>
      </div>
      <div>
        <dt>
          <el-icon><Warning /></el-icon>
          运输风险
        </dt>
        <dd :class="{ 'risk-warning': anomalyCount > 0 }">
          {{ riskStatusText }}
        </dd>
      </div>
      <div>
        <dt>
          <el-icon><Connection /></el-icon>
          当前阶段
        </dt>
        <dd class="stage-value">运输中</dd>
      </div>
    </dl>

    <section class="engine-placeholder">
      <div class="engine-heading">
        <el-icon><Clock /></el-icon>
        <div>
          <strong>
            {{
              transportStatus === 'RUNNING'
                ? '运输事件引擎运行中'
                : '运输事件引擎已就绪'
            }}
          </strong>
          <p v-if="currentPoint">
            演示时间 {{ currentPoint.time }} · 当前速度
            {{ currentPoint.speed }} km/h
          </p>
          <p v-else>点击开始运输，播放当前案例的预置轨迹。</p>
        </div>
      </div>

      <el-progress
        class="transport-progress"
        :percentage="progress"
        :stroke-width="6"
      />

      <span class="disabled-action">
        <el-button
          type="primary"
          :icon="Van"
          :disabled="!canStart"
          :loading="transportStatus === 'RUNNING'"
          @click="emit('start')"
        >
          {{
            transportStatus === 'RUNNING'
              ? '运输播放中'
              : '开始运输'
          }}
        </el-button>
      </span>
    </section>

    <p class="mock-tip">
      <el-icon><InfoFilled /></el-icon>
      当前使用本地 Mock 轨迹和确定性规则演示，不连接真实 GPS。
    </p>
  </aside>
</template>

<style scoped>
.transport-panel {
  display: flex;
  min-height: 0;
  flex-direction: column;
  padding: 15px 17px 13px;
  overflow: hidden;
  border: 1px solid var(--platform-border-color);
  background: var(--platform-panel-background);
  box-shadow: var(--platform-panel-shadow);
}

.panel-header {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
}

.stage-number {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 4px;
  color: #fff;
  background: var(--platform-primary-color);
  font-size: 13px;
  font-weight: 700;
}

.eyebrow {
  margin-bottom: 2px;
  color: var(--platform-placeholder-text-color);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.13em;
}

.panel-header h2 {
  margin: 0;
  color: var(--platform-title-color);
  font-size: 18px;
  line-height: 1.2;
}

.stage-badge {
  padding: 4px 7px;
  border: 1px solid #c8dce8;
  border-radius: 3px;
  color: var(--platform-primary-color);
  background: #eef6fa;
  font-size: 11px;
  font-weight: 600;
}

.ready-banner {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  align-items: center;
  gap: 11px;
  margin-top: 16px;
  padding: 13px;
  border: 1px solid #c9e1d2;
  border-radius: 4px;
  background: #f1f8f4;
}

.ready-icon {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  background: var(--platform-success-color);
  font-size: 20px;
}

.ready-banner strong {
  color: var(--platform-success-color);
  font-size: 13px;
}

.ready-banner p {
  margin: 4px 0 0;
  color: var(--platform-secondary-text-color);
  font-size: 9px;
  line-height: 1.4;
}

.status-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 16px 0 0;
}

.status-list > div {
  min-width: 0;
  padding: 11px;
  border: 1px solid #e0e5e9;
  border-radius: 4px;
  background: #fafbfc;
}

.status-list dt {
  display: flex;
  align-items: center;
  margin-bottom: 7px;
  color: var(--platform-placeholder-text-color);
  font-size: 9px;
}

.status-list dt .el-icon {
  margin-right: 4px;
  color: var(--platform-primary-color);
}

.status-list dd {
  display: flex;
  align-items: center;
  overflow: hidden;
  margin: 0;
  color: var(--platform-regular-text-color);
  font-size: 11px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-list .material-id,
.status-list .stage-value {
  color: var(--platform-primary-color);
}

.status-dot {
  width: 6px;
  height: 6px;
  margin-right: 6px;
  border-radius: 50%;
}

.status-dot.waiting {
  background: var(--platform-warning-color);
  box-shadow: 0 0 0 3px rgb(217 119 6 / 12%);
}

.status-dot.running {
  background: var(--platform-primary-color);
  box-shadow: 0 0 0 3px rgb(31 95 139 / 12%);
}

.status-list dd.risk-warning {
  color: var(--platform-warning-color);
}

.engine-placeholder {
  margin-top: 16px;
  padding: 13px;
  border: 1px dashed #cbd4db;
  border-radius: 4px;
  background: #f7f9fa;
}

.engine-heading {
  display: flex;
  align-items: flex-start;
  color: var(--platform-primary-color);
}

.engine-heading > .el-icon {
  margin: 1px 8px 0 0;
  font-size: 17px;
}

.engine-heading strong {
  color: var(--platform-title-color);
  font-size: 12px;
}

.engine-heading p {
  margin: 4px 0 0;
  color: var(--platform-secondary-text-color);
  font-size: 9px;
  line-height: 1.4;
}

.disabled-action {
  display: block;
  margin-top: 13px;
}

.transport-progress {
  margin-top: 11px;
}

.disabled-action .el-button {
  width: 100%;
}

.mock-tip {
  display: flex;
  align-items: flex-start;
  margin: auto 0 0;
  color: var(--platform-placeholder-text-color);
  font-size: 9px;
  line-height: 1.5;
}

.mock-tip .el-icon {
  flex: 0 0 auto;
  margin: 2px 5px 0 0;
}

@media (max-height: 800px) {
  .transport-panel {
    padding: 10px 14px 8px;
  }

  .ready-banner {
    grid-template-columns: 34px minmax(0, 1fr);
    gap: 8px;
    margin-top: 9px;
    padding: 8px 10px;
  }

  .ready-icon {
    width: 32px;
    height: 32px;
    font-size: 17px;
  }

  .ready-banner p {
    margin-top: 2px;
  }

  .status-list {
    gap: 6px;
    margin-top: 8px;
  }

  .status-list > div {
    padding: 7px 9px;
  }

  .status-list dt {
    margin-bottom: 3px;
  }

  .engine-placeholder {
    margin-top: 8px;
    padding: 8px 10px;
  }

  .engine-heading p {
    margin-top: 2px;
  }

  .disabled-action {
    margin-top: 6px;
  }

  .disabled-action .el-button {
    height: 28px;
  }

  .mock-tip {
    margin-top: 6px;
    font-size: 8px;
  }
}
</style>
