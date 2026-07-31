<script setup lang="ts">
import { nextTick, ref } from 'vue'

import ArrivalVerifyPanel from '@/components/ArrivalVerifyPanel.vue'
import DeliveryStepper from '@/components/DeliveryStepper.vue'
import DeliveryTimeline from '@/components/DeliveryTimeline.vue'
import FactoryArchivePanel from '@/components/FactoryArchivePanel.vue'
import MaterialArchiveDrawer from '@/components/MaterialArchiveDrawer.vue'
import MaterialHeader from '@/components/MaterialHeader.vue'
import RiskConclusionPanel from '@/components/RiskConclusionPanel.vue'
import TransportMap from '@/components/TransportMap.vue'
import TransportStatusPanel from '@/components/TransportStatusPanel.vue'
import { useDeliveryDemo } from '@/composables/useDeliveryDemo'
import type { TransportMapExpose } from '@/types/amap'

const {
  recognitionMode,
  scenarioType,
  currentStage,
  certificateFile,
  nameplateFile,
  recognitionStatus,
  recognitionStepText,
  recognitionProgress,
  recognitionResult,
  recognitionMeta,
  recognitionError,
  orderCompareRows,
  canStartRecognition,
  canConfirmArchive,
  isArchiveConfirmed,
  materialDisplayId,
  transportStatus,
  transportProgress,
  transportAnomalies,
  currentTransportPoint,
  visibleTrajectoryPoints,
  activeTrajectory,
  plannedTrajectory,
  canStartTransport,
  arrivalFile,
  arrivalRecognitionStatus,
  arrivalRecognitionStepText,
  arrivalRecognitionProgress,
  arrivalRecognitionResult,
  arrivalRecognitionMeta,
  arrivalRecognitionError,
  arrivalCompareRows,
  hasIdentityMismatch,
  batchNoMismatch,
  canStartArrivalRecognition,
  riskGenerationStatus,
  riskGenerationStepText,
  riskGenerationProgress,
  riskReport,
  reviewDecision,
  canGenerateRiskReport,
  timelineEvents,
  isBusy,
  resetVersion,
  deliverySteps,
  currentStatusText,
  mapStatusText,
  materialArchive,
  purchaseOrder,
  selectCertificate,
  selectNameplate,
  removeCertificate,
  removeNameplate,
  startRecognition,
  confirmArchive,
  startTransport,
  selectArrivalFile,
  removeArrivalFile,
  startArrivalRecognition,
  generateRiskReport,
  completeReview,
  resetScenario,
  switchScenario,
  switchRecognitionMode,
} = useDeliveryDemo()

const archiveVisible = ref(false)
const transportMap = ref<TransportMapExpose | null>(null)

const locateTrajectory = async () => {
  archiveVisible.value = false
  await nextTick()
  transportMap.value?.focusTrajectory()
}

const locateAnomalies = async () => {
  archiveVisible.value = false
  await nextTick()
  transportMap.value?.focusAnomalies()
}

const locateAnomaly = async (pointId: string) => {
  archiveVisible.value = false
  await nextTick()
  transportMap.value?.focusAnomaly(pointId)
}
</script>

<template>
  <main class="delivery-workbench">
    <MaterialHeader
      :material-id="materialDisplayId"
      :material-name="purchaseOrder.materialName"
      :grade="purchaseOrder.grade"
      :specification="purchaseOrder.specification"
      :current-status-text="currentStatusText"
      :scenario-type="scenarioType"
      :recognition-mode="recognitionMode"
      :is-busy="isBusy"
      @scenario-change="switchScenario"
      @recognition-mode-change="switchRecognitionMode"
      @open-archive="archiveVisible = true"
      @reset="resetScenario"
    />

    <DeliveryStepper :steps="deliverySteps" />

    <section class="workspace-main">
      <TransportMap
        ref="transportMap"
        :current-stage="currentStage"
        :map-status-text="mapStatusText"
        :transport-status="transportStatus"
        :transport-progress="transportProgress"
        :transport-anomalies="transportAnomalies"
        :current-transport-point="currentTransportPoint"
        :visible-trajectory-points="visibleTrajectoryPoints"
        :active-trajectory="activeTrajectory"
        :planned-trajectory="plannedTrajectory"
        :origin-label="purchaseOrder.supplier"
        :destination-label="purchaseOrder.deliveryProject"
      />

      <FactoryArchivePanel
        v-if="currentStage === 'FACTORY_ARCHIVE'"
        :key="resetVersion"
        :certificate-file="certificateFile"
        :nameplate-file="nameplateFile"
        :recognition-status="recognitionStatus"
        :recognition-step-text="recognitionStepText"
        :recognition-progress="recognitionProgress"
        :recognition-result="recognitionResult"
        :recognition-meta="recognitionMeta"
        :recognition-error="recognitionError"
        :recognition-mode="recognitionMode"
        :order-compare-rows="orderCompareRows"
        :purchase-order="purchaseOrder"
        :can-start-recognition="canStartRecognition"
        :can-confirm-archive="canConfirmArchive"
        :is-archive-confirmed="isArchiveConfirmed"
        :is-busy="isBusy"
        @select-certificate="selectCertificate"
        @select-nameplate="selectNameplate"
        @remove-certificate="removeCertificate"
        @remove-nameplate="removeNameplate"
        @start-recognition="startRecognition"
        @confirm-archive="confirmArchive"
      />

      <TransportStatusPanel
        v-else-if="currentStage === 'IN_TRANSIT'"
        :material-id="materialDisplayId"
        :transport-status="transportStatus"
        :progress="transportProgress"
        :anomaly-count="transportAnomalies.length"
        :current-point="currentTransportPoint"
        :can-start="canStartTransport"
        @start="startTransport"
      />

      <ArrivalVerifyPanel
        v-else-if="currentStage === 'ARRIVAL_VERIFY'"
        :arrival-file="arrivalFile"
        :recognition-status="arrivalRecognitionStatus"
        :recognition-step-text="arrivalRecognitionStepText"
        :recognition-progress="arrivalRecognitionProgress"
        :recognition-result="arrivalRecognitionResult"
        :recognition-meta="arrivalRecognitionMeta"
        :recognition-error="arrivalRecognitionError"
        :recognition-mode="recognitionMode"
        :compare-rows="arrivalCompareRows"
        :has-identity-mismatch="hasIdentityMismatch"
        :batch-no-mismatch="batchNoMismatch"
        :risk-generation-status="riskGenerationStatus"
        :risk-generation-step-text="riskGenerationStepText"
        :risk-generation-progress="riskGenerationProgress"
        :can-start-recognition="canStartArrivalRecognition"
        :can-generate-risk-report="canGenerateRiskReport"
        :is-busy="isBusy"
        @select-file="selectArrivalFile"
        @remove-file="removeArrivalFile"
        @recognize="startArrivalRecognition"
        @generate-risk="generateRiskReport"
      />

      <RiskConclusionPanel
        v-else-if="
          (currentStage === 'RISK_REVIEW' ||
            currentStage === 'COMPLETED') &&
          riskReport
        "
        :report="riskReport"
        :transport-anomalies="transportAnomalies"
        :compare-rows="arrivalCompareRows"
        :decision="reviewDecision"
        @decision="completeReview"
      />
    </section>

    <DeliveryTimeline :events="timelineEvents" />

    <MaterialArchiveDrawer
      v-model:visible="archiveVisible"
      :archive="materialArchive"
      @locate-trajectory="locateTrajectory"
      @locate-anomalies="locateAnomalies"
      @locate-anomaly="locateAnomaly"
    />
  </main>
</template>

<style scoped>
.delivery-workbench {
  display: grid;
  width: 100%;
  height: 100vh;
  min-height: 680px;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  gap: 8px;
  padding: 10px 12px;
  overflow: hidden;
  background: var(--platform-page-background);
}

.workspace-main {
  display: grid;
  min-height: 0;
  grid-template-columns: minmax(0, 1fr) 410px;
  gap: 8px;
}

@media (max-width: 1280px) {
  .workspace-main {
    grid-template-columns: minmax(0, 1fr) 390px;
  }
}

@media (max-height: 800px) {
  .delivery-workbench {
    gap: 6px;
    padding-top: 8px;
    padding-bottom: 8px;
  }
}
</style>
