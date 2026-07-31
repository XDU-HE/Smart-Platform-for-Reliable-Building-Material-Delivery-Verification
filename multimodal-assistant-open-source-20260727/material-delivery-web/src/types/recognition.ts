import type { MaterialRecognition } from '@/types/material'

export type RecognitionMode = 'MOCK' | 'REAL'
export type RecognitionSource = 'MOCK' | 'REAL'

export interface RecognitionMeta {
  source: RecognitionSource
  model: string
  durationMs: number
  confidence: number
  requestId: string
}

export interface RecognitionApiResponse {
  recognition: MaterialRecognition
  meta: RecognitionMeta
}

export interface RecognitionApiError {
  code: string
  message: string
  requestId?: string
}
