
import React, { createContext, useContext } from 'react';
import { FigmaConnectionProvider, useFigmaConnection } from './FigmaConnectionContext';
import { CodeGenerationProvider, useCodeGeneration } from './CodeGenerationContext';
import { UIStateProvider, useUIState } from './UIStateContext';

// Re-export types for compatibility
export type { FigmaConnectionState } from './FigmaConnectionContext';
export type { CodeGenerationState } from './CodeGenerationContext';
export type { UIState } from './UIStateContext';

// Legacy interface for backward compatibility
interface FigmaStepsContextType {
  state: {
    connection: ReturnType<typeof useFigmaConnection>['state'];
    codeGeneration: ReturnType<typeof useCodeGeneration>['state'];
    ui: ReturnType<typeof useUIState>['state'];
  };
  actions: {
    connection: ReturnType<typeof useFigmaConnection>['actions'];
    codeGeneration: ReturnType<typeof useCodeGeneration>['actions'];
    ui: ReturnType<typeof useUIState>['actions'];
    // Legacy methods for backward compatibility
    setStepData: (data: any) => void;
    setStepStatus: (status: any) => void;
    setUIState: (state: any) => void;
    setError: (step: string, error: string) => void;
    clearErrors: () => void;
    toggleBlock: (block: keyof ReturnType<typeof useUIState>['state']['expandedBlocks']) => void;
    setProgress: (progress: any) => void;
    resetAll: () => void;
    connectToFigma: () => Promise<void>;
    generateSvgCode: (svgContent?: string) => Promise<void>;
    saveCssCode: () => void;
    generateFinalCode: () => Promise<void>;
    downloadCode: () => void;
  };
}

const FigmaStepsContext = createContext<FigmaStepsContextType | undefined>(undefined);

// Internal component that combines all contexts
const FigmaStepsContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const connection = useFigmaConnection();
  const codeGeneration = useCodeGeneration();
  const ui = useUIState();

  // Legacy compatibility methods
  const setStepData = (data: any) => {
    if (data.figmaUrl !== undefined) connection.actions.setUrl(data.figmaUrl);
    if (data.accessToken !== undefined) connection.actions.setToken(data.accessToken);
    if (data.figmaData !== undefined) connection.actions.setData(data.figmaData);
    if (data.svgCode !== undefined) codeGeneration.actions.setSvgCode(data.svgCode);
    if (data.generatedTsxCode !== undefined) codeGeneration.actions.setGeneratedTsx(data.generatedTsxCode);
    if (data.cssCode !== undefined) codeGeneration.actions.setCssCode(data.cssCode);
    if (data.jsxCode !== undefined) codeGeneration.actions.setJsxCode(data.jsxCode);
    if (data.moreCssCode !== undefined) codeGeneration.actions.setMoreCss(data.moreCssCode);
    if (data.finalTsxCode !== undefined) codeGeneration.actions.setFinalTsx(data.finalTsxCode);
    if (data.finalCssCode !== undefined) codeGeneration.actions.setFinalCss(data.finalCssCode);
  };

  const setStepStatus = (status: any) => {
    if (status.step1 !== undefined) connection.actions.setStatus(status.step1);
    if (status.step2 !== undefined) codeGeneration.actions.setStepStatus('step2', status.step2);
    if (status.step3 !== undefined) codeGeneration.actions.setStepStatus('step3', status.step3);
    if (status.step4 !== undefined) codeGeneration.actions.setStepStatus('step4', status.step4);
  };

  const setUIState = (state: any) => {
    if (state.previewMode !== undefined) ui.actions.setPreviewMode(state.previewMode);
    if (state.progress !== undefined) ui.actions.setProgress(state.progress);
  };

  const setError = (step: string, error: string) => {
    if (step === 'step1') connection.actions.setError(error);
    else codeGeneration.actions.setError(step, error);
  };

  const clearErrors = () => {
    connection.actions.clearError();
    codeGeneration.actions.clearErrors();
  };

  const resetAll = () => {
    connection.actions.reset();
    codeGeneration.actions.reset();
    ui.actions.reset();
  };

  const generateFinalCode = async () => {
    await codeGeneration.actions.generateFinalCode(connection.state.figmaData);
  };

  const downloadCode = () => {
    const { finalTsxCode, finalCssCode } = codeGeneration.state;
    
    if (!finalTsxCode || !finalCssCode) return;

    // Download TSX file
    const tsxBlob = new Blob([finalTsxCode], { type: 'text/plain' });
    const tsxUrl = URL.createObjectURL(tsxBlob);
    const tsxLink = document.createElement('a');
    tsxLink.href = tsxUrl;
    tsxLink.download = 'GeneratedComponent.tsx';
    tsxLink.click();
    URL.revokeObjectURL(tsxUrl);

    // Download CSS file
    const cssBlob = new Blob([finalCssCode], { type: 'text/plain' });
    const cssUrl = URL.createObjectURL(cssBlob);
    const cssLink = document.createElement('a');
    cssLink.href = cssUrl;
    cssLink.download = 'GeneratedComponent.css';
    cssLink.click();
    URL.revokeObjectURL(cssUrl);
  };

  const contextValue: FigmaStepsContextType = {
    state: {
      connection: connection.state,
      codeGeneration: codeGeneration.state,
      ui: ui.state
    },
    actions: {
      connection: connection.actions,
      codeGeneration: codeGeneration.actions,
      ui: ui.actions,
      // Legacy methods
      setStepData,
      setStepStatus,
      setUIState,
      setError,
      clearErrors,
      toggleBlock: ui.actions.toggleBlock,
      setProgress: ui.actions.setProgress,
      resetAll,
      connectToFigma: connection.actions.connectToFigma,
      generateSvgCode: codeGeneration.actions.generateSvgCode,
      saveCssCode: codeGeneration.actions.saveCssCode,
      generateFinalCode,
      downloadCode
    }
  };

  return (
    <FigmaStepsContext.Provider value={contextValue}>
      {children}
    </FigmaStepsContext.Provider>
  );
};

// Main provider that wraps all sub-providers
export const FigmaStepsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <FigmaConnectionProvider>
      <CodeGenerationProvider>
        <UIStateProvider>
          <FigmaStepsContent>
            {children}
          </FigmaStepsContent>
        </UIStateProvider>
      </CodeGenerationProvider>
    </FigmaConnectionProvider>
  );
};

export const useFigmaSteps = () => {
  const context = useContext(FigmaStepsContext);
  if (context === undefined) {
    throw new Error('useFigmaSteps must be used within a FigmaStepsProvider');
  }
  return context;
};
