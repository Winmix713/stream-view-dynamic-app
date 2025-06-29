/**
 * Centralized Async Operations Handler
 * Provides consistent async operation handling with proper error management
 */

import { errorHandler, FigmaStepsError } from './errorHandler';

export interface AsyncOperationConfig {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  onProgress?: (progress: number, message: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Async Handler Class
 */
export class AsyncHandler {
  private static instance: AsyncHandler;

  static getInstance(): AsyncHandler {
    if (!AsyncHandler.instance) {
      AsyncHandler.instance = new AsyncHandler();
    }
    return AsyncHandler.instance;
  }

  /**
   * Execute async operation with error handling and retries
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: AsyncOperationConfig = {}
  ): Promise<T> {
    const {
      retries = 3,
      retryDelay = 1000,
      timeout = 30000,
      onProgress,
      onError
    } = config;

    let lastError: Error;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        onProgress?.(
          (attempt - 1) / retries * 100,
          `Attempt ${attempt}/${retries}...`
        );

        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new FigmaStepsError(
              'OPERATION_TIMEOUT',
              `Operation timed out after ${timeout}ms`
            ));
          }, timeout);
        });

        // Race between operation and timeout
        const result = await Promise.race([
          operation(),
          timeoutPromise
        ]);

        onProgress?.(100, 'Operation completed successfully');
        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        console.warn(`Attempt ${attempt} failed:`, lastError.message);
        
        if (attempt === retries) {
          // Last attempt failed
          const handledError = errorHandler.handleError(lastError);
          onError?.(lastError);
          throw lastError;
        }

        // Wait before retry
        if (retryDelay > 0) {
          await this.delay(retryDelay * attempt); // Exponential backoff
        }
      }
    }

    throw lastError!;
  }

  /**
   * Execute multiple async operations in sequence
   */
  async executeSequence<T>(
    operations: Array<() => Promise<T>>,
    config: AsyncOperationConfig = {}
  ): Promise<T[]> {
    const { onProgress } = config;
    const results: T[] = [];

    for (let i = 0; i < operations.length; i++) {
      onProgress?.(
        (i / operations.length) * 100,
        `Executing operation ${i + 1}/${operations.length}...`
      );

      const result = await this.executeWithRetry(operations[i], {
        ...config,
        onProgress: undefined // Avoid nested progress updates
      });

      results.push(result);
    }

    onProgress?.(100, 'All operations completed');
    return results;
  }

  /**
   * Execute multiple async operations in parallel
   */
  async executeParallel<T>(
    operations: Array<() => Promise<T>>,
    config: AsyncOperationConfig = {}
  ): Promise<T[]> {
    const { onProgress } = config;
    
    onProgress?.(0, 'Starting parallel operations...');

    const promises = operations.map(operation => 
      this.executeWithRetry(operation, {
        ...config,
        onProgress: undefined // Avoid nested progress updates
      })
    );

    const results = await Promise.all(promises);
    
    onProgress?.(100, 'All parallel operations completed');
    return results;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create cancellable operation
   */
  createCancellableOperation<T>(
    operation: (signal: AbortSignal) => Promise<T>
  ): {
    promise: Promise<T>;
    cancel: () => void;
  } {
    const controller = new AbortController();
    
    const promise = operation(controller.signal).catch(error => {
      if (error.name === 'AbortError') {
        throw new FigmaStepsError(
          'OPERATION_CANCELLED',
          'Operation was cancelled by user'
        );
      }
      throw error;
    });

    return {
      promise,
      cancel: () => controller.abort()
    };
  }

  /**
   * Batch operations with concurrency limit
   */
  async executeBatch<T>(
    operations: Array<() => Promise<T>>,
    batchSize: number = 3,
    config: AsyncOperationConfig = {}
  ): Promise<T[]> {
    const { onProgress } = config;
    const results: T[] = [];
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      
      onProgress?.(
        (i / operations.length) * 100,
        `Processing batch ${Math.floor(i / batchSize) + 1}...`
      );

      const batchResults = await this.executeParallel(batch, {
        ...config,
        onProgress: undefined
      });

      results.push(...batchResults);
    }

    onProgress?.(100, 'All batches completed');
    return results;
  }
}

// Export singleton instance
export const asyncHandler = AsyncHandler.getInstance();