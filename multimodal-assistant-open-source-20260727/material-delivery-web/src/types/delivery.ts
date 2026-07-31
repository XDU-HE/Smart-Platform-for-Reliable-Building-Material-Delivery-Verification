export type ScenarioType = 'NORMAL' | 'ABNORMAL'

export type DeliveryStage =
  | 'FACTORY_ARCHIVE'
  | 'IN_TRANSIT'
  | 'ARRIVAL_VERIFY'
  | 'RISK_REVIEW'
  | 'COMPLETED'

export type StageStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'WARNING'
  | 'FAILED'

export type RecognitionStatus =
  | 'IDLE'
  | 'READY'
  | 'RECOGNIZING'
  | 'SUCCEEDED'
  | 'FAILED'

export type TimelineEventLevel =
  | 'INFO'
  | 'SUCCESS'
  | 'WARNING'
  | 'DANGER'
  | 'PENDING'

export interface DeliveryTimelineEvent {
  id: string
  time: string
  title: string
  description?: string
  level: TimelineEventLevel
  occurred: boolean
}

export interface DeliveryStepItem {
  key: string
  title: string
  description?: string
  status: StageStatus
}

export type TransportStatus = 'IDLE' | 'RUNNING' | 'ARRIVED'

export type TransportEventType =
  | 'DEPARTED'
  | 'ROUTE_DEVIATION'
  | 'UNAUTHORIZED_STOP'
  | 'GPS_INTERRUPTED'
  | 'GPS_RECOVERED'
  | 'TRANSPORT_TIMEOUT'
  | 'ARRIVED'

export interface TransportPointEvent {
  type: TransportEventType
  title: string
  description: string
  level: TimelineEventLevel
  isAnomaly: boolean
}

export interface TransportTrajectoryPoint {
  id: string
  x: number
  y: number
  longitude: number
  latitude: number
  time: string
  speed: number
  event?: TransportPointEvent
}

export interface TransportAnomaly {
  id: string
  type: TransportEventType
  title: string
  description: string
  time: string
  level: TimelineEventLevel
  pointId: string
}

export type RiskGenerationStatus =
  | 'IDLE'
  | 'GENERATING'
  | 'SUCCEEDED'

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export type RiskFactLevel =
  | 'CRITICAL'
  | 'HIGH'
  | 'WARNING'
  | 'INTERRUPTED'
  | 'SUCCESS'

export interface RiskFact {
  text: string
  level: RiskFactLevel
  label: string
}

export type ReviewDecision =
  | 'ACCEPTED'
  | 'REVIEW_REQUIRED'
  | 'DEFERRED'

export interface RiskReport {
  riskLevel: RiskLevel
  confirmedFacts: RiskFact[]
  riskExplanation: string
  recommendations: string[]
  acceptanceSuggestion: string
}
