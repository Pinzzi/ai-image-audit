
<template>
  <div v-if="frequencyEnergy !== undefined" class="mt-4">
    <canvas :id="chartId" class="w-full max-h-64"></canvas>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Chart from 'chart.js/auto'

const { t } = useI18n()

const props = defineProps({
  frequencyEnergy: {
    type: Number,
    required: true
  },
  chartId: {
    type: String,
    required: true
  }
})

let chartInstance = null

function createChart() {
  const canvas = document.getElementById(props.chartId)
  if (!canvas) return

  chartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: [t('chart.frequencyEnergy')],
      datasets: [{
        label: t('chart.energyLevel'),
        data: [props.frequencyEnergy],
        backgroundColor: 'rgb(75, 192, 192)'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: t('chart.analysisResult')
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 200
        }
      }
    }
  })
}

function destroyChart() {
  if (chartInstance && typeof chartInstance.destroy === 'function') {
    chartInstance.destroy()
    chartInstance = null
  }
}

watch(() => props.frequencyEnergy, () => {
  destroyChart()
  createChart()
})

onMounted(() => {
  createChart()
})

onBeforeUnmount(() => {
  destroyChart()
})
</script>
