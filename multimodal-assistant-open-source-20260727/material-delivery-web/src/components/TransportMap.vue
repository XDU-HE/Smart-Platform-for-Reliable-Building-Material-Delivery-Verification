<script setup lang="ts">
import {
  Aim,
  Compass,
  LocationFilled,
  Place,
  Van,
  WarningFilled,
} from '@element-plus/icons-vue'
import { computed, ref } from 'vue'

import { useAmap } from '@/composables/useAmap'
import type { TransportMapExpose } from '@/types/amap'
import type {
  DeliveryStage,
  TransportAnomaly,
  TransportStatus,
  TransportTrajectoryPoint,
} from '@/types/delivery'

interface Props {
  currentStage: DeliveryStage
  mapStatusText: string
  transportStatus: TransportStatus
  transportProgress: number
  transportAnomalies: TransportAnomaly[]
  currentTransportPoint: TransportTrajectoryPoint | null
  visibleTrajectoryPoints: TransportTrajectoryPoint[]
  activeTrajectory: TransportTrajectoryPoint[]
  plannedTrajectory: TransportTrajectoryPoint[]
  originLabel: string
  destinationLabel: string
}

const props = defineProps<Props>()

const mapContainer = ref<HTMLElement | null>(null)
const fallbackFocusMode = ref<'NONE' | 'TRAJECTORY' | 'ANOMALIES'>(
  'NONE',
)
const fallbackFocusedPointId = ref<string | null>(null)

const actualRoutePolyline = computed(() =>
  props.visibleTrajectoryPoints
    .map((point) => `${point.x},${point.y}`)
    .join(' '),
)

const transportAnomalyMarkers = computed(() =>
  props.transportAnomalies.flatMap((anomaly) => {
    const point = props.activeTrajectory.find(
      (trajectoryPoint) => trajectoryPoint.id === anomaly.pointId,
    )

    return point ? [{ ...anomaly, x: point.x, y: point.y }] : []
  }),
)

const currentCoordinateText = computed(() => {
  const point =
    props.currentTransportPoint ?? props.plannedTrajectory[0] ?? null

  return point
    ? `${point.latitude.toFixed(4)}° N / ${point.longitude.toFixed(4)}° E`
    : '等待轨迹坐标'
})

const {
  loadStatus,
  fallbackReason,
  focusTrajectory: focusAmapTrajectory,
  focusAnomalies: focusAmapAnomalies,
  focusAnomaly: focusAmapAnomaly,
} = useAmap({
  container: mapContainer,
  plannedPoints: () => props.plannedTrajectory,
  activePoints: () => props.activeTrajectory,
  visiblePoints: () => props.visibleTrajectoryPoints,
  anomalies: () => props.transportAnomalies,
  originLabel: () => props.originLabel,
  destinationLabel: () => props.destinationLabel,
})

const mapSourceLabel = computed(() => {
  if (loadStatus.value === 'READY') {
    return '高德地图 API'
  }

  if (loadStatus.value === 'LOADING') {
    return '高德地图加载中'
  }

  return '静态降级地图'
})

const focusTrajectory = () => {
  fallbackFocusedPointId.value = null
  fallbackFocusMode.value = 'TRAJECTORY'

  if (focusAmapTrajectory()) {
    fallbackFocusMode.value = 'NONE'
  }
}

const focusAnomalies = () => {
  fallbackFocusedPointId.value = null
  fallbackFocusMode.value = 'ANOMALIES'

  if (focusAmapAnomalies()) {
    fallbackFocusMode.value = 'NONE'
  }
}

const focusAnomaly = (pointId: string) => {
  fallbackFocusMode.value = 'NONE'
  fallbackFocusedPointId.value = pointId

  if (focusAmapAnomaly(pointId)) {
    fallbackFocusedPointId.value = null
  }
}

defineExpose<TransportMapExpose>({
  focusTrajectory,
  focusAnomalies,
  focusAnomaly,
})
</script>

<template>
  <section class="map-panel" aria-labelledby="transport-map-title">
    <div class="map-toolbar">
      <div>
        <span class="map-kicker">TRANSPORT TRACE</span>
        <h2 id="transport-map-title">
          <el-icon><Compass /></el-icon>
          运输轨迹监控
        </h2>
      </div>

      <div class="map-toolbar-status">
        <span
          class="map-source"
          :class="`source-${loadStatus.toLowerCase()}`"
        >
          {{ mapSourceLabel }}
        </span>
        <div
          class="map-status"
          :class="{ 'is-ready': currentStage === 'IN_TRANSIT' }"
        >
          <i aria-hidden="true"></i>
          {{ mapStatusText }}
        </div>
      </div>
    </div>

    <div class="map-stage">
      <div
        ref="mapContainer"
        class="amap-container"
        :class="{ 'is-visible': loadStatus === 'READY' }"
        aria-label="高德地图运输轨迹"
      ></div>

      <div
        v-show="loadStatus !== 'READY'"
        class="map-canvas"
        :class="{
          'focus-trajectory': fallbackFocusMode === 'TRAJECTORY',
          'focus-anomalies': fallbackFocusMode === 'ANOMALIES',
        }"
        aria-label="静态降级运输地图"
      >
        <div class="map-grid-label label-a">滨江工业区</div>
        <div class="map-grid-label label-b">建设大道</div>
        <div class="map-grid-label label-c">城东新区</div>
        <div class="map-grid-label label-d">临港产业园</div>

        <div class="land-block land-block-a"></div>
        <div class="land-block land-block-b"></div>
        <div class="land-block land-block-c"></div>
        <div class="land-block land-block-d"></div>
        <div class="land-block land-block-e"></div>

        <div class="road road-horizontal road-one"></div>
        <div class="road road-horizontal road-two"></div>
        <div class="road road-vertical road-three"></div>
        <div class="road road-diagonal road-four"></div>
        <div class="road road-diagonal road-five"></div>

        <div class="planned-route route-one"></div>
        <div class="planned-route route-two"></div>
        <div class="planned-route route-three"></div>

        <svg
          class="actual-route-overlay"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polyline :points="actualRoutePolyline" />
        </svg>

        <div
          v-for="anomaly in transportAnomalyMarkers"
          :key="anomaly.id"
          class="anomaly-marker"
          :class="[
            `level-${anomaly.level.toLowerCase()}`,
            {
              'is-highlighted':
                fallbackFocusedPointId === anomaly.pointId ||
                fallbackFocusMode === 'ANOMALIES',
            },
          ]"
          :style="{ left: `${anomaly.x}%`, top: `${anomaly.y}%` }"
          :title="`${anomaly.time} ${anomaly.title}`"
        >
          <el-icon><WarningFilled /></el-icon>
        </div>

        <div class="map-marker factory-marker">
          <div class="marker-pin">
            <el-icon><LocationFilled /></el-icon>
          </div>
          <div class="marker-label">
            <strong>{{ originLabel }}</strong>
            <span>材料出厂点</span>
          </div>
        </div>

        <div
          class="truck-marker"
          :class="{ 'is-moving': transportStatus === 'RUNNING' }"
          :style="
            currentTransportPoint
              ? {
                  left: `${currentTransportPoint.x}%`,
                  top: `${currentTransportPoint.y}%`,
                }
              : undefined
          "
          aria-label="运输车辆当前位置"
        >
          <el-icon><Van /></el-icon>
        </div>

        <div class="map-marker site-marker">
          <div class="marker-pin site">
            <el-icon><Aim /></el-icon>
          </div>
          <div class="marker-label site-label">
            <strong>{{ destinationLabel }}</strong>
            <span>材料交付现场</span>
          </div>
        </div>

        <div class="map-scale">
          <span>0</span>
          <i></i>
          <span>5 km</span>
        </div>
      </div>

      <div class="map-coordinate">
        <el-icon><Place /></el-icon>
        <span>Mock GCJ-02 坐标 · {{ currentCoordinateText }}</span>
      </div>

      <div
        v-if="loadStatus !== 'READY'"
        class="map-fallback-notice"
        :class="{ loading: loadStatus === 'LOADING' }"
      >
        <strong>
          {{
            loadStatus === 'LOADING'
              ? '正在加载高德地图'
              : '已启用静态降级地图'
          }}
        </strong>
        <span>
          {{
            loadStatus === 'LOADING'
              ? '地图加载完成后将自动切换'
              : fallbackReason
          }}
        </span>
      </div>

      <div class="map-legend" aria-label="地图图例">
        <div class="legend-title">图例</div>
        <span><i class="planned"></i>规划路线</span>
        <span><i class="actual"></i>实际路线</span>
        <span><i class="abnormal"></i>异常路线</span>
        <span><i class="stop"></i>异常点</span>
      </div>

      <div class="map-empty-hint">
        <template v-if="transportStatus === 'RUNNING'">
          <span>运输轨迹播放中 · {{ transportProgress }}%</span>
          {{
            transportAnomalies.length > 0
              ? `已发现 ${transportAnomalies.length} 项运输异常`
              : '确定性规则正在实时监测'
          }}
        </template>
        <template
          v-else-if="
            ['ARRIVAL_VERIFY', 'RISK_REVIEW', 'COMPLETED'].includes(
              currentStage,
            )
          "
        >
          <span>运输任务已结束</span>
          {{
            transportAnomalies.length > 0
              ? `已记录 ${transportAnomalies.length} 项运输异常`
              : '运输轨迹未发现明显异常'
          }}
        </template>
        <template v-else-if="currentStage === 'IN_TRANSIT'">
          <span>运输阶段已就绪</span>
          点击右侧“开始运输”播放 Mock 轨迹
        </template>
        <template v-else>
          <span>轨迹与地图预览</span>
          完成材料建档后进入运输准备
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
.map-panel {
  display: grid;
  min-width: 0;
  min-height: 0;
  grid-template-rows: 57px minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid var(--platform-border-color);
  background: var(--platform-panel-background);
  box-shadow: var(--platform-panel-shadow);
}

.map-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--platform-border-color);
}

.map-kicker {
  color: var(--platform-placeholder-text-color);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.15em;
}

.map-toolbar h2 {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 2px 0 0;
  color: var(--platform-title-color);
  font-size: 16px;
}

.map-toolbar h2 .el-icon {
  color: var(--platform-primary-color);
}

.map-toolbar-status {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
}

.map-source {
  flex: 0 0 auto;
  padding: 5px 7px;
  border: 1px solid #c9dce8;
  border-radius: 3px;
  color: var(--platform-primary-color);
  background: #f0f6f9;
  font-size: 9px;
  font-weight: 650;
}

.map-source.source-fallback {
  border-color: #dfd4c4;
  color: var(--platform-warning-color);
  background: #fff8ed;
}

.map-source.source-loading {
  color: var(--platform-secondary-text-color);
}

.map-status {
  display: flex;
  min-width: 0;
  align-items: center;
  padding: 6px 9px;
  overflow: hidden;
  border: 1px solid #d5dde4;
  border-radius: 3px;
  color: var(--platform-secondary-text-color);
  background: #f6f8f9;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-status i {
  width: 6px;
  height: 6px;
  flex: 0 0 auto;
  margin-right: 6px;
  border-radius: 50%;
  background: #aab3bd;
}

.map-status.is-ready {
  border-color: #c9e1d2;
  color: var(--platform-success-color);
  background: #f1f8f4;
}

.map-status.is-ready i {
  background: var(--platform-success-color);
  box-shadow: 0 0 0 3px rgb(47 133 90 / 12%);
}

.map-stage {
  position: relative;
  min-height: 0;
  overflow: hidden;
  background: #e9eef0;
  isolation: isolate;
}

.amap-container,
.map-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.amap-container {
  z-index: 0;
  visibility: hidden;
}

.amap-container.is-visible {
  visibility: visible;
}

.map-canvas {
  z-index: 0;
  overflow: hidden;
  background: #e9eef0;
}

.map-canvas.focus-trajectory .actual-route-overlay {
  filter: drop-shadow(0 0 3px rgb(31 95 139 / 45%));
}

.land-block {
  position: absolute;
  z-index: -1;
  border: 1px solid #d6dee0;
  background: #e2e8e9;
}

.land-block-a {
  top: 7%;
  left: 4%;
  width: 23%;
  height: 25%;
}

.land-block-b {
  top: 10%;
  left: 35%;
  width: 26%;
  height: 21%;
}

.land-block-c {
  top: 13%;
  right: 5%;
  width: 22%;
  height: 30%;
}

.land-block-d {
  bottom: 9%;
  left: 11%;
  width: 29%;
  height: 25%;
}

.land-block-e {
  right: 16%;
  bottom: 10%;
  width: 24%;
  height: 25%;
}

.road {
  position: absolute;
  z-index: -1;
  border: 1px solid #d0d7da;
  background: #f7f9f9;
  box-shadow: 0 0 0 1px rgb(255 255 255 / 65%);
}

.road::after {
  position: absolute;
  content: '';
  border-color: #ccd3d6;
  border-style: dashed;
}

.road-horizontal {
  right: -3%;
  left: -3%;
  height: 22px;
}

.road-horizontal::after {
  top: 10px;
  right: 0;
  left: 0;
  border-width: 1px 0 0;
}

.road-one {
  top: 39%;
  transform: rotate(-3deg);
}

.road-two {
  top: 72%;
  transform: rotate(5deg);
}

.road-vertical {
  width: 22px;
  height: 120%;
}

.road-vertical::after {
  top: 0;
  bottom: 0;
  left: 10px;
  border-width: 0 0 0 1px;
}

.road-three {
  top: -10%;
  left: 47%;
  transform: rotate(6deg);
}

.road-diagonal {
  width: 23px;
  height: 140%;
  transform-origin: top center;
}

.road-diagonal::after {
  top: 0;
  bottom: 0;
  left: 10px;
  border-width: 0 0 0 1px;
}

.road-four {
  top: -24%;
  left: 20%;
  transform: rotate(-36deg);
}

.road-five {
  top: -20%;
  right: 15%;
  transform: rotate(38deg);
}

.planned-route {
  position: absolute;
  z-index: 2;
  height: 0;
  border-top: 3px dashed #7d8c96;
  transform-origin: left center;
}

.route-one {
  top: 68%;
  left: 22%;
  width: 25%;
  transform: rotate(-17deg);
}

.route-two {
  top: 60%;
  left: 45%;
  width: 22%;
  transform: rotate(-33deg);
}

.route-three {
  top: 43%;
  left: 63%;
  width: 20%;
  transform: rotate(-9deg);
}

.actual-route-overlay {
  position: absolute;
  z-index: 3;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.actual-route-overlay polyline {
  fill: none;
  stroke: var(--platform-primary-color);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 0.7;
}

.anomaly-marker {
  position: absolute;
  z-index: 7;
  display: grid;
  width: 20px;
  height: 20px;
  place-items: center;
  border: 2px solid #fff;
  border-radius: 50%;
  color: #fff;
  background: var(--platform-warning-color);
  box-shadow: 0 2px 7px rgb(31 41 55 / 28%);
  font-size: 11px;
  transform: translate(-50%, -50%);
}

.anomaly-marker.level-danger {
  background: var(--platform-danger-color);
}

.anomaly-marker.is-highlighted {
  outline: 3px solid rgb(217 119 6 / 30%);
  outline-offset: 3px;
}

.anomaly-marker.level-danger.is-highlighted {
  outline-color: rgb(194 65 58 / 34%);
}

.map-grid-label {
  position: absolute;
  z-index: 0;
  color: #9aa6ab;
  font-size: 10px;
  letter-spacing: 0.08em;
}

.label-a {
  top: 16%;
  left: 8%;
}

.label-b {
  top: 34%;
  left: 44%;
}

.label-c {
  top: 17%;
  right: 10%;
}

.label-d {
  bottom: 18%;
  left: 43%;
}

.map-marker {
  position: absolute;
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 8px;
}

.factory-marker {
  top: 62%;
  left: 18%;
}

.site-marker {
  top: 31%;
  right: 15%;
  flex-direction: row-reverse;
}

.marker-pin {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 3px solid #fff;
  border-radius: 50% 50% 50% 4px;
  color: #fff;
  background: var(--platform-primary-color);
  box-shadow: 0 3px 10px rgb(31 41 55 / 25%);
  font-size: 19px;
  transform: rotate(-45deg);
}

.marker-pin .el-icon {
  transform: rotate(45deg);
}

.marker-pin.site {
  background: #244e69;
}

.marker-label {
  padding: 6px 9px;
  border: 1px solid #cbd5dc;
  border-radius: 3px;
  background: rgb(255 255 255 / 94%);
  box-shadow: 0 3px 9px rgb(31 41 55 / 10%);
}

.marker-label strong,
.marker-label span {
  display: block;
  white-space: nowrap;
}

.marker-label strong {
  color: var(--platform-title-color);
  font-size: 11px;
}

.marker-label span {
  margin-top: 2px;
  color: var(--platform-placeholder-text-color);
  font-size: 9px;
}

.site-label {
  text-align: right;
}

.truck-marker {
  position: absolute;
  z-index: 6;
  top: 68%;
  left: 22%;
  display: grid;
  width: 30px;
  height: 25px;
  place-items: center;
  border: 2px solid #fff;
  border-radius: 3px;
  color: #fff;
  background: #263f50;
  box-shadow: 0 2px 6px rgb(31 41 55 / 25%);
  font-size: 17px;
  transform: translate(-50%, -50%);
  transition:
    left 0.58s linear,
    top 0.58s linear;
}

.truck-marker.is-moving {
  background: var(--platform-primary-color);
  box-shadow:
    0 2px 6px rgb(31 41 55 / 25%),
    0 0 0 5px rgb(31 95 139 / 12%);
}

.map-coordinate {
  position: absolute;
  z-index: 20;
  top: 12px;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 7px;
  border: 1px solid rgb(203 213 220 / 85%);
  border-radius: 3px;
  color: #697b84;
  background: rgb(255 255 255 / 88%);
  font-size: 9px;
}

.map-fallback-notice {
  position: absolute;
  z-index: 20;
  top: 12px;
  right: 12px;
  max-width: 250px;
  padding: 6px 8px;
  border: 1px solid #e3d3b9;
  border-radius: 3px;
  color: var(--platform-warning-color);
  background: rgb(255 249 239 / 94%);
  text-align: right;
}

.map-fallback-notice.loading {
  border-color: #c9dce8;
  color: var(--platform-primary-color);
  background: rgb(242 247 250 / 94%);
}

.map-fallback-notice strong,
.map-fallback-notice span {
  display: block;
}

.map-fallback-notice strong {
  font-size: 9px;
}

.map-fallback-notice span {
  margin-top: 2px;
  overflow: hidden;
  color: var(--platform-secondary-text-color);
  font-size: 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-scale {
  position: absolute;
  right: 18px;
  bottom: 49px;
  display: flex;
  align-items: center;
  gap: 4px;
  color: #718087;
  font-size: 8px;
}

.map-scale i {
  width: 48px;
  height: 6px;
  border-right: 1px solid #718087;
  border-bottom: 2px solid #718087;
  border-left: 1px solid #718087;
}

.map-legend {
  position: absolute;
  z-index: 20;
  bottom: 10px;
  left: 12px;
  display: flex;
  height: 30px;
  align-items: center;
  gap: 14px;
  padding: 0 10px;
  border: 1px solid #d3dadd;
  border-radius: 3px;
  background: rgb(255 255 255 / 91%);
  color: var(--platform-secondary-text-color);
  font-size: 9px;
}

.legend-title {
  padding-right: 9px;
  border-right: 1px solid #dfe4e7;
  color: var(--platform-title-color);
  font-weight: 700;
}

.map-legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

.map-legend i {
  display: inline-block;
  width: 22px;
  height: 0;
  border-top: 2px solid;
}

.map-legend .planned {
  border-top-color: #7d8c96;
  border-top-style: dashed;
}

.map-legend .actual {
  border-top-color: var(--platform-primary-color);
}

.map-legend .abnormal {
  border-top-color: var(--platform-danger-color);
  border-top-style: dashed;
}

.map-legend .stop {
  width: 7px;
  height: 7px;
  border: 0;
  border-radius: 50%;
  background: var(--platform-warning-color);
}

.map-empty-hint {
  position: absolute;
  z-index: 19;
  top: 49%;
  left: 50%;
  padding: 8px 12px;
  color: #6f7f87;
  background: rgb(245 248 249 / 86%);
  font-size: 9px;
  text-align: center;
  transform: translate(-50%, -50%);
}

.map-empty-hint span {
  display: block;
  margin-bottom: 3px;
  color: #53666f;
  font-size: 10px;
  font-weight: 650;
}

:global(.amap-endpoint) {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

:global(.amap-endpoint-site) {
  flex-direction: row-reverse;
}

:global(.amap-endpoint-pin) {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 3px solid #fff;
  border-radius: 50%;
  color: #fff;
  background: var(--platform-primary-color);
  box-shadow: 0 2px 8px rgb(31 41 55 / 25%);
  font-size: 11px;
  font-weight: 700;
}

:global(.amap-endpoint-site .amap-endpoint-pin) {
  background: #244e69;
}

:global(.amap-endpoint-copy) {
  padding: 5px 7px;
  border: 1px solid #cbd5dc;
  border-radius: 3px;
  background: rgb(255 255 255 / 95%);
  box-shadow: 0 2px 7px rgb(31 41 55 / 12%);
}

:global(.amap-endpoint-copy strong),
:global(.amap-endpoint-copy small) {
  display: block;
}

:global(.amap-endpoint-copy strong) {
  color: var(--platform-title-color);
  font-size: 10px;
}

:global(.amap-endpoint-copy small) {
  margin-top: 2px;
  color: var(--platform-placeholder-text-color);
  font-size: 8px;
}

:global(.amap-endpoint-site .amap-endpoint-copy) {
  text-align: right;
}

:global(.amap-truck) {
  display: grid;
  width: 30px;
  height: 24px;
  place-items: center;
  border: 2px solid #fff;
  border-radius: 3px;
  color: #fff;
  background: var(--platform-primary-color);
  box-shadow:
    0 2px 7px rgb(31 41 55 / 28%),
    0 0 0 4px rgb(31 95 139 / 12%);
  font-size: 10px;
  font-weight: 700;
}

:global(.amap-anomaly) {
  display: grid;
  width: 22px;
  height: 22px;
  padding: 0;
  place-items: center;
  border: 2px solid #fff;
  border-radius: 50%;
  color: #fff;
  background: var(--platform-warning-color);
  box-shadow: 0 2px 7px rgb(31 41 55 / 28%);
  font-size: 12px;
  font-weight: 800;
}

:global(.amap-anomaly-danger) {
  background: var(--platform-danger-color);
}

:global(.amap-anomaly-info) {
  width: 220px;
  padding: 9px 10px;
  border: 1px solid #d7dee4;
  border-left: 3px solid var(--platform-warning-color);
  border-radius: 3px;
  background: #fff;
  box-shadow: 0 5px 16px rgb(31 41 55 / 18%);
}

:global(.amap-anomaly-info strong),
:global(.amap-anomaly-info time) {
  display: block;
}

:global(.amap-anomaly-info strong) {
  color: var(--platform-title-color);
  font-size: 11px;
}

:global(.amap-anomaly-info time) {
  margin-top: 3px;
  color: var(--platform-warning-color);
  font-size: 9px;
  font-weight: 650;
}

:global(.amap-anomaly-info p) {
  margin: 5px 0 0;
  color: var(--platform-secondary-text-color);
  font-size: 9px;
  line-height: 1.45;
}

@media (max-height: 800px) {
  .map-panel {
    grid-template-rows: 49px minmax(0, 1fr);
  }

  .map-toolbar {
    padding-top: 5px;
    padding-bottom: 5px;
  }
}
</style>
