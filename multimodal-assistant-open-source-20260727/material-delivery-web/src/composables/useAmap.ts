import { load } from '@amap/amap-jsapi-loader'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  toValue,
  watch,
} from 'vue'
import type { MaybeRefOrGetter, Ref } from 'vue'

import type {
  AMapAnomalyMarker,
  AMapInfoWindowInstance,
  AMapLoadStatus,
  AMapMapInstance,
  AMapMarkerInstance,
  AMapNamespace,
  AMapOverlay,
  AMapPolylineInstance,
  AMapPosition,
} from '@/types/amap'
import { toAMapPosition } from '@/types/amap'
import type {
  TransportAnomaly,
  TransportTrajectoryPoint,
} from '@/types/delivery'

const AMAP_LOAD_TIMEOUT = 10_000
const MAP_AVOID_PADDING: [number, number, number, number] = [
  70, 70, 70, 70,
]

interface UseAmapOptions {
  container: Ref<HTMLElement | null>
  plannedPoints: MaybeRefOrGetter<TransportTrajectoryPoint[]>
  activePoints: MaybeRefOrGetter<TransportTrajectoryPoint[]>
  visiblePoints: MaybeRefOrGetter<TransportTrajectoryPoint[]>
  anomalies: MaybeRefOrGetter<TransportAnomaly[]>
  originLabel: MaybeRefOrGetter<string>
  destinationLabel: MaybeRefOrGetter<string>
}

const createEndpointContent = (
  type: 'factory' | 'site',
  label: string,
) => {
  const root = document.createElement('div')
  const pin = document.createElement('span')
  const copy = document.createElement('span')
  const title = document.createElement('strong')
  const subtitle = document.createElement('small')

  root.className = `amap-endpoint amap-endpoint-${type}`
  pin.className = 'amap-endpoint-pin'
  pin.textContent = type === 'factory' ? '厂' : '场'
  copy.className = 'amap-endpoint-copy'
  title.textContent = label
  subtitle.textContent = type === 'factory' ? '材料出厂点' : '材料交付现场'
  copy.append(title, subtitle)
  root.append(pin, copy)

  return root
}

const createTruckContent = () => {
  const marker = document.createElement('div')
  marker.className = 'amap-truck'
  marker.textContent = '车'
  return marker
}

const createAnomalyContent = (
  level: TransportAnomaly['level'],
) => {
  const marker = document.createElement('button')
  marker.type = 'button'
  marker.className = `amap-anomaly amap-anomaly-${level.toLowerCase()}`
  marker.textContent = '!'
  marker.setAttribute('aria-label', '查看运输异常')
  return marker
}

const createAnomalyInfoContent = (anomaly: TransportAnomaly) => {
  const root = document.createElement('div')
  const title = document.createElement('strong')
  const time = document.createElement('time')
  const description = document.createElement('p')

  root.className = 'amap-anomaly-info'
  title.textContent = anomaly.title
  time.textContent = anomaly.time
  description.textContent = anomaly.description
  root.append(title, time, description)

  return root
}

const normalizeLoadError = (error: unknown) =>
  error instanceof Error ? error : new Error('高德地图资源加载失败')

const toPolylinePath = (
  mapNamespace: AMapNamespace,
  points: TransportTrajectoryPoint[],
) =>
  points.map(
    (point) =>
      new mapNamespace.LngLat(point.longitude, point.latitude),
  )

export const useAmap = (options: UseAmapOptions) => {
  const loadStatus = ref<AMapLoadStatus>('LOADING')
  const fallbackReason = ref('')
  const hasConfiguredCredentials = computed(
    () =>
      Boolean(import.meta.env.VITE_AMAP_KEY?.trim()) &&
      Boolean(import.meta.env.VITE_AMAP_SECURITY_CODE?.trim()),
  )

  let namespace: AMapNamespace | null = null
  let map: AMapMapInstance | null = null
  let plannedPolyline: AMapPolylineInstance | null = null
  let actualPolyline: AMapPolylineInstance | null = null
  let anomalyPolyline: AMapPolylineInstance | null = null
  let factoryMarker: AMapMarkerInstance | null = null
  let siteMarker: AMapMarkerInstance | null = null
  let truckMarker: AMapMarkerInstance | null = null
  let infoWindow: AMapInfoWindowInstance | null = null
  let anomalyMarkers = new Map<string, AMapAnomalyMarker>()
  let initializeRunId = 0
  let isUnmounted = false

  const loadNamespace = () =>
    new Promise<AMapNamespace>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        reject(new Error('高德地图加载超时'))
      }, AMAP_LOAD_TIMEOUT)

      window._AMapSecurityConfig = {
        securityJsCode:
          import.meta.env.VITE_AMAP_SECURITY_CODE?.trim() ?? '',
      }

      load({
        key: import.meta.env.VITE_AMAP_KEY?.trim() ?? '',
        version: '2.0',
        plugins: ['AMap.Scale'],
      })
        .then((loadedNamespace) => {
          window.clearTimeout(timeout)
          resolve(loadedNamespace as unknown as AMapNamespace)
        })
        .catch((error: unknown) => {
          window.clearTimeout(timeout)
          reject(normalizeLoadError(error))
        })
    })

  const addOverlay = (overlay: AMapOverlay | AMapOverlay[]) => {
    map?.add(overlay)
  }

  const clearAnomalyMarkers = () => {
    anomalyMarkers.forEach(({ marker, clickHandler }) => {
      marker.off('click', clickHandler)
      map?.remove(marker)
    })
    anomalyMarkers = new Map<string, AMapAnomalyMarker>()
    infoWindow?.close()
  }

  const openAnomalyInfo = (
    anomaly: TransportAnomaly,
    position: AMapPosition,
  ) => {
    if (!map || !infoWindow) {
      return
    }

    infoWindow.setContent(createAnomalyInfoContent(anomaly))
    infoWindow.open(map, position)
  }

  const syncAnomalyMarkers = () => {
    const activeNamespace = namespace
    const activeMap = map

    if (!activeNamespace || !activeMap) {
      return
    }

    clearAnomalyMarkers()

    const activePoints = toValue(options.activePoints)

    toValue(options.anomalies).forEach((anomaly) => {
      const point = activePoints.find(
        (activePoint) => activePoint.id === anomaly.pointId,
      )

      if (!point) {
        return
      }

      const position = toAMapPosition(point)
      const marker = new activeNamespace.Marker({
        position,
        content: createAnomalyContent(anomaly.level),
        anchor: 'center',
        title: `${anomaly.time} ${anomaly.title}`,
        zIndex: 130,
      })
      const clickHandler = () => openAnomalyInfo(anomaly, position)

      marker.on('click', clickHandler)
      activeMap.add(marker)
      anomalyMarkers.set(anomaly.pointId, {
        marker,
        position,
        clickHandler,
      })
    })
  }

  const syncTransportOverlays = () => {
    const activeNamespace = namespace

    if (!map || !activeNamespace) {
      return
    }

    const visiblePoints = toValue(options.visiblePoints)
    const anomalyPointIds = new Set(
      toValue(options.anomalies).map((anomaly) => anomaly.pointId),
    )
    const actualPath = toPolylinePath(
      activeNamespace,
      visiblePoints,
    )
    const firstAnomalyIndex = visiblePoints.findIndex((point) =>
      anomalyPointIds.has(point.id),
    )
    const anomalyPoints =
      firstAnomalyIndex >= 0
        ? visiblePoints
            .slice(Math.max(0, firstAnomalyIndex - 1))
        : []
    const anomalyPath = toPolylinePath(
      activeNamespace,
      anomalyPoints,
    )
    const currentPoint = visiblePoints[visiblePoints.length - 1]

    if (actualPath.length > 1) {
      actualPolyline?.setPath(actualPath)
      actualPolyline?.show?.()
    } else {
      actualPolyline?.hide?.()
    }

    if (anomalyPath.length > 1) {
      anomalyPolyline?.setPath(anomalyPath)
      anomalyPolyline?.show?.()
    } else {
      anomalyPolyline?.hide?.()
    }

    if (currentPoint) {
      truckMarker?.setPosition(toAMapPosition(currentPoint))
      truckMarker?.show?.()
    }

    syncAnomalyMarkers()
  }

  const initializeMap = (loadedNamespace: AMapNamespace) => {
    const container = options.container.value
    const plannedPoints = toValue(options.plannedPoints)
    const startPoint = plannedPoints[0]
    const endPoint = plannedPoints[plannedPoints.length - 1]
    const placeholderPath = toPolylinePath(
      loadedNamespace,
      plannedPoints.slice(0, 2),
    )

    if (
      !container ||
      !startPoint ||
      !endPoint ||
      placeholderPath.length < 2
    ) {
      throw new Error('地图容器或规划轨迹尚未就绪')
    }

    namespace = loadedNamespace
    container.replaceChildren()

    map = new namespace.Map(container, {
      center: toAMapPosition(startPoint),
      zoom: 13,
      viewMode: '2D',
      mapStyle: 'amap://styles/whitesmoke',
      resizeEnable: true,
      showLabel: true,
    })

    plannedPolyline = new namespace.Polyline({
      path: toPolylinePath(namespace, plannedPoints),
      strokeColor: '#71808a',
      strokeWeight: 5,
      strokeStyle: 'dashed',
      strokeOpacity: 0.86,
      lineJoin: 'round',
      lineCap: 'round',
      zIndex: 50,
    })
    actualPolyline = new namespace.Polyline({
      path: placeholderPath,
      strokeColor: '#1f5f8b',
      strokeWeight: 6,
      strokeStyle: 'solid',
      strokeOpacity: 0.94,
      lineJoin: 'round',
      lineCap: 'round',
      zIndex: 70,
    })
    anomalyPolyline = new namespace.Polyline({
      path: placeholderPath,
      strokeColor: '#c2413a',
      strokeWeight: 6,
      strokeStyle: 'dashed',
      strokeOpacity: 0.92,
      lineJoin: 'round',
      lineCap: 'round',
      zIndex: 80,
    })
    factoryMarker = new namespace.Marker({
      position: toAMapPosition(startPoint),
      content: createEndpointContent(
        'factory',
        toValue(options.originLabel),
      ),
      anchor: 'bottom-center',
      title: toValue(options.originLabel),
      zIndex: 110,
    })
    siteMarker = new namespace.Marker({
      position: toAMapPosition(endPoint),
      content: createEndpointContent(
        'site',
        toValue(options.destinationLabel),
      ),
      anchor: 'bottom-center',
      title: toValue(options.destinationLabel),
      zIndex: 110,
    })
    truckMarker = new namespace.Marker({
      position: toAMapPosition(startPoint),
      content: createTruckContent(),
      anchor: 'center',
      title: '运输车辆当前位置',
      zIndex: 120,
    })
    infoWindow = new namespace.InfoWindow({
      content: document.createElement('div'),
      anchor: 'bottom-center',
      isCustom: true,
    })

    addOverlay([
      plannedPolyline,
      actualPolyline,
      anomalyPolyline,
      factoryMarker,
      siteMarker,
      truckMarker,
    ])
    map.addControl(new namespace.Scale({ position: 'RB' }))
    map.setFitView(
      [plannedPolyline, factoryMarker, siteMarker],
      true,
      MAP_AVOID_PADDING,
      15,
    )
    syncTransportOverlays()
  }

  const initialize = async () => {
    initializeRunId += 1
    const runId = initializeRunId

    if (!hasConfiguredCredentials.value) {
      loadStatus.value = 'FALLBACK'
      fallbackReason.value = '未配置高德 Web Key 或安全密钥'
      return
    }

    loadStatus.value = 'LOADING'
    fallbackReason.value = ''

    try {
      const loadedNamespace = await loadNamespace()

      if (isUnmounted || runId !== initializeRunId) {
        return
      }

      initializeMap(loadedNamespace)
      loadStatus.value = 'READY'
    } catch (error: unknown) {
      if (isUnmounted || runId !== initializeRunId) {
        return
      }

      loadStatus.value = 'FALLBACK'
      fallbackReason.value = normalizeLoadError(error).message
    }
  }

  const focusTrajectory = () => {
    if (!map) {
      return false
    }

    const overlays = [
      plannedPolyline,
      actualPolyline,
      factoryMarker,
      siteMarker,
    ].filter(
      (
        overlay,
      ): overlay is AMapMarkerInstance | AMapPolylineInstance =>
        overlay !== null,
    )

    map.setFitView(overlays, false, MAP_AVOID_PADDING, 15)
    infoWindow?.close()
    return true
  }

  const focusAnomalies = () => {
    if (!map || anomalyMarkers.size === 0) {
      return false
    }

    map.setFitView(
      [...anomalyMarkers.values()].map(({ marker }) => marker),
      false,
      [100, 100, 100, 100],
      16,
    )
    return true
  }

  const focusAnomaly = (pointId: string) => {
    if (!map) {
      return false
    }

    const markerEntry = anomalyMarkers.get(pointId)
    const anomaly = toValue(options.anomalies).find(
      (item) => item.pointId === pointId,
    )

    if (!markerEntry || !anomaly) {
      return false
    }

    map.setZoomAndCenter(16, markerEntry.position, false, 320)
    openAnomalyInfo(anomaly, markerEntry.position)
    return true
  }

  const destroy = () => {
    initializeRunId += 1
    clearAnomalyMarkers()
    infoWindow?.close()
    map?.destroy()
    options.container.value?.replaceChildren()
    namespace = null
    map = null
    plannedPolyline = null
    actualPolyline = null
    anomalyPolyline = null
    factoryMarker = null
    siteMarker = null
    truckMarker = null
    infoWindow = null
  }

  watch(
    [
      () => toValue(options.visiblePoints),
      () => toValue(options.anomalies),
    ],
    () => {
      if (loadStatus.value === 'READY') {
        syncTransportOverlays()
      }
    },
    { deep: true },
  )

  onMounted(initialize)

  onBeforeUnmount(() => {
    isUnmounted = true
    destroy()
  })

  return {
    loadStatus,
    fallbackReason,
    hasConfiguredCredentials,
    focusTrajectory,
    focusAnomalies,
    focusAnomaly,
  }
}
