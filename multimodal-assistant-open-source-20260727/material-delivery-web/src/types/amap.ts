import type { TransportTrajectoryPoint } from '@/types/delivery'

export type AMapLoadStatus = 'LOADING' | 'READY' | 'FALLBACK'

export type AMapPosition = [number, number]

export interface AMapLngLatInstance {
  getLng: () => number
  getLat: () => number
}

export type AMapPathPosition = AMapPosition | AMapLngLatInstance

export interface AMapOverlay {
  show?: () => void
  hide?: () => void
}

export interface AMapEventOverlay extends AMapOverlay {
  on: (eventName: string, handler: () => void) => void
  off: (eventName: string, handler: () => void) => void
}

export interface AMapMarkerInstance extends AMapEventOverlay {
  setPosition: (position: AMapPosition) => void
  getPosition: () => AMapPosition
}

export interface AMapPolylineInstance extends AMapOverlay {
  setPath: (path: AMapPathPosition[]) => void
}

export interface AMapInfoWindowInstance {
  open: (map: AMapMapInstance, position: AMapPosition) => void
  close: () => void
  setContent: (content: string | HTMLElement) => void
}

export interface AMapMapInstance {
  add: (overlay: AMapOverlay | AMapOverlay[]) => void
  remove: (overlay: AMapOverlay | AMapOverlay[]) => void
  addControl: (control: AMapOverlay) => void
  setFitView: (
    overlays?: AMapOverlay[],
    immediately?: boolean,
    avoid?: [number, number, number, number],
    maxZoom?: number,
  ) => void
  setZoomAndCenter: (
    zoom: number,
    center: AMapPosition,
    immediately?: boolean,
    duration?: number,
  ) => void
  destroy: () => void
}

export interface AMapMapOptions {
  center: AMapPosition
  zoom: number
  viewMode: '2D'
  mapStyle: string
  resizeEnable: boolean
  showLabel: boolean
}

export interface AMapMarkerOptions {
  position: AMapPosition
  content?: HTMLElement
  anchor?: 'center' | 'bottom-center'
  title?: string
  zIndex?: number
}

export interface AMapPolylineOptions {
  path: AMapPathPosition[]
  strokeColor: string
  strokeWeight: number
  strokeStyle?: 'solid' | 'dashed'
  strokeOpacity?: number
  lineJoin?: 'round'
  lineCap?: 'round'
  zIndex?: number
}

export interface AMapInfoWindowOptions {
  content: string | HTMLElement
  anchor?: 'bottom-center'
  offset?: AMapPosition
  isCustom?: boolean
}

export interface AMapNamespace {
  LngLat: new (
    longitude: number,
    latitude: number,
  ) => AMapLngLatInstance
  Map: new (
    container: HTMLElement | string,
    options: AMapMapOptions,
  ) => AMapMapInstance
  Marker: new (options: AMapMarkerOptions) => AMapMarkerInstance
  Polyline: new (
    options: AMapPolylineOptions,
  ) => AMapPolylineInstance
  InfoWindow: new (
    options: AMapInfoWindowOptions,
  ) => AMapInfoWindowInstance
  Scale: new (options?: { position?: string }) => AMapOverlay
}

export interface AMapAnomalyMarker {
  marker: AMapMarkerInstance
  position: AMapPosition
  clickHandler: () => void
}

export interface TransportMapExpose {
  focusTrajectory: () => void
  focusAnomalies: () => void
  focusAnomaly: (pointId: string) => void
}

export const toAMapPosition = (
  point: TransportTrajectoryPoint,
): AMapPosition => [point.longitude, point.latitude]
