
<template>
  <div v-if="exif" class="mt-4">
    <p class="font-semibold mb-1">{{ t('exifInfo') }}:</p>
    <div class="text-sm space-y-1">
      <p v-if="exif.Make">{{ t('cameraBrand') }}: {{ exif.Make }}</p>
      <p v-if="exif.Model">{{ t('cameraModel') }}: {{ exif.Model }}</p>
      <p v-if="exif.DateTimeOriginal">
        {{ t('shotTime') }}: {{ formatDateTime(exif.DateTimeOriginal) }}
      </p>
      <p v-if="exif.ExposureTime">{{ t('exposure') }}: {{ exif.ExposureTime }}s</p>
      <p v-if="exif.FNumber">{{ t('aperture') }}: f/{{ exif.FNumber }}</p>
      <p v-if="exif.ISO">ISO: {{ exif.ISO }}</p>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps({
  exif: {
    type: Object,
    default: () => null
  }
})

function formatDateTime(dateTime) {
  try {
    return new Date(dateTime).toLocaleString()
  } catch (e) {
    return dateTime
  }
}
</script>
