import { ElMessage } from 'element-plus'
import { computed, onBeforeUnmount, ref } from 'vue'

import {
  abnormalArrivalMaterial,
  abnormalRiskReport,
  abnormalTrajectory,
  factoryRecognition,
  normalArrivalMaterial,
  normalRiskReport,
  normalTrajectory,
  purchaseOrder,
  transportTask,
} from '@/mock'
import {
  recognizeArrivalMaterial,
  recognizeFactoryMaterial,
  RecognitionRequestError,
} from '@/services/recognitionService'
import {
  timelineLevelLabels,
  type ArchiveBusinessStage,
  type ArchiveFileSnapshot,
  type ArchiveStatusTone,
  type MaterialArchiveSnapshot,
} from '@/types/archive'
import type {
  DeliveryStage,
  DeliveryStepItem,
  DeliveryTimelineEvent,
  RecognitionStatus,
  ReviewDecision,
  RiskFact,
  RiskGenerationStatus,
  RiskReport,
  ScenarioType,
  StageStatus,
  TransportAnomaly,
  TransportEventType,
  TransportStatus,
  TransportTrajectoryPoint,
} from '@/types/delivery'
import type {
  LocalUploadFile,
  MaterialCompareRow,
  MaterialIdentityFieldKey,
  MaterialRecognition,
  OrderCompareRow,
} from '@/types/material'
import type {
  RecognitionMeta,
  RecognitionMode,
} from '@/types/recognition'
import { materialIdentityValuesMatch } from '@/utils/materialIdentity'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const CERTIFICATE_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
])
const NAMEPLATE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

const initialRecognitionMode: RecognitionMode =
  import.meta.env.VITE_RECOGNITION_MODE?.toLowerCase() === 'real'
    ? 'REAL'
    : 'MOCK'

const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError'

const recognitionErrorMessage = (error: unknown) =>
  error instanceof RecognitionRequestError
    ? error.message
    : '识别任务执行失败，请重新尝试'

const createMockRecognitionMeta = (
  stage: 'factory' | 'arrival',
  runId: number,
  durationMs: number,
): RecognitionMeta => ({
  source: 'MOCK',
  model: '本地预置演示数据',
  durationMs,
  confidence: 1,
  requestId: `mock-${stage}-${runId}`,
})

const initialTimelineEvent: DeliveryTimelineEvent = {
  id: 'order-loaded',
  time: '12:50',
  title: '采购订单已加载',
  description: '系统已加载材料采购订单，等待创建出厂数字档案。',
  level: 'INFO',
  occurred: true,
}

const recognitionSteps = [
  { text: '正在识别文档类型……', progress: 15 },
  { text: '正在提取材料字段……', progress: 38 },
  { text: '正在匹配采购订单……', progress: 65 },
  { text: '正在生成材料数字档案……', progress: 88 },
  { text: '识别完成。', progress: 100 },
] as const

const arrivalRecognitionSteps = [
  { text: '正在识别现场铭牌……', progress: 22 },
  { text: '正在提取到场身份字段……', progress: 48 },
  { text: '正在与出厂数字档案核对……', progress: 76 },
  { text: '到场身份核验完成。', progress: 100 },
] as const

const riskGenerationSteps = [
  { text: '正在汇总已确认事实……', progress: 30 },
  { text: '正在解释跨阶段风险……', progress: 65 },
  { text: '正在生成核查建议……', progress: 100 },
] as const

const recognitionArchivePresentation: Record<
  RecognitionStatus,
  { label: string; tone: ArchiveStatusTone }
> = {
  IDLE: { label: '待选择文件', tone: 'MUTED' },
  READY: { label: '文件已就绪', tone: 'WARNING' },
  RECOGNIZING: { label: '识别处理中', tone: 'PRIMARY' },
  SUCCEEDED: { label: '识别完成', tone: 'SUCCESS' },
  FAILED: { label: '识别失败', tone: 'DANGER' },
}

const timelineLevelTones: Record<
  DeliveryTimelineEvent['level'],
  ArchiveStatusTone
> = {
  INFO: 'PRIMARY',
  SUCCESS: 'SUCCESS',
  WARNING: 'WARNING',
  DANGER: 'DANGER',
  PENDING: 'MUTED',
}

const reviewDecisionPresentation: Record<
  ReviewDecision,
  { label: string; tone: ArchiveStatusTone }
> = {
  ACCEPTED: { label: '进入常规验收', tone: 'SUCCESS' },
  REVIEW_REQUIRED: { label: '转人工复核', tone: 'WARNING' },
  DEFERRED: { label: '暂缓验收', tone: 'DANGER' },
}

const transportRiskFactLabels: Partial<
  Record<TransportEventType, string>
> = {
  ROUTE_DEVIATION: '偏航风险',
  UNAUTHORIZED_STOP: '异常停留',
  GPS_INTERRUPTED: '定位中断',
  TRANSPORT_TIMEOUT: '运输超时',
}

const getArchiveBusinessStage = (
  eventId: string,
): ArchiveBusinessStage => {
  if (eventId.startsWith('transport-')) {
    return '运输追溯'
  }

  if (eventId.startsWith('arrival-')) {
    return '到场核验'
  }

  if (
    eventId.startsWith('risk-') ||
    eventId.startsWith('review-')
  ) {
    return '人工验收'
  }

  if (eventId === 'order-loaded') {
    return '采购订单'
  }

  return '出厂建档'
}

const toArchiveFileSnapshot = (
  uploadFile: LocalUploadFile | null,
): ArchiveFileSnapshot | null =>
  uploadFile
    ? {
        fileName: uploadFile.fileName,
        mimeType: uploadFile.mimeType,
        previewUrl: uploadFile.previewUrl,
      }
    : null

export const useDeliveryDemo = () => {
  const recognitionMode = ref<RecognitionMode>(initialRecognitionMode)
  const scenarioType = ref<ScenarioType>('ABNORMAL')
  const currentStage = ref<DeliveryStage>('FACTORY_ARCHIVE')
  const certificateFile = ref<LocalUploadFile | null>(null)
  const nameplateFile = ref<LocalUploadFile | null>(null)
  const recognitionStatus = ref<RecognitionStatus>('IDLE')
  const recognitionStepText = ref('等待选择出厂材料凭证')
  const recognitionProgress = ref(0)
  const recognitionResult = ref<MaterialRecognition | null>(null)
  const recognitionMeta = ref<RecognitionMeta | null>(null)
  const recognitionError = ref<string | null>(null)
  const isArchiveConfirmed = ref(false)
  const materialId = ref<string | null>(null)
  const transportStatus = ref<TransportStatus>('IDLE')
  const transportPointIndex = ref(0)
  const transportProgress = ref(0)
  const transportAnomalies = ref<TransportAnomaly[]>([])
  const arrivalFile = ref<LocalUploadFile | null>(null)
  const arrivalRecognitionStatus = ref<RecognitionStatus>('IDLE')
  const arrivalRecognitionStepText = ref('等待选择到场铭牌照片')
  const arrivalRecognitionProgress = ref(0)
  const arrivalRecognitionResult =
    ref<MaterialRecognition | null>(null)
  const arrivalRecognitionMeta = ref<RecognitionMeta | null>(null)
  const arrivalRecognitionError = ref<string | null>(null)
  const riskGenerationStatus =
    ref<RiskGenerationStatus>('IDLE')
  const riskGenerationStepText = ref('等待完成到场身份核验')
  const riskGenerationProgress = ref(0)
  const riskReport = ref<RiskReport | null>(null)
  const reviewDecision = ref<ReviewDecision | null>(null)
  const timelineEvents = ref<DeliveryTimelineEvent[]>([
    { ...initialTimelineEvent },
  ])
  const resetVersion = ref(0)

  let recognitionRunId = 0
  let transportRunId = 0
  let arrivalRecognitionRunId = 0
  let riskGenerationRunId = 0
  let factoryRecognitionController: AbortController | null = null
  let arrivalRecognitionController: AbortController | null = null
  const pendingDelays = new Map<ReturnType<typeof setTimeout>, () => void>()
  const appendedEventIds = new Set<string>([initialTimelineEvent.id])

  const isBusy = computed(
    () =>
      recognitionStatus.value === 'RECOGNIZING' ||
      transportStatus.value === 'RUNNING' ||
      arrivalRecognitionStatus.value === 'RECOGNIZING' ||
      riskGenerationStatus.value === 'GENERATING',
  )

  const materialDisplayId = computed(
    () => materialId.value ?? '待生成材料档案',
  )

  const orderCompareRows = computed<OrderCompareRow[]>(() => {
    const result = recognitionResult.value

    if (!result) {
      return []
    }

    const rows: Array<
      Omit<OrderCompareRow, 'result'> & {
        identityFieldKey: MaterialIdentityFieldKey
      }
    > = [
      {
        fieldKey: 'supplier',
        identityFieldKey: 'manufacturer',
        fieldLabel: '供应商',
        orderValue: purchaseOrder.supplier,
        recognitionValue: result.manufacturer,
      },
      {
        fieldKey: 'materialName',
        identityFieldKey: 'materialName',
        fieldLabel: '材料名称',
        orderValue: purchaseOrder.materialName,
        recognitionValue: result.materialName,
      },
      {
        fieldKey: 'grade',
        identityFieldKey: 'grade',
        fieldLabel: '牌号',
        orderValue: purchaseOrder.grade,
        recognitionValue: result.grade,
      },
      {
        fieldKey: 'specification',
        identityFieldKey: 'specification',
        fieldLabel: '规格',
        orderValue: purchaseOrder.specification,
        recognitionValue: result.specification,
      },
    ]

    return rows.map(({ identityFieldKey, ...row }) => ({
      ...row,
      result: materialIdentityValuesMatch(
        identityFieldKey,
        row.orderValue,
        row.recognitionValue,
      )
        ? 'MATCH'
        : 'MISMATCH',
    }))
  })

  const allOrderFieldsMatch = computed(
    () =>
      orderCompareRows.value.length > 0 &&
      orderCompareRows.value.every((row) => row.result === 'MATCH'),
  )

  const canStartRecognition = computed(
    () =>
      certificateFile.value !== null &&
      nameplateFile.value !== null &&
      (recognitionStatus.value === 'READY' ||
        recognitionStatus.value === 'FAILED') &&
      !isBusy.value,
  )

  const canConfirmArchive = computed(
    () =>
      recognitionStatus.value === 'SUCCEEDED' &&
      allOrderFieldsMatch.value &&
      !isArchiveConfirmed.value &&
      !isBusy.value,
  )

  const activeTrajectory = computed<TransportTrajectoryPoint[]>(() =>
    scenarioType.value === 'ABNORMAL'
      ? abnormalTrajectory
      : normalTrajectory,
  )

  const currentTransportPoint = computed(
    () =>
      activeTrajectory.value[
        Math.min(
          transportPointIndex.value,
          activeTrajectory.value.length - 1,
        )
      ] ?? null,
  )

  const visibleTrajectoryPoints = computed(() =>
    activeTrajectory.value.slice(0, transportPointIndex.value + 1),
  )

  const canStartTransport = computed(
    () =>
      currentStage.value === 'IN_TRANSIT' &&
      transportStatus.value === 'IDLE' &&
      !isBusy.value,
  )

  const arrivalCompareRows = computed<MaterialCompareRow[]>(() => {
    const factoryResult = recognitionResult.value
    const arrivalResult = arrivalRecognitionResult.value

    if (!factoryResult || !arrivalResult) {
      return []
    }

    const rows: Omit<MaterialCompareRow, 'result'>[] = [
      {
        fieldKey: 'manufacturer',
        fieldLabel: '生产厂家',
        factoryValue: factoryResult.manufacturer,
        arrivalValue: arrivalResult.manufacturer,
      },
      {
        fieldKey: 'materialName',
        fieldLabel: '材料名称',
        factoryValue: factoryResult.materialName,
        arrivalValue: arrivalResult.materialName,
      },
      {
        fieldKey: 'grade',
        fieldLabel: '牌号',
        factoryValue: factoryResult.grade,
        arrivalValue: arrivalResult.grade,
      },
      {
        fieldKey: 'specification',
        fieldLabel: '规格',
        factoryValue: factoryResult.specification,
        arrivalValue: arrivalResult.specification,
      },
      {
        fieldKey: 'batchNo',
        fieldLabel: '批次号',
        factoryValue: factoryResult.batchNo,
        arrivalValue: arrivalResult.batchNo,
      },
    ]

    return rows.map((row) => ({
      ...row,
      result: materialIdentityValuesMatch(
        row.fieldKey,
        row.factoryValue,
        row.arrivalValue,
      )
        ? 'MATCH'
        : 'MISMATCH',
    }))
  })

  const identityMismatchRows = computed(() =>
    arrivalCompareRows.value.filter(
      (row) => row.result === 'MISMATCH',
    ),
  )

  const hasIdentityMismatch = computed(
    () => identityMismatchRows.value.length > 0,
  )

  const batchNoMismatch = computed(() =>
    identityMismatchRows.value.some(
      (row) => row.fieldKey === 'batchNo',
    ),
  )

  const canStartArrivalRecognition = computed(
    () =>
      currentStage.value === 'ARRIVAL_VERIFY' &&
      arrivalFile.value !== null &&
      (arrivalRecognitionStatus.value === 'READY' ||
        arrivalRecognitionStatus.value === 'FAILED') &&
      !isBusy.value,
  )

  const canGenerateRiskReport = computed(
    () =>
      currentStage.value === 'ARRIVAL_VERIFY' &&
      arrivalRecognitionStatus.value === 'SUCCEEDED' &&
      riskGenerationStatus.value === 'IDLE' &&
      !isBusy.value,
  )

  const factoryStageStatus = computed<StageStatus>(() => {
    if (isArchiveConfirmed.value) {
      return 'COMPLETED'
    }

    if (recognitionStatus.value === 'FAILED') {
      return 'FAILED'
    }

    return 'PROCESSING'
  })

  const transportStageStatus = computed<StageStatus>(() => {
    if (!isArchiveConfirmed.value) {
      return 'PENDING'
    }

    if (transportStatus.value === 'ARRIVED') {
      return transportAnomalies.value.length > 0
        ? 'WARNING'
        : 'COMPLETED'
    }

    return 'PROCESSING'
  })

  const arrivalStageStatus = computed<StageStatus>(() => {
    if (
      currentStage.value === 'FACTORY_ARCHIVE' ||
      currentStage.value === 'IN_TRANSIT'
    ) {
      return 'PENDING'
    }

    if (arrivalRecognitionStatus.value === 'FAILED') {
      return 'FAILED'
    }

    if (currentStage.value === 'ARRIVAL_VERIFY') {
      return 'PROCESSING'
    }

    if (currentStage.value === 'RISK_REVIEW') {
      return riskReport.value?.riskLevel === 'HIGH'
        ? 'WARNING'
        : 'COMPLETED'
    }

    return 'COMPLETED'
  })

  const deliverySteps = computed<DeliveryStepItem[]>(() => [
    {
      key: 'factory-archive',
      title: '出厂建档',
      description:
        factoryStageStatus.value === 'COMPLETED'
          ? '数字档案已建立'
          : '材料凭证采集',
      status: factoryStageStatus.value,
    },
    {
      key: 'transport',
      title: '运输中',
      description:
        transportStatus.value === 'RUNNING'
          ? `运输进度 ${transportProgress.value}%`
          : transportStatus.value === 'ARRIVED'
            ? transportAnomalies.value.length > 0
              ? '存在运输异常'
              : '运输过程正常'
            : transportStageStatus.value === 'PROCESSING'
              ? '等待车辆发车'
              : '轨迹可信核验',
      status: transportStageStatus.value,
    },
    {
      key: 'arrival',
      title: '到场核验',
      description:
        arrivalStageStatus.value === 'PROCESSING'
          ? arrivalRecognitionStatus.value === 'SUCCEEDED'
            ? '身份比对已完成'
            : '等待现场识别'
          : arrivalStageStatus.value === 'WARNING'
            ? '存在身份风险'
            : arrivalStageStatus.value === 'COMPLETED'
              ? '辅助验收已完成'
              : '多模态验收',
      status: arrivalStageStatus.value,
    },
  ])

  const currentStatusText = computed(() => {
    if (currentStage.value === 'COMPLETED') {
      if (reviewDecision.value === 'ACCEPTED') {
        return '辅助验收已完成，材料进入常规验收流程'
      }

      return '风险处置已记录，等待后续人工复核'
    }

    if (currentStage.value === 'RISK_REVIEW') {
      return '综合风险分析已完成，等待监理处置'
    }

    if (currentStage.value === 'ARRIVAL_VERIFY') {
      if (riskGenerationStatus.value === 'GENERATING') {
        return '正在生成综合风险说明'
      }

      if (arrivalRecognitionStatus.value === 'RECOGNIZING') {
        return '正在核验到场材料身份'
      }

      if (arrivalRecognitionStatus.value === 'SUCCEEDED') {
        return '到场身份核验完成，等待风险分析'
      }

      return '车辆已到场，等待材料身份核验'
    }

    if (currentStage.value === 'IN_TRANSIT') {
      if (transportStatus.value === 'RUNNING') {
        return `材料运输中，当前进度 ${transportProgress.value}%`
      }

      return '出厂建档已完成，等待开始运输'
    }

    if (recognitionStatus.value === 'RECOGNIZING') {
      return '正在生成出厂数字档案'
    }

    if (recognitionStatus.value === 'SUCCEEDED') {
      return '识别完成，等待确认建档'
    }

    return '待完成出厂建档'
  })

  const materialArchive = computed<MaterialArchiveSnapshot>(() => {
    const factoryRecognition =
      recognitionArchivePresentation[recognitionStatus.value]
    const arrivalRecognition =
      recognitionArchivePresentation[arrivalRecognitionStatus.value]
    const orderMismatchCount = orderCompareRows.value.filter(
      (row) => row.result === 'MISMATCH',
    ).length
    const arrivalMismatchCount = arrivalCompareRows.value.filter(
      (row) => row.result === 'MISMATCH',
    ).length
    const trajectoryStarted = transportStatus.value !== 'IDLE'
    const transportFinished = transportStatus.value === 'ARRIVED'
    const arrivalCompared = arrivalRecognitionResult.value !== null
    const selectedReview = reviewDecision.value
      ? reviewDecisionPresentation[reviewDecision.value]
      : { label: '尚未人工处置', tone: 'MUTED' as const }

    let archiveStatusLabel = '待完成出厂识别'
    let archiveStatusTone: ArchiveStatusTone = 'MUTED'

    if (isArchiveConfirmed.value) {
      archiveStatusLabel = '已确认建档'
      archiveStatusTone = 'SUCCESS'
    } else if (recognitionStatus.value === 'SUCCEEDED') {
      archiveStatusLabel = '待确认建档'
      archiveStatusTone = 'WARNING'
    } else if (recognitionStatus.value === 'RECOGNIZING') {
      archiveStatusLabel = '正在生成档案'
      archiveStatusTone = 'PRIMARY'
    }

    let transportStatusLabel = isArchiveConfirmed.value
      ? '待发车'
      : '运输任务待建立'
    let transportStatusTone: ArchiveStatusTone = 'MUTED'

    if (transportStatus.value === 'RUNNING') {
      transportStatusLabel = '运输进行中'
      transportStatusTone =
        transportAnomalies.value.length > 0 ? 'WARNING' : 'PRIMARY'
    } else if (transportFinished) {
      transportStatusLabel =
        transportAnomalies.value.length > 0
          ? '已到场（存在异常）'
          : '已正常到场'
      transportStatusTone =
        transportAnomalies.value.length > 0 ? 'WARNING' : 'SUCCESS'
    }

    let arrivalVerificationLabel = '待车辆到场'
    let arrivalVerificationTone: ArchiveStatusTone = 'MUTED'

    if (arrivalCompared) {
      arrivalVerificationLabel =
        arrivalMismatchCount > 0 ? '身份字段存在冲突' : '身份字段一致'
      arrivalVerificationTone =
        arrivalMismatchCount > 0 ? 'DANGER' : 'SUCCESS'
    } else if (
      arrivalRecognitionStatus.value === 'RECOGNIZING' ||
      arrivalRecognitionStatus.value === 'READY'
    ) {
      arrivalVerificationLabel =
        arrivalRecognitionStatus.value === 'RECOGNIZING'
          ? '到场识别处理中'
          : '等待开始到场识别'
      arrivalVerificationTone =
        arrivalRecognitionStatus.value === 'RECOGNIZING'
          ? 'PRIMARY'
          : 'WARNING'
    } else if (currentStage.value === 'ARRIVAL_VERIFY') {
      arrivalVerificationLabel = '等待采集到场铭牌'
      arrivalVerificationTone = 'WARNING'
    }

    let overviewVerificationStatus = archiveStatusLabel
    let overviewVerificationTone: ArchiveStatusTone =
      archiveStatusTone

    if (currentStage.value === 'IN_TRANSIT') {
      overviewVerificationStatus = transportStatusLabel
      overviewVerificationTone = transportStatusTone
    } else if (currentStage.value === 'ARRIVAL_VERIFY') {
      overviewVerificationStatus = arrivalVerificationLabel
      overviewVerificationTone = arrivalVerificationTone
    } else if (currentStage.value === 'RISK_REVIEW') {
      overviewVerificationStatus = '等待人工验收处置'
      overviewVerificationTone =
        riskReport.value?.riskLevel === 'HIGH' ? 'DANGER' : 'WARNING'
    } else if (currentStage.value === 'COMPLETED') {
      overviewVerificationStatus = selectedReview.label
      overviewVerificationTone = selectedReview.tone
    }

    const stageLabels: Record<DeliveryStage, string> = {
      FACTORY_ARCHIVE: '出厂建档',
      IN_TRANSIT: '运输追溯',
      ARRIVAL_VERIFY: '到场核验',
      RISK_REVIEW: '综合风险复核',
      COMPLETED: '人工处置完成',
    }

    const activeLastPoint =
      activeTrajectory.value[activeTrajectory.value.length - 1]
    const visiblePointCount = trajectoryStarted
      ? visibleTrajectoryPoints.value.length
      : 0
    const latestTrajectoryTime = trajectoryStarted
      ? currentTransportPoint.value?.time ?? '—'
      : '—'

    return {
      overview: {
        archiveId: materialDisplayId.value,
        purchaseOrderId: purchaseOrder.purchaseOrderId,
        materialName: purchaseOrder.materialName,
        grade: purchaseOrder.grade,
        specification: purchaseOrder.specification,
        manufacturer:
          recognitionResult.value?.manufacturer ?? '待识别',
        batchNo: recognitionResult.value?.batchNo ?? '待识别',
        furnaceNo: recognitionResult.value?.furnaceNo ?? '待识别',
        productionDate:
          recognitionResult.value?.productionDate ?? '待识别',
        currentStage: stageLabels[currentStage.value],
        verificationStatus: overviewVerificationStatus,
        verificationTone: overviewVerificationTone,
        scenarioLabel:
          scenarioType.value === 'NORMAL'
            ? '正常交付案例'
            : '异常交付案例',
        createdAt: isArchiveConfirmed.value
          ? '2026-07-25 12:56'
          : '待确认建档后生成',
      },
      purchaseOrder: { ...purchaseOrder },
      factory: {
        certificateFile: toArchiveFileSnapshot(certificateFile.value),
        nameplateFile: toArchiveFileSnapshot(nameplateFile.value),
        recognitionStatus: recognitionStatus.value,
        recognitionStatusLabel: factoryRecognition.label,
        recognitionTone: factoryRecognition.tone,
        recognitionResult: recognitionResult.value,
        recognitionMeta: recognitionMeta.value,
        compareRows: orderCompareRows.value,
        matchCount:
          orderCompareRows.value.length - orderMismatchCount,
        mismatchCount: orderMismatchCount,
        archiveStatusLabel,
        archiveStatusTone,
      },
      transport: {
        task: transportTask,
        status: transportStatus.value,
        statusLabel: transportStatusLabel,
        statusTone: transportStatusTone,
        startedAt: trajectoryStarted
          ? transportTask.plannedStartTime
          : '尚未发车',
        plannedArrivalAt: transportTask.plannedArrivalTime,
        actualArrivalAt:
          transportFinished && activeLastPoint
            ? `2026-07-25 ${activeLastPoint.time}`
            : '尚未到场',
        progress: transportProgress.value,
        trajectoryPointCount: visiblePointCount,
        anomalyCount: transportAnomalies.value.length,
        anomalies: transportAnomalies.value,
      },
      arrival: {
        nameplateFile: toArchiveFileSnapshot(arrivalFile.value),
        recognitionStatus: arrivalRecognitionStatus.value,
        recognitionStatusLabel: arrivalRecognition.label,
        recognitionTone: arrivalRecognition.tone,
        recognitionResult: arrivalRecognitionResult.value,
        recognitionMeta: arrivalRecognitionMeta.value,
        compareRows: arrivalCompareRows.value,
        matchCount:
          arrivalCompareRows.value.length - arrivalMismatchCount,
        mismatchCount: arrivalMismatchCount,
        verificationStatusLabel: arrivalVerificationLabel,
        verificationStatusTone: arrivalVerificationTone,
      },
      evidenceItems: [
        {
          id: 'purchase-order',
          name: '采购订单',
          type: '结构化订单',
          time: '2026-07-25 12:50',
          status: '已载入',
          statusTone: 'SUCCESS',
          sourceStage: '采购订单',
          isObtained: true,
          sourceNote: '演示数据',
        },
        {
          id: 'factory-certificate',
          name: '出厂质量证明书',
          type: certificateFile.value?.mimeType ?? '质量凭证',
          time: certificateFile.value
            ? '2026-07-25 12:51'
            : '—',
          status: certificateFile.value ? '已选择' : '待补充',
          statusTone: certificateFile.value ? 'SUCCESS' : 'MUTED',
          sourceStage: '出厂建档',
          isObtained: certificateFile.value !== null,
          sourceNote: certificateFile.value ? '本地文件' : '待补充',
        },
        {
          id: 'factory-nameplate',
          name: '出厂铭牌',
          type: nameplateFile.value?.mimeType ?? '图片凭证',
          time: nameplateFile.value
            ? '2026-07-25 12:52'
            : '—',
          status: nameplateFile.value ? '已选择' : '待补充',
          statusTone: nameplateFile.value ? 'SUCCESS' : 'MUTED',
          sourceStage: '出厂建档',
          isObtained: nameplateFile.value !== null,
          sourceNote: nameplateFile.value ? '本地文件' : '待补充',
        },
        {
          id: 'factory-recognition',
          name: '出厂识别结果',
          type: '结构化识别',
          time:
            recognitionStatus.value === 'SUCCEEDED'
              ? '2026-07-25 12:55'
              : '—',
          status: factoryRecognition.label,
          statusTone: factoryRecognition.tone,
          sourceStage: '出厂建档',
          isObtained: recognitionResult.value !== null,
          sourceNote:
            recognitionMeta.value?.source === 'REAL'
              ? '真实模型'
              : recognitionResult.value !== null
                ? '演示数据'
                : '待补充',
        },
        {
          id: 'transport-trajectory',
          name: '运输轨迹',
          type: '轨迹点集合',
          time: latestTrajectoryTime,
          status: trajectoryStarted
            ? `${visiblePointCount} 个轨迹点`
            : '尚未开始',
          statusTone: transportFinished
            ? 'SUCCESS'
            : trajectoryStarted
              ? 'PRIMARY'
              : 'MUTED',
          sourceStage: '运输追溯',
          isObtained: trajectoryStarted,
          sourceNote: trajectoryStarted ? '演示数据' : '待补充',
        },
        {
          id: 'transport-anomalies',
          name: '运输异常记录',
          type: '规则检测结果',
          time:
            transportAnomalies.value[
              transportAnomalies.value.length - 1
            ]?.time ?? (transportFinished ? latestTrajectoryTime : '—'),
          status:
            transportAnomalies.value.length > 0
              ? `${transportAnomalies.value.length} 项异常`
              : transportFinished
                ? '未发现异常'
                : trajectoryStarted
                  ? '监测中'
                  : '尚未分析',
          statusTone:
            transportAnomalies.value.length > 0
              ? 'WARNING'
              : transportFinished
                ? 'SUCCESS'
                : trajectoryStarted
                  ? 'PRIMARY'
                  : 'MUTED',
          sourceStage: '运输追溯',
          isObtained: trajectoryStarted,
          sourceNote: trajectoryStarted ? '演示数据' : '待补充',
        },
        {
          id: 'arrival-nameplate',
          name: '到场铭牌',
          type: arrivalFile.value?.mimeType ?? '图片凭证',
          time: arrivalFile.value
            ? '2026-07-25 15:50'
            : '—',
          status: arrivalFile.value ? '已选择' : '待补充',
          statusTone: arrivalFile.value ? 'SUCCESS' : 'MUTED',
          sourceStage: '到场核验',
          isObtained: arrivalFile.value !== null,
          sourceNote: arrivalFile.value ? '本地文件' : '待补充',
        },
        {
          id: 'arrival-recognition',
          name: '到场识别结果',
          type: '结构化识别',
          time:
            arrivalRecognitionStatus.value === 'SUCCEEDED'
              ? '2026-07-25 15:52'
              : '—',
          status: arrivalRecognition.label,
          statusTone: arrivalRecognition.tone,
          sourceStage: '到场核验',
          isObtained: arrivalRecognitionResult.value !== null,
          sourceNote:
            arrivalRecognitionMeta.value?.source === 'REAL'
              ? '真实模型'
              : arrivalRecognitionResult.value !== null
                ? '演示数据'
                : '待补充',
        },
        {
          id: 'identity-compare',
          name: '身份字段比对',
          type: '确定性规则结果',
          time: arrivalCompared ? '2026-07-25 15:52' : '—',
          status: arrivalCompared
            ? arrivalMismatchCount > 0
              ? `${arrivalMismatchCount} 项冲突`
              : '全部一致'
            : '待核验',
          statusTone: arrivalCompared
            ? arrivalMismatchCount > 0
              ? 'DANGER'
              : 'SUCCESS'
            : 'MUTED',
          sourceStage: '到场核验',
          isObtained: arrivalCompared,
          sourceNote: arrivalCompared ? '演示数据' : '待补充',
        },
        {
          id: 'manual-review',
          name: '人工处置结果',
          type: '人工验收记录',
          time: reviewDecision.value
            ? '2026-07-25 15:56'
            : '—',
          status: selectedReview.label,
          statusTone: selectedReview.tone,
          sourceStage: '人工验收',
          isObtained: reviewDecision.value !== null,
          sourceNote:
            reviewDecision.value !== null ? '演示数据' : '待补充',
        },
      ],
      timelineItems: timelineEvents.value.map((event) => ({
        ...event,
        businessStage: getArchiveBusinessStage(event.id),
        levelLabel: timelineLevelLabels[event.level],
        levelTone: timelineLevelTones[event.level],
      })),
      reviewDecision: reviewDecision.value,
      reviewDecisionLabel: selectedReview.label,
      reviewDecisionTone: selectedReview.tone,
    }
  })

  const mapStatusText = computed(() => {
    if (
      currentStage.value === 'ARRIVAL_VERIFY' ||
      currentStage.value === 'RISK_REVIEW' ||
      currentStage.value === 'COMPLETED'
    ) {
      return transportAnomalies.value.length > 0
        ? `运输已结束 · ${transportAnomalies.value.length} 项异常`
        : '运输已结束 · 未发现轨迹异常'
    }

    if (transportStatus.value === 'RUNNING') {
      return `运输进行中 · ${transportProgress.value}%`
    }

    if (currentStage.value === 'IN_TRANSIT') {
      return '材料档案已建立，等待开始运输'
    }

    return '等待完成出厂建档'
  })

  const addTimelineEvent = (event: DeliveryTimelineEvent) => {
    if (appendedEventIds.has(event.id)) {
      return
    }

    appendedEventIds.add(event.id)
    timelineEvents.value = [...timelineEvents.value, event]
  }

  const releaseObjectUrl = (uploadFile: LocalUploadFile | null) => {
    if (uploadFile?.previewUrl) {
      URL.revokeObjectURL(uploadFile.previewUrl)
    }
  }

  const releaseAllObjectUrls = () => {
    releaseObjectUrl(certificateFile.value)
    releaseObjectUrl(nameplateFile.value)
    releaseObjectUrl(arrivalFile.value)
  }

  const createLocalUploadFile = (file: File): LocalUploadFile => {
    const localFile: LocalUploadFile = {
      file,
      fileName: file.name,
      mimeType: file.type,
    }

    if (file.type.startsWith('image/')) {
      localFile.previewUrl = URL.createObjectURL(file)
    }

    return localFile
  }

  const validateFile = (
    file: File,
    allowedMimeTypes: Set<string>,
    label: string,
  ) => {
    if (!allowedMimeTypes.has(file.type)) {
      ElMessage.error(`${label}文件格式不支持，请重新选择`)
      return false
    }

    if (file.size > MAX_FILE_SIZE) {
      ElMessage.error(`${label}文件不能超过 10 MB`)
      return false
    }

    return true
  }

  const delay = (duration: number) =>
    new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        pendingDelays.delete(timer)
        resolve()
      }, duration)

      pendingDelays.set(timer, resolve)
    })

  const clearPendingDelays = () => {
    pendingDelays.forEach((resolve, timer) => {
      clearTimeout(timer)
      resolve()
    })
    pendingDelays.clear()
  }

  const cancelRecognitionTask = () => {
    recognitionRunId += 1
    factoryRecognitionController?.abort()
    factoryRecognitionController = null
    clearPendingDelays()
  }

  const cancelTransportTask = () => {
    transportRunId += 1
    clearPendingDelays()
  }

  const cancelArrivalRecognitionTask = () => {
    arrivalRecognitionRunId += 1
    arrivalRecognitionController?.abort()
    arrivalRecognitionController = null
    clearPendingDelays()
  }

  const cancelRiskGenerationTask = () => {
    riskGenerationRunId += 1
    clearPendingDelays()
  }

  const refreshRecognitionReadiness = () => {
    recognitionStatus.value =
      certificateFile.value && nameplateFile.value ? 'READY' : 'IDLE'
    recognitionStepText.value =
      recognitionStatus.value === 'READY'
        ? '材料凭证已就绪，可以开始识别'
        : '等待选择出厂材料凭证'
  }

  const invalidateRecognitionResult = () => {
    cancelRecognitionTask()
    recognitionResult.value = null
    recognitionMeta.value = null
    recognitionError.value = null
    recognitionProgress.value = 0
    refreshRecognitionReadiness()
  }

  const selectCertificate = (file: File) => {
    if (!validateFile(file, CERTIFICATE_MIME_TYPES, '质量证明书')) {
      return
    }

    invalidateRecognitionResult()
    releaseObjectUrl(certificateFile.value)
    certificateFile.value = createLocalUploadFile(file)
    refreshRecognitionReadiness()
    addTimelineEvent({
      id: 'certificate-selected',
      time: '12:51',
      title: '质量证明书已选择',
      description: file.name,
      level: 'INFO',
      occurred: true,
    })
  }

  const selectNameplate = (file: File) => {
    if (!validateFile(file, NAMEPLATE_MIME_TYPES, '材料铭牌')) {
      return
    }

    invalidateRecognitionResult()
    releaseObjectUrl(nameplateFile.value)
    nameplateFile.value = createLocalUploadFile(file)
    refreshRecognitionReadiness()
    addTimelineEvent({
      id: 'nameplate-selected',
      time: '12:52',
      title: '材料铭牌照片已选择',
      description: file.name,
      level: 'INFO',
      occurred: true,
    })
  }

  const removeCertificate = () => {
    invalidateRecognitionResult()
    releaseObjectUrl(certificateFile.value)
    certificateFile.value = null
    refreshRecognitionReadiness()
  }

  const removeNameplate = () => {
    invalidateRecognitionResult()
    releaseObjectUrl(nameplateFile.value)
    nameplateFile.value = null
    refreshRecognitionReadiness()
  }

  const startRecognition = async () => {
    if (!canStartRecognition.value) {
      return
    }

    cancelRecognitionTask()
    const runId = recognitionRunId

    recognitionStatus.value = 'RECOGNIZING'
    recognitionResult.value = null
    recognitionMeta.value = null
    recognitionError.value = null
    recognitionProgress.value = 0

    try {
      if (recognitionMode.value === 'MOCK') {
        for (const step of recognitionSteps) {
          if (runId !== recognitionRunId) {
            return
          }

          recognitionStepText.value = step.text
          recognitionProgress.value = step.progress
          await delay(480)

          if (runId !== recognitionRunId) {
            return
          }
        }

        recognitionResult.value = { ...factoryRecognition }
        recognitionMeta.value = createMockRecognitionMeta(
          'factory',
          runId,
          recognitionSteps.length * 480,
        )
      } else {
        const certificate = certificateFile.value?.file
        const nameplate = nameplateFile.value?.file

        if (!certificate || !nameplate) {
          return
        }

        const controller = new AbortController()
        factoryRecognitionController = controller
        recognitionStepText.value = '正在上传凭证至本地识别网关……'
        recognitionProgress.value = 18
        await delay(180)

        if (runId !== recognitionRunId) {
          return
        }

        recognitionStepText.value = '多模态模型正在解析质量证明书与铭牌……'
        recognitionProgress.value = 52
        const response = await recognizeFactoryMaterial(
          certificate,
          nameplate,
          controller.signal,
        )

        if (runId !== recognitionRunId) {
          return
        }

        recognitionStepText.value = '正在校验结构化字段并匹配采购订单……'
        recognitionProgress.value = 86
        recognitionResult.value = response.recognition
        recognitionMeta.value = response.meta
        await delay(180)
        recognitionProgress.value = 100
      }

      recognitionStatus.value = 'SUCCEEDED'
      recognitionStepText.value = '识别完成。'
      addTimelineEvent({
        id: 'factory-recognition-completed',
        time: '12:55',
        title:
          recognitionMode.value === 'REAL'
            ? '真实多模态识别已完成'
            : 'Mock AI 识别已完成',
        description:
          recognitionMode.value === 'REAL'
            ? `出厂凭证已由 ${recognitionMeta.value?.model ?? '多模态模型'} 完成结构化提取。`
            : '出厂材料字段提取完成，采购订单比对结果全部一致。',
        level: 'SUCCESS',
        occurred: true,
      })
      ElMessage.success(
        recognitionMode.value === 'REAL'
          ? '真实多模态识别完成'
          : 'Mock AI 识别完成',
      )
    } catch (error) {
      if (runId !== recognitionRunId) {
        return
      }

      if (isAbortError(error)) {
        return
      }

      recognitionStatus.value = 'FAILED'
      recognitionProgress.value = 0
      recognitionError.value = recognitionErrorMessage(error)
      recognitionStepText.value = recognitionError.value
      ElMessage.error(recognitionError.value)
    } finally {
      if (runId === recognitionRunId) {
        factoryRecognitionController = null
      }
    }
  }

  const confirmArchive = () => {
    if (!canConfirmArchive.value) {
      return
    }

    isArchiveConfirmed.value = true
    materialId.value = 'MAT-2026-0018'
    currentStage.value = 'IN_TRANSIT'

    addTimelineEvent({
      id: 'factory-archive-created',
      time: '12:56',
      title: '材料数字档案已创建',
      description: '档案编号 MAT-2026-0018，出厂材料信息已完成可信建档。',
      level: 'SUCCESS',
      occurred: true,
    })
    addTimelineEvent({
      id: 'transport-pending',
      time: '12:57',
      title: '等待开始运输',
      description: '运输阶段已就绪，车辆当前处于等待发车状态。',
      level: 'PENDING',
      occurred: false,
    })
    ElMessage.success('材料数字档案已创建，已进入运输阶段')
  }

  const recordTransportPointEvent = (
    point: TransportTrajectoryPoint,
  ) => {
    const event = point.event

    if (!event) {
      return
    }

    addTimelineEvent({
      id: `transport-${event.type.toLowerCase()}`,
      time: point.time,
      title: event.title,
      description: event.description,
      level: event.level,
      occurred: true,
    })

    if (event.isAnomaly) {
      const anomalyId = `anomaly-${event.type.toLowerCase()}`

      if (
        !transportAnomalies.value.some(
          (anomaly) => anomaly.id === anomalyId,
        )
      ) {
        transportAnomalies.value = [
          ...transportAnomalies.value,
          {
            id: anomalyId,
            type: event.type,
            title: event.title,
            description: event.description,
            time: point.time,
            level: event.level,
            pointId: point.id,
          },
        ]
      }
    }
  }

  const startTransport = async () => {
    if (!canStartTransport.value) {
      return
    }

    cancelTransportTask()
    const runId = transportRunId
    const trajectory = activeTrajectory.value

    transportStatus.value = 'RUNNING'
    transportPointIndex.value = 0
    transportProgress.value = 0
    transportAnomalies.value = []

    const departurePoint = trajectory[0]

    if (departurePoint) {
      recordTransportPointEvent(departurePoint)
    }

    for (let index = 1; index < trajectory.length; index += 1) {
      await delay(620)

      if (runId !== transportRunId) {
        return
      }

      const point = trajectory[index]

      if (!point) {
        continue
      }

      transportPointIndex.value = index
      transportProgress.value = Math.round(
        (index / (trajectory.length - 1)) * 100,
      )
      recordTransportPointEvent(point)
    }

    if (runId !== transportRunId) {
      return
    }

    transportStatus.value = 'ARRIVED'
    currentStage.value = 'ARRIVAL_VERIFY'
    ElMessage.success(
      transportAnomalies.value.length > 0
        ? '车辆已到场，运输过程存在需核查事件'
        : '车辆已按计划到场，运输过程未发现明显异常',
    )
  }

  const selectArrivalFile = (file: File) => {
    if (!validateFile(file, NAMEPLATE_MIME_TYPES, '到场铭牌')) {
      return
    }

    cancelArrivalRecognitionTask()
    cancelRiskGenerationTask()
    releaseObjectUrl(arrivalFile.value)
    arrivalFile.value = createLocalUploadFile(file)
    arrivalRecognitionStatus.value = 'READY'
    arrivalRecognitionStepText.value = '到场铭牌已就绪，可以开始识别'
    arrivalRecognitionProgress.value = 0
    arrivalRecognitionResult.value = null
    arrivalRecognitionMeta.value = null
    arrivalRecognitionError.value = null
    riskGenerationStatus.value = 'IDLE'
    riskGenerationStepText.value = '等待完成到场身份核验'
    riskGenerationProgress.value = 0
    riskReport.value = null
    reviewDecision.value = null
    addTimelineEvent({
      id: 'arrival-nameplate-selected',
      time: '15:50',
      title: '到场铭牌照片已选择',
      description: file.name,
      level: 'INFO',
      occurred: true,
    })
  }

  const removeArrivalFile = () => {
    cancelArrivalRecognitionTask()
    cancelRiskGenerationTask()
    releaseObjectUrl(arrivalFile.value)
    arrivalFile.value = null
    arrivalRecognitionStatus.value = 'IDLE'
    arrivalRecognitionStepText.value = '等待选择到场铭牌照片'
    arrivalRecognitionProgress.value = 0
    arrivalRecognitionResult.value = null
    arrivalRecognitionMeta.value = null
    arrivalRecognitionError.value = null
    riskGenerationStatus.value = 'IDLE'
    riskGenerationStepText.value = '等待完成到场身份核验'
    riskGenerationProgress.value = 0
    riskReport.value = null
    reviewDecision.value = null
  }

  const startArrivalRecognition = async () => {
    if (!canStartArrivalRecognition.value) {
      return
    }

    cancelArrivalRecognitionTask()
    const runId = arrivalRecognitionRunId

    arrivalRecognitionStatus.value = 'RECOGNIZING'
    arrivalRecognitionResult.value = null
    arrivalRecognitionMeta.value = null
    arrivalRecognitionError.value = null
    arrivalRecognitionProgress.value = 0

    try {
      if (recognitionMode.value === 'MOCK') {
        for (const step of arrivalRecognitionSteps) {
          if (runId !== arrivalRecognitionRunId) {
            return
          }

          arrivalRecognitionStepText.value = step.text
          arrivalRecognitionProgress.value = step.progress
          await delay(460)

          if (runId !== arrivalRecognitionRunId) {
            return
          }
        }

        arrivalRecognitionResult.value = {
          ...(scenarioType.value === 'ABNORMAL'
            ? abnormalArrivalMaterial
            : normalArrivalMaterial),
        }
        arrivalRecognitionMeta.value = createMockRecognitionMeta(
          'arrival',
          runId,
          arrivalRecognitionSteps.length * 460,
        )
      } else {
        const nameplate = arrivalFile.value?.file

        if (!nameplate) {
          return
        }

        const controller = new AbortController()
        arrivalRecognitionController = controller
        arrivalRecognitionStepText.value =
          '正在上传到场铭牌至本地识别网关……'
        arrivalRecognitionProgress.value = 24
        await delay(160)

        if (runId !== arrivalRecognitionRunId) {
          return
        }

        arrivalRecognitionStepText.value =
          '多模态模型正在提取到场材料身份……'
        arrivalRecognitionProgress.value = 58
        const response = await recognizeArrivalMaterial(
          nameplate,
          controller.signal,
        )

        if (runId !== arrivalRecognitionRunId) {
          return
        }

        arrivalRecognitionStepText.value =
          '正在与出厂数字档案进行确定性比对……'
        arrivalRecognitionProgress.value = 86
        arrivalRecognitionResult.value = response.recognition
        arrivalRecognitionMeta.value = response.meta
        await delay(160)
        arrivalRecognitionProgress.value = 100
      }

      arrivalRecognitionStatus.value = 'SUCCEEDED'
      arrivalRecognitionStepText.value = '到场身份核验完成。'
      riskGenerationStepText.value =
        '身份核验已完成，可以生成综合风险说明'

      addTimelineEvent({
        id: 'arrival-recognition-completed',
        time: '15:52',
        title:
          recognitionMode.value === 'REAL'
            ? '真实到场铭牌识别已完成'
            : '到场铭牌识别已完成',
        description:
          recognitionMode.value === 'REAL'
            ? `现场铭牌已由 ${arrivalRecognitionMeta.value?.model ?? '多模态模型'} 提取，并完成出厂档案首尾比对。`
            : '现场材料身份字段已提取，并完成出厂档案首尾比对。',
        level: 'SUCCESS',
        occurred: true,
      })

      if (hasIdentityMismatch.value) {
        const mismatchFields = arrivalCompareRows.value
          .filter((row) => row.result === 'MISMATCH')
          .map((row) => row.fieldLabel)
          .join('、')

        addTimelineEvent({
          id: 'arrival-identity-mismatch',
          time: '15:53',
          title: '发现到场身份字段冲突',
          description: `到场材料的${mismatchFields}与出厂数字档案不一致。`,
          level: 'DANGER',
          occurred: true,
        })
        ElMessage.warning('到场材料存在身份字段冲突')
        return
      }

      ElMessage.success('到场材料身份核验完成，关键字段全部一致')
    } catch (error) {
      if (runId !== arrivalRecognitionRunId) {
        return
      }

      if (isAbortError(error)) {
        return
      }

      arrivalRecognitionStatus.value = 'FAILED'
      arrivalRecognitionProgress.value = 0
      arrivalRecognitionError.value = recognitionErrorMessage(error)
      arrivalRecognitionStepText.value = arrivalRecognitionError.value
      ElMessage.error(arrivalRecognitionError.value)
    } finally {
      if (runId === arrivalRecognitionRunId) {
        arrivalRecognitionController = null
      }
    }
  }

  const cloneRiskFactByLabel = (
    report: RiskReport,
    label: string,
  ): RiskFact | null => {
    const fact = report.confirmedFacts.find(
      (candidate) => candidate.label === label,
    )
    return fact ? { ...fact } : null
  }

  const createIdentityMismatchText = (
    mismatchRows: MaterialCompareRow[],
  ) => {
    const onlyMismatch = mismatchRows[0]

    if (
      mismatchRows.length === 1 &&
      onlyMismatch?.fieldKey === 'batchNo'
    ) {
      return `到场批次号 ${onlyMismatch.arrivalValue} 与出厂批次号 ${onlyMismatch.factoryValue} 不一致`
    }

    if (mismatchRows.length === 1 && onlyMismatch) {
      return `到场${onlyMismatch.fieldLabel}“${onlyMismatch.arrivalValue}”与出厂档案“${onlyMismatch.factoryValue}”不一致`
    }

    const fieldLabels = mismatchRows
      .map((row) => row.fieldLabel)
      .join('、')
    return `到场材料的${fieldLabels}共 ${mismatchRows.length} 项身份字段与出厂档案不一致`
  }

  const buildCurrentRiskReport = (): RiskReport => {
    const mismatchRows = identityMismatchRows.value
    const hasTransportRisk = transportAnomalies.value.length > 0
    const hasIdentityRisk = mismatchRows.length > 0
    const hasBatchRisk = mismatchRows.some(
      (row) => row.fieldKey === 'batchNo',
    )

    if (!hasTransportRisk && !hasIdentityRisk) {
      return {
        ...normalRiskReport,
        confirmedFacts: normalRiskReport.confirmedFacts.map((fact) => ({
          ...fact,
        })),
        recommendations: [...normalRiskReport.recommendations],
      }
    }

    const confirmedFacts: RiskFact[] = []
    const identityTemplate = cloneRiskFactByLabel(
      abnormalRiskReport,
      '严重冲突',
    )
    const identitySuccess = cloneRiskFactByLabel(
      normalRiskReport,
      '身份一致',
    )

    if (hasIdentityRisk && identityTemplate) {
      confirmedFacts.push({
        ...identityTemplate,
        text: createIdentityMismatchText(mismatchRows),
      })
    } else if (identitySuccess) {
      confirmedFacts.push(identitySuccess)
    }

    if (hasTransportRisk) {
      const addedFactLabels = new Set<string>()

      transportAnomalies.value.forEach((anomaly) => {
        const factLabel = transportRiskFactLabels[anomaly.type]

        if (!factLabel || addedFactLabels.has(factLabel)) {
          return
        }

        const fact = cloneRiskFactByLabel(
          abnormalRiskReport,
          factLabel,
        )

        if (fact) {
          addedFactLabels.add(factLabel)
          confirmedFacts.push(fact)
        }
      })
    } else {
      normalRiskReport.confirmedFacts
        .filter((fact) => fact.label !== '身份一致')
        .forEach((fact) => confirmedFacts.push({ ...fact }))
    }

    const recommendations =
      abnormalRiskReport.recommendations.filter((_, index) => {
        if (index === 0) {
          return hasTransportRisk
        }

        if (index === 1 || index === 2) {
          return hasBatchRisk
        }

        return index === 3 && hasIdentityRisk
      })

    let riskExplanation = abnormalRiskReport.riskExplanation

    if (hasTransportRisk && !hasIdentityRisk) {
      riskExplanation =
        '到场身份字段与出厂档案一致，但运输过程存在已确认异常；现有证据不能直接证明材料已被调换。'
    } else if (!hasTransportRisk && hasIdentityRisk) {
      riskExplanation =
        '运输过程未发现明显异常，但到场身份字段与出厂档案存在冲突，需要结合原始凭证进行人工复核。'
    }

    return {
      ...abnormalRiskReport,
      confirmedFacts,
      riskExplanation,
      recommendations,
    }
  }

  const generateRiskReport = async () => {
    if (!canGenerateRiskReport.value) {
      return
    }

    cancelRiskGenerationTask()
    const runId = riskGenerationRunId

    riskGenerationStatus.value = 'GENERATING'
    riskGenerationProgress.value = 0

    for (const step of riskGenerationSteps) {
      if (runId !== riskGenerationRunId) {
        return
      }

      riskGenerationStepText.value = step.text
      riskGenerationProgress.value = step.progress
      await delay(480)

      if (runId !== riskGenerationRunId) {
        return
      }
    }

    const sourceReport = buildCurrentRiskReport()

    riskReport.value = sourceReport
    riskGenerationStatus.value = 'SUCCEEDED'
    riskGenerationStepText.value = '综合风险说明已生成'
    currentStage.value = 'RISK_REVIEW'

    addTimelineEvent({
      id: 'risk-report-generated',
      time: '15:54',
      title: '综合风险说明已生成',
      description: `${sourceReport.riskLevel === 'HIGH' ? '高风险' : '低风险'} · ${sourceReport.acceptanceSuggestion}`,
      level:
        sourceReport.riskLevel === 'HIGH' ? 'WARNING' : 'SUCCESS',
      occurred: true,
    })
    ElMessage.success('综合风险说明已生成')
  }

  const completeReview = (decision: ReviewDecision) => {
    if (!riskReport.value || reviewDecision.value) {
      return
    }

    reviewDecision.value = decision
    currentStage.value = 'COMPLETED'

    const decisionCopy: Record<
      ReviewDecision,
      { title: string; description: string; level: 'SUCCESS' | 'WARNING' }
    > = {
      ACCEPTED: {
        title: '已确认进入常规验收',
        description: '系统建议已记录，最终验收仍由现场专业人员完成。',
        level: 'SUCCESS',
      },
      REVIEW_REQUIRED: {
        title: '已转人工复核',
        description: '材料身份和运输异常将交由监理工程师进一步核查。',
        level: 'WARNING',
      },
      DEFERRED: {
        title: '已暂缓本批次验收',
        description: '等待供应商补充材料和异常运输证明。',
        level: 'WARNING',
      },
    }
    const selectedDecision = decisionCopy[decision]

    addTimelineEvent({
      id: `review-${decision.toLowerCase()}`,
      time: '15:56',
      ...selectedDecision,
      occurred: true,
    })
    ElMessage.success('人工处置结果已记录')
  }

  const resetScenario = (showMessage = true) => {
    cancelRecognitionTask()
    cancelTransportTask()
    cancelArrivalRecognitionTask()
    cancelRiskGenerationTask()
    releaseAllObjectUrls()
    certificateFile.value = null
    nameplateFile.value = null
    recognitionStatus.value = 'IDLE'
    recognitionStepText.value = '等待选择出厂材料凭证'
    recognitionProgress.value = 0
    recognitionResult.value = null
    recognitionMeta.value = null
    recognitionError.value = null
    isArchiveConfirmed.value = false
    materialId.value = null
    transportStatus.value = 'IDLE'
    transportPointIndex.value = 0
    transportProgress.value = 0
    transportAnomalies.value = []
    arrivalFile.value = null
    arrivalRecognitionStatus.value = 'IDLE'
    arrivalRecognitionStepText.value = '等待选择到场铭牌照片'
    arrivalRecognitionProgress.value = 0
    arrivalRecognitionResult.value = null
    arrivalRecognitionMeta.value = null
    arrivalRecognitionError.value = null
    riskGenerationStatus.value = 'IDLE'
    riskGenerationStepText.value = '等待完成到场身份核验'
    riskGenerationProgress.value = 0
    riskReport.value = null
    reviewDecision.value = null
    currentStage.value = 'FACTORY_ARCHIVE'
    timelineEvents.value = [{ ...initialTimelineEvent }]
    appendedEventIds.clear()
    appendedEventIds.add(initialTimelineEvent.id)
    resetVersion.value += 1

    if (showMessage) {
      ElMessage.success('演示状态已完整重置')
    }
  }

  const switchScenario = (type: ScenarioType) => {
    resetScenario(false)
    scenarioType.value = type
    ElMessage.info(
      type === 'NORMAL'
        ? '已切换至正常交付案例，业务状态已重置'
        : '已切换至异常交付案例，业务状态已重置',
    )
  }

  const switchRecognitionMode = (mode: RecognitionMode) => {
    if (mode === recognitionMode.value) {
      return
    }

    resetScenario(false)
    recognitionMode.value = mode
    ElMessage.info(
      mode === 'REAL'
        ? '已切换至真实多模态识别，业务状态已重置'
        : '已切换至 Mock 演示识别，业务状态已重置',
    )
  }

  onBeforeUnmount(() => {
    recognitionRunId += 1
    transportRunId += 1
    arrivalRecognitionRunId += 1
    riskGenerationRunId += 1
    factoryRecognitionController?.abort()
    arrivalRecognitionController?.abort()
    clearPendingDelays()
    releaseAllObjectUrls()
  })

  return {
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
    materialId,
    materialDisplayId,
    transportStatus,
    transportProgress,
    transportAnomalies,
    currentTransportPoint,
    visibleTrajectoryPoints,
    activeTrajectory,
    plannedTrajectory: normalTrajectory,
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
  }
}
