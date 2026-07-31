import type {
  DeliveryTimelineEvent,
  RecognitionStatus,
  ReviewDecision,
  TimelineEventLevel,
  TransportAnomaly,
  TransportStatus,
} from '@/types/delivery'
import type {
  MaterialCompareRow,
  MaterialRecognition,
  OrderCompareRow,
  PurchaseOrder,
} from '@/types/material'
import type { RecognitionMeta } from '@/types/recognition'

export type ArchiveStatusTone =
  | 'PRIMARY'
  | 'SUCCESS'
  | 'WARNING'
  | 'DANGER'
  | 'MUTED'

export type ArchiveBusinessStage =
  | '采购订单'
  | '出厂建档'
  | '运输追溯'
  | '到场核验'
  | '人工验收'

export interface ArchiveFileSnapshot {
  fileName: string
  mimeType: string
  previewUrl?: string
}

export interface TransportTaskInfo {
  taskId: string
  vehicleNo: string
  origin: string
  destination: string
  plannedStartTime: string
  plannedArrivalTime: string
}

export interface ArchiveOverview {
  archiveId: string
  purchaseOrderId: string
  materialName: string
  grade: string
  specification: string
  manufacturer: string
  batchNo: string
  furnaceNo: string
  productionDate: string
  currentStage: string
  verificationStatus: string
  verificationTone: ArchiveStatusTone
  scenarioLabel: string
  createdAt: string
}

export interface ArchiveFactorySection {
  certificateFile: ArchiveFileSnapshot | null
  nameplateFile: ArchiveFileSnapshot | null
  recognitionStatus: RecognitionStatus
  recognitionStatusLabel: string
  recognitionTone: ArchiveStatusTone
  recognitionResult: MaterialRecognition | null
  recognitionMeta: RecognitionMeta | null
  compareRows: OrderCompareRow[]
  matchCount: number
  mismatchCount: number
  archiveStatusLabel: string
  archiveStatusTone: ArchiveStatusTone
}

export interface ArchiveTransportSection {
  task: TransportTaskInfo
  status: TransportStatus
  statusLabel: string
  statusTone: ArchiveStatusTone
  startedAt: string
  plannedArrivalAt: string
  actualArrivalAt: string
  progress: number
  trajectoryPointCount: number
  anomalyCount: number
  anomalies: TransportAnomaly[]
}

export interface ArchiveArrivalSection {
  nameplateFile: ArchiveFileSnapshot | null
  recognitionStatus: RecognitionStatus
  recognitionStatusLabel: string
  recognitionTone: ArchiveStatusTone
  recognitionResult: MaterialRecognition | null
  recognitionMeta: RecognitionMeta | null
  compareRows: MaterialCompareRow[]
  matchCount: number
  mismatchCount: number
  verificationStatusLabel: string
  verificationStatusTone: ArchiveStatusTone
}

export interface ArchiveEvidenceItem {
  id: string
  name: string
  type: string
  time: string
  status: string
  statusTone: ArchiveStatusTone
  sourceStage: ArchiveBusinessStage
  isObtained: boolean
  sourceNote: '本地文件' | '演示数据' | '真实模型' | '待补充'
}

export interface ArchiveTimelineItem extends DeliveryTimelineEvent {
  businessStage: ArchiveBusinessStage
  levelLabel: string
  levelTone: ArchiveStatusTone
}

export interface MaterialArchiveSnapshot {
  overview: ArchiveOverview
  purchaseOrder: PurchaseOrder
  factory: ArchiveFactorySection
  transport: ArchiveTransportSection
  arrival: ArchiveArrivalSection
  evidenceItems: ArchiveEvidenceItem[]
  timelineItems: ArchiveTimelineItem[]
  reviewDecision: ReviewDecision | null
  reviewDecisionLabel: string
  reviewDecisionTone: ArchiveStatusTone
}

export const timelineLevelLabels: Record<TimelineEventLevel, string> = {
  INFO: '信息',
  SUCCESS: '正常',
  WARNING: '警告',
  DANGER: '危险',
  PENDING: '待处理',
}
