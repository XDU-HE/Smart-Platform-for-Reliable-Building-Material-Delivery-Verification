<script setup lang="ts">
import { Check, CloseBold } from '@element-plus/icons-vue'
import { computed } from 'vue'

import type { MaterialCompareRow } from '@/types/material'

interface Props {
  rows: MaterialCompareRow[]
}

const props = defineProps<Props>()

const mismatchCount = computed(
  () => props.rows.filter((row) => row.result === 'MISMATCH').length,
)
</script>

<template>
  <section class="material-compare" aria-labelledby="compare-title">
    <div class="compare-title">
      <h3 id="compare-title">出厂 / 到场身份比对</h3>
      <span :class="{ danger: mismatchCount > 0 }">
        <el-icon>
          <CloseBold v-if="mismatchCount > 0" />
          <Check v-else />
        </el-icon>
        {{
          mismatchCount > 0
            ? `${mismatchCount} 项冲突`
            : '关键字段一致'
        }}
      </span>
    </div>

    <div class="compare-table">
      <div class="compare-row compare-header">
        <span>核验字段</span>
        <span>出厂档案</span>
        <span>到场识别</span>
        <span>结果</span>
      </div>
      <div
        v-for="row in rows"
        :key="row.fieldKey"
        class="compare-row"
        :class="{ mismatch: row.result === 'MISMATCH' }"
      >
        <b>{{ row.fieldLabel }}</b>
        <span :title="row.factoryValue">{{ row.factoryValue }}</span>
        <span :title="row.arrivalValue">{{ row.arrivalValue }}</span>
        <em :class="row.result.toLowerCase()">
          {{ row.result === 'MATCH' ? '一致' : '冲突' }}
        </em>
      </div>
    </div>
  </section>
</template>

<style scoped>
.material-compare {
  margin-top: 10px;
}

.compare-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.compare-title h3 {
  margin: 0;
  color: var(--platform-title-color);
  font-size: 12px;
}

.compare-title > span {
  display: flex;
  align-items: center;
  color: var(--platform-success-color);
  font-size: 9px;
  font-weight: 650;
}

.compare-title > span.danger {
  color: var(--platform-danger-color);
}

.compare-title .el-icon {
  margin-right: 3px;
}

.compare-table {
  margin-top: 6px;
  overflow: hidden;
  border: 1px solid #dfe5e9;
  border-radius: 3px;
}

.compare-row {
  display: grid;
  min-width: 0;
  grid-template-columns: 0.78fr 1fr 1fr 38px;
  align-items: center;
  border-top: 1px solid #edf0f2;
  font-size: 8px;
}

.compare-row:first-child {
  border-top: 0;
}

.compare-row > * {
  min-width: 0;
  padding: 4px 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compare-header {
  color: var(--platform-secondary-text-color);
  background: #f5f7f9;
  font-weight: 650;
}

.compare-row b {
  color: var(--platform-regular-text-color);
}

.compare-row em {
  color: var(--platform-danger-color);
  font-style: normal;
  font-weight: 700;
}

.compare-row em.match {
  color: var(--platform-success-color);
}

.compare-row.mismatch {
  background: #fff6f5;
}
</style>
