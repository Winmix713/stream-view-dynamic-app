import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
  Code,
  FileText,
  Zap,
  Download,
  Copy,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { useFigmaSteps } from '@/contexts/FigmaStepsContext';
import { getStatusIcon } from '../utils/statusUtils';
import { VirtualizedCodeEditor } from '../components/VirtualizedCodeEditor';

interface SvgAnalysis {
  elementCount: number;
  complexity: 'simple' | 'moderate' | 'complex';
  hasAnimations: boolean;
  hasGradients: boolean;
  hasFilters: boolean;
  estimatedConversionTime: number;
  fileSize: number;
}

interface ConversionMetrics {
  startTime: number;
  endTime?: number;
  processingTime?: number;
  originalSize: number;
  convertedSize: number;
  optimizationRatio?: number;
}

/**
 * Step 2: Enhanced SVG Code Generation Component
 * 🎯 Features:
 * - Advanced SVG analysis and validation
 * - Real-time conversion progress
 * - Code optimization metrics
 * - Enhanced code editor with syntax highlighting
 * - Auto-save and recovery
 * - Performance monitoring
 * - Accessibility optimized
 */
export const Step2SvgGeneration: React.FC = () => {
  const { state, actions } = useFigmaSteps();
  const { stepData, stepStatus, uiState } = state;
  
  const [svgAnalysis, setSvgAnalysis] = useState<SvgAnalysis | null>(null);
  const [conversionMetrics, setConversionMetrics] = useState<ConversionMetrics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);
  
  const analysisTimeoutRef = useRef<NodeJS.Timeout>();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Enhanced SVG analysis
  const analyzeSvg = useCallback((svgCode: string): SvgAnalysis => {
    const elementCount = (svgCode.match(/<[^\/][^>]*>/g) || []).length;
    const hasAnimations = /animate|animateTransform|animateMotion/.test(svgCode);
    const hasGradients = /linearGradient|radialGradient/.test(svgCode);
    const hasFilters = /filter|feGaussianBlur|feDropShadow/.test(svgCode);
    const fileSize = new Blob([svgCode]).size;
    
    let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
    if (elementCount > 100 || hasAnimations || hasFilters) complexity = 'complex';
    else if (elementCount > 20 || hasGradients) complexity = 'moderate';
    
    const estimatedConversionTime = Math.max(500, elementCount * 10 + (hasAnimations ? 1000 : 0));
    
    return {
      elementCount,
      complexity,
      hasAnimations,
      hasGradients,
      hasFilters,
      estimatedConversionTime,
      fileSize
    };
  }, []);

  // Debounced SVG analysis
  const debouncedAnalysis = useCallback((svgCode: string) => {
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }
    
    analysisTimeoutRef.current = setTimeout(() => {
      if (svgCode.trim()) {
        setIsAnalyzing(true);
        try {
          const analysis = analyzeSvg(svgCode);
          setSvgAnalysis(analysis);
        } catch (error) {
          console.error('SVG analysis error:', error);
          setSvgAnalysis(null);
        } finally {
          setIsAnalyzing(false);
        }
      } else {
        setSvgAnalysis(null);
      }
    }, 500);
  }, [analyzeSvg]);

  // Enhanced SVG change handler with auto-save
  const handleSvgChange = useCallback((value: string) => {
    actions.setStepData({ svgCode: value });
    debouncedAnalysis(value);
    
    // Auto-save functionality
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    setAutoSaveStatus('saving');
    autoSaveTimeoutRef.current = setTimeout(() => {
      try {
        // Simulate auto-save (in real app, this would save to localStorage or server)
        localStorage.setItem('figma-step2-svg', value);
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus(null), 2000);
      } catch (error) {
        setAutoSaveStatus('error');
        setTimeout(() => setAutoSaveStatus(null), 3000);
      }
    }, 1000);
  }, [actions, debouncedAnalysis]);

  // Enhanced conversion with progress tracking
  const handleConversion = useCallback(async () => {
    if (!stepData.svgCode.trim()) {
      actions.setError('step2', 'Please provide SVG code before conversion');
      return;
    }

    const startTime = Date.now();
    const originalSize = new Blob([stepData.svgCode]).size;
    
    setConversionMetrics({
      startTime,
      originalSize,
      convertedSize: 0
    });

    try {
      // Simulate conversion progress
      setConversionProgress(0);
      const progressInterval = setInterval(() => {
        setConversionProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 100);

      await actions.generateSvgCode();
      
      clearInterval(progressInterval);
      setConversionProgress(100);
      
      const endTime = Date.now();
      const convertedSize = stepData.generatedTsxCode ? 
        new Blob([stepData.generatedTsxCode]).size : originalSize;
      
      setConversionMetrics({
        startTime,
        endTime,
        processingTime: endTime - startTime,
        originalSize,
        convertedSize,
        optimizationRatio: ((originalSize - convertedSize) / originalSize) * 100
      });
      
      setTimeout(() => setConversionProgress(0), 2000);
      
    } catch (error) {
      setConversionProgress(0);
      console.error('Conversion error:', error);
    }
  }, [actions, stepData.svgCode, stepData.generatedTsxCode]);

  // Copy to clipboard functionality
  const handleCopy = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, []);

  // Auto-recovery on component mount
  useEffect(() => {
    const savedSvg = localStorage.getItem('figma-step2-svg');
    if (savedSvg && !stepData.svgCode) {
      actions.setStepData({ svgCode: savedSvg });
    }
  }, [actions, stepData.svgCode]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, []);

  const isLoading = stepStatus.step2 === 'loading';
  const isSuccess = stepStatus.step2 === 'success';
  const hasError = stepStatus.step2 === 'error';
  const error = uiState.errors.step2;

  // Complexity color mapping
  const getComplexityColor = (complexity?: string) => {
    switch (complexity) {
      case 'simple': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'complex': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="bg-gray-800 border-gray-700 transition-all duration-300 hover:border-gray-600">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-white">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg">
            2
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              SVG Code Generation
              {getStatusIcon(stepStatus.step2)}
            </div>
            <div className="text-sm text-gray-400 font-normal">
              Convert SVG to React TSX component
            </div>
          </div>
          {autoSaveStatus && (
            <Badge variant="outline" className={`text-xs ${
              autoSaveStatus === 'saved' ? 'text-green-400' : 
              autoSaveStatus === 'saving' ? 'text-blue-400' : 'text-red-400'
            }`}>
              {autoSaveStatus === 'saved' && '✓ Saved'}
              {autoSaveStatus === 'saving' && '⏳ Saving...'}
              {autoSaveStatus === 'error' && '⚠ Save Error'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* SVG Analysis Panel */}
        {svgAnalysis && (
          <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                SVG Analysis
              </h4>
              {isAnalyzing && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="text-center p-2 bg-gray-800 rounded">
                <div className="text-lg font-bold text-white">{svgAnalysis.elementCount}</div>
                <div className="text-gray-400">Elements</div>
              </div>
              <div className="text-center p-2 bg-gray-800 rounded">
                <div className={`text-lg font-bold ${getComplexityColor(svgAnalysis.complexity)}`}>
                  {svgAnalysis.complexity}
                </div>
                <div className="text-gray-400">Complexity</div>
              </div>
              <div className="text-center p-2 bg-gray-800 rounded">
                <div className="text-lg font-bold text-white">
                  {formatFileSize(svgAnalysis.fileSize)}
                </div>
                <div className="text-gray-400">Size</div>
              </div>
              <div className="text-center p-2 bg-gray-800 rounded">
                <div className="text-lg font-bold text-white">
                  {Math.round(svgAnalysis.estimatedConversionTime / 1000)}s
                </div>
                <div className="text-gray-400">Est. Time</div>
              </div>
            </div>
            
            {/* Feature indicators */}
            <div className="flex gap-2 mt-3">
              {svgAnalysis.hasAnimations && (
                <Badge variant="outline" className="text-xs text-blue-400">
                  🎬 Animations
                </Badge>
              )}
              {svgAnalysis.hasGradients && (
                <Badge variant="outline" className="text-xs text-purple-400">
                  🌈 Gradients
                </Badge>
              )}
              {svgAnalysis.hasFilters && (
                <Badge variant="outline" className="text-xs text-green-400">
                  ✨ Filters
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Conversion Progress */}
        {isLoading && conversionProgress > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-purple-400">Converting SVG to TSX...</span>
              <span className="text-gray-400">{Math.round(conversionProgress)}%</span>
            </div>
            <Progress value={conversionProgress} className="h-2" />
          </div>
        )}

        {/* SVG Code Editor */}
        <div className="space-y-3">
          <VirtualizedCodeEditor
            value={stepData.svgCode}
            onChange={handleSvgChange}
            placeholder="Paste your SVG code here or it will be auto-generated from Figma..."
            language="svg"
            label="SVG Code"
            disabled={isLoading}
            maxLength={5000000} // 5MB limit
            showStats={true}
          />
        </div>

        {/* Error Display */}
        {hasError && error && (
          <Alert className="border-red-600 bg-red-900/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-400">
              <div className="font-medium mb-1">Conversion Failed</div>
              <div className="text-sm">{error}</div>
              {error.includes('Invalid SVG') && (
                <div className="mt-2 text-xs">
                  💡 Try: Check your SVG syntax or use a simpler SVG structure
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Conversion Metrics */}
        {conversionMetrics && conversionMetrics.endTime && (
          <div className="p-4 bg-green-900/20 border border-green-600 rounded-lg">
            <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Conversion Metrics
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <div className="text-gray-400">Processing Time</div>
                <div className="text-white font-medium">{conversionMetrics.processingTime}ms</div>
              </div>
              <div>
                <div className="text-gray-400">Original Size</div>
                <div className="text-white font-medium">{formatFileSize(conversionMetrics.originalSize)}</div>
              </div>
              <div>
                <div className="text-gray-400">Converted Size</div>
                <div className="text-white font-medium">{formatFileSize(conversionMetrics.convertedSize)}</div>
              </div>
              <div>
                <div className="text-gray-400">Optimization</div>
                <div className={`font-medium ${
                  (conversionMetrics.optimizationRatio || 0) > 0 ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {conversionMetrics.optimizationRatio ? 
                    `${conversionMetrics.optimizationRatio.toFixed(1)}%` : 
                    'N/A'
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleConversion}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            disabled={!stepData.svgCode.trim() || isLoading}
            aria-label={isLoading ? "Converting SVG to TSX component" : "Convert SVG code to TypeScript React component"}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Convert to TSX
              </>
            )}
          </Button>
          
          {stepData.svgCode && (
            <Button
              variant="outline"
              onClick={() => handleCopy(stepData.svgCode)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
              aria-label="Copy SVG code to clipboard"
            >
              <Copy className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Generated TSX Display */}
        {isSuccess && stepData.generatedTsxCode && (
          <div className="mt-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => actions.toggleBlock('block2')}
              className="text-green-400 hover:bg-gray-700 w-full justify-between mb-3"
              aria-expanded={uiState.expandedBlocks.block2}
              aria-controls="generated-tsx-panel"
            >
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                TSX Component Generated ({formatFileSize(stepData.generatedTsxCode.length)})
              </span>
              {uiState.expandedBlocks.block2 ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
            
            {uiState.expandedBlocks.block2 && (
              <div id="generated-tsx-panel" className="space-y-3">
                <VirtualizedCodeEditor
                  value={stepData.generatedTsxCode}
                  onChange={() => {}} // Read-only
                  language="tsx"
                  label="Generated TSX Component"
                  disabled={true}
                  showStats={true}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(stepData.generatedTsxCode)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    aria-label="Copy generated TSX component code to clipboard"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy TSX
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const blob = new Blob([stepData.generatedTsxCode], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'GeneratedComponent.tsx';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    aria-label="Download generated TSX component as file"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};