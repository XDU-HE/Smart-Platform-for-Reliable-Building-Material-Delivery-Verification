<script setup lang="ts">
import {
  Check,
  CircleClose,
  Cpu,
  Delete,
  Document,
  InfoFilled,
  Picture,
  RefreshRight,
  UploadFilled,
} from '@element-plus/icons-vue'
import type { UploadFile } from 'element-plus'
import { computed } from 'vue'

import type { RecognitionStatus } from '@/types/delivery'
import type {
  LocalUploadFile,
  MaterialRecognition,
  OrderCompareRow,
  PurchaseOrder,
} from '@/types/material'
import type {
  RecognitionMeta,
  RecognitionMode,
} from '@/types/recognition'

interface Props {
  certificateFile: LocalUploadFile | null
  nameplateFile: LocalUploadFile | null
  recognitionStatus: RecognitionStatus
  recognitionStepText: string
  recognitionProgress: number
  recognitionResult: MaterialRecognition | null
  recognitionMeta: RecognitionMeta | null
  recognitionError: string | null
  recognitionMode: RecognitionMode
  orderCompareRows: OrderCompareRow[]
  purchaseOrder: PurchaseOrder
  canStartRecognition: boolean
  canConfirmArchive: boolean
  isArchiveConfirmed: boolean
  isBusy: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'select-certificate': [file: File]
  'select-nameplate': [file: File]
  'remove-certificate': []
  'remove-nameplate': []
  'start-recognition': []
  'confirm-archive': []
}>()

const allRowsMatch = computed(
  () =>
    props.orderCompareRows.length > 0 &&
    props.orderCompareRows.every((row) => row.result === 'MATCH'),
)

const isRecognizing = computed(
  () => props.recognitionStatus === 'RECOGNIZING',
)

const recognitionHint = computed(() => {
  if (props.isBusy) {
    return props.recognitionStepText
  }

  if (props.recognitionStatus === 'SUCCEEDED') {
    return '识别完成，请检查结果并确认建档'
  }

  if (props.recognitionStatus === 'FAILED') {
    return props.recognitionError ?? '识别失败，可保留原文件重新尝试'
  }

  if (!props.certificateFile || !props.nameplateFile) {
    return '请先选择质量证明书和材料铭牌'
  }

  return '材料凭证已就绪，可以开始识别'
})

const handleCertificateChange = (uploadFile: UploadFile) => {
  if (uploadFile.raw) {
    emit('select-certificate', uploadFile.raw)
  }
}

const handleNameplateChange = (uploadFile: UploadFile) => {
  if (uploadFile.raw) {
    emit('select-nameplate', uploadFile.raw)
  }
}
</script>

<template>
  <aside class="archive-panel" aria-labelledby="archive-panel-title">
    <header class="panel-header">
      <div class="stage-number">01</div>
      <div>
        <div class="eyebrow">FACTORY ARCHIVE</div>
        <h2 id="archive-panel-title">出厂材料建档</h2>
      </div>
      <span class="stage-badge">当前阶段</span>
    </header>

    <p class="panel-description">
      采集质量证明书与材料铭牌，完成字段识别和订单一致性核验。
    </p>

    <div class="upload-grid">
      <section class="upload-item">
        <div class="upload-label">
          <el-icon><Document /></el-icon>
          <span>出厂质量证明书</span>
          <em>必填</em>
        </div>

        <el-upload
          v-if="!certificateFile"
          class="document-uploader"
          drag
          :auto-upload="false"
          :show-file-list="false"
          :disabled="isBusy"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          :on-change="handleCertificateChange"
        >
          <el-icon class="upload-icon"><UploadFilled /></el-icon>
          <div class="upload-primary">拖拽或点击选择文件</div>
          <div class="upload-hint">PDF / JPG / PNG / WEBP，≤ 10 MB</div>
        </el-upload>

        <div v-else class="selected-file">
          <div class="file-preview">
            <img
              v-if="certificateFile.previewUrl"
              :src="certificateFile.previewUrl"
              alt="质量证明书预览"
            />
            <div v-else class="document-preview">
              <el-icon><Document /></el-icon>
              <span>PDF</span>
            </div>
          </div>
          <div class="file-details">
            <span class="file-ready">
              <el-icon><Check /></el-icon>
              已选择
            </span>
            <strong :title="certificateFile.fileName">
              {{ certificateFile.fileName }}
            </strong>
            <div class="file-actions">
              <el-upload
                :key="`${certificateFile.file.lastModified}-certificate`"
                :auto-upload="false"
                :show-file-list="false"
                :disabled="isBusy"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                :on-change="handleCertificateChange"
              >
                <el-button
                  link
                  type="primary"
                  :icon="RefreshRight"
                  :disabled="isBusy"
                >
                  替换
                </el-button>
              </el-upload>
              <el-button
                link
                type="danger"
                :icon="Delete"
                :disabled="isBusy"
                @click="emit('remove-certificate')"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>
      </section>

      <section class="upload-item">
        <div class="upload-label">
          <el-icon><Picture /></el-icon>
          <span>材料铭牌照片</span>
          <em>必填</em>
        </div>

        <el-upload
          v-if="!nameplateFile"
          class="document-uploader"
          drag
          :auto-upload="false"
          :show-file-list="false"
          :disabled="isBusy"
          accept=".jpg,.jpeg,.png,.webp"
          :on-change="handleNameplateChange"
        >
          <el-icon class="upload-icon"><UploadFilled /></el-icon>
          <div class="upload-primary">拖拽或点击选择图片</div>
          <div class="upload-hint">JPG / PNG / WEBP，≤ 10 MB</div>
        </el-upload>

        <div v-else class="selected-file">
          <div class="file-preview">
            <img
              :src="nameplateFile.previewUrl"
              alt="材料铭牌缩略图"
            />
          </div>
          <div class="file-details">
            <span class="file-ready">
              <el-icon><Check /></el-icon>
              已选择
            </span>
            <strong :title="nameplateFile.fileName">
              {{ nameplateFile.fileName }}
            </strong>
            <div class="file-actions">
              <el-upload
                :key="`${nameplateFile.file.lastModified}-nameplate`"
                :auto-upload="false"
                :show-file-list="false"
                :disabled="isBusy"
                accept=".jpg,.jpeg,.png,.webp"
                :on-change="handleNameplateChange"
              >
                <el-button
                  link
                  type="primary"
                  :icon="RefreshRight"
                  :disabled="isBusy"
                >
                  替换
                </el-button>
              </el-upload>
              <el-button
                link
                type="danger"
                :icon="Delete"
                :disabled="isBusy"
                @click="emit('remove-nameplate')"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div class="recognition-action">
      <el-button
        class="recognition-button"
        type="primary"
        :icon="Cpu"
        :disabled="!canStartRecognition"
        :loading="isRecognizing"
        @click="emit('start-recognition')"
      >
        {{
          isRecognizing
            ? '识别处理中'
            : recognitionStatus === 'FAILED'
              ? '重新 AI 识别'
              : '开始 AI 识别'
        }}
      </el-button>
      <p
        :class="{
          active: recognitionStatus === 'READY' || isRecognizing,
          danger: recognitionStatus === 'FAILED',
        }"
      >
        <el-icon><InfoFilled /></el-icon>
        {{ recognitionHint }}
      </p>
    </div>

    <section
      v-if="isRecognizing"
      class="recognition-progress"
      aria-live="polite"
    >
      <div>
        <span>{{ recognitionStepText }}</span>
        <b>{{ recognitionProgress }}%</b>
      </div>
      <el-progress
        :percentage="recognitionProgress"
        :show-text="false"
        :stroke-width="6"
      />
    </section>

    <section
      v-if="recognitionResult"
      class="recognition-result"
      aria-labelledby="recognition-result-title"
    >
      <div class="section-title">
        <h3 id="recognition-result-title">结构化识别结果</h3>
        <span
          class="recognition-source-badge"
          :class="{ real: recognitionMeta?.source === 'REAL' }"
        >
          {{
            recognitionMeta?.source === 'REAL'
              ? '真实模型结果'
              : '本地 Mock 结果'
          }}
        </span>
      </div>

      <div v-if="recognitionMeta" class="recognition-meta">
        <span :title="recognitionMeta.model">
          模型 {{ recognitionMeta.model }}
        </span>
        <span>耗时 {{ recognitionMeta.durationMs }} ms</span>
        <span>
          置信度 {{ Math.round(recognitionMeta.confidence * 100) }}%
        </span>
      </div>

      <dl class="recognition-fields">
        <div>
          <dt>生产厂家</dt>
          <dd>{{ recognitionResult.manufacturer }}</dd>
        </div>
        <div>
          <dt>材料名称</dt>
          <dd>{{ recognitionResult.materialName }}</dd>
        </div>
        <div>
          <dt>牌号 / 规格</dt>
          <dd>{{ recognitionResult.grade }} / {{ recognitionResult.specification }}</dd>
        </div>
        <div>
          <dt>批次号</dt>
          <dd>{{ recognitionResult.batchNo }}</dd>
        </div>
        <div>
          <dt>炉号</dt>
          <dd>{{ recognitionResult.furnaceNo || '—' }}</dd>
        </div>
        <div>
          <dt>生产日期</dt>
          <dd>{{ recognitionResult.productionDate || '—' }}</dd>
        </div>
      </dl>

      <div class="compare-heading">
        <h3>采购订单字段比对</h3>
        <span :class="{ matched: allRowsMatch }">
          <el-icon>
            <Check v-if="allRowsMatch" />
            <CircleClose v-else />
          </el-icon>
          {{ allRowsMatch ? '全部一致' : '存在差异' }}
        </span>
      </div>

      <div class="compare-table">
        <div class="compare-row compare-header">
          <span>字段</span>
          <span>采购订单</span>
          <span>识别结果</span>
          <span>结论</span>
        </div>
        <div
          v-for="row in orderCompareRows"
          :key="row.fieldKey"
          class="compare-row"
        >
          <b>{{ row.fieldLabel }}</b>
          <span :title="row.orderValue">{{ row.orderValue }}</span>
          <span :title="row.recognitionValue">
            {{ row.recognitionValue }}
          </span>
          <em :class="row.result.toLowerCase()">
            {{ row.result === 'MATCH' ? '一致' : '不一致' }}
          </em>
        </div>
      </div>

      <el-button
        class="confirm-button"
        type="success"
        :icon="Check"
        :disabled="!canConfirmArchive || isArchiveConfirmed"
        @click="emit('confirm-archive')"
      >
        确认建档
      </el-button>
    </section>

    <section
      v-else
      class="order-summary"
      aria-labelledby="order-title"
    >
      <div class="section-title">
        <h3 id="order-title">采购订单摘要</h3>
        <span class="loaded-badge">已载入</span>
      </div>

      <dl>
        <div>
          <dt>采购订单</dt>
          <dd class="order-number">
            {{ purchaseOrder.purchaseOrderId }}
          </dd>
        </div>
        <div>
          <dt>供应商</dt>
          <dd>{{ purchaseOrder.supplier }}</dd>
        </div>
        <div>
          <dt>材料</dt>
          <dd>
            {{ purchaseOrder.grade }} {{ purchaseOrder.specification }}
            {{ purchaseOrder.materialName }}
          </dd>
        </div>
        <div>
          <dt>采购数量</dt>
          <dd>{{ purchaseOrder.quantity }}</dd>
        </div>
      </dl>
    </section>

    <p class="mock-tip">
      {{
        recognitionMode === 'REAL'
          ? '真实模式会将当前凭证发送至本机 8081 识别网关，原始文件不落盘。'
          : 'Mock 模式使用本地确定性演示数据，不会上传任何文件。'
      }}
    </p>
  </aside>
</template>

<style scoped>
.archive-panel {
  display: flex;
  min-height: 0;
  flex-direction: column;
  padding: 15px 14px 12px 17px;
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
  flex: 0 0 auto;
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

.stage-badge,
.recognition-source-badge,
.loaded-badge {
  padding: 4px 7px;
  border: 1px solid #c8dce8;
  border-radius: 3px;
  color: var(--platform-primary-color);
  background: #eef6fa;
  font-size: 10px;
  font-weight: 600;
}

.recognition-source-badge.real {
  border-color: #cfe6d8;
  color: var(--platform-success-color);
  background: #f1f8f4;
}

.panel-description {
  flex: 0 0 auto;
  margin: 9px 0 10px;
  color: var(--platform-secondary-text-color);
  font-size: 11px;
  line-height: 1.5;
}

.upload-grid {
  display: grid;
  flex: 0 0 auto;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
}

.upload-label {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  color: var(--platform-regular-text-color);
  font-size: 11px;
  font-weight: 650;
}

.upload-label .el-icon {
  margin-right: 4px;
  color: var(--platform-primary-color);
}

.upload-label em {
  margin-left: auto;
  color: var(--platform-danger-color);
  font-size: 9px;
  font-style: normal;
  font-weight: 500;
}

.document-uploader,
.document-uploader :deep(.el-upload) {
  width: 100%;
}

.document-uploader :deep(.el-upload-dragger) {
  width: 100%;
  height: 78px;
  padding: 8px 4px;
  border-color: #cbd5de;
  border-radius: 4px;
  background: #f8fafb;
}

.document-uploader :deep(.el-upload-dragger:hover) {
  border-color: var(--platform-primary-color);
  background: #f2f7fa;
}

.upload-icon {
  margin-bottom: 2px;
  color: #6f8fa4;
  font-size: 22px;
}

.upload-primary {
  color: var(--platform-regular-text-color);
  font-size: 10px;
}

.upload-hint {
  margin-top: 3px;
  color: var(--platform-placeholder-text-color);
  font-size: 8px;
}

.selected-file {
  display: grid;
  height: 78px;
  grid-template-columns: 67px minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid #c9d8e1;
  border-radius: 4px;
  background: #f8fbfc;
}

.file-preview {
  display: grid;
  place-items: center;
  overflow: hidden;
  background: #e9eff2;
}

.file-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.document-preview {
  display: grid;
  place-items: center;
  color: var(--platform-primary-color);
}

.document-preview .el-icon {
  font-size: 25px;
}

.document-preview span {
  margin-top: -8px;
  font-size: 8px;
  font-weight: 700;
}

.file-details {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  padding: 6px 7px;
}

.file-ready {
  display: flex;
  align-items: center;
  color: var(--platform-success-color);
  font-size: 8px;
}

.file-ready .el-icon {
  margin-right: 3px;
}

.file-details strong {
  overflow: hidden;
  margin: 3px 0;
  color: var(--platform-title-color);
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-actions {
  display: flex;
  align-items: center;
  gap: 7px;
}

.file-actions .el-button {
  height: 15px;
  margin: 0;
  padding: 0;
  font-size: 8px;
}

.recognition-action {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 9px;
  margin-top: 10px;
}

.recognition-button {
  width: 132px;
  flex: 0 0 132px;
}

.recognition-action p {
  display: flex;
  min-width: 0;
  align-items: center;
  margin: 0;
  color: var(--platform-placeholder-text-color);
  font-size: 9px;
  line-height: 1.35;
}

.recognition-action p.active {
  color: var(--platform-primary-color);
}

.recognition-action p.danger {
  color: var(--platform-danger-color);
}

.recognition-action p .el-icon {
  flex: 0 0 auto;
  margin-right: 4px;
}

.recognition-progress {
  flex: 0 0 auto;
  margin-top: 9px;
  padding: 8px 10px;
  border: 1px solid #cfdee7;
  border-radius: 4px;
  background: #f3f8fa;
}

.recognition-progress > div {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  color: var(--platform-primary-color);
  font-size: 10px;
}

.recognition-progress b {
  font-size: 9px;
}

.order-summary,
.recognition-result {
  flex: 0 0 auto;
  margin-top: 11px;
  padding-top: 9px;
  border-top: 1px solid #e3e8ed;
}

.recognition-meta {
  display: flex;
  min-width: 0;
  margin-top: 6px;
  color: var(--platform-secondary-text-color);
  font-size: 8px;
  gap: 9px;
}

.recognition-meta span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recognition-meta span:first-child {
  flex: 1 1 auto;
}

.section-title,
.compare-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title h3,
.compare-heading h3 {
  margin: 0;
  color: var(--platform-title-color);
  font-size: 12px;
}

.loaded-badge {
  border-color: #cfe6d8;
  color: var(--platform-success-color);
  background: #f1f8f4;
}

.order-summary dl,
.recognition-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 12px;
  margin: 8px 0 0;
}

.order-summary dl > div,
.recognition-fields > div {
  min-width: 0;
}

.order-summary dt,
.recognition-fields dt {
  margin-bottom: 2px;
  color: var(--platform-placeholder-text-color);
  font-size: 8px;
}

.order-summary dd,
.recognition-fields dd {
  overflow: hidden;
  margin: 0;
  color: var(--platform-regular-text-color);
  font-size: 9px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-summary .order-number {
  color: var(--platform-primary-color);
  font-weight: 700;
}

.compare-heading {
  margin-top: 10px;
  padding-top: 9px;
  border-top: 1px dashed #dfe5e9;
}

.compare-heading > span {
  display: flex;
  align-items: center;
  color: var(--platform-danger-color);
  font-size: 9px;
}

.compare-heading > span.matched {
  color: var(--platform-success-color);
}

.compare-heading .el-icon {
  margin-right: 3px;
}

.compare-table {
  margin-top: 6px;
  border: 1px solid #dfe5e9;
  border-radius: 3px;
}

.compare-row {
  display: grid;
  min-width: 0;
  grid-template-columns: 0.72fr 1fr 1fr 42px;
  align-items: center;
  border-top: 1px solid #edf0f2;
  font-size: 8px;
}

.compare-row:first-child {
  border-top: 0;
}

.compare-row > * {
  min-width: 0;
  padding: 4px 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compare-header {
  color: var(--platform-secondary-text-color);
  background: #f5f7f9;
  font-weight: 650;
}

.compare-row b {
  color: var(--platform-regular-text-color);
}

.compare-row em {
  color: var(--platform-danger-color);
  font-style: normal;
  font-weight: 650;
}

.compare-row em.match {
  color: var(--platform-success-color);
}

.confirm-button {
  width: 100%;
  margin-top: 9px;
}

.mock-tip {
  flex: 0 0 auto;
  margin: auto 0 0;
  padding-top: 8px;
  color: var(--platform-placeholder-text-color);
  font-size: 8px;
  line-height: 1.4;
}

@media (max-height: 800px) {
  .archive-panel {
    padding-top: 11px;
  }

  .panel-description {
    margin: 7px 0 8px;
  }

  .document-uploader :deep(.el-upload-dragger),
  .selected-file {
    height: 69px;
  }

  .recognition-action {
    margin-top: 8px;
  }

  .order-summary,
  .recognition-result {
    margin-top: 8px;
    padding-top: 7px;
  }
}
</style>
