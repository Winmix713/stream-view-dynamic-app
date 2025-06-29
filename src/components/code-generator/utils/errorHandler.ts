
export class FigmaStepsError extends Error {
  public code: string;
  
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'FigmaStepsError';
  }
}

class ErrorHandler {
  handleError(error: Error, context?: string): string {
    const contextStr = context ? `[${context}]` : '';
    console.error(`${contextStr} Error:`, error);
    
    // Common error patterns and user-friendly messages
    if (error.message.includes('fetch')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return 'Invalid access token. Please check your Figma Personal Access Token.';
    }
    
    if (error.message.includes('403') || error.message.includes('Forbidden')) {
      return 'Access denied. Please ensure you have permission to access this Figma file.';
    }
    
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      return 'Figma file not found. Please check the URL and try again.';
    }
    
    if (error.message.includes('429') || error.message.includes('Rate limit')) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    
    // Return the original error message if no pattern matches
    return error.message || 'An unexpected error occurred';
  }
}

export const errorHandler = new ErrorHandler();
