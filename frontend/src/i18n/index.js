import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import zh from './locales/zh.json'

// 检测浏览器语言设置
const getBrowserLanguage = () => {
  const lang = navigator.language || navigator.userLanguage
  return lang.includes('zh') ? 'zh' : 'en'
}

// 创建 i18n 实例
const i18n = createI18n({
  legacy: false, // 使用 Composition API 模式
  locale: getBrowserLanguage(), // 默认语言
  fallbackLocale: 'en', // 回退语言
  messages: {
    en,
    zh
  },
  // 数字格式化选项
  numberFormats: {
    en: {
      percentage: {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }
    },
    zh: {
      percentage: {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }
    }
  }
})

// 导出 i18n 实例和一些辅助函数
export default i18n

// 切换语言的辅助函数
export const setLocale = (locale) => {
  i18n.global.locale.value = locale
}

// 获取当前语言
export const getLocale = () => {
  return i18n.global.locale.value
}