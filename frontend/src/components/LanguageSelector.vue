<template>
  <div class="language-selector">
    <select
      v-model="selectedLanguage"
      @change="changeLanguage"
    >
      <option value="zh"> {{`${zhFlag} 中文`}} </option>
      <option value="en"> {{ `${usFlag} English` }} </option>
    </select>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue';
import emojiFlags from 'emoji-flags';

const { locale } = useI18n()
const selectedLanguage = ref(locale.value)

const zhFlag = emojiFlags.countryCode('CN').emoji;
const usFlag = emojiFlags.countryCode('US').emoji;

const changeLanguage = () => {
  locale.value = selectedLanguage.value
}
</script>

<style scoped>
.language-selector {
  position: relative;
  display: inline-block;
}

.language-selector select {
  appearance: none;
  background-color: white;
  color: #333;
  padding: 8px 32px 8px 12px;
  border: 1px solid #ddd;
  border-radius: 16px !important;
  font-size: 14px;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
}

.language-selector select:hover {
  border-color: #666;
}

.language-selector select:focus {
  border-color: #4a9eff;
  box-shadow: 0 0 0 2px rgba(74, 158, 255, 0.2);
}

/* 添加下拉箭头 */
.language-selector:after {
  content: "";
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid #666;
  pointer-events: none;
}

/* 下拉选项样式 */
.language-selector select option {
  background-color: white;
  color: #333;
  padding: 8px;
  border-radius: 16px;
}
</style>