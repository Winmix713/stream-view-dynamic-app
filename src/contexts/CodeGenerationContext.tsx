
import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Batch Processing Types
export interface FigmaFileItem {
  id: string;
  name: string;
  url: string;
  accessToken: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  progress: number;
  error?: string;
  result?: any;
}

export interface BatchProcessingState {
  isActive: boolean;
  mode: 'single' | 'batch';
  files: FigmaFileItem[];
  currentFileIndex: number;
  totalProgress: number;
  successCount: number;
  errorCount: number;
  completedFiles: FigmaFileItem[];
  failedFiles: FigmaFileItem[];
  startTime?: number;
  endTime?: number;
}

// Types
export interface CodeGenerationState {
  svgCode: string;
  generatedTsxCode: string;
  cssCode: string;
  jsxCode: string;
  moreCssCode: string;
  finalTsxCode: string;
  finalCssCode: string;
  stepStatus: {
    step2: 'idle' | 'loading' | 'success' | 'error';
    step3: 'idle' | 'loading' | 'success' | 'error';
    step4: 'idle' | 'loading' | 'success' | 'error';
  };
  errors: {
    step2?: string;
    step3?: string;
    step4?: string;
  };
  batchProcessing: BatchProcessingState;
}

type CodeGenerationAction =
  | { type: 'SET_SVG_CODE'; payload: string }
  | { type: 'SET_GENERATED_TSX'; payload: string }
  | { type: 'SET_CSS_CODE'; payload: string }
  | { type: 'SET_JSX_CODE'; payload: string }
  | { type: 'SET_MORE_CSS'; payload: string }
  | { type: 'SET_FINAL_TSX'; payload: string }
  | { type: 'SET_FINAL_CSS'; payload: string }
  | { type: 'SET_STEP_STATUS'; payload: { step: keyof CodeGenerationState['stepStatus']; status: CodeGenerationState['stepStatus'][keyof CodeGenerationState['stepStatus']] } }
  | { type: 'SET_ERROR'; payload: { step: string; error: string } }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_BATCH_MODE'; payload: 'single' | 'batch' }
  | { type: 'ADD_FIGMA_FILE'; payload: FigmaFileItem }
  | { type: 'REMOVE_FIGMA_FILE'; payload: string }
  | { type: 'UPDATE_FILE_STATUS'; payload: { id: string; status: FigmaFileItem['status']; progress?: number; error?: string } }
  | { type: 'START_BATCH_PROCESSING' }
  | { type: 'STOP_BATCH_PROCESSING' }
  | { type: 'RESET_BATCH_PROCESSING' }
  | { type: 'RESET' };

const initialState: CodeGenerationState = {
  svgCode: '',
  generatedTsxCode: '',
  cssCode: '',
  jsxCode: '',
  moreCssCode: '',
  finalTsxCode: '',
  finalCssCode: '',
  stepStatus: {
    step2: 'idle',
    step3: 'idle',
    step4: 'idle'
  },
  errors: {},
  batchProcessing: {
    isActive: false,
    mode: 'single',
    files: [],
    currentFileIndex: 0,
    totalProgress: 0,
    successCount: 0,
    errorCount: 0,
    completedFiles: [],
    failedFiles: []
  }
};

function codeGenerationReducer(state: CodeGenerationState, action: CodeGenerationAction): CodeGenerationState {
  switch (action.type) {
    case 'SET_SVG_CODE':
      return { ...state, svgCode: action.payload };
    case 'SET_GENERATED_TSX':
      return { ...state, generatedTsxCode: action.payload };
    case 'SET_CSS_CODE':
      return { ...state, cssCode: action.payload };
    case 'SET_JSX_CODE':
      return { ...state, jsxCode: action.payload };
    case 'SET_MORE_CSS':
      return { ...state, moreCssCode: action.payload };
    case 'SET_FINAL_TSX':
      return { ...state, finalTsxCode: action.payload };
    case 'SET_FINAL_CSS':
      return { ...state, finalCssCode: action.payload };
    case 'SET_STEP_STATUS':
      return {
        ...state,
        stepStatus: { ...state.stepStatus, [action.payload.step]: action.payload.status }
      };
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.payload.step]: action.payload.error }
      };
    case 'CLEAR_ERRORS':
      return { ...state, errors: {} };
    case 'SET_BATCH_MODE':
      return {
        ...state,
        batchProcessing: { ...state.batchProcessing, mode: action.payload }
      };
    case 'ADD_FIGMA_FILE':
      return {
        ...state,
        batchProcessing: {
          ...state.batchProcessing,
          files: [...state.batchProcessing.files, action.payload]
        }
      };
    case 'REMOVE_FIGMA_FILE':
      return {
        ...state,
        batchProcessing: {
          ...state.batchProcessing,
          files: state.batchProcessing.files.filter(f => f.id !== action.payload)
        }
      };
    case 'UPDATE_FILE_STATUS':
      return {
        ...state,
        batchProcessing: {
          ...state.batchProcessing,
          files: state.batchProcessing.files.map(f =>
            f.id === action.payload.id
              ? { ...f, status: action.payload.status, progress: action.payload.progress || f.progress, error: action.payload.error }
              : f
          )
        }
      };
    case 'START_BATCH_PROCESSING':
      return {
        ...state,
        batchProcessing: {
          ...state.batchProcessing,
          isActive: true,
          startTime: Date.now(),
          currentFileIndex: 0,
          successCount: 0,
          errorCount: 0,
          completedFiles: [],
          failedFiles: []
        }
      };
    case 'STOP_BATCH_PROCESSING':
      return {
        ...state,
        batchProcessing: {
          ...state.batchProcessing,
          isActive: false,
          endTime: Date.now()
        }
      };
    case 'RESET_BATCH_PROCESSING':
      return {
        ...state,
        batchProcessing: {
          ...initialState.batchProcessing,
          mode: state.batchProcessing.mode
        }
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface CodeGenerationContextType {
  state: CodeGenerationState;
  actions: {
    setSvgCode: (code: string) => void;
    setGeneratedTsx: (code: string) => void;
    setCssCode: (code: string) => void;
    setJsxCode: (code: string) => void;
    setMoreCss: (code: string) => void;
    setFinalTsx: (code: string) => void;
    setFinalCss: (code: string) => void;
    setStepStatus: (step: keyof CodeGenerationState['stepStatus'], status: CodeGenerationState['stepStatus'][keyof CodeGenerationState['stepStatus']]) => void;
    setError: (step: string, error: string) => void;
    clearErrors: () => void;
    setBatchMode: (mode: 'single' | 'batch') => void;
    addFigmaFile: (file: FigmaFileItem) => void;
    removeFigmaFile: (id: string) => void;
    updateFileStatus: (id: string, status: FigmaFileItem['status'], progress?: number, error?: string) => void;
    startBatchProcessing: () => void;
    stopBatchProcessing: () => void;
    resetBatchProcessing: () => void;
    reset: () => void;
    generateSvgCode: (svgContent?: string) => Promise<void>;
    saveCssCode: () => void;
    generateFinalCode: (figmaData?: any) => Promise<void>;
  };
}

const CodeGenerationContext = createContext<CodeGenerationContextType | undefined>(undefined);

export const CodeGenerationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(codeGenerationReducer, initialState);

  const setSvgCode = useCallback((code: string) => {
    dispatch({ type: 'SET_SVG_CODE', payload: code });
  }, []);

  const setGeneratedTsx = useCallback((code: string) => {
    dispatch({ type: 'SET_GENERATED_TSX', payload: code });
  }, []);

  const setCssCode = useCallback((code: string) => {
    dispatch({ type: 'SET_CSS_CODE', payload: code });
  }, []);

  const setJsxCode = useCallback((code: string) => {
    dispatch({ type: 'SET_JSX_CODE', payload: code });
  }, []);

  const setMoreCss = useCallback((code: string) => {
    dispatch({ type: 'SET_MORE_CSS', payload: code });
  }, []);

  const setFinalTsx = useCallback((code: string) => {
    dispatch({ type: 'SET_FINAL_TSX', payload: code });
  }, []);

  const setFinalCss = useCallback((code: string) => {
    dispatch({ type: 'SET_FINAL_CSS', payload: code });
  }, []);

  const setStepStatus = useCallback((step: keyof CodeGenerationState['stepStatus'], status: CodeGenerationState['stepStatus'][keyof CodeGenerationState['stepStatus']]) => {
    dispatch({ type: 'SET_STEP_STATUS', payload: { step, status } });
  }, []);

  const setError = useCallback((step: string, error: string) => {
    dispatch({ type: 'SET_ERROR', payload: { step, error } });
  }, []);

  const clearErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ERRORS' });
  }, []);

  const setBatchMode = useCallback((mode: 'single' | 'batch') => {
    dispatch({ type: 'SET_BATCH_MODE', payload: mode });
  }, []);

  const addFigmaFile = useCallback((file: FigmaFileItem) => {
    dispatch({ type: 'ADD_FIGMA_FILE', payload: file });
  }, []);

  const removeFigmaFile = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_FIGMA_FILE', payload: id });
  }, []);

  const updateFileStatus = useCallback((id: string, status: FigmaFileItem['status'], progress?: number, error?: string) => {
    dispatch({ type: 'UPDATE_FILE_STATUS', payload: { id, status, progress, error } });
  }, []);

  const startBatchProcessing = useCallback(() => {
    dispatch({ type: 'START_BATCH_PROCESSING' });
  }, []);

  const stopBatchProcessing = useCallback(() => {
    dispatch({ type: 'STOP_BATCH_PROCESSING' });
  }, []);

  const resetBatchProcessing = useCallback(() => {
    dispatch({ type: 'RESET_BATCH_PROCESSING' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // Mock implementation of code generation functions
  const generateSvgCode = useCallback(async (svgContent?: string) => {
    setStepStatus('step2', 'loading');
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockTsxCode = `import React from 'react';\n\nconst GeneratedComponent = () => {\n  return (\n    <div>\n      {/* Generated from SVG */}\n    </div>\n  );\n};\n\nexport default GeneratedComponent;`;
      setGeneratedTsx(mockTsxCode);
      setStepStatus('step2', 'success');
    } catch (error) {
      setError('step2', error instanceof Error ? error.message : 'SVG generation failed');
      setStepStatus('step2', 'error');
    }
  }, [setStepStatus, setGeneratedTsx, setError]);

  const saveCssCode = useCallback(() => {
    setStepStatus('step3', 'success');
  }, [setStepStatus]);

  const generateFinalCode = useCallback(async (figmaData?: any) => {
    setStepStatus('step4', 'loading');
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockFinalTsx = `import React from 'react';\nimport './GeneratedComponent.css';\n\nconst FinalComponent = () => {\n  return (\n    <div className="final-component">\n      {/* Final generated component */}\n    </div>\n  );\n};\n\nexport default FinalComponent;`;
      const mockFinalCss = `.final-component {\n  /* Generated styles */\n  padding: 1rem;\n  background: #f0f0f0;\n}`;
      setFinalTsx(mockFinalTsx);
      setFinalCss(mockFinalCss);
      setStepStatus('step4', 'success');
    } catch (error) {
      setError('step4', error instanceof Error ? error.message : 'Final code generation failed');
      setStepStatus('step4', 'error');
    }
  }, [setStepStatus, setFinalTsx, setFinalCss, setError]);

  const contextValue: CodeGenerationContextType = {
    state,
    actions: {
      setSvgCode,
      setGeneratedTsx,
      setCssCode,
      setJsxCode,
      setMoreCss,
      setFinalTsx,
      setFinalCss,
      setStepStatus,
      setError,
      clearErrors,
      setBatchMode,
      addFigmaFile,
      removeFigmaFile,
      updateFileStatus,
      startBatchProcessing,
      stopBatchProcessing,
      resetBatchProcessing,
      reset,
      generateSvgCode,
      saveCssCode,
      generateFinalCode
    }
  };

  return (
    <CodeGenerationContext.Provider value={contextValue}>
      {children}
    </CodeGenerationContext.Provider>
  );
};

export const useCodeGeneration = () => {
  const context = useContext(CodeGenerationContext);
  if (context === undefined) {
    throw new Error('useCodeGeneration must be used within a CodeGenerationProvider');
  }
  return context;
};
