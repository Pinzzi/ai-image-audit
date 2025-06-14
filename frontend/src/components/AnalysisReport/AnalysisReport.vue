
<template>
  <div class="hidden">
    <!-- 用于生成PDF的隐藏容器 -->
  </div>
</template>

<script setup>
import { jsPDF } from 'jspdf'
import { formatFileSize } from '@/utils/fileUtils'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  imageData: {
    type: Object,
    required: false,
    default: null
  }
})

async function generateReport(imageData = props.imageData) {
  if (!imageData?.file) {
    console.warn('No valid image data available for report generation')
    return null
  }

  try {
    const doc = new jsPDF()
    const lineHeight = 10
    let yPosition = 20

    // 添加标题
    doc.setFontSize(20)
    doc.text(t('report.title'), 105, yPosition, { align: 'center' })
    yPosition += lineHeight * 2

    // 添加基本信息
    doc.setFontSize(12)
    doc.text(`${t('report.fileName')}: ${imageData.file.name || 'Untitled'}`, 20, yPosition)
    yPosition += lineHeight
    doc.text(`${t('report.fileSize')}: ${formatFileSize(imageData.file.size || 0)}`, 20, yPosition)
    yPosition += lineHeight
    doc.text(`${t('report.date')}: ${new Date().toLocaleString()}`, 20, yPosition)
    yPosition += lineHeight * 1.5

    // 添加分析结果
    if (imageData.result) {
      doc.setFontSize(16)
      doc.text(t('report.analysisResults'), 20, yPosition)
      yPosition += lineHeight * 1.5

      doc.setFontSize(12)
      // 添加分析具体数据...
      if (imageData.result.texture_score !== undefined) {
        doc.text(`${t('report.textureScore')}: ${imageData.result.texture_score.toFixed(2)}`, 20, yPosition)
        yPosition += lineHeight
      }

      if (imageData.result.energy !== undefined) {
        doc.text(`${t('report.energyScore')}: ${imageData.result.energy.toFixed(2)}`, 20, yPosition)
        yPosition += lineHeight
      }

      if (imageData.result.confidence !== undefined) {
        doc.text(`${t('report.confidence')}: ${(imageData.result.confidence * 100).toFixed(1)}%`, 20, yPosition)
        yPosition += lineHeight
      }
    }

    // 添加关键指标
    doc.setFontSize(12)
    const result = imageData.result || {}

    const summaryItems = [
      {
        label: t('report.exifStatus'),
        value: result.has_exif ? t('report.available') : t('report.none')
      },
      {
        label: t('report.textureScore'),
        value: result.texture_score?.toFixed(2) || 'N/A'
      },
      {
        label: t('report.frequencyEnergy'),
        value: result.frequency_energy?.toFixed(2) || 'N/A'
      },
      {
        label: t('report.confidence'),
        value: result.confidence ? `${(result.confidence * 100).toFixed(1)}%` : 'N/A'
      }
    ]

    summaryItems.forEach(item => {
      doc.text(`${item.label}: ${item.value}`, 20, yPosition)
      yPosition += lineHeight
    })
    yPosition += lineHeight

    // 添加结论
    doc.setFontSize(14)
    doc.text(t('report.conclusion'), 20, yPosition)
    yPosition += lineHeight * 1.5

    doc.setFontSize(12)
    doc.text(result.message || t('report.noConclusion'), 20, yPosition)
    yPosition += lineHeight * 2

    // 添加EXIF信息（如果有）
    if (imageData.exif && Object.keys(imageData.exif).length > 0) {
      yPosition += lineHeight
      doc.setFontSize(16)
      doc.text(t('report.exifInfo'), 20, yPosition)
      yPosition += lineHeight * 1.5

      doc.setFontSize(12)
      for (const [key, value] of Object.entries(imageData.exif)) {
        if (value !== null && value !== undefined) {
          // 限制每行长度，避免溢出
          const text = `${key}: ${value}`.substring(0, 80)
          doc.text(text, 20, yPosition)
          yPosition += lineHeight
        }
      }
    }

    // 添加页码
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.text(
        `${t('report.page')} ${i} ${t('report.of')} ${totalPages}`,
        105,
        290,
        { align: 'center' }
      )
    }

    return doc
  } catch (error) {
    console.error('Failed to generate report:', error)
    throw error
  }
}

// Move defineExpose to top-level scope
// 将 generateReport 方法暴露给父组件
defineExpose({
  generateReport
})
</script>