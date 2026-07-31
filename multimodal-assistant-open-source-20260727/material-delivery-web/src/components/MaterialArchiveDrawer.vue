<script setup lang="ts">
import {
  CircleCheckFilled,
  Close,
  Collection,
  DataAnalysis,
  Document,
  Files,
  Goods,
  Location,
  Picture,
  Tickets,
  UserFilled,
  Van,
  WarningFilled,
} from '@element-plus/icons-vue'

import MaterialCompareTable from '@/components/MaterialCompareTable.vue'
import { timelineLevelLabels } from '@/types/archive'
import type {
  ArchiveStatusTone,
  MaterialArchiveSnapshot,
} from '@/types/archive'
import type { TimelineEventLevel } from '@/types/delivery'

interface Props {
  visible: boolean
  archive: MaterialArchiveSnapshot
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  'locate-trajectory': []
  'locate-anomalies': []
  'locate-anomaly': [pointId: string]
}>()

const toneClass = (tone: ArchiveStatusTone) =>
  `tone-${tone.toLowerCase()}`

const timelineTone: Record<TimelineEventLevel, ArchiveStatusTone> = {
  INFO: 'PRIMARY',
  SUCCESS: 'SUCCESS',
  WARNING: 'WARNING',
  DANGER: 'DANGER',
  PENDING: 'MUTED',
}

const mimeTypeLabel = (mimeType: string) => {
  const labels: Record<string, string> = {
    'application/pdf': 'PDF 文档',
    'image/jpeg': 'JPEG 图片',
    'image/png': 'PNG 图片',
    'image/webp': 'WEBP 图片',
  }

  return labels[mimeType] ?? mimeType
}

const handleVisibleChange = (visible: boolean) => {
  emit('update:visible', visible)
}

const handleEvidenceLocate = (evidenceId: string) => {
  if (evidenceId === 'transport-trajectory') {
    emit('locate-trajectory')
    return
  }

  if (evidenceId === 'transport-anomalies') {
    emit('locate-anomalies')
  }
}
</script>

<template>
  <el-drawer
    class="material-archive-drawer"
    :model-value="props.visible"
    direction="rtl"
    size="min(760px, 92vw)"
    :with-header="false"
    append-to-body
    @update:model-value="handleVisibleChange"
  >
    <div class="archive-shell">
      <header class="archive-header">
        <div class="archive-heading-icon" aria-hidden="true">
          <el-icon><Collection /></el-icon>
        </div>
        <div class="archive-heading">
          <span>MATERIAL DIGITAL ARCHIVE</span>
          <h2>材料数字档案与全链追溯</h2>
          <p>
            {{ archive.overview.archiveId }} ·
            {{ archive.overview.materialName }}
          </p>
        </div>
        <span
          class="status-chip archive-header-status"
          :class="toneClass(archive.overview.verificationTone)"
        >
          {{ archive.overview.verificationStatus }}
        </span>
        <el-button
          class="archive-close"
          circle
          plain
          :icon="Close"
          aria-label="关闭材料数字档案"
          @click="emit('update:visible', false)"
        />
      </header>

      <div class="archive-scroll">
        <section class="archive-section archive-overview">
          <header class="section-heading">
            <div class="section-icon">
              <el-icon><Goods /></el-icon>
            </div>
            <div>
              <h3>档案概览</h3>
              <p>当前批次身份、阶段与核验状态</p>
            </div>
            <span class="scenario-badge">
              {{ archive.overview.scenarioLabel }}
            </span>
          </header>

          <dl class="overview-grid">
            <div>
              <dt>材料档案编号</dt>
              <dd class="primary-value">
                {{ archive.overview.archiveId }}
              </dd>
            </div>
            <div>
              <dt>采购订单编号</dt>
              <dd>{{ archive.overview.purchaseOrderId }}</dd>
            </div>
            <div>
              <dt>材料名称</dt>
              <dd>{{ archive.overview.materialName }}</dd>
            </div>
            <div>
              <dt>牌号</dt>
              <dd>{{ archive.overview.grade }}</dd>
            </div>
            <div>
              <dt>规格</dt>
              <dd>{{ archive.overview.specification }}</dd>
            </div>
            <div>
              <dt>生产厂家</dt>
              <dd>{{ archive.overview.manufacturer }}</dd>
            </div>
            <div>
              <dt>批次号</dt>
              <dd class="code-value">{{ archive.overview.batchNo }}</dd>
            </div>
            <div>
              <dt>炉号</dt>
              <dd class="code-value">{{ archive.overview.furnaceNo }}</dd>
            </div>
            <div>
              <dt>生产日期</dt>
              <dd>{{ archive.overview.productionDate }}</dd>
            </div>
            <div>
              <dt>当前交付阶段</dt>
              <dd>{{ archive.overview.currentStage }}</dd>
            </div>
            <div>
              <dt>当前核验状态</dt>
              <dd
                class="status-value"
                :class="toneClass(archive.overview.verificationTone)"
              >
                {{ archive.overview.verificationStatus }}
              </dd>
            </div>
            <div>
              <dt>档案创建时间</dt>
              <dd>{{ archive.overview.createdAt }}</dd>
            </div>
          </dl>
        </section>

        <section class="archive-section">
          <header class="section-heading">
            <div class="section-icon">
              <el-icon><Tickets /></el-icon>
            </div>
            <div>
              <h3>采购订单</h3>
              <p>材料需求与交付对象</p>
            </div>
            <span class="status-chip tone-success">已载入</span>
          </header>

          <dl class="detail-grid order-grid">
            <div>
              <dt>订单编号</dt>
              <dd class="primary-value">
                {{ archive.purchaseOrder.purchaseOrderId }}
              </dd>
            </div>
            <div>
              <dt>供应商</dt>
              <dd>{{ archive.purchaseOrder.supplier }}</dd>
            </div>
            <div>
              <dt>材料名称</dt>
              <dd>{{ archive.purchaseOrder.materialName }}</dd>
            </div>
            <div>
              <dt>牌号</dt>
              <dd>{{ archive.purchaseOrder.grade }}</dd>
            </div>
            <div>
              <dt>规格</dt>
              <dd>{{ archive.purchaseOrder.specification }}</dd>
            </div>
            <div>
              <dt>采购数量</dt>
              <dd>{{ archive.purchaseOrder.quantity }}</dd>
            </div>
            <div class="wide-detail">
              <dt>项目名称 / 交付对象</dt>
              <dd>{{ archive.purchaseOrder.deliveryProject }}</dd>
            </div>
          </dl>
        </section>

        <section class="archive-section">
          <header class="section-heading">
            <div class="section-icon">
              <el-icon><Files /></el-icon>
            </div>
            <div>
              <h3>出厂建档</h3>
              <p>原始凭证、识别结果与订单字段比对</p>
            </div>
            <span
              class="status-chip"
              :class="toneClass(archive.factory.archiveStatusTone)"
            >
              {{ archive.factory.archiveStatusLabel }}
            </span>
          </header>

          <div class="file-grid">
            <article class="archive-file">
              <div class="file-preview">
                <img
                  v-if="archive.factory.certificateFile?.previewUrl"
                  :src="archive.factory.certificateFile.previewUrl"
                  alt="质量证明书缩略图"
                />
                <el-icon v-else><Document /></el-icon>
              </div>
              <div class="file-copy">
                <span>出厂质量证明书</span>
                <strong
                  :title="
                    archive.factory.certificateFile?.fileName ??
                    '尚未选择文件'
                  "
                >
                  {{
                    archive.factory.certificateFile?.fileName ??
                    '尚未选择文件'
                  }}
                </strong>
                <small>
                  {{
                    archive.factory.certificateFile
                      ? mimeTypeLabel(
                          archive.factory.certificateFile.mimeType,
                        )
                      : '待补充真实本地文件'
                  }}
                </small>
              </div>
              <span
                class="file-state"
                :class="
                  archive.factory.certificateFile
                    ? 'tone-success'
                    : 'tone-muted'
                "
              >
                {{
                  archive.factory.certificateFile
                    ? '已获取'
                    : '未获取'
                }}
              </span>
            </article>

            <article class="archive-file">
              <div class="file-preview">
                <img
                  v-if="archive.factory.nameplateFile?.previewUrl"
                  :src="archive.factory.nameplateFile.previewUrl"
                  alt="出厂铭牌缩略图"
                />
                <el-icon v-else><Picture /></el-icon>
              </div>
              <div class="file-copy">
                <span>出厂铭牌照片</span>
                <strong
                  :title="
                    archive.factory.nameplateFile?.fileName ??
                    '尚未选择文件'
                  "
                >
                  {{
                    archive.factory.nameplateFile?.fileName ??
                    '尚未选择文件'
                  }}
                </strong>
                <small>
                  {{
                    archive.factory.nameplateFile
                      ? mimeTypeLabel(
                          archive.factory.nameplateFile.mimeType,
                        )
                      : '待补充真实本地文件'
                  }}
                </small>
              </div>
              <span
                class="file-state"
                :class="
                  archive.factory.nameplateFile
                    ? 'tone-success'
                    : 'tone-muted'
                "
              >
                {{
                  archive.factory.nameplateFile ? '已获取' : '未获取'
                }}
              </span>
            </article>
          </div>

          <div class="subsection-heading">
            <h4>出厂识别结果</h4>
            <span
              class="status-chip"
              :class="toneClass(archive.factory.recognitionTone)"
            >
              {{ archive.factory.recognitionStatusLabel }}
            </span>
          </div>

          <div
            v-if="archive.factory.recognitionMeta"
            class="recognition-provenance"
          >
            <span
              :class="{
                real:
                  archive.factory.recognitionMeta.source === 'REAL',
              }"
            >
              {{
                archive.factory.recognitionMeta.source === 'REAL'
                  ? '真实模型'
                  : 'Mock 数据'
              }}
            </span>
            <b :title="archive.factory.recognitionMeta.model">
              {{ archive.factory.recognitionMeta.model }}
            </b>
            <em>
              置信度
              {{
                Math.round(
                  archive.factory.recognitionMeta.confidence * 100,
                )
              }}%
              · {{ archive.factory.recognitionMeta.durationMs }} ms
            </em>
          </div>

          <dl
            v-if="archive.factory.recognitionResult"
            class="detail-grid recognition-grid"
          >
            <div>
              <dt>生产厂家</dt>
              <dd>
                {{ archive.factory.recognitionResult.manufacturer }}
              </dd>
            </div>
            <div>
              <dt>材料名称</dt>
              <dd>
                {{ archive.factory.recognitionResult.materialName }}
              </dd>
            </div>
            <div>
              <dt>牌号</dt>
              <dd>{{ archive.factory.recognitionResult.grade }}</dd>
            </div>
            <div>
              <dt>规格</dt>
              <dd>
                {{ archive.factory.recognitionResult.specification }}
              </dd>
            </div>
            <div>
              <dt>批次号</dt>
              <dd class="code-value">
                {{ archive.factory.recognitionResult.batchNo }}
              </dd>
            </div>
            <div>
              <dt>炉号</dt>
              <dd class="code-value">
                {{ archive.factory.recognitionResult.furnaceNo || '—' }}
              </dd>
            </div>
            <div>
              <dt>生产日期</dt>
              <dd>
                {{
                  archive.factory.recognitionResult.productionDate ||
                  '—'
                }}
              </dd>
            </div>
          </dl>
          <div v-else class="compact-empty">
            尚未生成出厂识别结果，档案将在识别任务完成后实时更新。
          </div>

          <div class="subsection-heading compare-subheading">
            <h4>采购订单字段比对</h4>
            <span
              class="status-chip"
              :class="
                archive.factory.mismatchCount > 0
                  ? 'tone-danger'
                  : archive.factory.compareRows.length > 0
                    ? 'tone-success'
                    : 'tone-muted'
              "
            >
              {{
                archive.factory.compareRows.length > 0
                  ? `${archive.factory.matchCount} 项一致 / ${archive.factory.mismatchCount} 项差异`
                  : '待比对'
              }}
            </span>
          </div>

          <div
            v-if="archive.factory.compareRows.length > 0"
            class="archive-table"
          >
            <div class="table-row table-header order-compare-row">
              <span>字段</span>
              <span>采购订单</span>
              <span>识别结果</span>
              <span>结论</span>
            </div>
            <div
              v-for="row in archive.factory.compareRows"
              :key="row.fieldKey"
              class="table-row order-compare-row"
              :class="{ mismatch: row.result === 'MISMATCH' }"
            >
              <strong>{{ row.fieldLabel }}</strong>
              <span :title="row.orderValue">{{ row.orderValue }}</span>
              <span :title="row.recognitionValue">
                {{ row.recognitionValue }}
              </span>
              <em
                :class="
                  row.result === 'MATCH'
                    ? 'tone-success'
                    : 'tone-danger'
                "
              >
                {{ row.result === 'MATCH' ? '一致' : '不一致' }}
              </em>
            </div>
          </div>
        </section>

        <section class="archive-section">
          <header class="section-heading">
            <div class="section-icon">
              <el-icon><Van /></el-icon>
            </div>
            <div>
              <h3>运输追溯</h3>
              <p>任务、进度、轨迹点与异常事实</p>
            </div>
            <span
              class="status-chip"
              :class="toneClass(archive.transport.statusTone)"
            >
              {{ archive.transport.statusLabel }}
            </span>
          </header>

          <dl class="detail-grid transport-task-grid">
            <div>
              <dt>运输任务编号</dt>
              <dd class="primary-value">
                {{ archive.transport.task.taskId }}
              </dd>
            </div>
            <div>
              <dt>运输车辆</dt>
              <dd>{{ archive.transport.task.vehicleNo }}</dd>
            </div>
            <div>
              <dt>出发地</dt>
              <dd>{{ archive.transport.task.origin }}</dd>
            </div>
            <div>
              <dt>交付目的地</dt>
              <dd>{{ archive.transport.task.destination }}</dd>
            </div>
            <div>
              <dt>运输开始时间</dt>
              <dd>{{ archive.transport.startedAt }}</dd>
            </div>
            <div>
              <dt>计划到场时间</dt>
              <dd>{{ archive.transport.plannedArrivalAt }}</dd>
            </div>
            <div>
              <dt>实际到场时间</dt>
              <dd>{{ archive.transport.actualArrivalAt }}</dd>
            </div>
            <div>
              <dt>轨迹点 / 异常数</dt>
              <dd>
                {{ archive.transport.trajectoryPointCount }} 点 /
                {{ archive.transport.anomalyCount }} 项
              </dd>
            </div>
          </dl>

          <div class="transport-progress">
            <div>
              <span>运输进度</span>
              <strong>{{ archive.transport.progress }}%</strong>
            </div>
            <el-progress
              :percentage="archive.transport.progress"
              :show-text="false"
              :stroke-width="7"
              :status="
                archive.transport.anomalyCount > 0
                  ? 'warning'
                  : undefined
              "
            />
          </div>

          <div class="subsection-heading">
            <h4>运输异常列表</h4>
            <span
              class="status-chip"
              :class="
                archive.transport.anomalyCount > 0
                  ? 'tone-warning'
                  : archive.transport.status === 'ARRIVED'
                    ? 'tone-success'
                    : 'tone-muted'
              "
            >
              {{
                archive.transport.anomalyCount > 0
                  ? `${archive.transport.anomalyCount} 项异常`
                  : archive.transport.status === 'ARRIVED'
                    ? '未发现异常'
                    : '监测结果待生成'
              }}
            </span>
          </div>

          <ul
            v-if="archive.transport.anomalies.length > 0"
            class="anomaly-list"
          >
            <li
              v-for="anomaly in archive.transport.anomalies"
              :key="anomaly.id"
              :class="toneClass(timelineTone[anomaly.level])"
            >
              <div class="anomaly-icon">
                <el-icon><WarningFilled /></el-icon>
              </div>
              <div>
                <strong>{{ anomaly.title }}</strong>
                <p>{{ anomaly.description }}</p>
              </div>
              <div class="anomaly-meta">
                <time>{{ anomaly.time }}</time>
                <span>{{ timelineLevelLabels[anomaly.level] }}</span>
                <el-button
                  class="anomaly-locate"
                  link
                  type="primary"
                  @click="emit('locate-anomaly', anomaly.pointId)"
                >
                  地图定位
                </el-button>
              </div>
            </li>
          </ul>
          <div v-else class="compact-empty">
            {{
              archive.transport.status === 'ARRIVED'
                ? '运输任务已结束，当前案例未发现运输异常。'
                : '运输开始后，路线偏离、异常停留、GPS 中断和运输超时将实时进入此处。'
            }}
          </div>
        </section>

        <section class="archive-section">
          <header class="section-heading">
            <div class="section-icon">
              <el-icon><DataAnalysis /></el-icon>
            </div>
            <div>
              <h3>到场核验</h3>
              <p>现场铭牌、身份字段与首尾一致性</p>
            </div>
            <span
              class="status-chip"
              :class="
                toneClass(archive.arrival.verificationStatusTone)
              "
            >
              {{ archive.arrival.verificationStatusLabel }}
            </span>
          </header>

          <article class="archive-file arrival-file">
            <div class="file-preview">
              <img
                v-if="archive.arrival.nameplateFile?.previewUrl"
                :src="archive.arrival.nameplateFile.previewUrl"
                alt="到场铭牌缩略图"
              />
              <el-icon v-else><Picture /></el-icon>
            </div>
            <div class="file-copy">
              <span>到场铭牌文件</span>
              <strong
                :title="
                  archive.arrival.nameplateFile?.fileName ??
                  '尚未选择文件'
                "
              >
                {{
                  archive.arrival.nameplateFile?.fileName ??
                  '尚未选择文件'
                }}
              </strong>
              <small>
                {{
                  archive.arrival.nameplateFile
                    ? mimeTypeLabel(
                        archive.arrival.nameplateFile.mimeType,
                      )
                    : '待车辆到场后补充'
                }}
              </small>
            </div>
            <span
              class="file-state"
              :class="
                archive.arrival.nameplateFile
                  ? 'tone-success'
                  : 'tone-muted'
              "
            >
              {{
                archive.arrival.nameplateFile ? '已获取' : '未获取'
              }}
            </span>
          </article>

          <div class="subsection-heading">
            <h4>到场识别结果</h4>
            <span
              class="status-chip"
              :class="toneClass(archive.arrival.recognitionTone)"
            >
              {{ archive.arrival.recognitionStatusLabel }}
            </span>
          </div>

          <div
            v-if="archive.arrival.recognitionMeta"
            class="recognition-provenance"
          >
            <span
              :class="{
                real:
                  archive.arrival.recognitionMeta.source === 'REAL',
              }"
            >
              {{
                archive.arrival.recognitionMeta.source === 'REAL'
                  ? '真实模型'
                  : 'Mock 数据'
              }}
            </span>
            <b :title="archive.arrival.recognitionMeta.model">
              {{ archive.arrival.recognitionMeta.model }}
            </b>
            <em>
              置信度
              {{
                Math.round(
                  archive.arrival.recognitionMeta.confidence * 100,
                )
              }}%
              · {{ archive.arrival.recognitionMeta.durationMs }} ms
            </em>
          </div>

          <dl
            v-if="archive.arrival.recognitionResult"
            class="detail-grid recognition-grid arrival-recognition-grid"
          >
            <div>
              <dt>生产厂家</dt>
              <dd>
                {{ archive.arrival.recognitionResult.manufacturer }}
              </dd>
            </div>
            <div>
              <dt>材料名称</dt>
              <dd>
                {{ archive.arrival.recognitionResult.materialName }}
              </dd>
            </div>
            <div>
              <dt>牌号</dt>
              <dd>{{ archive.arrival.recognitionResult.grade }}</dd>
            </div>
            <div>
              <dt>规格</dt>
              <dd>
                {{ archive.arrival.recognitionResult.specification }}
              </dd>
            </div>
            <div>
              <dt>到场批次号</dt>
              <dd class="code-value">
                {{ archive.arrival.recognitionResult.batchNo }}
              </dd>
            </div>
            <div>
              <dt>一致 / 冲突</dt>
              <dd>
                {{ archive.arrival.matchCount }} 项 /
                <span
                  :class="
                    archive.arrival.mismatchCount > 0
                      ? 'tone-danger'
                      : 'tone-success'
                  "
                >
                  {{ archive.arrival.mismatchCount }} 项
                </span>
              </dd>
            </div>
          </dl>
          <div v-else class="compact-empty">
            尚未生成到场识别结果，完成现场铭牌识别后将显示身份字段。
          </div>

          <div
            v-if="archive.arrival.compareRows.length > 0"
            class="archive-material-compare"
          >
            <MaterialCompareTable :rows="archive.arrival.compareRows" />
          </div>
        </section>

        <section class="archive-section">
          <header class="section-heading">
            <div class="section-icon">
              <el-icon><Collection /></el-icon>
            </div>
            <div>
              <h3>全链证据</h3>
              <p>采购、出厂、运输、到场与人工处置证据索引</p>
            </div>
            <span class="evidence-count">
              {{
                archive.evidenceItems.filter((item) => item.isObtained)
                  .length
              }}
              / {{ archive.evidenceItems.length }} 已获取
            </span>
          </header>

          <div class="evidence-grid">
            <article
              v-for="item in archive.evidenceItems"
              :key="item.id"
              class="evidence-card"
              :class="{ 'is-missing': !item.isObtained }"
            >
              <div class="evidence-icon">
                <el-icon>
                  <Document
                    v-if="
                      item.sourceStage === '采购订单' ||
                      item.sourceStage === '出厂建档'
                    "
                  />
                  <Location
                    v-else-if="item.sourceStage === '运输追溯'"
                  />
                  <DataAnalysis
                    v-else-if="item.sourceStage === '到场核验'"
                  />
                  <UserFilled v-else />
                </el-icon>
              </div>
              <div class="evidence-copy">
                <div>
                  <strong>{{ item.name }}</strong>
                  <div class="evidence-actions">
                    <el-button
                      v-if="
                        item.isObtained &&
                        (item.id === 'transport-trajectory' ||
                          item.id === 'transport-anomalies')
                      "
                      class="evidence-locate"
                      link
                      type="primary"
                      @click="handleEvidenceLocate(item.id)"
                    >
                      地图查看
                    </el-button>
                    <span
                      class="status-chip"
                      :class="toneClass(item.statusTone)"
                    >
                      {{ item.status }}
                    </span>
                  </div>
                </div>
                <p>{{ item.type }}</p>
                <dl>
                  <div>
                    <dt>来源阶段</dt>
                    <dd>{{ item.sourceStage }}</dd>
                  </div>
                  <div>
                    <dt>生成 / 上传时间</dt>
                    <dd>{{ item.time }}</dd>
                  </div>
                  <div>
                    <dt>获取状态</dt>
                    <dd>
                      {{ item.isObtained ? '已获取' : '未获取' }}
                    </dd>
                  </div>
                  <div>
                    <dt>数据说明</dt>
                    <dd>{{ item.sourceNote }}</dd>
                  </div>
                </dl>
              </div>
            </article>
          </div>
        </section>

        <section class="archive-section timeline-section">
          <header class="section-heading">
            <div class="section-icon">
              <el-icon><CircleCheckFilled /></el-icon>
            </div>
            <div>
              <h3>全过程记录</h3>
              <p>复用当前交付流程事件，按纵向顺序归档</p>
            </div>
            <span class="evidence-count">
              {{
                archive.timelineItems.filter((item) => item.occurred)
                  .length
              }}
              项已发生
            </span>
          </header>

          <ol class="archive-timeline">
            <li
              v-for="item in archive.timelineItems"
              :key="item.id"
              :class="[
                toneClass(item.levelTone),
                { 'is-pending': !item.occurred },
              ]"
            >
              <div class="timeline-node" aria-hidden="true"></div>
              <div class="timeline-time">
                <time>{{ item.time }}</time>
                <span>{{ item.businessStage }}</span>
              </div>
              <div class="timeline-content">
                <div>
                  <strong>{{ item.title }}</strong>
                  <span
                    class="status-chip"
                    :class="toneClass(item.levelTone)"
                  >
                    {{ item.levelLabel }}
                  </span>
                </div>
                <p>{{ item.description || '未记录补充描述' }}</p>
              </div>
            </li>
          </ol>
        </section>

        <footer class="archive-boundary">
          <el-icon><WarningFilled /></el-icon>
          <p>
            当前档案为纯前端比赛演示数据。本地文件仅用于当前页面预览，不提供伪造下载地址；刷新页面后演示状态会重置。
          </p>
        </footer>
      </div>
    </div>
  </el-drawer>
</template>

<style scoped>
:global(.material-archive-drawer) {
  max-width: 92vw;
  background: var(--platform-panel-background);
  box-shadow: -8px 0 24px rgb(31 41 55 / 16%);
}

:global(.material-archive-drawer .el-drawer__body) {
  padding: 0;
  overflow: hidden;
}

.archive-shell {
  display: grid;
  height: 100%;
  grid-template-rows: auto minmax(0, 1fr);
  color: var(--platform-regular-text-color);
  background: var(--platform-panel-background);
}

.archive-header {
  display: grid;
  min-width: 0;
  grid-template-columns: 42px minmax(0, 1fr) auto 34px;
  align-items: center;
  gap: 11px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--platform-border-color);
  background: #f8fafb;
}

.archive-heading-icon,
.section-icon {
  display: grid;
  place-items: center;
  border-radius: 4px;
  color: #fff;
  background: var(--platform-primary-color);
}

.archive-heading-icon {
  width: 42px;
  height: 42px;
  font-size: 21px;
}

.archive-heading {
  min-width: 0;
}

.archive-heading > span {
  color: var(--platform-placeholder-text-color);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.archive-heading h2 {
  margin: 2px 0 0;
  color: var(--platform-title-color);
  font-size: 18px;
  line-height: 1.25;
}

.archive-heading p {
  overflow: hidden;
  margin: 3px 0 0;
  color: var(--platform-secondary-text-color);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.archive-header-status {
  max-width: 145px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.archive-close {
  --el-button-hover-text-color: var(--platform-primary-color);
  --el-button-hover-border-color: #9cbcd1;
  --el-button-hover-bg-color: #edf4f8;
  width: 32px;
  height: 32px;
}

.archive-scroll {
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-color: #bcc8d0 transparent;
  scrollbar-width: thin;
}

.archive-section {
  padding: 15px 18px 17px;
  border-bottom: 1px solid var(--platform-border-color);
}

.archive-overview {
  background: #fbfcfd;
}

.section-heading {
  display: grid;
  min-width: 0;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
  margin-bottom: 12px;
}

.section-icon {
  width: 34px;
  height: 34px;
  font-size: 16px;
}

.section-heading h3 {
  margin: 0;
  color: var(--platform-title-color);
  font-size: 14px;
}

.section-heading p {
  margin: 2px 0 0;
  color: var(--platform-placeholder-text-color);
  font-size: 9px;
  line-height: 1.4;
}

.status-chip,
.scenario-badge,
.evidence-count,
.file-state {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px 6px;
  border: 1px solid currentcolor;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 650;
  line-height: 1.2;
  white-space: nowrap;
}

.scenario-badge,
.evidence-count {
  border-color: #c9dce8;
  color: var(--platform-primary-color);
  background: #f0f6f9;
}

.overview-grid,
.detail-grid {
  display: grid;
  margin: 0;
}

.overview-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid #dfe5e9;
  border-left: 1px solid #dfe5e9;
}

.overview-grid > div {
  min-width: 0;
  padding: 8px 9px;
  border-right: 1px solid #dfe5e9;
  border-bottom: 1px solid #dfe5e9;
  background: #fff;
}

dt {
  margin-bottom: 3px;
  color: var(--platform-placeholder-text-color);
  font-size: 8px;
}

dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--platform-regular-text-color);
  font-size: 10px;
  font-weight: 600;
  line-height: 1.45;
}

.primary-value,
.code-value {
  color: var(--platform-primary-color);
  font-weight: 700;
}

.code-value {
  letter-spacing: 0.02em;
}

.status-value {
  display: inline-flex;
  font-weight: 700;
}

.detail-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  border: 1px solid #e0e5e9;
  border-bottom: 0;
  background: #fff;
}

.detail-grid > div {
  min-width: 0;
  padding: 8px 9px;
  border-right: 1px solid #e7ebee;
  border-bottom: 1px solid #e0e5e9;
}

.detail-grid > div:nth-child(3n) {
  border-right: 0;
}

.detail-grid .wide-detail {
  grid-column: span 3;
  border-right: 0;
}

.file-grid,
.evidence-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.archive-file {
  display: grid;
  min-width: 0;
  grid-template-columns: 74px minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
  min-height: 76px;
  overflow: hidden;
  border: 1px solid #dfe5e9;
  border-radius: 4px;
  background: #fafbfc;
}

.file-preview {
  display: grid;
  width: 74px;
  height: 74px;
  place-items: center;
  overflow: hidden;
  color: #7895a8;
  background: #eaf0f3;
  font-size: 28px;
}

.file-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-copy {
  min-width: 0;
}

.file-copy span,
.file-copy strong,
.file-copy small {
  display: block;
}

.file-copy span {
  color: var(--platform-placeholder-text-color);
  font-size: 8px;
}

.file-copy strong {
  overflow: hidden;
  margin-top: 4px;
  color: var(--platform-title-color);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-copy small {
  overflow: hidden;
  margin-top: 3px;
  color: var(--platform-secondary-text-color);
  font-size: 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-state {
  margin-right: 8px;
  border: 0;
}

.subsection-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 13px 0 7px;
  padding-top: 10px;
  border-top: 1px dashed #dfe5e9;
}

.subsection-heading h4 {
  margin: 0;
  color: var(--platform-title-color);
  font-size: 11px;
}

.recognition-provenance {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  margin: -1px 0 7px;
  color: var(--platform-secondary-text-color);
  font-size: 9px;
}

.recognition-provenance span {
  flex: 0 0 auto;
  padding: 2px 5px;
  border-radius: 3px;
  color: var(--platform-primary-color);
  background: #eef6fa;
  font-weight: 650;
}

.recognition-provenance span.real {
  color: var(--platform-success-color);
  background: #edf7f1;
}

.recognition-provenance b {
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
  color: var(--platform-regular-text-color);
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recognition-provenance em {
  flex: 0 0 auto;
  font-style: normal;
  white-space: nowrap;
}

.recognition-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.recognition-grid > div:nth-child(3n) {
  border-right: 1px solid #e7ebee;
}

.recognition-grid > div:nth-child(4n) {
  border-right: 0;
}

.compact-empty {
  padding: 10px 11px;
  border: 1px dashed #cfd7dd;
  border-radius: 3px;
  color: var(--platform-placeholder-text-color);
  background: #fafbfc;
  font-size: 9px;
  line-height: 1.5;
}

.archive-table {
  overflow: hidden;
  border: 1px solid #dfe5e9;
  border-radius: 3px;
}

.table-row {
  display: grid;
  min-width: 0;
  align-items: center;
  border-top: 1px solid #edf0f2;
}

.table-row:first-child {
  border-top: 0;
}

.order-compare-row {
  grid-template-columns: 0.7fr 1fr 1fr 60px;
}

.table-row > * {
  min-width: 0;
  padding: 6px 8px;
  overflow: hidden;
  color: var(--platform-regular-text-color);
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-row em {
  font-style: normal;
  font-weight: 700;
}

.table-header {
  color: var(--platform-secondary-text-color);
  background: #f3f6f8;
  font-weight: 650;
}

.table-row.mismatch {
  background: #fff5f4;
}

.transport-task-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.transport-task-grid > div:nth-child(3n) {
  border-right: 1px solid #e7ebee;
}

.transport-task-grid > div:nth-child(4n) {
  border-right: 0;
}

.transport-progress {
  margin-top: 10px;
  padding: 8px 10px;
  border: 1px solid #dfe5e9;
  border-radius: 3px;
  background: #f8fafb;
}

.transport-progress > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  color: var(--platform-secondary-text-color);
  font-size: 9px;
}

.transport-progress strong {
  color: var(--platform-primary-color);
  font-size: 10px;
}

.anomaly-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.anomaly-list li {
  display: grid;
  min-width: 0;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
  margin-top: 6px;
  padding: 8px 9px;
  border: 1px solid #ead7c3;
  border-left: 3px solid var(--platform-warning-color);
  border-radius: 3px;
  background: #fff9f1;
}

.anomaly-list li.tone-danger {
  border-color: #ecc6c3;
  border-left-color: var(--platform-danger-color);
  background: #fff4f3;
}

.anomaly-icon {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  background: var(--platform-warning-color);
}

.anomaly-list li.tone-danger .anomaly-icon {
  background: var(--platform-danger-color);
}

.anomaly-list strong {
  color: var(--platform-title-color);
  font-size: 10px;
}

.anomaly-list p {
  margin: 3px 0 0;
  color: var(--platform-secondary-text-color);
  font-size: 9px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.anomaly-meta {
  text-align: right;
}

.anomaly-meta time,
.anomaly-meta span {
  display: block;
  white-space: nowrap;
}

.anomaly-meta time {
  color: var(--platform-title-color);
  font-size: 10px;
  font-weight: 700;
}

.anomaly-meta span {
  margin-top: 4px;
  color: var(--platform-warning-color);
  font-size: 8px;
}

.anomaly-locate {
  --el-button-text-color: var(--platform-primary-color);
  --el-button-hover-text-color: #174d72;
  height: auto;
  margin-top: 4px;
  padding: 0;
  font-size: 8px;
}

.arrival-file {
  max-width: 100%;
}

.arrival-recognition-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.arrival-recognition-grid > div:nth-child(3n) {
  border-right: 0;
}

.archive-material-compare {
  margin-top: 11px;
}

.archive-material-compare :deep(.material-compare) {
  margin-top: 0;
}

.archive-material-compare :deep(.compare-title h3) {
  font-size: 11px;
}

.archive-material-compare :deep(.compare-row) {
  grid-template-columns: 0.75fr 1fr 1fr 54px;
  font-size: 9px;
}

.archive-material-compare :deep(.compare-row > *) {
  padding: 6px 8px;
}

.evidence-card {
  display: grid;
  min-width: 0;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 9px;
  padding: 10px;
  border: 1px solid #dfe5e9;
  border-left: 3px solid var(--platform-primary-color);
  border-radius: 3px;
  background: #fbfcfd;
}

.evidence-card.is-missing {
  border-left-color: #b9c1c8;
  background: #f7f8f9;
}

.evidence-icon {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 4px;
  color: #fff;
  background: var(--platform-primary-color);
  font-size: 16px;
}

.is-missing .evidence-icon {
  color: #7f8b94;
  background: #dce2e6;
}

.evidence-copy {
  min-width: 0;
}

.evidence-copy > div {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 7px;
}

.evidence-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
}

.evidence-locate {
  --el-button-text-color: var(--platform-primary-color);
  --el-button-hover-text-color: #174d72;
  height: auto;
  padding: 0;
  font-size: 8px;
}

.evidence-copy strong {
  min-width: 0;
  overflow: hidden;
  color: var(--platform-title-color);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.evidence-copy p {
  margin: 3px 0 7px;
  color: var(--platform-secondary-text-color);
  font-size: 8px;
}

.evidence-copy dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px 9px;
  margin: 0;
}

.evidence-copy dl > div {
  min-width: 0;
}

.evidence-copy dt {
  margin-bottom: 1px;
  font-size: 7px;
}

.evidence-copy dd {
  overflow: hidden;
  font-size: 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timeline-section {
  padding-bottom: 12px;
}

.archive-timeline {
  margin: 0;
  padding: 0;
  list-style: none;
}

.archive-timeline li {
  position: relative;
  display: grid;
  min-width: 0;
  grid-template-columns: 14px 92px minmax(0, 1fr);
  gap: 9px;
  padding: 0 0 13px;
}

.archive-timeline li::before {
  position: absolute;
  top: 12px;
  bottom: -1px;
  left: 5px;
  width: 1px;
  content: '';
  background: #d8dfe4;
}

.archive-timeline li:last-child {
  padding-bottom: 0;
}

.archive-timeline li:last-child::before {
  display: none;
}

.timeline-node {
  position: relative;
  z-index: 1;
  width: 11px;
  height: 11px;
  margin-top: 3px;
  border: 2px solid #fff;
  border-radius: 50%;
  background: var(--platform-primary-color);
  box-shadow: 0 0 0 2px var(--platform-primary-color);
}

.archive-timeline .tone-success .timeline-node {
  background: var(--platform-success-color);
  box-shadow: 0 0 0 2px var(--platform-success-color);
}

.archive-timeline .tone-warning .timeline-node {
  background: var(--platform-warning-color);
  box-shadow: 0 0 0 2px var(--platform-warning-color);
}

.archive-timeline .tone-danger .timeline-node {
  background: var(--platform-danger-color);
  box-shadow: 0 0 0 2px var(--platform-danger-color);
}

.archive-timeline .tone-muted .timeline-node {
  background: #aeb7bf;
  box-shadow: 0 0 0 2px #aeb7bf;
}

.archive-timeline .is-pending {
  opacity: 0.72;
}

.timeline-time time,
.timeline-time span {
  display: block;
}

.timeline-time time {
  color: var(--platform-title-color);
  font-size: 10px;
  font-weight: 700;
}

.timeline-time span {
  margin-top: 3px;
  color: var(--platform-placeholder-text-color);
  font-size: 8px;
}

.timeline-content {
  min-width: 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #edf0f2;
}

.archive-timeline li:last-child .timeline-content {
  padding-bottom: 0;
  border-bottom: 0;
}

.timeline-content > div {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
}

.timeline-content strong {
  min-width: 0;
  color: var(--platform-title-color);
  font-size: 10px;
  overflow-wrap: anywhere;
}

.timeline-content p {
  margin: 4px 0 0;
  color: var(--platform-secondary-text-color);
  font-size: 9px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.archive-boundary {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin: 12px 18px 16px;
  padding: 9px 10px;
  border: 1px solid #dfe5e9;
  border-radius: 3px;
  color: var(--platform-placeholder-text-color);
  background: #f8fafb;
}

.archive-boundary .el-icon {
  flex: 0 0 auto;
  margin-top: 1px;
  color: var(--platform-warning-color);
}

.archive-boundary p {
  margin: 0;
  font-size: 8px;
  line-height: 1.5;
}

.tone-primary {
  color: var(--platform-primary-color);
}

.status-chip.tone-primary,
.file-state.tone-primary {
  border-color: #c9dce8;
  background: #eef6fa;
}

.tone-success {
  color: var(--platform-success-color);
}

.status-chip.tone-success,
.file-state.tone-success {
  border-color: #cde3d5;
  background: #eff8f2;
}

.tone-warning {
  color: var(--platform-warning-color);
}

.status-chip.tone-warning,
.file-state.tone-warning {
  border-color: #ead4b1;
  background: #fff8ed;
}

.tone-danger {
  color: var(--platform-danger-color);
}

.status-chip.tone-danger,
.file-state.tone-danger {
  border-color: #ebc4c1;
  background: #fff2f1;
}

.tone-muted {
  color: var(--platform-secondary-text-color);
}

.status-chip.tone-muted,
.file-state.tone-muted {
  border-color: #d8dee3;
  background: #f3f5f6;
}

@media (max-width: 760px) {
  .overview-grid,
  .detail-grid,
  .recognition-grid,
  .transport-task-grid,
  .arrival-recognition-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detail-grid > div:nth-child(3n),
  .recognition-grid > div:nth-child(3n),
  .recognition-grid > div:nth-child(4n),
  .transport-task-grid > div:nth-child(3n),
  .transport-task-grid > div:nth-child(4n) {
    border-right: 1px solid #e7ebee;
  }

  .detail-grid > div:nth-child(2n),
  .recognition-grid > div:nth-child(2n),
  .transport-task-grid > div:nth-child(2n) {
    border-right: 0;
  }

  .detail-grid .wide-detail {
    grid-column: span 2;
  }

  .file-grid,
  .evidence-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
