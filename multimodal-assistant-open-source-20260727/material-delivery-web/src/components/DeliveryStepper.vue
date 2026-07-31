<script setup lang="ts">
import {
  Check,
  Clock,
  CloseBold,
  Loading,
  WarningFilled,
} from '@element-plus/icons-vue'
import type { Component } from 'vue'
import { Connection } from '@element-plus/icons-vue'
import type { DeliveryStepItem, StageStatus } from '@/types/delivery'

interface Props {
  steps: DeliveryStepItem[]
}

defineProps<Props>()

const statusLabels: Record<StageStatus, string> = {
  PENDING: '待处理',
  PROCESSING: '进行中',
  COMPLETED: '已完成',
  WARNING: '需关注',
  FAILED: '未通过',
}

const statusIcons: Record<StageStatus, Component> = {
  PENDING: Clock,
  PROCESSING: Loading,
  COMPLETED: Check,
  WARNING: WarningFilled,
  FAILED: CloseBold,
}
</script>

<template>
  <nav class="delivery-stepper" aria-label="材料交付阶段">
     <div class="stepper-caption">
        <span class="caption-index" aria-hidden="true">
          <el-icon>
            <Connection />
          </el-icon>
        </span>

        <div>
          <strong>可信交付流程</strong>
          <small>DELIVERY PROCESS</small>
        </div>
      </div>


    <ol class="step-list">
      <li
        v-for="(step, index) in steps"
        :key="step.key"
        class="delivery-step"
        :class="`is-${step.status.toLowerCase()}`"
      >
        <div class="step-connector" aria-hidden="true"></div>

        <div class="step-node">
          <el-icon :class="{ 'is-rotating': step.status === 'PROCESSING' }">
            <component :is="statusIcons[step.status]" />
          </el-icon>
        </div>

        <div class="step-copy">
          <div class="step-heading">
            <span>0{{ index + 1 }}</span>
            <strong>{{ step.title }}</strong>
          </div>
          <div class="step-status">
            <i aria-hidden="true"></i>
            {{ statusLabels[step.status] }}
            <em v-if="step.description">{{ step.description }}</em>
          </div>
        </div>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.delivery-stepper {
  display: grid;
  min-height: 66px;
  grid-template-columns: 204px minmax(0, 1fr);
  align-items: center;
  padding: 7px 18px;
  border: 1px solid var(--platform-border-color);
  background: var(--platform-panel-background);
  box-shadow: 0 2px 10px rgb(31 41 55 / 5%);
}

.stepper-caption {
  display: flex;
  align-items: center;
  gap: 11px;
  border-right: 1px solid #e3e8ed;
}

.caption-index {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 3px;
  color: #fff;
  background: #244e69;
  font-size: 12px;
  font-weight: 700;
}

.stepper-caption strong,
.stepper-caption small {
  display: block;
}

.stepper-caption strong {
  color: var(--platform-title-color);
  font-size: 14px;
}

.stepper-caption small {
  margin-top: 3px;
  color: var(--platform-placeholder-text-color);
  font-size: 9px;
  letter-spacing: 0.09em;
}

.step-list {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
  padding: 0 2.5%;
  list-style: none;
}

.delivery-step {
  position: relative;
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 11px;
  padding-left: 10%;
}

.step-connector {
  position: absolute;
  z-index: 0;
  top: 19px;
  right: calc(50% + 33px);
  left: calc(-50% + 30px);
  height: 2px;
  background: #dce2e8;
}

.delivery-step:first-child .step-connector {
  display: none;
}

.delivery-step.is-completed .step-connector {
  background: var(--platform-success-color);
}

.step-node {
  position: relative;
  z-index: 1;
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  place-items: center;
  border: 2px solid #cbd3dc;
  border-radius: 50%;
  color: var(--platform-placeholder-text-color);
  background: #fff;
  font-size: 17px;
}

.step-copy {
  min-width: 0;
}

.step-heading {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 7px;
}

.step-heading span {
  color: #b1bac4;
  font-size: 10px;
  font-weight: 700;
}

.step-heading strong {
  overflow: hidden;
  color: var(--platform-title-color);
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.step-status {
  display: flex;
  min-width: 0;
  align-items: center;
  margin-top: 5px;
  color: var(--platform-placeholder-text-color);
  font-size: 11px;
}

.step-status i {
  width: 5px;
  height: 5px;
  margin-right: 5px;
  border-radius: 50%;
  background: currentcolor;
}

.step-status em {
  overflow: hidden;
  margin-left: 8px;
  color: var(--platform-placeholder-text-color);
  font-style: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delivery-step.is-processing .step-node {
  border-color: var(--platform-primary-color);
  color: #fff;
  background: var(--platform-primary-color);
  box-shadow: 0 0 0 5px rgb(31 95 139 / 10%);
}

.delivery-step.is-processing .step-status {
  color: var(--platform-primary-color);
  font-weight: 650;
}

.delivery-step.is-completed .step-node {
  border-color: var(--platform-success-color);
  color: #fff;
  background: var(--platform-success-color);
}

.delivery-step.is-completed .step-status {
  color: var(--platform-success-color);
}

.delivery-step.is-warning .step-node {
  border-color: var(--platform-warning-color);
  color: var(--platform-warning-color);
  background: #fff9ee;
}

.delivery-step.is-warning .step-status {
  color: var(--platform-warning-color);
}

.delivery-step.is-failed .step-node {
  border-color: var(--platform-danger-color);
  color: #fff;
  background: var(--platform-danger-color);
}

.delivery-step.is-failed .step-status {
  color: var(--platform-danger-color);
}

.is-rotating {
  animation: step-loading 1.4s linear infinite;
}

@keyframes step-loading {
  to {
    transform: rotate(360deg);
  }
}
</style>
