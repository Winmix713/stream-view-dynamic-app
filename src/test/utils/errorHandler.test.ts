import { ErrorHandler, FigmaStepsError } from '@/components/code-generator/utils/errorHandler';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
    errorHandler.clearErrorLog();
  });

  it('handles FigmaStepsError correctly', () => {
    const error = new FigmaStepsError('TEST_ERROR', 'Test message', { detail: 'test' }, 'step1');
    const message = errorHandler.handleError(error);
    
    expect(message).toBe('Test message');
    expect(errorHandler.getErrorLog()).toHaveLength(1);
  });

  it('handles generic Error correctly', () => {
    const error = new Error('Generic error');
    const message = errorHandler.handleError(error, 'step2');
    
    expect(message).toBe('Generic error');
    expect(errorHandler.getErrorLog()).toHaveLength(1);
  });

  it('provides user-friendly messages for known error codes', () => {
    const error = new FigmaStepsError('FIGMA_CONNECTION_FAILED', 'Connection failed');
    const message = errorHandler.handleError(error);
    
    expect(message).toBe('Failed to connect to Figma. Please check your URL and access token.');
  });

  it('creates specific error types', () => {
    const connectionError = ErrorHandler.createFigmaConnectionError('Connection failed');
    expect(connectionError.code).toBe('FIGMA_CONNECTION_FAILED');
    expect(connectionError.step).toBe('step1');

    const svgError = ErrorHandler.createSvgConversionError('SVG failed');
    expect(svgError.code).toBe('SVG_CONVERSION_FAILED');
    expect(svgError.step).toBe('step2');
  });

  it('clears error log', () => {
    const error = new Error('Test error');
    errorHandler.handleError(error);
    
    expect(errorHandler.getErrorLog()).toHaveLength(1);
    
    errorHandler.clearErrorLog();
    expect(errorHandler.getErrorLog()).toHaveLength(0);
  });
});