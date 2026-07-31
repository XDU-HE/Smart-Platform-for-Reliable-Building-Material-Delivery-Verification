import type {
  RecognitionApiError,
  RecognitionApiResponse,
} from '@/types/recognition'

const DEFAULT_API_BASE_URL = 'http://localhost:8081/api'
const configuredApiBaseUrl =
  import.meta.env.VITE_RECOGNITION_API_BASE_URL?.trim()
const apiBaseUrl = (
  configuredApiBaseUrl || DEFAULT_API_BASE_URL
).replace(/\/+$/, '')

export class RecognitionRequestError extends Error {
  readonly code: string
  readonly requestId?: string

  constructor(error: RecognitionApiError) {
    super(error.message)
    this.name = 'RecognitionRequestError'
    this.code = error.code
    this.requestId = error.requestId
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const readError = async (response: Response): Promise<RecognitionApiError> => {
  try {
    const payload: unknown = await response.json()

    if (
      isRecord(payload) &&
      typeof payload.message === 'string' &&
      typeof payload.code === 'string'
    ) {
      return {
        code: payload.code,
        message: payload.message,
        requestId:
          typeof payload.requestId === 'string'
            ? payload.requestId
            : undefined,
      }
    }
  } catch {
    // 网关返回非 JSON 时使用统一提示，不暴露底层响应。
  }

  return {
    code: 'RECOGNITION_REQUEST_FAILED',
    message:
      response.status === 0
        ? '无法连接多模态识别网关'
        : `识别网关请求失败（HTTP ${response.status}）`,
  }
}

const isRecognitionResponse = (
  value: unknown,
): value is RecognitionApiResponse => {
  if (!isRecord(value) || !isRecord(value.recognition) || !isRecord(value.meta)) {
    return false
  }

  const recognition = value.recognition
  const meta = value.meta

  return (
    typeof recognition.manufacturer === 'string' &&
    typeof recognition.materialName === 'string' &&
    typeof recognition.grade === 'string' &&
    typeof recognition.specification === 'string' &&
    typeof recognition.batchNo === 'string' &&
    meta.source === 'REAL' &&
    typeof meta.model === 'string' &&
    typeof meta.durationMs === 'number' &&
    typeof meta.confidence === 'number' &&
    typeof meta.requestId === 'string'
  )
}

const submit = async (
  endpoint: 'factory' | 'arrival',
  formData: FormData,
  signal: AbortSignal,
): Promise<RecognitionApiResponse> => {
  let response: Response

  try {
    response = await fetch(`${apiBaseUrl}/recognition/${endpoint}`, {
      method: 'POST',
      body: formData,
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }

    throw new RecognitionRequestError({
      code: 'GATEWAY_UNREACHABLE',
      message: '无法连接多模态识别网关，请确认本地 8081 服务已启动',
    })
  }

  if (!response.ok) {
    throw new RecognitionRequestError(await readError(response))
  }

  const payload: unknown = await response.json()
  if (!isRecognitionResponse(payload)) {
    throw new RecognitionRequestError({
      code: 'GATEWAY_RESPONSE_INVALID',
      message: '识别网关返回的数据结构不完整',
    })
  }

  return payload
}

export const recognizeFactoryMaterial = (
  certificate: File,
  nameplate: File,
  signal: AbortSignal,
) => {
  const formData = new FormData()
  formData.append('certificate', certificate)
  formData.append('nameplate', nameplate)
  return submit('factory', formData, signal)
}

export const recognizeArrivalMaterial = (
  nameplate: File,
  signal: AbortSignal,
) => {
  const formData = new FormData()
  formData.append('nameplate', nameplate)
  return submit('arrival', formData, signal)
}
