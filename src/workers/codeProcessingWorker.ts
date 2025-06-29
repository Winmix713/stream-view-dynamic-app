
// Worker for processing code generation tasks
/// <reference lib="webworker" />

declare const self: DedicatedWorkerGlobalScope;

export interface CodeProcessingTask {
  type: 'parse' | 'transform' | 'optimize' | 'validate';
  payload: any;
}

export interface CodeProcessingResult {
  success: boolean;
  result?: any;
  error?: string;
}

self.addEventListener('message', async (event: MessageEvent<CodeProcessingTask>) => {
  const { type, payload } = event.data;
  
  try {
    let result: any;
    
    switch (type) {
      case 'parse':
        result = await parseCode(payload);
        break;
      case 'transform':
        result = await transformCode(payload);
        break;
      case 'optimize':
        result = await optimizeCode(payload);
        break;
      case 'validate':
        result = await validateCode(payload);
        break;
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
    
    self.postMessage({ success: true, result } as CodeProcessingResult);
  } catch (error) {
    self.postMessage({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    } as CodeProcessingResult);
  }
});

async function parseCode(payload: any): Promise<any> {
  // Parse SVG, HTML, or other code formats
  if (payload.svg) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(payload.svg, 'image/svg+xml');
    return {
      elements: Array.from(doc.querySelectorAll('*')).length,
      hasErrors: doc.querySelector('parsererror') !== null
    };
  }
  
  return { parsed: true };
}

async function transformCode(payload: any): Promise<any> {
  const { code, framework } = payload;
  
  if (!code) {
    throw new Error('No code provided for transformation');
  }
  
  let transformed = code;
  
  switch (framework) {
    case 'react':
      // React-specific transformations
      transformed = code.replace(/class=/g, 'className=');
      break;
    case 'vue':
      // Vue-specific transformations
      transformed = code.replace(/className=/g, 'class=');
      break;
    case 'angular':
      // Angular-specific transformations
      transformed = code.replace(/className=/g, 'class=');
      break;
  }
  
  return { transformedCode: transformed };
}

async function optimizeCode(payload: any): Promise<any> {
  const { code } = payload;
  
  if (!code) {
    throw new Error('No code provided for optimization');
  }
  
  // Basic optimization: remove extra whitespace
  const optimized = code.replace(/\s+/g, ' ').trim();
  
  return {
    optimizedCode: optimized,
    originalSize: code.length,
    optimizedSize: optimized.length,
    savings: code.length - optimized.length
  };
}

async function validateCode(payload: any): Promise<any> {
  const { code, framework } = payload;
  
  if (!code) {
    throw new Error('No code provided for validation');
  }
  
  const issues: string[] = [];
  
  // Basic validation checks
  if (!code.includes('export')) {
    issues.push('No exports found in code');
  }
  
  if (framework === 'react' && !code.includes('React')) {
    issues.push('React component should import React');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

export {};
