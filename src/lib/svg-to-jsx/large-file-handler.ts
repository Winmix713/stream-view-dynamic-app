/**
 * Large SVG File Handler
 * Optimized for handling massive SVG files (up to 10MB+)
 * Based on svg-to-code-figma best practices
 */

export interface LargeFileConfig {
  maxChunkSize: number;
  maxMemoryUsage: number;
  enableStreaming: boolean;
  enableWorker: boolean;
  compressionLevel: number;
}

export interface ProcessingMetrics {
  originalSize: number;
  processedSize: number;
  compressionRatio: number;
  processingTime: number;
  memoryUsage: number;
  chunksProcessed: number;
}

export class LargeSvgHandler {
  private config: LargeFileConfig;
  private worker: Worker | null = null;
  private abortController: AbortController | null = null;

  constructor(config: Partial<LargeFileConfig> = {}) {
    this.config = {
      maxChunkSize: 1024 * 1024, // 1MB chunks
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB max
      enableStreaming: true,
      enableWorker: typeof Worker !== 'undefined',
      compressionLevel: 6,
      ...config
    };
  }

  /**
   * Process large SVG files with chunking and streaming
   */
  async processLargeSvg(
    svgContent: string,
    onProgress?: (progress: number, message: string) => void
  ): Promise<{ jsx: string; metrics: ProcessingMetrics }> {
    const startTime = performance.now();
    const originalSize = new Blob([svgContent]).size;

    // Check if file is too large for memory
    if (originalSize > this.config.maxMemoryUsage) {
      throw new Error(`File too large: ${(originalSize / 1024 / 1024).toFixed(1)}MB exceeds ${(this.config.maxMemoryUsage / 1024 / 1024).toFixed(1)}MB limit`);
    }

    onProgress?.(5, 'Initializing large file processing...');

    // Create abort controller for cancellation
    this.abortController = new AbortController();

    try {
      // Step 1: Pre-process and validate
      onProgress?.(10, 'Validating SVG structure...');
      const validatedSvg = await this.validateAndCleanSvg(svgContent);

      // Step 2: Chunk the SVG for processing
      onProgress?.(20, 'Chunking SVG content...');
      const chunks = await this.chunkSvgContent(validatedSvg);

      // Step 3: Process chunks
      onProgress?.(30, 'Processing SVG chunks...');
      const processedChunks = await this.processChunks(chunks, onProgress);

      // Step 4: Combine and optimize
      onProgress?.(80, 'Combining and optimizing...');
      const jsx = await this.combineChunks(processedChunks);

      // Step 5: Final optimization
      onProgress?.(95, 'Final optimization...');
      const optimizedJsx = await this.optimizeJsx(jsx);

      const endTime = performance.now();
      const processedSize = new Blob([optimizedJsx]).size;

      const metrics: ProcessingMetrics = {
        originalSize,
        processedSize,
        compressionRatio: ((originalSize - processedSize) / originalSize) * 100,
        processingTime: endTime - startTime,
        memoryUsage: this.getMemoryUsage(),
        chunksProcessed: chunks.length
      };

      onProgress?.(100, 'Processing complete!');

      return { jsx: optimizedJsx, metrics };

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Processing cancelled by user');
      }
      throw error;
    } finally {
      this.cleanup();
    }
  }

  /**
   * Validate and clean SVG content
   */
  private async validateAndCleanSvg(svgContent: string): Promise<string> {
    // Remove comments and unnecessary whitespace
    let cleaned = svgContent
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Validate basic SVG structure
    if (!cleaned.includes('<svg')) {
      throw new Error('Invalid SVG: No <svg> element found');
    }

    // Check for balanced tags
    const openTags = (cleaned.match(/<[^\/][^>]*>/g) || []).length;
    const closeTags = (cleaned.match(/<\/[^>]*>/g) || []).length;
    const selfClosing = (cleaned.match(/<[^>]*\/>/g) || []).length;

    if (openTags !== closeTags + selfClosing) {
      console.warn('SVG may have unbalanced tags, attempting to fix...');
      cleaned = this.fixUnbalancedTags(cleaned);
    }

    return cleaned;
  }

  /**
   * Fix unbalanced SVG tags
   */
  private fixUnbalancedTags(svgContent: string): string {
    // Simple fix for common issues
    return svgContent
      .replace(/<path([^>]*)(?<!\/)\s*>/g, '<path$1/>')
      .replace(/<circle([^>]*)(?<!\/)\s*>/g, '<circle$1/>')
      .replace(/<rect([^>]*)(?<!\/)\s*>/g, '<rect$1/>')
      .replace(/<line([^>]*)(?<!\/)\s*>/g, '<line$1/>')
      .replace(/<ellipse([^>]*)(?<!\/)\s*>/g, '<ellipse$1/>');
  }

  /**
   * Chunk SVG content for processing
   */
  private async chunkSvgContent(svgContent: string): Promise<string[]> {
    const chunks: string[] = [];
    const chunkSize = this.config.maxChunkSize;

    // For very large files, split by logical SVG elements
    if (svgContent.length > chunkSize * 2) {
      return this.chunkByElements(svgContent);
    }

    // Simple chunking for smaller files
    for (let i = 0; i < svgContent.length; i += chunkSize) {
      chunks.push(svgContent.slice(i, i + chunkSize));
    }

    return chunks;
  }

  /**
   * Chunk by SVG elements for better processing
   */
  private chunkByElements(svgContent: string): string[] {
    const chunks: string[] = [];
    const elementRegex = /<([^>]+)>/g;
    let currentChunk = '';
    let match;

    while ((match = elementRegex.exec(svgContent)) !== null) {
      const element = match[0];
      
      if (currentChunk.length + element.length > this.config.maxChunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = '';
        }
      }
      
      currentChunk += element;
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Process chunks with progress tracking
   */
  private async processChunks(
    chunks: string[],
    onProgress?: (progress: number, message: string) => void
  ): Promise<string[]> {
    const processedChunks: string[] = [];
    const totalChunks = chunks.length;

    for (let i = 0; i < totalChunks; i++) {
      if (this.abortController?.signal.aborted) {
        throw new Error('Processing aborted');
      }

      const progress = 30 + (i / totalChunks) * 40; // 30-70% range
      onProgress?.(progress, `Processing chunk ${i + 1}/${totalChunks}...`);

      const processedChunk = await this.processChunk(chunks[i]);
      processedChunks.push(processedChunk);

      // Allow browser to breathe
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    return processedChunks;
  }

  /**
   * Process individual chunk
   */
  private async processChunk(chunk: string): Promise<string> {
    // Convert SVG attributes to JSX format
    return chunk
      .replace(/class=/g, 'className=')
      .replace(/stroke-width=/g, 'strokeWidth=')
      .replace(/fill-opacity=/g, 'fillOpacity=')
      .replace(/stroke-opacity=/g, 'strokeOpacity=')
      .replace(/stroke-linecap=/g, 'strokeLinecap=')
      .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
      .replace(/stroke-dasharray=/g, 'strokeDasharray=')
      .replace(/font-family=/g, 'fontFamily=')
      .replace(/font-size=/g, 'fontSize=')
      .replace(/font-weight=/g, 'fontWeight=')
      .replace(/text-anchor=/g, 'textAnchor=')
      .replace(/clip-path=/g, 'clipPath=')
      .replace(/fill-rule=/g, 'fillRule=');
  }

  /**
   * Combine processed chunks
   */
  private async combineChunks(chunks: string[]): Promise<string> {
    return chunks.join('');
  }

  /**
   * Optimize final JSX
   */
  private async optimizeJsx(jsx: string): Promise<string> {
    // Remove duplicate attributes
    let optimized = jsx.replace(/(\w+)="([^"]*)"(\s+\1="[^"]*")+/g, '$1="$2"');
    
    // Optimize numeric values
    optimized = optimized.replace(/="(\d+\.\d{3,})"/g, (match, num) => {
      return `="${parseFloat(num).toFixed(2)}"`;
    });

    // Remove empty attributes
    optimized = optimized.replace(/\s+\w+=""/g, '');

    return optimized;
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Cancel processing
   */
  cancel(): void {
    this.abortController?.abort();
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.abortController = null;
  }
}

// Export singleton instance
export const largeSvgHandler = new LargeSvgHandler();