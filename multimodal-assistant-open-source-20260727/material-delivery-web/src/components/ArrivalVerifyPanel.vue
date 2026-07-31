<script setup lang="ts">
import {
  Check,
  DataAnalysis,
  Delete,
  InfoFilled,
  Picture,
  RefreshRight,
  UploadFilled,
} from '@element-plus/icons-vue'
import type { UploadFile } from 'element-plus'
import { computed } from 'vue'

import MaterialCompareTable from '@/components/MaterialCompareTable.vue'
import type {
  RecognitionStatus,
  RiskGenerationStatus,
} from '@/types/delivery'
import type {
  LocalUploadFile,
  MaterialCompareRow,
  MaterialRecognition,
} from '@/types/material'
import type {
  RecognitionMeta,
  RecognitionMode,
} from '@/types/recognition'

interface Props {
  arrivalFile: LocalUploadFile | null
  recognitionStatus: RecognitionStatus
  recognitionStepText: string
  recognitionProgress: number
  recognitionResult: MaterialRecognition | null
  recognitionMeta: RecognitionMeta | null
  recognitionError: string | null
  recognitionMode: RecognitionMode
  compareRows: MaterialCompareRow[]
  hasIdentityMismatch: boolean
  batchNoMismatch: boolean
  riskGenerationStatus: RiskGenerationStatus
  riskGenerationStepText: string
  riskGenerationProgress: number
  canStartRecognition: boolean
  canGenerateRiskReport: boolean
  isBusy: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'select-file': [file: File]
  'remove-file': []
  recognize: []
  'generate-risk': []
}>()

const isRecognizing = computed(
  () => props.recognitionStatus === 'RECOGNIZING',
)

const isGeneratingRisk = computed(
  () => props.riskGenerationStatus === 'GENERATING',
)

const handleFileChange = (uploadFile: UploadFile) => {
  if (uploadFile.raw) {
    emit('select-file', uploadFile.raw)
  }
}
</script>

<template>
  <aside class="arrival-panel" aria-labelledby="arrival-panel-title">
    <header class="panel-header">
      <div class="stage-number">03</div>
      <div>
        <div class="eyebrow">ARRIVAL VERIFY</div>
        <h2 id="arrival-panel-title">到场材料核验</h2>
      </div>
      <span class="stage-badge">当前阶段</span>
    </header>

    <p class="panel-description">
      采集现场铭牌并与出厂数字档案逐字段核对，确认材料身份连续性。
    </p>

    <section class="arrival-upload">
      <div class="upload-label">
        <el-icon><Picture /></el-icon>
        <span>到场材料铭牌照片</span>
        <em>必填</em>
      </div>

      <el-upload
        v-if="!arrivalFile"
        class="document-uploader"
        drag
        :auto-upload="false"
        :show-file-list="false"
        :disabled="isBusy"
        accept=".jpg,.jpeg,.png,.webp"
        :on-change="handleFileChange"
      >
        <el-icon class="upload-icon"><UploadFilled /></el-icon>
        <div class="upload-primary">拖拽或点击选择现场铭牌</div>
        <div class="upload-hint">JPG / PNG / WEBP，单文件不超过 10 MB</div>
      </el-upload>

      <div v-else class="selected-file">
        <div class="file-preview">
          <img :src="arrivalFile.previewUrl" alt="到场铭牌缩略图" />
        </div>
        <div class="file-details">
          <span class="file-ready">
            <el-icon><Check /></el-icon>
            到场凭证已选择
          </span>
          <strong :title="arrivalFile.fileName">
            {{ arrivalFile.fileName }}
          </strong>
          <div class="file-actions">
            <el-upload
              :key="`${arrivalFile.file.lastModified}-arrival`"
              :auto-upload="false"
              :show-file-list="false"
              :disabled="isBusy"
              accept=".jpg,.jpeg,.png,.webp"
              :on-change="handleFileChange"
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
              @click="emit('remove-file')"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>
    </section>

    <div class="recognition-action">
      <el-button
        type="primary"
        :icon="DataAnalysis"
        :disabled="!canStartRecognition"
        :loading="isRecognizing"
        @click="emit('recognize')"
      >
        {{ isRecognizing ? '身份识别中' : '识别到场铭牌' }}
      </el-button>
      <p>
        <el-icon><InfoFilled /></el-icon>
        {{
          arrivalFile
            ? recognitionError ?? recognitionStepText
            : '请先选择到场材料铭牌照片'
        }}
      </p>
    </div>

    <section v-if="isRecognizing" class="progress-card">
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

    <section v-if="recognitionResult" class="arrival-result">
      <div class="section-title">
        <h3>到场结构化识别结果</h3>
        <span
          class="identity-badge"
          :class="{ danger: hasIdentityMismatch }"
        >
          {{ hasIdentityMismatch ? '发现身份冲突' : '身份字段一致' }}
        </span>
      </div>

      <div v-if="recognitionMeta" class="recognition-meta">
        <span
          class="recognition-source"
          :class="{ real: recognitionMeta.source === 'REAL' }"
        >
          {{ recognitionMeta.source === 'REAL' ? '真实模型' : 'Mock 数据' }}
        </span>
        <span :title="recognitionMeta.model">
          {{ recognitionMeta.model }}
        </span>
        <span>
          {{ Math.round(recognitionMeta.confidence * 100) }}% ·
          {{ recognitionMeta.durationMs }} ms
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
          <dd>
            {{ recognitionResult.grade }} /
            {{ recognitionResult.specification }}
          </dd>
        </div>
        <div>
          <dt>到场批次号</dt>
          <dd :class="{ danger: batchNoMismatch }">
            {{ recognitionResult.batchNo }}
          </dd>
        </div>
      </dl>

      <MaterialCompareTable :rows="compareRows" />

      <el-button
        class="risk-button"
        :type="hasIdentityMismatch ? 'warning' : 'primary'"
        :icon="DataAnalysis"
        :disabled="!canGenerateRiskReport"
        :loading="isGeneratingRisk"
        @click="emit('generate-risk')"
      >
        {{ isGeneratingRisk ? '风险分析中' : '生成综合风险说明' }}
      </el-button>
    </section>

    <section v-if="isGeneratingRisk" class="progress-card risk-progress">
      <div>
        <span>{{ riskGenerationStepText }}</span>
        <b>{{ riskGenerationProgress }}%</b>
      </div>
      <el-progress
        :percentage="riskGenerationProgress"
        :show-text="false"
        :stroke-width="6"
        status="warning"
      />
    </section>

    <p class="mock-tip">
      {{
        recognitionMode === 'REAL'
          ? '真实模式通过本机网关识别铭牌，身份比对仍采用前端确定性规则。'
          : 'Mock 模式使用本地演示识别，最终验收仍由专业人员确认。'
      }}
    </p>
  </aside>
</template>

<style scoped>
.arrival-panel {
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
}

.stage-badge {
  padding: 4px 7px;
  border: 1px solid #c8dce8;
  border-radius: 3px;
  color: var(--platform-primary-color);
  background: #eef6fa;
  font-size: 10px;
  font-weight: 600;
}

.panel-description {
  margin: 8px 0 9px;
  color: var(--platform-secondary-text-color);
  font-size: 10px;
  line-height: 1.5;
}

.upload-label {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
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
}

.document-uploader,
.document-uploader :deep(.el-upload) {
  width: 100%;
}

.document-uploader :deep(.el-upload-dragger) {
  width: 100%;
  height: 74px;
  padding: 7px;
  border-color: #cbd5de;
  border-radius: 4px;
  background: #f8fafb;
}

.upload-icon {
  color: #6f8fa4;
  font-size: 22px;
}

.upload-primary {
  margin-top: 2px;
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
  height: 74px;
  grid-template-columns: 82px minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid #c9d8e1;
  border-radius: 4px;
  background: #f8fbfc;
}

.file-preview {
  overflow: hidden;
  background: #e9eff2;
}

.file-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-details {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  padding: 7px 9px;
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
  margin: 4px 0;
  color: var(--platform-title-color);
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-actions {
  display: flex;
  gap: 8px;
}

.file-actions .el-button {
  height: 15px;
  margin: 0;
  padding: 0;
  font-size: 8px;
}

.recognition-action {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 9px;
}

.recognition-action > .el-button {
  width: 135px;
  flex: 0 0 135px;
}

.recognition-action p {
  display: flex;
  min-width: 0;
  align-items: center;
  margin: 0;
  color: var(--platform-secondary-text-color);
  font-size: 8px;
  line-height: 1.35;
}

.recognition-action p .el-icon {
  flex: 0 0 auto;
  margin-right: 3px;
}

.progress-card {
  margin-top: 8px;
  padding: 7px 9px;
  border: 1px solid #cfdee7;
  border-radius: 4px;
  background: #f3f8fa;
}

.progress-card > div {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  color: var(--platform-primary-color);
  font-size: 9px;
}

.arrival-result {
  margin-top: 9px;
  padding-top: 8px;
  border-top: 1px solid #e3e8ed;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.recognition-meta {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  margin-top: 6px;
  color: var(--platform-secondary-text-color);
  font-size: 8px;
}

.recognition-meta > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recognition-meta > span:nth-child(2) {
  flex: 1 1 auto;
}

.recognition-source {
  flex: 0 0 auto;
  padding: 2px 5px;
  border-radius: 3px;
  color: var(--platform-primary-color);
  background: #eef6fa;
}

.recognition-source.real {
  color: var(--platform-success-color);
  background: #edf7f1;
}

.section-title h3 {
  margin: 0;
  color: var(--platform-title-color);
  font-size: 12px;
}

.identity-badge {
  padding: 3px 6px;
  border-radius: 3px;
  color: var(--platform-success-color);
  background: #edf7f1;
  font-size: 8px;
  font-weight: 650;
}

.identity-badge.danger {
  color: var(--platform-danger-color);
  background: #fff0ef;
}

.recognition-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 12px;
  margin: 7px 0 0;
}

.recognition-fields dt {
  color: var(--platform-placeholder-text-color);
  font-size: 8px;
}

.recognition-fields dd {
  overflow: hidden;
  margin: 2px 0 0;
  color: var(--platform-regular-text-color);
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recognition-fields dd.danger {
  color: var(--platform-danger-color);
  font-weight: 700;
}

.risk-button {
  width: 100%;
  margin-top: 9px;
}

.risk-progress {
  border-color: #ead6b8;
  background: #fff9ef;
}

.mock-tip {
  margin: auto 0 0;
  padding-top: 8px;
  color: var(--platform-placeholder-text-color);
  font-size: 8px;
  line-height: 1.4;
}
</style>
