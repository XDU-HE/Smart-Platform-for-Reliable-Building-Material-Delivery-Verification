<script setup lang="ts">
import {
  CircleCloseFilled,
  CircleCheckFilled,
  Clock,
  Connection,
  DocumentChecked,
  List,
  UserFilled,
  WarningFilled,
} from '@element-plus/icons-vue'
import { computed } from 'vue'
import type { Component } from 'vue'

import type {
  ReviewDecision,
  RiskFactLevel,
  RiskReport,
  TransportAnomaly,
} from '@/types/delivery'
import type { MaterialCompareRow } from '@/types/material'

interface Props {
  report: RiskReport
  transportAnomalies: TransportAnomaly[]
  compareRows: MaterialCompareRow[]
  decision: ReviewDecision | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  decision: [decision: ReviewDecision]
}>()

const isRiskReport = computed(() => props.report.riskLevel !== 'LOW')

const riskFactIcons: Record<RiskFactLevel, Component> = {
  CRITICAL: CircleCloseFilled,
  HIGH: WarningFilled,
  WARNING: Clock,
  INTERRUPTED: Connection,
  SUCCESS: CircleCheckFilled,
}

const decisionLabels: Record<ReviewDecision, string> = {
  ACCEPTED: '已进入常规验收',
  REVIEW_REQUIRED: '已转人工复核',
  DEFERRED: '已暂缓验收',
}
</script>

<template>
  <aside class="risk-panel" aria-labelledby="risk-panel-title">
    <header class="panel-header">
      <div
        class="stage-number"
        :class="{ danger: report.riskLevel === 'HIGH' }"
      >
        <el-icon>
          <WarningFilled v-if="report.riskLevel === 'HIGH'" />
          <CircleCheckFilled v-else />
        </el-icon>
      </div>
      <div>
        <div class="eyebrow">RISK REVIEW</div>
        <h2 id="risk-panel-title">综合风险与辅助验收</h2>
      </div>
      <span
        class="risk-badge"
        :class="report.riskLevel.toLowerCase()"
      >
        {{ report.riskLevel === 'HIGH' ? '高风险' : '低风险' }}
      </span>
    </header>

    <div class="risk-overview">
      <div>
        <span>运输异常</span>
        <strong>{{ transportAnomalies.length }}</strong>
      </div>
      <div>
        <span>身份冲突</span>
        <strong>
          {{
            compareRows.filter((row) => row.result === 'MISMATCH')
              .length
          }}
        </strong>
      </div>
      <div>
        <span>风险等级</span>
        <strong>{{ report.riskLevel }}</strong>
      </div>
    </div>

    <section class="report-section">
      <h3>
        <el-icon>
          <WarningFilled v-if="isRiskReport" />
          <DocumentChecked v-else />
        </el-icon>
        {{ isRiskReport ? '验收风险' : '核验结论' }}
      </h3>
      <ul class="fact-list">
        <li
          v-for="fact in report.confirmedFacts"
          :key="fact.text"
          :class="`risk-${fact.level.toLowerCase()}`"
        >
          <el-icon class="fact-icon">
            <component :is="riskFactIcons[fact.level]" />
          </el-icon>
          <span class="fact-text">{{ fact.text }}</span>
          <span class="fact-level">{{ fact.label }}</span>
        </li>
      </ul>
    </section>

    <section class="report-section explanation">
      <h3>
        <el-icon><WarningFilled /></el-icon>
        风险解释
      </h3>
      <p>{{ report.riskExplanation }}</p>
    </section>

    <section class="report-section">
      <div class="section-heading">
        <h3>
          <el-icon><List /></el-icon>
          待办核查事项
        </h3>
        <span class="todo-count">
          {{ report.recommendations.length }} 项待办
        </span>
      </div>
      <ul class="todo-list">
        <li
          v-for="recommendation in report.recommendations"
          :key="recommendation"
        >
          <span class="todo-checkbox" aria-hidden="true"></span>
          <span class="todo-text">{{ recommendation }}</span>
          <span class="todo-status">待核查</span>
        </li>
      </ul>
    </section>

    <div class="acceptance-suggestion">
      <span>辅助验收建议</span>
      <strong>{{ report.acceptanceSuggestion }}</strong>
    </div>

    <div v-if="decision" class="decision-result">
      <el-icon><DocumentChecked /></el-icon>
      <div>
        <span>人工处置结果</span>
        <strong>{{ decisionLabels[decision] }}</strong>
      </div>
    </div>

    <div v-else class="review-actions">
      <el-button
        v-if="report.riskLevel === 'LOW'"
        type="success"
        :icon="CircleCheckFilled"
        @click="emit('decision', 'ACCEPTED')"
      >
        进入常规验收
      </el-button>
      <el-button
        v-else
        type="danger"
        :icon="WarningFilled"
        @click="emit('decision', 'DEFERRED')"
      >
        暂缓验收
      </el-button>
      <el-button
        :icon="UserFilled"
        @click="emit('decision', 'REVIEW_REQUIRED')"
      >
        转人工复核
      </el-button>
    </div>

    <p class="boundary-tip">
      系统仅汇总事实、解释风险并给出核查建议，不替代监理人员作出最终验收决定。
    </p>
  </aside>
</template>

<style scoped>
.risk-panel {
  display: flex;
  min-height: 0;
  flex-direction: column;
  padding: 14px 14px 11px 17px;
  overflow-x: hidden;
  overflow-y: auto;
  border: 1px solid var(--platform-border-color);
  background: var(--platform-panel-background);
  box-shadow: var(--platform-panel-shadow);
  scrollbar-color: #c8d2d9 transparent;
  scrollbar-width: thin;
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
  background: var(--platform-success-color);
  font-size: 19px;
}

.stage-number.danger {
  background: var(--platform-danger-color);
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
  font-size: 17px;
}

.risk-badge {
  padding: 4px 7px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
}

.risk-badge.low {
  color: var(--platform-success-color);
  background: #edf7f1;
}

.risk-badge.high {
  color: var(--platform-danger-color);
  background: #fff0ef;
}

.risk-overview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
  margin-top: 10px;
}

.risk-overview > div {
  padding: 7px;
  border: 1px solid #e0e5e9;
  border-radius: 3px;
  background: #f8fafb;
  text-align: center;
}

.risk-overview span,
.risk-overview strong {
  display: block;
}

.risk-overview span {
  color: var(--platform-placeholder-text-color);
  font-size: 8px;
}

.risk-overview strong {
  margin-top: 3px;
  color: var(--platform-title-color);
  font-size: 13px;
}

.report-section {
  margin-top: 9px;
  padding-top: 8px;
  border-top: 1px solid #e7ebee;
}

.report-section h3 {
  display: flex;
  align-items: center;
  margin: 0 0 6px;
  color: var(--platform-title-color);
  font-size: 13px;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 7px;
}

.section-heading h3 {
  margin-bottom: 0;
  font-size: 14px;
}

.todo-count {
  padding: 2px 6px;
  border: 1px solid #cbdce8;
  border-radius: 3px;
  color: var(--platform-primary-color);
  background: #f2f7fa;
  font-size: 9.5px;
  font-weight: 650;
  white-space: nowrap;
}

.report-section h3 .el-icon {
  margin-right: 5px;
  color: var(--platform-primary-color);
  font-size: 14px;
}

.fact-list,
.todo-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.fact-list li {
  --risk-color: var(--platform-secondary-text-color);
  display: grid;
  grid-template-columns: 21px minmax(0, 1fr) auto;
  align-items: center;
  gap: 7px;
  margin-top: 5px;
  padding: 6px 7px;
  border-left: 3px solid var(--risk-color);
  border-radius: 3px;
  color: var(--platform-secondary-text-color);
  background: #f7f9fa;
  font-size: 10.5px;
  line-height: 1.45;
}

.fact-list .fact-icon {
  display: grid;
  width: 21px;
  height: 21px;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  background: var(--risk-color);
  font-size: 13px;
}

.fact-list .fact-icon :deep(svg) {
  color: #fff;
}

.fact-text {
  color: var(--platform-regular-text-color);
}

.fact-level {
  padding: 2px 5px;
  border-radius: 3px;
  color: var(--risk-color);
  background: rgb(255 255 255 / 76%);
  font-size: 8px;
  font-weight: 700;
  white-space: nowrap;
}

.fact-list li.risk-critical {
  --risk-color: #a92a25;
  color: #a92a25;
  background: #fff0ef;
}

.fact-list li.risk-critical .fact-text {
  color: #8f211d;
  font-weight: 700;
}

.fact-list li.risk-high {
  --risk-color: var(--platform-danger-color);
  color: var(--platform-danger-color);
  background: #fff5f4;
}

.fact-list li.risk-warning {
  --risk-color: var(--platform-warning-color);
  color: var(--platform-warning-color);
  background: #fff8ed;
}

.fact-list li.risk-interrupted {
  --risk-color: #536b7b;
  color: #536b7b;
  background: #f0f4f6;
}

.fact-list li.risk-success {
  --risk-color: var(--platform-success-color);
  color: var(--platform-success-color);
  background: #f1f8f4;
}

.explanation {
  padding: 9px 10px;
  border: 1px solid #ead7c3;
  border-radius: 3px;
  background: #fff9f1;
}

.explanation h3 {
  color: var(--platform-warning-color);
}

.explanation p {
  margin: 0;
  color: var(--platform-secondary-text-color);
  font-size: 10.5px;
  line-height: 1.6;
}

.todo-list li {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  padding: 7px 8px;
  border: 1px solid #e1e7ec;
  border-radius: 4px;
  background: #fbfcfd;
}

.todo-checkbox {
  width: 17px;
  height: 17px;
  border: 2px solid #7ea3bc;
  border-radius: 3px;
  background: #fff;
  box-shadow: inset 0 0 0 2px #fff;
}

.todo-text {
  color: var(--platform-regular-text-color);
  font-size: 11.5px;
  line-height: 1.5;
}

.todo-status {
  padding: 2px 5px;
  border-radius: 3px;
  color: var(--platform-primary-color);
  background: #eaf3f8;
  font-size: 9px;
  font-weight: 650;
  white-space: nowrap;
}

.acceptance-suggestion {
  margin-top: 9px;
  padding: 8px 10px;
  border-left: 3px solid var(--platform-primary-color);
  background: #f2f7fa;
}

.acceptance-suggestion span,
.acceptance-suggestion strong {
  display: block;
}

.acceptance-suggestion span {
  color: var(--platform-placeholder-text-color);
  font-size: 10px;
}

.acceptance-suggestion strong {
  margin-top: 4px;
  color: var(--platform-title-color);
  font-size: 13px;
  line-height: 1.45;
}

.review-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.decision-result {
  display: flex;
  align-items: center;
  margin-top: 10px;
  padding: 9px;
  border: 1px solid #c9e1d2;
  border-radius: 3px;
  color: var(--platform-success-color);
  background: #f1f8f4;
}

.decision-result > .el-icon {
  margin-right: 8px;
  font-size: 20px;
}

.decision-result span,
.decision-result strong {
  display: block;
}

.decision-result span {
  font-size: 8px;
}

.decision-result strong {
  margin-top: 2px;
  font-size: 10px;
}

.boundary-tip {
  margin: 8px 0 0;
  color: var(--platform-placeholder-text-color);
  font-size: 9px;
  line-height: 1.45;
}
</style>
