import { memoryManager } from '@/utils/memoryManager';
import { workerManager } from '@/utils/workerManager';
import { aiDesignAnalyzer } from './aiDesignAnalyzer';
import { frameworkAdapter } from './frameworkAdapter';
import { codeAssembler } from './code-generation/CodeAssembler';
import { metricsCalculator } from './code-generation/MetricsCalculator';
import { codeValidator } from './code-generation/CodeValidator';
import { qualityAssessor } from './code-generation/QualityAssessor';
import { normalizeFigmaData, validateFigmaData } from '@/utils/figmaDataNormalizer';
import { 
  CodeGenerationConfig, 
  GeneratedCode, 
  ProjectStructure
} from '@/types/code-generation';

interface GenerationContext {
  sessionId: string;
  startTime: number;
  config: CodeGenerationConfig;
  userPreferences?: Record<string, any>;
  figmaData?: any;
}

/**
 * Enhanced Code Generation Engine
 * Orchestrates the entire code generation pipeline with AI assistance
 */
export class EnhancedCodeGenerationEngine {
  private static instance: EnhancedCodeGenerationEngine;
  private generationQueue: Map<string, GenerationContext> = new Map();
  private performanceMetrics: Map<string, any> = new Map();

  static getInstance(): EnhancedCodeGenerationEngine {
    if (!EnhancedCodeGenerationEngine.instance) {
      EnhancedCodeGenerationEngine.instance = new EnhancedCodeGenerationEngine();
    }
    return EnhancedCodeGenerationEngine.instance;
  }

  private constructor() {
    this.initializePerformanceMonitoring();
  }

  private initializePerformanceMonitoring(): void {
    this.performanceMetrics.set('startup', Date.now());
  }

  /**
   * Enhanced SVG extraction with robust data structure handling
   */
  async extractSVGFromFigma(figmaData: any): Promise<string> {
    console.log('Starting SVG extraction from Figma data...');
    
    try {
      // Validate and normalize the Figma data structure
      const validation = validateFigmaData(figmaData);
      console.log('Figma data validation result:', validation);

      if (!validation.isValid) {
        console.error('Figma data validation failed:', validation.error);
        return this.createFallbackSVG(`Validation failed: ${validation.error}`);
      }

      const normalizedData = normalizeFigmaData(figmaData);
      if (!normalizedData) {
        console.error('Failed to normalize Figma data structure');
        return this.createFallbackSVG('Unable to normalize Figma data structure');
      }

      console.log(`Successfully normalized Figma data (${validation.structure} structure) with ${validation.childrenCount} children`);

      // Extract SVG from normalized data
      const width = 400;
      const height = 300;
      
      let svgContent = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
      
      const extractShapes = (nodes: any[], offsetX = 0, offsetY = 0): string => {
        let shapes = '';
        
        if (!Array.isArray(nodes)) {
          console.warn('Expected array of nodes, got:', typeof nodes);
          return shapes;
        }
        
        nodes.forEach((node, index) => {
          try {
            if (node.absoluteBoundingBox) {
              const { x, y, width: w, height: h } = node.absoluteBoundingBox;
              
              switch (node.type) {
                case 'RECTANGLE':
                  shapes += `<rect x="${x + offsetX}" y="${y + offsetY}" width="${w}" height="${h}" fill="#f0f0f0" stroke="#ccc" stroke-width="1"/>`;
                  break;
                case 'ELLIPSE':
                  const cx = x + w / 2;
                  const cy = y + h / 2;
                  shapes += `<ellipse cx="${cx + offsetX}" cy="${cy + offsetY}" rx="${w / 2}" ry="${h / 2}" fill="#e0e0e0" stroke="#ccc" stroke-width="1"/>`;
                  break;
                case 'TEXT':
                  shapes += `<text x="${x + offsetX}" y="${y + offsetY + 16}" font-family="Arial, sans-serif" font-size="14" fill="#333">${node.characters || 'Text'}</text>`;
                  break;
                default:
                  console.log(`Unhandled node type: ${node.type}`);
              }
            }
            
            if (node.children && Array.isArray(node.children)) {
              shapes += extractShapes(node.children, offsetX, offsetY);
            }
          } catch (nodeError) {
            console.warn(`Error processing node ${index}:`, nodeError);
          }
        });
        
        return shapes;
      };
      
      const extractedShapes = extractShapes(normalizedData.document.children);
      svgContent += extractedShapes;
      svgContent += '</svg>';
      
      if (extractedShapes.trim()) {
        console.log('Successfully extracted SVG with shapes');
        return svgContent;
      } else {
        console.warn('No shapes were extracted, returning default SVG');
        return this.createDefaultSVG();
      }
      
    } catch (error) {
      console.error('SVG extraction error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown extraction error';
      return this.createFallbackSVG(errorMessage);
    }
  }

  /**
   * Create a fallback SVG when extraction fails
   */
  private createFallbackSVG(errorMessage: string): string {
    return `<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="380" height="280" fill="none" stroke="#ddd" stroke-width="1"/>
      <text x="200" y="160" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#999">SVG Generation Error</text>
      <text x="200" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#666">${errorMessage}</text>
    </svg>`;
  }

  /**
   * Create a default SVG for successful extraction with no shapes
   */
  private createDefaultSVG(): string {
    return `<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="50" y="50" width="300" height="200" fill="#f0f0f0" stroke="#ccc" stroke-width="2" rx="8"/>
      <text x="200" y="160" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#666">Generated from Figma</text>
    </svg>`;
  }

  /**
   * Main entry point for code generation
   */
  async generateCode(
    figmaData: any,
    config: CodeGenerationConfig,
    progressCallback?: (progress: number, status: string) => void
  ): Promise<GeneratedCode> {
    const sessionId = this.generateSessionId();
    const startTime = Date.now();

    const context: GenerationContext = {
      sessionId,
      startTime,
      config,
      figmaData
    };

    this.generationQueue.set(sessionId, context);

    try {
      console.log(`[${sessionId}] Starting design analysis...`);
      progressCallback?.(10, 'Analyzing design...');
      const designAnalysis = await aiDesignAnalyzer.analyzeFigmaDesign(figmaData, config);

      console.log(`[${sessionId}] Planning code structure...`);
      progressCallback?.(30, 'Planning structure...');
      const structure = await this.planCodeStructure(designAnalysis, config);

      console.log(`[${sessionId}] Generating components...`);
      progressCallback?.(50, 'Generating components...');
      const components = await this.generateComponents(designAnalysis, structure, config);

      console.log(`[${sessionId}] Adapting to target framework...`);
      progressCallback?.(70, 'Adapting framework...');
      const adaptedCode = await frameworkAdapter.adaptToFramework(
        components.jsx,
        components.css,
        config
      );

      console.log(`[${sessionId}] Assessing code quality...`);
      progressCallback?.(85, 'Assessing quality...');
      const quality = await qualityAssessor.performQualityAssessment(adaptedCode, config);

      console.log(`[${sessionId}] Assembling final code...`);
      progressCallback?.(95, 'Finalizing...');
      const finalCode = await codeAssembler.assembleFinalCode(adaptedCode, structure, config);

      const metrics = metricsCalculator.calculateMetrics(finalCode, startTime);
      const buildLogs = await codeValidator.validateBuild(finalCode, config);

      const result: GeneratedCode = {
        id: sessionId,
        timestamp: new Date(),
        config,
        files: finalCode.files,
        structure: finalCode.structure,
        metrics,
        quality: {
          ...quality,
          recommendations: [...quality.recommendations, ...designAnalysis.suggestions]
        },
        preview: finalCode.preview,
        buildStatus: buildLogs.some(log => log.level === 'error') ? 'error' : 
                    buildLogs.some(log => log.level === 'warn') ? 'warning' : 'success',
        buildLogs
      };

      await memoryManager.store(`generation-${sessionId}`, result);

      console.log(`[${sessionId}] Code generation completed successfully`);
      progressCallback?.(100, 'Complete!');
      return result;

    } catch (error) {
      console.error(`[${sessionId}] Code generation failed:`, error);
      throw error;
    } finally {
      this.generationQueue.delete(sessionId);
    }
  }

  private generateSessionId(): string {
    return `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async planCodeStructure(
    designAnalysis: any,
    config: CodeGenerationConfig
  ): Promise<ProjectStructure> {
    const hasComplexInteractions = designAnalysis.interactions?.length > 0;

    return {
      root: 'src',
      components: [`components/GeneratedComponent.${config.typescript ? 'tsx' : 'jsx'}`],
      hooks: hasComplexInteractions ? ['useInteraction.ts'] : [],
      utils: ['helpers.ts'],
      types: config.typescript ? ['index.ts'] : [],
      styles: [`styles/generated.${config.styling === 'scss' ? 'scss' : 'css'}`],
      tests: config.testing.unitTests ? ['__tests__/'] : [],
      assets: designAnalysis.assets?.map((asset: any) => asset.name) || []
    };
  }

  private async generateComponents(
    designAnalysis: any,
    structure: ProjectStructure,
    config: CodeGenerationConfig
  ): Promise<{ jsx: string; css: string }> {
    const processingResult = await workerManager.processInWorker('codeProcessingWorker', {
      type: 'generateComponents',
      data: {
        designAnalysis,
        structure,
        config
      }
    });

    return {
      jsx: processingResult.jsx || this.generateFallbackJSX(config),
      css: processingResult.css || this.generateFallbackCSS(config)
    };
  }

  private generateFallbackJSX(config: CodeGenerationConfig): string {
    return `    <div className="generated-component">
      <h1>Generated Component</h1>
      <p>This component was generated from your Figma design.</p>
    </div>`;
  }

  private generateFallbackCSS(config: CodeGenerationConfig): string {
    return `.generated-component {
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
  font-family: Arial, sans-serif;
}`;
  }
}

export const enhancedCodeGenerationEngine = EnhancedCodeGenerationEngine.getInstance();
