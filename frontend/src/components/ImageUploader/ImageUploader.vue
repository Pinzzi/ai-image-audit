
<template>
  <div class="w-full max-w-6xl mb-4">
    <div class="flex items-center gap-2">
      <label 
        class="inline-block px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 transition-colors"
        :class="{ 'opacity-50 cursor-not-allowed': disabled || isUploading }"
      >
        <input 
          type="file" 
          @change="onFileChange" 
          multiple 
          accept=".jpg,.jpeg,.png,.gif,.webp" 
          class="hidden"
          :disabled="disabled || isUploading"
        />
        {{ isUploading ? t('uploading') : t('uploadImage') }}
      </label>
      <button
        v-if="hasFiles"
        @click="$emit('clear')"
        class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
      >
        {{ t('clearAll') }}
      </button>
    </div>

    <ErrorMessage 
      v-if="error" 
      :message="error"
      type="error"
    />

    <div v-if="!disabled && maxFiles > 0" class="mt-2 text-sm text-gray-600">
      {{ t('uploadLimit', { count: maxFiles }) }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ErrorMessage from '../common/ErrorMessage.vue'
import { validateFile, convertWebPToJPEG, readFileAsBase64 } from '@/utils/fileUtils'

const { t } = useI18n()

const props = defineProps({
  maxFiles: {
    type: Number,
    default: 10
  },
  maxFileSize: {
    type: Number,
    default: 10 * 1024 * 1024 // 10MB
  },
  disabled: {
    type: Boolean,
    default: false
  },
  hasFiles: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['upload', 'error', 'clear'])
const error = ref('')
const isUploading = ref(false)

async function onFileChange(e) {
  const files = Array.from(e.target.files)
  error.value = ''

  // 验证文件数量
  if (files.length > props.maxFiles) {
    error.value = t('error.tooManyFiles', { max: props.maxFiles })
    return
  }

  // 设置上传状态
  isUploading.value = true

  try {
    for (const file of files) {
      // 验证文件
      const validationError = validateFile(file)
      if (validationError) {
        error.value = validationError
        continue
      }

      try {
        // 处理WebP转换
        let processedFile = file
        if (file.type === 'image/webp') {
          processedFile = await convertWebPToJPEG(file)
        }

        // 读取文件为base64
        const base64 = await readFileAsBase64(processedFile)

        // 发送文件数据
        emit('upload', {
          file: processedFile,
          base64,
          originalName: file.name
        })

        // 等待一小段时间，确保上一个文件处理完成
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (err) {
        console.error('文件处理失败:', err)
        error.value = t('error.fileProcessingFailed', { name: file.name })
      }
    }
  } finally {
    // 清理input和状态
    e.target.value = ''
    isUploading.value = false
  }
}
</script>