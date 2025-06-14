<template>
  <div class="min-h-screen bg-gray-100 flex flex-col items-center p-8">
    <div class="flex items-center justify-between w-full max-w-6xl mb-4">
      <h1 class="text-2xl font-bold">{{ t('title') }}</h1>
      <LanguageSelector />
    </div>

    <ImageUploader
      :max-files="MAX_FILES"
      :max-file-size="MAX_FILE_SIZE"
      :disabled="images.length >= MAX_FILES"
      :has-files="images.length > 0"
      @upload="handleFileUpload"
      @clear="removeAllImages"
    />

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
      <ImageCard
        v-for="(img, index) in images"
        :key="index"
        :image-data="img"
        :index="index"
        @analyze="analyze(index)"
        @download="downloadReport(index)"
        @remove="removeImage(index)"
      />
    </div>

    <AnalysisReport
      ref="reportGenerator"
      :image-data="currentImage"
    />
  </div>
</template>

<script setup>
// 1. 导入语句
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import LanguageSelector from './components/LanguageSelector.vue'
import ImageUploader from './components/ImageUploader/ImageUploader.vue'
import ImageCard from './components/ImageCard/ImageCard.vue'
import AnalysisReport from './components/AnalysisReport/AnalysisReport.vue'
import init, { analyze_image } from './wasm/rust_core'
import * as exifr from 'exifr'
import { 
  initFingerprint, 
  saveImagesToStorage, 
  loadStoredImages 
} from './services/storageService'
import { MAX_FILE_SIZE } from './utils/fileUtils'
import { getLocale, setLocale } from './i18n'

// 2. 常量定义
const MAX_FILES = 10
const SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

// 3. i18n 设置
const { t } = useI18n()
const currentLanguage = computed(() => getLocale())

// 4. 响应式变量
const images = ref([])
const reportGenerator = ref(null)
const currentImage = computed(() => {
  if (images.value.length === 0) return null
  // 默认显示第一张图片的数据
  return images.value[0]
})
const fftCharts = []
const fftChartInstances = ref([])
const fingerprint = ref('')
const errorMessage = ref('')
onMounted(async () => {
  try {
    // 首先初始化 WASM 模块
    await init()
    await initFingerprint()
    const storedImages = loadStoredImages()
    if (storedImages) {
      // 为每个恢复的图片创建新的 URL
      images.value = storedImages.map(img => {
        if (img.base64) {
          // 从 base64 创建 Blob
          const byteString = atob(img.base64.split(',')[1]);
          const mimeType = img.base64.split(',')[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeType });

          // 创建新的 URL
          return {
            ...img,
            file: blob, // 保存 blob 对象以供后续使用
            src: URL.createObjectURL(blob)
          }
        }
        return img
      })
    }
  } catch (error) {
    console.error('初始化失败:', error)
    errorMessage.value = t('error.initFailed')
  }
})

async function handleFileUpload(fileData) {
  try {
    // 为上传的文件创建一个 URL
    const fileUrl = URL.createObjectURL(fileData.file)

    const newImage = {
      ...fileData,
      src: fileUrl,
      file: fileData.file,  // 保存文件对象
      result: null
    }

    images.value.unshift(newImage)

    if (images.value.length > MAX_FILES) {
      // 在移除超出的图片前释放它们的 URL
      images.value.slice(MAX_FILES).forEach(img => {
        if (img.src) {
          URL.revokeObjectURL(img.src)
        }
      })
      images.value = images.value.slice(0, MAX_FILES)
    }

    try {
      // 在保存到存储之前，创建一个不包含 URL 和文件对象的副本
      const storageImages = images.value.map(img => {
        // 创建一个新对象，只包含需要存储的数据
        const storageImg = {
          originalName: img.originalName,
          base64: img.base64,
          result: img.result,
          exif: img.exif
        }
        return storageImg
      })
      await saveImagesToStorage(storageImages)
    } catch (error) {
      console.error('保存图片数据失败:', error)
      errorMessage.value = t('error.saveStorageFailed')

      // 释放刚刚创建的 URL
      URL.revokeObjectURL(fileUrl)

      // 从列表中移除刚刚添加的图片
      images.value = images.value.slice(1)

      setTimeout(() => {
        errorMessage.value = ''
      }, 3000)
    }
  } catch (error) {
    console.error('处理上传失败:', error)
    errorMessage.value = t('error.uploadFailed')

    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  }
}

async function analyze(index) {
  const image = images.value[index]
  if (!image) {
    console.error('图片数据不存在')
    errorMessage.value = t('error.imageNotFound')
    return
  }

  try {
    // 检查并标准化 base64 数据
    if (!image.base64) {
      throw new Error('图片base64数据不存在')
    }

    // 确保 base64 格式正确
    let base64Data = image.base64
    if (!base64Data.startsWith('data:image/')) {
      throw new Error('无效的图片数据格式')
    }

    // 只提取 base64 内容部分（去掉 data:image/xxx;base64, 前缀）
    base64Data = base64Data.split(',')[1]

    // 读取 EXIF 数据
    let exifData = null
    try {
      if (image.file && (image.file.type === 'image/jpeg' || image.file.type === 'image/tiff')) {
        exifData = await exifr.parse(image.file)
      }
    } catch (error) {
      console.warn('EXIF数据读取失败:', error)
    }

    // 分析图片
    const jsResult = analyze_image(base64Data)
    const result = JSON.parse(JSON.stringify(jsResult))

    // 更新图片数据
    image.result = result
    if (exifData && Object.keys(exifData).length > 0) {
      image.exif = exifData
    }

    // 保存更新后的数据
    try {
      await saveImagesToStorage(images.value)
    } catch (error) {
      console.error('保存分析结果失败:', error)
      // 继续执行，因为分析结果已经获取到了
    }

  } catch (error) {
    console.error('分析失败:', error)
    errorMessage.value = t('error.analysisFailed')

    // 3秒后清除错误消息
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  }
}

async function downloadReport(index) {
  if (index < 0 || index >= images.value.length) {
    console.warn('Invalid image index')
    return
  }

  try {
    const doc = await reportGenerator.value?.generateReport(images.value[index])
    if (doc) {
      const fileName = images.value[index].originalName?.replace(/\.[^/.]+$/, '') || 'photo-audit'
      doc.save(`${fileName}-report.pdf`)
    }
  } catch (error) {
    console.error('Failed to generate report:', error)
    errorMessage.value = t('error.reportGenerationFailed')

    // 3秒后清除错误消息
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  }
}

async function removeImage(index) {
  if (images.value[index]?.src) {
    URL.revokeObjectURL(images.value[index].src)
  }
  images.value.splice(index, 1)

  // 创建不包含 URL 和文件对象的副本用于存储
  const storageImages = images.value.map(img => ({
    originalName: img.originalName,
    base64: img.base64,
    result: img.result,
    exif: img.exif
  }))
  await saveImagesToStorage(storageImages)
}

function removeAllImages() {
  // 释放所有图片的 URL
  images.value.forEach(img => {
    if (img.src) {
      URL.revokeObjectURL(img.src)
    }
  })
  images.value = []
  saveImagesToStorage(images.value)
}
// 在其他函数定义之前添加这个辅助函数
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
// 已经在上面声明过这些变量，这里删除重复声明

// 在组件卸载时清理
onBeforeUnmount(() => {
  removeAllImages()
})

// 切换语言
function toggleLanguage() {
  const newLang = currentLanguage.value === 'zh' ? 'en' : 'zh'
  setLocale(newLang)
}
</script>

<style scoped>
body {
  font-family: system-ui, sans-serif;
}
</style>