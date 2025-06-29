
import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { transformer } from '@/lib/transform';
import { enhancedCodeGenerationEngine } from '@/services/enhanced-code-generation-engine';

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
  errors: Record<string, string>;
}

type CodeGenerationAction =
  | { type: 'SET_SVG_CODE'; payload: string }
  | { type: 'SET_GENERATED_TSX'; payload: string }
  | { type: 'SET_CSS_CODE'; payload: string }
  | { type: 'SET_JSX_CODE'; payload: string }
  | { type: 'SET_MORE_CSS'; payload: string }
  | { type: 'SET_FINAL_TSX'; payload: string }
  | { type: 'SET_FINAL_CSS'; payload: string }
  | { type: 'SET_STEP_STATUS'; payload: { step: keyof CodeGenerationState['stepStatus']; status: CodeGenerationState['stepStatus']['step2'] } }
  | { type: 'SET_ERROR'; payload: { step: string; error: string } }
  | { type: 'CLEAR_ERRORS' }
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
  errors: {}
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
    setStepStatus: (step: keyof CodeGenerationState['stepStatus'], status: CodeGenerationState['stepStatus']['step2']) => void;
    setError: (step: string, error: string) => void;
    clearErrors: () => void;
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

  const setStepStatus = useCallback((step: keyof CodeGenerationState['stepStatus'], status: CodeGenerationState['stepStatus']['step2']) => {
    dispatch({ type: 'SET_STEP_STATUS', payload: { step, status } });
  }, []);

  const setError = useCallback((step: string, error: string) => {
    dispatch({ type: 'SET_ERROR', payload: { step, error } });
  }, []);

  const clearErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ERRORS' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const generateSvgCode = useCallback(async (svgContent?: string) => {
    const svg = svgContent || state.svgCode;
    
    if (!svg.trim()) {
      setError('step2', 'Please provide SVG code');
      return;
    }

    setStepStatus('step2', 'loading');
    clearErrors();

    try {
      if (!svg.includes('<svg') && !svg.includes('<path') && !svg.includes('<rect') && !svg.includes('<circle')) {
        throw new Error('Invalid SVG: No SVG elements found in the provided code');
      }

      const tsxCode = await transformer(svg, {
        framework: 'react',
        typescript: true,
        styling: 'css',
        componentName: 'GeneratedComponent',
        passProps: true
      });

      setSvgCode(svg);
      setGeneratedTsx(tsxCode);
      setStepStatus('step2', 'success');

    } catch (error) {
      console.error('SVG to TSX conversion error:', error);
      let errorMessage = 'SVG conversion failed';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (error.message.includes('Invalid SVG')) {
          errorMessage = `${error.message}. Please ensure your input contains valid SVG elements like <svg>, <path>, <rect>, etc.`;
        } else if (error.message.includes('parsing')) {
          errorMessage = 'SVG parsing failed. Please check your SVG syntax and try again.';
        }
      }
      
      setError('step2', errorMessage);
      setStepStatus('step2', 'error');
    }
  }, [state.svgCode, setSvgCode, setGeneratedTsx, setStepStatus, setError, clearErrors]);

  const saveCssCode = useCallback(() => {
    if (!state.cssCode.trim()) {
      setError('step3', 'Please provide CSS code');
      return;
    }

    setStepStatus('step3', 'success');
    clearErrors();
  }, [state.cssCode, setStepStatus, setError, clearErrors]);

  const generateFinalCode = useCallback(async (figmaData?: any) => {
    const { jsxCode, moreCssCode } = state;
    
    if (!jsxCode.trim() && !moreCssCode.trim()) {
      setError('step4', 'Please provide JSX or additional CSS code');
      return;
    }

    setStepStatus('step4', 'loading');
    clearErrors();

    try {
      // Combine all code pieces
      const finalTsx = combineCodePieces(
        state.generatedTsxCode,
        state.jsxCode,
        figmaData
      );

      const finalCss = combineCssCode(
        state.cssCode,
        state.moreCssCode,
        figmaData
      );

      setFinalTsx(finalTsx);
      setFinalCss(finalCss);
      setStepStatus('step4', 'success');

    } catch (error) {
      console.error('Final generation error:', error);
      setError('step4', error instanceof Error ? error.message : 'Generation failed');
      setStepStatus('step4', 'error');
    }
  }, [state, setFinalTsx, setFinalCss, setStepStatus, setError, clearErrors]);

  // Helper functions
  const combineCodePieces = (generatedTsx: string, manualJsx: string, figmaData: any): string => {
    let finalCode = generatedTsx;

    if (manualJsx.trim()) {
      const returnMatch = finalCode.match(/return\s*\(\s*([\s\S]*?)\s*\);/);
      if (returnMatch) {
        const originalJsx = returnMatch[1].trim();
        
        if (originalJsx.startsWith('<svg')) {
          const mergedJsx = `
    <React.Fragment>
      ${originalJsx}
      {/* Additional JSX */}
      ${manualJsx}
    </React.Fragment>`;
          finalCode = finalCode.replace(returnMatch[0], `return (${mergedJsx}\n  );`);
        } else {
          const mergedJsx = `${originalJsx}\n      {/* Additional JSX */}\n      ${manualJsx}`;
          finalCode = finalCode.replace(returnMatch[0], `return (\n    ${mergedJsx}\n  );`);
        }
      }
    }

    if (figmaData) {
      const metadata = `/*
 * Generated from Figma Design
 * File: ${figmaData.file?.name || 'Unknown'}
 * Generated: ${new Date().toISOString()}
 * Components: ${figmaData.metadata?.componentCount || 0}
 * Styles: ${figmaData.metadata?.styleCount || 0}
 */

`;
      finalCode = metadata + finalCode;
    }

    return finalCode;
  };

  const combineCssCode = (baseCss: string, additionalCss: string, figmaData: any): string => {
    let finalCss = '';

    if (figmaData) {
      finalCss += `/*
 * Styles for Figma Component: ${figmaData.file?.name || 'Unknown'}
 * Generated: ${new Date().toISOString()}
 */

`;
    }

    if (baseCss.trim()) {
      finalCss += `/* Base Styles */
${baseCss}

`;
    }

    if (additionalCss.trim()) {
      finalCss += `/* Additional Styles */
${additionalCss}

`;
    }

    finalCss += `/* Responsive Utilities */
@media (max-width: 768px) {
  .figma-component {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .figma-component {
    padding: 0.5rem;
  }
}`;

    return finalCss;
  };

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
