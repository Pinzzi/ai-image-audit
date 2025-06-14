import FingerprintJS from '@fingerprintjs/fingerprintjs'
import imageCompression from 'browser-image-compression'

/**
 * 压缩 base64 图片数据
 * @param {string} base64 - 原始base64数据
 * @returns {string} 压缩后的base64数据
 */
async function compressBase64(base64) {
  if (!base64) return null;

  try {
    // 将base64转换为Blob
    const byteString = atob(base64.split(',')[1]);
    const mimeType = base64.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeType });

    // 压缩选项
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: mimeType
    };

    const compressedBlob = await imageCompression(blob, options);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(compressedBlob);
    });
  } catch (error) {
    console.warn('图片压缩失败，使用原始数据:', error);
    return base64;
  }
}

/**
 * 估算数据大小
 * @param {object} data - 要存储的数据
 * @returns {number} 预估的字节大小
 */
function estimateSize(data) {
  return new Blob([JSON.stringify(data)]).size;
}

let visitorId = null

/**
 * 初始化指纹ID
 * @returns {Promise<string>} 访客ID
 */
export async function initFingerprint() {
  if (visitorId) return visitorId

  const fp = await FingerprintJS.load()
  const result = await fp.get()
  visitorId = result.visitorId
  return visitorId
}

/**
 * 保存图片数据到本地存储
 * @param {Array} images - 图片数据数组
 */
export async function saveImagesToStorage(images) {
  try {
    // 确保 visitorId 已初始化
    await initFingerprint();
    if (!visitorId) {
      throw new Error('无法初始化访客ID');
    }

    // 准备数据，压缩图片
    const storageData = [];
    for (const img of images) {
      try {
        const compressedBase64 = await compressBase64(img.base64);
        storageData.push({
          src: img.src,
          base64: compressedBase64,
          originalName: img.originalName,
          result: img.result,
          exif: img.exif
        });
      } catch (error) {
        console.error('处理图片失败:', error);
        // 使用原始数据
        storageData.push(img);
      }
    }

    // 尝试存储数据
    try {
      localStorage.setItem(`images_${visitorId}`, JSON.stringify(storageData));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        // 计算当前数据大小
        const dataSize = estimateSize(storageData);
        const maxSize = 5 * 1024 * 1024; // 设置5MB的限制

        if (dataSize > maxSize) {
          // 如果单次数据就超过限制，只保存最新的数据
          const singleItemSize = dataSize / storageData.length;
          const maxItems = Math.floor(maxSize / singleItemSize);
          const reducedData = storageData.slice(-maxItems); // 保留最新的数据
          localStorage.setItem(`images_${visitorId}`, JSON.stringify(reducedData));
        } else {
          // 清理所有旧数据后重试
          localStorage.clear();
          try {
            localStorage.setItem(`images_${visitorId}`, JSON.stringify(storageData));
          } catch (retryError) {
            console.error('即使清理后仍然无法保存数据:', retryError);
            // 保存最新的一半数据
            const halfLength = Math.floor(storageData.length / 2);
            const reducedData = storageData.slice(-halfLength); // 保留最新的一半
            localStorage.setItem(`images_${visitorId}`, JSON.stringify(reducedData));
          }
        }
      } else {
        throw e; // 重新抛出非配额相关的错误
      }
    }
  } catch (error) {
    console.error('保存数据失败:', error);
    throw error; // 向上传播错误以便UI处理
  }
}

/**
 * 从本地存储加载图片数据
 * @returns {Array|null} 图片数据数组或null
 */
export function loadStoredImages() {
  if (!visitorId) {
    console.error('Fingerprint not initialized')
    return null
  }

  try {
    const storedImages = localStorage.getItem(`images_${visitorId}`)
    return storedImages ? JSON.parse(storedImages) : null
  } catch (error) {
    console.error('加载数据失败:', error)
    return null
  }
}

/**
 * 清除所有存储的图片数据
 */
export function clearStoredImages() {
  if (!visitorId) {
    console.error('Fingerprint not initialized')
    return
  }

  try {
    localStorage.removeItem(`images_${visitorId}`)
  } catch (error) {
    console.error('清除数据失败:', error)
  }
}