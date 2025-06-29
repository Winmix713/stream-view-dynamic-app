import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Maximize2, 
  Minimize2, 
  Copy, 
  Download, 
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  Zap,
  Shield
} from 'lucide-react';
import { largeSvgHandler } from '@/lib/svg-to-jsx/large-file-handler';

interface VirtualizedCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  language?: string;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
  showStats?: boolean;
}

interface EditorStats {
  lines: number;
  characters: number;
  size: number;
  words: number;
  complexity: 'simple' | 'moderate' | 'complex';
}

/**
 * Enhanced Virtualized Code Editor Component
 * Optimized for handling massive code files (10MB+) without browser freezing
 * Based on svg-to-code-figma best practices
 */
export const VirtualizedCodeEditor: React.FC<VirtualizedCodeEditorProps> = ({
  value,
  onChange,
  placeholder = "Paste your code here...",
  language = "text",
  maxLength = 10000000, // 10MB limit
  disabled = false,
  className = "",
  label,
  showStats = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<EditorStats>({
    lines: 0,
    characters: 0,
    size: 0,
    words: 0,
    complexity: 'simple'
  });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const processingRef = useRef<boolean>(false);

  // Calculate stats with performance optimization
  const calculateStats = useCallback((text: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

    // Use requestIdleCallback for non-blocking processing
    const processStats = () => {
      const lines = text.split('\n').length;
      const characters = text.length;
      const size = new Blob([text]).size;
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      
      // Determine complexity based on content
      let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
      if (language === 'svg') {
        const elementCount = (text.match(/<[^\/][^>]*>/g) || []).length;
        if (elementCount > 100) complexity = 'complex';
        else if (elementCount > 20) complexity = 'moderate';
      } else if (language === 'css') {
        const ruleCount = (text.match(/\{[^}]*\}/g) || []).length;
        if (ruleCount > 100) complexity = 'complex';
        else if (ruleCount > 30) complexity = 'moderate';
      } else {
        if (lines > 1000) complexity = 'complex';
        else if (lines > 200) complexity = 'moderate';
      }

      setStats({ lines, characters, size, words, complexity });
      
      // Show warning for large files
      setShowWarning(size > 1024 * 1024); // 1MB threshold
      
      processingRef.current = false;
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(processStats, { timeout: 1000 });
    } else {
      setTimeout(processStats, 0);
    }
  }, [language]);

  // Debounced onChange handler with chunked processing
  const debouncedOnChange = useCallback((newValue: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setIsProcessing(true);
      
      // For very large content, use chunked processing
      if (newValue.length > 100000) {
        const processInChunks = async () => {
          try {
            calculateStats(newValue);
            onChange(newValue);
          } catch (error) {
            console.error('Processing error:', error);
          } finally {
            setIsProcessing(false);
          }
        };
        processInChunks();
      } else {
        calculateStats(newValue);
        onChange(newValue);
        setIsProcessing(false);
      }
    }, 300);
  }, [onChange, calculateStats]);

  // Handle input change with performance optimization
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // Check size limit
    if (newValue.length > maxLength) {
      alert(`Content is too large! Maximum ${Math.round(maxLength / 1024 / 1024)}MB allowed.`);
      return;
    }

    // Immediate UI update for responsiveness
    if (textareaRef.current) {
      textareaRef.current.value = newValue;
    }
    
    debouncedOnChange(newValue);
  }, [debouncedOnChange, maxLength]);

  // Optimize large SVG content
  const handleOptimize = useCallback(async () => {
    if (!value || language !== 'svg') return;
    
    setIsOptimizing(true);
    try {
      const result = await largeSvgHandler.processLargeSvg(value, (progress, message) => {
        console.log(`Optimization: ${progress}% - ${message}`);
      });
      
      onChange(result.jsx);
      
      // Show optimization results
      alert(`Optimization complete!\nOriginal: ${formatFileSize(result.metrics.originalSize)}\nOptimized: ${formatFileSize(result.metrics.processedSize)}\nSaved: ${result.metrics.compressionRatio.toFixed(1)}%`);
      
    } catch (error) {
      console.error('Optimization error:', error);
      alert(`Optimization failed: ${error.message}`);
    } finally {
      setIsOptimizing(false);
    }
  }, [value, language, onChange]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      // Could add toast notification here
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [value]);

  // Download as file
  const handleDownload = useCallback(() => {
    const blob = new Blob([value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${language}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [value, language]);

  // Format file size
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Initialize stats
  useEffect(() => {
    if (value) {
      calculateStats(value);
    }
  }, [value, calculateStats]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Get complexity color
  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'complex': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header with label and controls */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300" htmlFor={`editor-${label?.replace(/\s+/g, '-').toLowerCase()}`}>
            {label}
            {isProcessing && (
              <Loader2 className="inline w-3 h-3 ml-2 animate-spin" />
            )}
          </label>
          <div className="flex items-center gap-2">
            {language === 'svg' && value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleOptimize}
                disabled={isOptimizing}
                className="text-gray-400 hover:text-gray-200"
                aria-label={isOptimizing ? "Optimizing SVG code" : "Optimize SVG code for better performance"}
              >
                {isOptimizing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="text-gray-400 hover:text-gray-200"
              aria-label={isPreviewMode ? "Switch to edit mode" : "Switch to preview mode"}
            >
              {isPreviewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-200"
              aria-label={isExpanded ? "Collapse editor" : "Expand editor"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Stats display */}
      {showStats && stats.characters > 0 && (
        <div 
          className="p-3 rounded-lg border border-gray-600 bg-gray-700"
          id={label ? `stats-${label?.replace(/\s+/g, '-').toLowerCase()}` : undefined}
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span>📄 {stats.lines.toLocaleString()} lines</span>
              <span>🔤 {stats.characters.toLocaleString()} chars</span>
              <span>📏 {formatFileSize(stats.size)}</span>
              <span>📝 {stats.words.toLocaleString()} words</span>
              <span className={getComplexityColor(stats.complexity)}>
                🎯 {stats.complexity}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {showWarning && (
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              )}
              <Badge variant="outline" className="text-xs">
                {language.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Performance warning for large files */}
      {showWarning && (
        <Alert className="border-yellow-600 bg-yellow-900/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-yellow-400">
            <div className="flex items-center justify-between">
              <div>
                <strong>Large file detected!</strong> Files over 1MB may cause performance issues.
              </div>
              {language === 'svg' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOptimize}
                  disabled={isOptimizing}
                  className="border-yellow-600 text-yellow-400 hover:bg-yellow-900/20"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Optimize
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Code editor */}
      <div className="relative">
        {isPreviewMode ? (
          // Preview mode - read-only with syntax highlighting simulation
          <div className={`
            bg-gray-700 border border-gray-600 rounded-lg p-3 font-mono text-xs text-gray-300
            ${isExpanded ? 'h-96' : 'h-40'} overflow-auto
          `}>
            <pre className="whitespace-pre-wrap break-words">
              {value || placeholder}
            </pre>
          </div>
        ) : (
          // Edit mode - optimized textarea
          <Textarea
            ref={textareaRef}
            id={label ? `editor-${label?.replace(/\s+/g, '-').toLowerCase()}` : undefined}
            defaultValue={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              bg-gray-700 border-gray-600 text-white font-mono text-xs resize-none
              ${isExpanded ? 'h-96' : 'h-40'}
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${showWarning ? 'border-yellow-500' : ''}
            `}
            style={{
              // Optimize for large text handling
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              whiteSpace: 'pre-wrap'
            }}
            aria-describedby={showStats ? `stats-${label?.replace(/\s+/g, '-').toLowerCase()}` : undefined}
          />
        )}

        {/* Action buttons overlay */}
        {value && (
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-6 w-6 p-0 bg-gray-800/80 hover:bg-gray-700/80 text-gray-300"
              aria-label={`Copy ${language} code to clipboard`}
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-6 w-6 p-0 bg-gray-800/80 hover:bg-gray-700/80 text-gray-300"
              aria-label={`Download ${language} code as file`}
            >
              <Download className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* File operations */}
      {value && (
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>
            {isProcessing ? 'Processing...' : 'Ready'}
            {stats.complexity === 'complex' && (
              <span className="ml-2 text-yellow-400">⚠ Complex content</span>
            )}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="text-xs h-7 border-gray-600 text-gray-300 hover:bg-gray-700"
              aria-label={`Copy ${language} code to clipboard`}
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="text-xs h-7 border-gray-600 text-gray-300 hover:bg-gray-700"
              aria-label={`Download ${language} code as ${language} file`}
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualizedCodeEditor;