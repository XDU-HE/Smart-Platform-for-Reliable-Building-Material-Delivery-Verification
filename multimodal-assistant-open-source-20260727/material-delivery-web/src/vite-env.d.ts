/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AMAP_KEY?: string
  readonly VITE_AMAP_SECURITY_CODE?: string
  readonly VITE_RECOGNITION_MODE?: 'mock' | 'real'
  readonly VITE_RECOGNITION_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
