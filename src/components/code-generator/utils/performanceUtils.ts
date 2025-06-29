/**
 * Performance utilities for handling large code files
 */

export interface ChunkProcessingOptions {
  chunkSize?: number;
  delayBetweenChunks?: number;
  onProgress?: (progress: number) => void;
  onChunkProcessed?: (chunk: string, index: number) => void;
}

/**
 * Process large text in chunks to prevent browser freezing
 */
export const processTextInChunks = async (
  text: string,
  processor: (chunk: string) => string | Promise<string>,
  options: ChunkProcessingOptions = {}
): Promise<string> => {
  const {
    chunkSize = 10000,
    delayBetweenChunks = 10,
    onProgress,
    onChunkProcessed
  } = options;

  const chunks: string[] = [];
  const totalChunks = Math.ceil(text.length / chunkSize);
  
  for (let i = 0; i < text.length; i += chunkSize) {
    const chunk = text.slice(i, i + chunkSize);
    const processedChunk = await processor(chunk);
    chunks.push(processedChunk);
    
    const chunkIndex = Math.floor(i / chunkSize);
    const progress = ((chunkIndex + 1) / totalChunks) * 100;
    
    onProgress?.(progress);
    onChunkProcessed?.(processedChunk, chunkIndex);
    
    // Allow browser to breathe
    if (delayBetweenChunks > 0) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenChunks));
    }
  }
  
  return chunks.join('');
};

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
};

/**
 * Throttle function for performance optimization
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Check if browser supports requestIdleCallback
 */
export const supportsIdleCallback = (): boolean => {
  return 'requestIdleCallback' in window;
};

/**
 * Schedule work during idle time
 */
export const scheduleIdleWork = (
  callback: () => void,
  options: { timeout?: number } = {}
): void => {
  if (supportsIdleCallback()) {
    requestIdleCallback(callback, options);
  } else {
    setTimeout(callback, 0);
  }
};

/**
 * Measure text statistics efficiently
 */
export const measureTextStats = (text: string) => {
  const lines = text.split('\n').length;
  const characters = text.length;
  const size = new Blob([text]).size;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  
  return { lines, characters, size, words };
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Check if text is likely to cause performance issues
 */
export const isLargeText = (text: string, thresholds = {
  characters: 100000,
  lines: 5000,
  size: 200 * 1024 // 200KB
}): boolean => {
  const stats = measureTextStats(text);
  
  return stats.characters > thresholds.characters ||
         stats.lines > thresholds.lines ||
         stats.size > thresholds.size;
};

/**
 * Optimize text for display (truncate if too large)
 */
export const optimizeTextForDisplay = (
  text: string,
  maxLength = 50000
): { text: string; truncated: boolean } => {
  if (text.length <= maxLength) {
    return { text, truncated: false };
  }
  
  return {
    text: text.slice(0, maxLength) + '\n\n... (truncated)',
    truncated: true
  };
};