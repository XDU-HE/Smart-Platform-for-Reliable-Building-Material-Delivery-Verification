<script setup lang="ts">
import {
  Check,
  CircleCloseFilled,
  Clock,
  InfoFilled,
  WarningFilled,
} from '@element-plus/icons-vue'
import { computed, nextTick, ref, watch } from 'vue'
import type { Component } from 'vue'

import type {
  DeliveryTimelineEvent,
  TimelineEventLevel,
} from '@/types/delivery'

interface Props {
  events: DeliveryTimelineEvent[]
}

const props = defineProps<Props>()
const timelineList = ref<HTMLOListElement | null>(null)

const levelIcons: Record<TimelineEventLevel, Component> = {
  INFO: InfoFilled,
  SUCCESS: Check,
  WARNING: WarningFilled,
  DANGER: CircleCloseFilled,
  PENDING: Clock,
}

const latestOccurredEventId = computed(() => {
  const occurredEvents = props.events.filter((event) => event.occurred)
  return occurredEvents[occurredEvents.length - 1]?.id ?? null
})

watch(
  () => props.events.length,
  async () => {
    await nextTick()
    timelineList.value?.scrollTo({
      left: timelineList.value.scrollWidth,
      behavior: 'smooth',
    })
  },
)
</script>

<template>
  <section class="delivery-timeline" aria-labelledby="timeline-title">
    <header class="timeline-heading">
      <div>
        <span>PROCESS RECORD</span>
        <h2 id="timeline-title">全过程事件记录</h2>
      </div>
      <p>
        <i aria-hidden="true"></i>
        已记录 {{ events.filter((event) => event.occurred).length }} 项事件
      </p>
    </header>

    <ol ref="timelineList" class="timeline-list">
      <li
        v-for="event in events"
        :key="event.id"
        class="timeline-item"
        :class="[
          `level-${event.level.toLowerCase()}`,
          event.occurred ? 'is-occurred' : 'is-pending',
          { 'is-latest': event.id === latestOccurredEventId },
        ]"
      >
        <div class="timeline-track" aria-hidden="true"></div>
        <div class="timeline-node">
          <el-icon>
            <component :is="levelIcons[event.level]" />
          </el-icon>
        </div>

        <div class="timeline-content">
          <div class="event-meta">
            <time>{{ event.time }}</time>
            <span>
              {{ event.occurred ? '已发生事件' : '待处理阶段' }}
            </span>
          </div>
          <strong>{{ event.title }}</strong>
          <p v-if="event.description">{{ event.description }}</p>
        </div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.delivery-timeline {
  display: grid;
  min-height: 124px;
  grid-template-columns: 190px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  overflow: hidden;
  border: 1px solid var(--platform-border-color);
  background: var(--platform-panel-background);
  box-shadow: var(--platform-panel-shadow);
}

.timeline-heading {
  align-self: stretch;
  padding: 6px 18px 5px 0;
  border-right: 1px solid #e3e8ed;
}

.timeline-heading > div > span {
  color: var(--platform-placeholder-text-color);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.13em;
}

.timeline-heading h2 {
  margin: 5px 0 13px;
  color: var(--platform-title-color);
  font-size: 16px;
}

.timeline-heading p {
  margin: 0;
  color: var(--platform-placeholder-text-color);
  font-size: 10px;
  line-height: 1.5;
}

.timeline-heading p i {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 3px;
  border-radius: 50%;
  background: var(--platform-success-color);
}

.timeline-list {
  display: flex;
  min-width: 0;
  gap: 4px;
  margin: 0;
  padding: 4px 0;
  overflow-x: auto;
  overflow-y: hidden;
  list-style: none;
  scrollbar-color: #d1d9df transparent;
  scrollbar-width: thin;
}

.timeline-item {
  position: relative;
  display: grid;
  min-width: 164px;
  max-width: 230px;
  flex: 1 0 164px;
  grid-template-columns: 30px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  border: 1px solid transparent;
  border-radius: 4px;
}

.timeline-track {
  position: absolute;
  top: 20px;
  right: calc(100% - 8px);
  left: -12px;
  height: 1px;
  background: #d7dee5;
}

.timeline-item:first-child .timeline-track {
  display: none;
}

.timeline-node {
  position: relative;
  z-index: 1;
  display: grid;
  width: 29px;
  height: 29px;
  place-items: center;
  border: 1px solid #cbd3dc;
  border-radius: 50%;
  color: var(--platform-placeholder-text-color);
  background: #f6f8fa;
  font-size: 13px;
}

.is-occurred.level-info .timeline-node {
  border-color: var(--platform-primary-color);
  color: #fff;
  background: var(--platform-primary-color);
}

.is-occurred.level-success .timeline-node {
  border-color: var(--platform-success-color);
  color: #fff;
  background: var(--platform-success-color);
}

.is-occurred.level-warning .timeline-node {
  border-color: var(--platform-warning-color);
  color: #fff;
  background: var(--platform-warning-color);
}

.is-occurred.level-danger .timeline-node {
  border-color: var(--platform-danger-color);
  color: #fff;
  background: var(--platform-danger-color);
}

.timeline-item.is-latest {
  border-color: #bdd5e3;
  background: #f4f8fa;
  box-shadow: inset 3px 0 0 var(--platform-primary-color);
}

.timeline-item.is-latest.level-success {
  border-color: #c9e1d2;
  background: #f3f9f5;
  box-shadow: inset 3px 0 0 var(--platform-success-color);
}

.timeline-content {
  min-width: 0;
}

.event-meta {
  display: flex;
  align-items: center;
  gap: 5px;
}

.event-meta time {
  color: var(--platform-title-color);
  font-size: 11px;
  font-weight: 700;
}

.event-meta span {
  padding: 1px 4px;
  border-radius: 2px;
  color: var(--platform-placeholder-text-color);
  background: #eef1f3;
  font-size: 7px;
  white-space: nowrap;
}

.is-occurred .event-meta span {
  color: var(--platform-primary-color);
  background: #e9f2f7;
}

.level-success .event-meta span {
  color: var(--platform-success-color);
  background: #edf7f1;
}

.timeline-content strong {
  display: block;
  overflow: hidden;
  margin-top: 4px;
  color: var(--platform-regular-text-color);
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timeline-content p {
  display: -webkit-box;
  margin: 3px 0 0;
  overflow: hidden;
  color: var(--platform-placeholder-text-color);
  font-size: 8px;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.is-pending .timeline-content strong,
.is-pending .timeline-content p {
  color: var(--platform-placeholder-text-color);
}
</style>
