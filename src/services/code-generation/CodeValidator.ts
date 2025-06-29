
import { BuildLog, CodeFile, CodeGenerationConfig } from '@/types/code-generation';

export class CodeValidator {
  private static instance: CodeValidator;

  static getInstance(): CodeValidator {
    if (!CodeValidator.instance) {
      CodeValidator.instance = new CodeValidator();
    }
    return CodeValidator.instance;
  }

  private constructor() {}

  /**
   * Validate the build
   */
  async validateBuild(finalCode: any, config: CodeGenerationConfig): Promise<BuildLog[]> {
    const logs: BuildLog[] = [];
    
    finalCode.files.forEach((file: CodeFile) => {
      const missingImports = this.findMissingImports(file.content, file.imports);
      missingImports.forEach(imp => {
        logs.push({
          level: 'warn',
          message: `Missing import: ${imp}`,
          file: file.path,
          line: 1,
          timestamp: new Date()
        });
      });

      if (config.typescript && file.language === 'typescript') {
        const tsIssues = this.validateTypeScript(file.content);
        tsIssues.forEach(issue => {
          logs.push({
            level: 'error',
            message: issue,
            file: file.path,
            line: 1,
            timestamp: new Date()
          });
        });
      }
    });

    return logs;
  }

  private findMissingImports(content: string, existingImports: string[]): string[] {
    const used = [];
    
    if (/React\.|useState|useEffect|Component/.test(content) && !existingImports.includes('react')) {
      used.push('react');
    }
    
    return used;
  }

  private validateTypeScript(content: string): string[] {
    const issues = [];
    
    if (content.includes(': React.FC') && !content.includes('import React')) {
      issues.push('React import missing for React.FC type');
    }
    
    if (/interface\s+\w+/.test(content) && !content.includes('export')) {
      issues.push('Interface defined but not exported');
    }
    
    return issues;
  }
}

export const codeValidator = CodeValidator.getInstance();
