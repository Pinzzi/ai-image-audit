
<template>
  <transition name="fade">
    <div
      v-if="message"
      :class="[
        'p-4 rounded-lg mb-4 flex items-center',
        typeClasses[type] || typeClasses.error
      ]"
    >
      <span class="mr-2" v-html="icon"></span>
      {{ message }}
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'error',
    validator: (value) => ['error', 'warning', 'success', 'info'].includes(value)
  }
})

const typeClasses = {
  error: 'bg-red-100 text-red-700 border border-red-200',
  warning: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  success: 'bg-green-100 text-green-700 border border-green-200',
  info: 'bg-blue-100 text-blue-700 border border-blue-200'
}

const icon = computed(() => {
  switch (props.type) {
    case 'error':
      return '⚠️'
    case 'warning':
      return '⚡'
    case 'success':
      return '✅'
    case 'info':
      return 'ℹ️'
    default:
      return '⚠️'
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
