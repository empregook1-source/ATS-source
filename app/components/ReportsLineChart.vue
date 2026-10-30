<script setup lang="ts">
import type { ReportSeries, ReportStatPoint } from '~~/shared/reports'

const props = defineProps<{
  points: ReportStatPoint[]
  series: ReportSeries[]
}>()

const chartWidth = 860
const chartHeight = 320
const padding = {
  top: 24,
  right: 24,
  bottom: 40,
  left: 44,
}

const innerWidth = chartWidth - padding.left - padding.right
const innerHeight = chartHeight - padding.top - padding.bottom

const maxValue = computed(() => {
  const values = props.points.flatMap(point =>
    props.series.map(item => point.values[item.key] ?? 0),
  )

  return Math.max(1, ...values)
})

const yTicks = computed(() =>
  Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4
    const value = Math.round(maxValue.value * (1 - ratio))
    const y = padding.top + innerHeight * ratio

    return { value, y }
  }),
)

const labelStep = computed(() => {
  if (props.points.length <= 8) {
    return 1
  }

  return Math.ceil(props.points.length / 8)
})

function getX(index: number) {
  if (props.points.length <= 1) {
    return padding.left + innerWidth / 2
  }

  return padding.left + (index / (props.points.length - 1)) * innerWidth
}

function getY(value: number) {
  return padding.top + innerHeight - (value / maxValue.value) * innerHeight
}

const seriesPolylines = computed(() =>
  props.series.map(item => ({
    ...item,
    points: props.points.map((point, index) => ({
      x: getX(index),
      y: getY(point.values[item.key] ?? 0),
      value: point.values[item.key] ?? 0,
      label: point.label,
    })),
  })),
)

function toPolylinePoints(points: Array<{ x: number; y: number }>) {
  return points.map(point => `${point.x},${point.y}`).join(' ')
}
</script>

<template>
  <div class="overflow-x-auto">
    <svg
      :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
      class="min-w-[680px] w-full"
      role="img"
      aria-label="Gráfico de linhas do relatório"
    >
      <g>
        <line
          v-for="tick in yTicks"
          :key="tick.y"
          :x1="padding.left"
          :x2="chartWidth - padding.right"
          :y1="tick.y"
          :y2="tick.y"
          class="stroke-surface-200 dark:stroke-surface-800"
          stroke-width="1"
          stroke-dasharray="4 6"
        />

        <text
          v-for="tick in yTicks"
          :key="tick.value"
          :x="padding.left - 10"
          :y="tick.y + 4"
          text-anchor="end"
          class="fill-surface-400 dark:fill-surface-500 text-[11px]"
        >
          {{ tick.value }}
        </text>
      </g>

      <g>
        <polyline
          v-for="line in seriesPolylines"
          :key="line.key"
          :points="toPolylinePoints(line.points)"
          fill="none"
          :stroke="line.color"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="3"
        />

        <g v-for="line in seriesPolylines" :key="`${line.key}-dots`">
          <circle
            v-for="point in line.points"
            :key="`${line.key}-${point.label}`"
            :cx="point.x"
            :cy="point.y"
            r="4"
            :fill="line.color"
            class="stroke-white dark:stroke-surface-950"
            stroke-width="2"
          />
        </g>
      </g>

      <g>
        <text
          v-for="(point, index) in props.points"
          v-show="index % labelStep === 0 || index === props.points.length - 1"
          :key="point.date"
          :x="getX(index)"
          :y="chartHeight - 12"
          text-anchor="middle"
          class="fill-surface-400 dark:fill-surface-500 text-[11px]"
        >
          {{ point.label }}
        </text>
      </g>
    </svg>
  </div>
</template>
