
import React from 'react';
import { Code, RefreshCw, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FigmaStepsProvider, useFigmaSteps } from '@/contexts/FigmaStepsContext';
import { Step1Configuration } from './steps/Step1Configuration';
import { Step2SvgGeneration } from './steps/Step2SvgGeneration';
import { Step3CssImplementation } from './steps/Step3CssImplementation';
import { Step4FinalGeneration } from './steps/Step4FinalGeneration';
import { ProgressIndicator } from './components/ProgressIndicator';
import { SuccessSummary } from './components/SuccessSummary';
import { PreviewPanel } from './components/PreviewPanel';
import { BatchProgressIndicator } from './components/BatchProgressIndicator';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/**
 * Main Generator Component (Internal)
 * Contains the actual generator logic wrapped by the provider
 */
const GeneratorContent: React.FC = () => {
  const { state, actions } = useFigmaSteps();
  const { connection, codeGeneration, ui } = state;

  // Create legacy state structure for backward compatibility
  const legacyState = {
    stepData: {
      figmaUrl: connection.figmaUrl,
      accessToken: connection.accessToken,
      figmaData: connection.figmaData,
      svgCode: codeGeneration.svgCode,
      generatedTsxCode: codeGeneration.generatedTsxCode,
      cssCode: codeGeneration.cssCode,
      jsxCode: codeGeneration.jsxCode,
      moreCssCode: codeGeneration.moreCssCode,
      finalTsxCode: codeGeneration.finalTsxCode,
      finalCssCode: codeGeneration.finalCssCode,
      batchProcessing: {
        isActive: false,
        mode: 'single' as const,
        files: [],
        currentFileIndex: 0,
        totalProgress: 0,
        successCount: 0,
        errorCount: 0,
        completedFiles: [],
        failedFiles: []
      }
    },
    stepStatus: {
      step1: connection.status,
      step2: codeGeneration.stepStatus.step2,
      step3: codeGeneration.stepStatus.step3,
      step4: codeGeneration.stepStatus.step4
    },
    uiState: {
      expandedBlocks: ui.expandedBlocks,
      previewMode: ui.previewMode,
      errors: { 
        step1: connection.error || '',
        ...codeGeneration.errors 
      },
      progress: ui.progress
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Code className="w-6 h-6 text-gray-900" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Modular 4-Step Code Generator
              </h1>
              <p className="text-gray-400">
                Transform Figma designs into production-ready code with enhanced modularity
              </p>
            </div>
          </div>
          
          {/* Header Actions */}
          <div className="flex gap-2">
            {legacyState.stepStatus.step4 === 'success' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={actions.downloadCode}
                  className="text-gray-300 border-gray-600 hover:bg-gray-800"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => actions.setUIState({ previewMode: !ui.previewMode })}
                  className="text-gray-300 border-gray-600 hover:bg-gray-800"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={actions.resetAll}
              className="text-gray-300 border-gray-600 hover:bg-gray-800"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Progress Indicator */}
        <ProgressIndicator />

        {/* Batch Processing Indicator */}
        {legacyState.stepData.batchProcessing.mode === 'batch' && legacyState.stepData.batchProcessing.files.length > 0 && (
          <div className="mb-8">
            <BatchProgressIndicator batchState={legacyState.stepData.batchProcessing} />
          </div>
        )}

        {/* 4-Step Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ErrorBoundary>
            <Step1Configuration />
          </ErrorBoundary>
          <ErrorBoundary>
            <Step2SvgGeneration />
          </ErrorBoundary>
          <ErrorBoundary>
            <Step3CssImplementation />
          </ErrorBoundary>
          <ErrorBoundary>
            <Step4FinalGeneration />
          </ErrorBoundary>
        </div>

        {/* Success Summary */}
        <ErrorBoundary>
          <SuccessSummary />
        </ErrorBoundary>

        {/* Preview Panel */}
        <ErrorBoundary>
          <PreviewPanel />
        </ErrorBoundary>
      </div>
    </div>
  );
};

/**
 * Modular Figma Steps Generator (Main Export)
 * Provides context and wraps the generator content
 */
export const ModularFigmaStepsGenerator: React.FC = () => {
  return (
    <ErrorBoundary>
      <FigmaStepsProvider>
        <GeneratorContent />
      </FigmaStepsProvider>
    </ErrorBoundary>
  );
};

export default ModularFigmaStepsGenerator;
