
<template>
  <div class="bg-white p-4 rounded shadow">
    <img :src="imageData.src" class="w-full h-auto rounded mb-2" :alt="imageData.originalName" />

    <div class="flex space-x-2">
      <button 
        @click="$emit('analyze')" 
        class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        :disabled="analyzing"
      >
        {{ analyzing ? t('analyzing') : t('analyze') }}
      </button>

      <button 
        v-if="imageData.result" 
        @click="$emit('download')" 
        class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
      >
        {{ t('download') }}
      </button>

      <button 
        @click="$emit('remove')" 
        class="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
      >
        {{ t('delete') }}
      </button>
    </div>

    <div v-if="imageData.result" class="mt-4">
      <p class="text-lg font-semibold mb-2">{{ t('analysisResult') }}</p>
      <div class="text-sm">
        <p><strong>{{ t('exif') }}:</strong> {{ imageData.result.has_exif ? t('yes') : t('no') }}</p>
        <p><strong>{{ t('texture') }}:</strong> {{ imageData.result.texture_score }}</p>
        <p><strong>{{ t('fft') }}:</strong> {{ imageData.result.frequency_energy.toFixed(2) }}</p>
        <p><strong>{{ t('confidence') }}:</strong> {{ (imageData.result.confidence * 100).toFixed(1) }}%</p>
        <p class="mt-1 font-semibold text-yellow-600">⚠️ {{ imageData.result.message }}</p>
      </div>

      <FFTChart
        v-if="imageData.result.frequency_energy !== undefined"
        :frequency-energy="imageData.result.frequency_energy"
        :chart-id="'fft-chart-' + index"
      />

      <ExifInfo :exif="imageData.exif" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import FFTChart from './FFTChart.vue'
import ExifInfo from './ExifInfo.vue'

const { t } = useI18n()

const props = defineProps({
  imageData: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  }
})

const analyzing = ref(false)

defineEmits(['analyze', 'download', 'remove'])
</script>
