
import imageCompression from 'browser-image-compression'

export const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10MB
export const SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

/**
 * 格式化文件大小
 * @param {number} bytes - 文件大小（字节）
 * @returns {string} 格式化后的大小
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 将WebP格式转换为JPEG
 * @param {File} file - WebP文件
 * @returns {Promise<File>} 转换后的JPEG文件
 */
export async function convertWebPToJPEG(file) {
  if (!file || file.type !== 'image/webp') {
    throw new Error('Invalid WebP file');
  }

  const options = {
    maxSizeMB: 10,
    maxWidthOrHeight: 4096,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.9
  };

  try {
    const compressedFile = await imageCompression(file, options);

    // 验证转换结果
    if (!compressedFile || compressedFile.size === 0) {
      throw new Error('Conversion resulted in invalid file');
    }

    if (compressedFile.type !== 'image/jpeg') {
      throw new Error('Conversion failed to produce JPEG');
    }

    return compressedFile;
  } catch (error) {
    console.error('WebP转换失败:', error);
    throw new Error(`WebP转换失败: ${error.message}`);
  }
}

/**
 * 验证文件是否符合要求
 * @param {File} file - 要验证的文件
 * @returns {string|null} 错误信息，如果文件有效则返回null
 */
export function validateFile(file) {
  try {
    if (!file || !(file instanceof File)) {
      return '无效的文件对象';
    }

    if (!file.name || !file.type) {
      return '文件信息不完整';
    }

    if (!SUPPORTED_FORMATS.includes(file.type)) {
      return `文件 ${file.name} 格式不支持。仅支持 JPG, PNG, GIF 和 WebP 格式`;
    }

    if (file.size === 0) {
      return `文件 ${file.name} 是空文件`;
    }

    if (file.size > MAX_FILE_SIZE) {
      return `文件 ${file.name} 超过大小限制(${formatFileSize(MAX_FILE_SIZE)})`;
    }

    return null;
  } catch (error) {
    console.error('文件验证出错:', error);
    return '文件验证失败';
  }
}

/**
 * 读取文件为Base64
 * @param {File} file - 要读取的文件
 * @returns {Promise<string>} Base64字符串
 */
export function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    // 验证输入
    if (!file || !(file instanceof File)) {
      reject(new Error('Invalid file object'));
      return;
    }

    const reader = new FileReader();

    // 添加所有可能的错误处理
    reader.onerror = () => reject(new Error('File reading failed'));
    reader.onabort = () => reject(new Error('File reading aborted'));

    reader.onload = () => {
      try {
        // 验证 base64 结果
        if (typeof reader.result !== 'string') {
          reject(new Error('Invalid file data'));
          return;
        }

        if (!reader.result.startsWith('data:image/')) {
          reject(new Error('Invalid image data'));
          return;
        }

        resolve(reader.result);
      } catch (error) {
        reject(new Error('Failed to process file data'));
      }
    };

    // 添加超时处理
    const timeout = setTimeout(() => {
      reader.abort();
      reject(new Error('File reading timed out'));
    }, 30000); // 30秒超时

    try {
      reader.readAsDataURL(file);
    } catch (error) {
      clearTimeout(timeout);
      reject(new Error('Failed to start file reading'));
    }
  });
}