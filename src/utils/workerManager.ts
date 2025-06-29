
export type WorkerTask = {
  id: string;
  type: 'PARSE_SVG' | 'TRANSFORM_CODE' | 'OPTIMIZE_CODE' | 'VALIDATE_CODE';
  payload: any;
};

export type WorkerResult = {
  id: string;
  type: 'SUCCESS' | 'ERROR';
  result?: any;
  error?: string;
};

export class WorkerManager {
  private static instance: WorkerManager;
  private worker: Worker | null = null;
  private pendingTasks = new Map<string, { resolve: Function; reject: Function }>();

  static getInstance(): WorkerManager {
    if (!WorkerManager.instance) {
      WorkerManager.instance = new WorkerManager();
    }
    return WorkerManager.instance;
  }

  private constructor() {
    this.initializeWorker();
  }

  private initializeWorker(): void {
    try {
      // Create worker from our TypeScript file
      const workerBlob = new Blob(
        [this.getWorkerCode()],
        { type: 'application/javascript' }
      );
      
      this.worker = new Worker(URL.createObjectURL(workerBlob));
      
      this.worker.addEventListener('message', (event: MessageEvent<WorkerResult>) => {
        const { id, type, result, error } = event.data;
        const pending = this.pendingTasks.get(id);
        
        if (pending) {
          this.pendingTasks.delete(id);
          
          if (type === 'SUCCESS') {
            pending.resolve(result);
          } else {
            pending.reject(new Error(error));
          }
        }
      });

      this.worker.addEventListener('error', (error) => {
        console.error('Worker error:', error);
      });
    } catch (error) {
      console.error('Failed to initialize worker:', error);
    }
  }

  async executeTask(type: WorkerTask['type'], payload: any): Promise<any> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    const id = Math.random().toString(36).substr(2, 9);
    
    return new Promise((resolve, reject) => {
      this.pendingTasks.set(id, { resolve, reject });
      
      this.worker!.postMessage({
        id,
        type,
        payload
      });

      // Set timeout for long-running tasks
      setTimeout(() => {
        if (this.pendingTasks.has(id)) {
          this.pendingTasks.delete(id);
          reject(new Error('Worker task timeout'));
        }
      }, 30000); // 30 second timeout
    });
  }

  /**
   * Process work in worker (alias for executeTask)
   */
  async processInWorker(workerName: string, payload: any): Promise<any> {
    // Map worker names to task types
    const taskTypeMap: Record<string, WorkerTask['type']> = {
      'codeProcessingWorker': 'TRANSFORM_CODE',
      'svgProcessingWorker': 'PARSE_SVG',
      'codeOptimizationWorker': 'OPTIMIZE_CODE',
      'validationWorker': 'VALIDATE_CODE'
    };

    const taskType = taskTypeMap[workerName] || 'TRANSFORM_CODE';
    return this.executeTask(taskType, payload);
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingTasks.clear();
  }

  private getWorkerCode(): string {
    // Inline the worker code since we can't import modules in workers easily
    return `
      self.addEventListener('message', async (event) => {
        const { type, payload, id } = event.data;
        
        try {
          let result;
          
          switch (type) {
            case 'PARSE_SVG':
              result = await parseSvg(payload.svg);
              break;
            case 'TRANSFORM_CODE':  
              result = await transformCode(payload.code, payload.config);
              break;
            case 'OPTIMIZE_CODE':
              result = await optimizeCode(payload.code);
              break;
            case 'VALIDATE_CODE':
              result = await validateCode(payload.code, payload.framework);
              break;
            default:
              throw new Error('Unknown task: ' + type);
          }
          
          self.postMessage({ id, type: 'SUCCESS', result });
        } catch (error) {
          self.postMessage({ id, type: 'ERROR', error: error.message });
        }
      });
      
      async function parseSvg(svg) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svg, 'image/svg+xml');
        const elements = Array.from(doc.querySelectorAll('*')).map(el => ({
          tagName: el.tagName,
          attributes: Object.fromEntries(Array.from(el.attributes).map(a => [a.name, a.value])),
          textContent: el.textContent?.trim() || ''
        }));
        return { elements, nodeCount: elements.length };
      }
      
      async function transformCode(code, config) {
        let transformed = code;
        
        // Check if config exists and has framework property
        if (config && config.framework) {
          switch (config.framework) {
            case 'vue':
              transformed = code
                .replace(/import React/g, 'import { defineComponent }')
                .replace(/className=/g, 'class=');
              break;
            case 'angular':
              transformed = 'import { Component } from "@angular/core";\\n\\n@Component({\\n  template: \`' + 
                code.replace(/className=/g, 'class=') + '\`\\n})\\nexport class GeneratedComponent {}';
              break;
            case 'svelte':
              transformed = code.replace(/className=/g, 'class=');
              break;
            default:
              // For React or unknown frameworks, keep the original code
              break;
          }
        }
        
        return { transformedCode: transformed };
      }
      
      async function optimizeCode(code) {
        const optimized = code.replace(/\\s+/g, ' ').trim();
        return { optimizedCode: optimized, savings: code.length - optimized.length };
      }
      
      async function validateCode(code, framework) {
        const issues = [];
        if (!code.includes('export')) {
          issues.push({ type: 'warning', message: 'No exports found' });
        }
        
        // Framework-specific validation
        if (framework) {
          switch (framework) {
            case 'react':
              if (!code.includes('React') && !code.includes('import')) {
                issues.push({ type: 'warning', message: 'Missing React import' });
              }
              break;
            case 'vue':
              if (!code.includes('defineComponent') && !code.includes('export default')) {
                issues.push({ type: 'warning', message: 'Missing Vue component definition' });
              }
              break;
          }
        }
        
        return { valid: true, issues };
      }
    `;
  }
}

export const workerManager = WorkerManager.getInstance();
