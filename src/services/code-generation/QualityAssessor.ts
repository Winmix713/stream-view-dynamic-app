
import { QualityAssessment, CodeGenerationConfig } from '@/types/code-generation';

export class QualityAssessor {
  private static instance: QualityAssessor;

  static getInstance(): QualityAssessor {
    if (!QualityAssessor.instance) {
      QualityAssessor.instance = new QualityAssessor();
    }
    return QualityAssessor.instance;
  }

  private constructor() {}

  /**
   * Perform comprehensive quality assessment
   */
  async performQualityAssessment(
    code: any,
    config: CodeGenerationConfig
  ): Promise<QualityAssessment> {
    const codeString = typeof code.componentCode === 'string' ? code.componentCode : '';
    
    const hasTypeScript = config.typescript && codeString.includes('interface');
    const hasAccessibility = /aria-|role=|alt=/.test(codeString);
    const hasResponsive = /@media|rem|em|%/.test(code.styleCode || '');
    const hasTests = config.testing.unitTests;
    const hasComments = /\/\*|\/\//.test(codeString);

    const categories = {
      visual: this.calculateVisualScore(code),
      code: this.calculateCodeScore(codeString, config),
      performance: this.calculatePerformanceScore(code, config),
      accessibility: hasAccessibility ? 95 : 60,
      maintainability: (hasComments ? 40 : 20) + (hasTypeScript ? 30 : 10) + (hasTests ? 30 : 0),
      security: this.calculateSecurityScore(codeString)
    };

    const overall = Object.values(categories).reduce((sum, score) => sum + score, 0) / Object.keys(categories).length;

    const issues = [];
    const recommendations = [];

    if (!hasAccessibility) {
      issues.push({
        level: 'warning' as const,
        message: 'Missing accessibility attributes',
        category: 'accessibility' as const
      });
    }

    if (!hasTypeScript && config.typescript) {
      recommendations.push('Enable TypeScript for better type safety');
    }

    if (!hasResponsive) {
      recommendations.push('Add responsive design patterns');
    }

    return {
      overall,
      categories,
      issues,
      recommendations,
      aiSuggestions: recommendations
    };
  }

  private calculateVisualScore(code: any): number {
    return 85;
  }

  private calculateCodeScore(codeString: string, config: CodeGenerationConfig): number {
    let score = 70;
    
    if (config.typescript && codeString.includes('interface')) score += 15;
    if (codeString.includes('React.FC') || codeString.includes('function')) score += 10;
    if (/\/\*|\/\//.test(codeString)) score += 5;
    
    return Math.min(score, 100);
  }

  private calculatePerformanceScore(code: any, config: CodeGenerationConfig): number {
    let score = 75;
    
    if (config.optimization.treeshaking) score += 8;
    if (config.optimization.codesplitting) score += 8;
    if (config.optimization.lazyLoading) score += 9;
    
    return Math.min(score, 100);
  }

  private calculateSecurityScore(codeString: string): number {
    let score = 90;
    
    if (codeString.includes('dangerouslySetInnerHTML')) score -= 20;
    if (codeString.includes('eval(')) score -= 30;
    if (codeString.includes('document.write')) score -= 25;
    
    return Math.max(score, 0);
  }
}

export const qualityAssessor = QualityAssessor.getInstance();
