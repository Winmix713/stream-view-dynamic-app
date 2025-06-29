
import { CodeFile, ProjectStructure, CodeGenerationConfig } from '@/types/code-generation';

export class CodeAssembler {
  private static instance: CodeAssembler;

  static getInstance(): CodeAssembler {
    if (!CodeAssembler.instance) {
      CodeAssembler.instance = new CodeAssembler();
    }
    return CodeAssembler.instance;
  }

  private constructor() {}

  /**
   * Assemble the final code structure
   */
  async assembleFinalCode(adaptedCode: any, structure: ProjectStructure, config: CodeGenerationConfig): Promise<any> {
    const files: CodeFile[] = [];
    
    // Create main component file
    const componentContent = adaptedCode.componentCode || this.generateFallbackJSX(config);
    files.push({
      path: 'src/components/GeneratedComponent.tsx',
      name: 'GeneratedComponent.tsx',
      content: componentContent,
      language: this.detectLanguage('GeneratedComponent.tsx'),
      size: componentContent.length,
      extension: '.tsx',
      imports: this.extractImports(componentContent),
      exports: this.extractExports(componentContent),
      dependencies: ['react']
    });

    // Create style file
    const styleContent = adaptedCode.styleCode || this.generateFallbackCSS(config);
    files.push({
      path: 'src/styles/generated.css',
      name: 'generated.css',
      content: styleContent,
      language: 'css',
      size: styleContent.length,
      extension: '.css',
      imports: [],
      exports: [],
      dependencies: []
    });

    return {
      files,
      structure,
      preview: this.generatePreview(componentContent)
    };
  }

  private generateFallbackJSX(config: CodeGenerationConfig): string {
    return `import React from 'react';

const GeneratedComponent${config.typescript ? ': React.FC' : ''} = () => {
  return (
    <div className="generated-component">
      <h1>Generated Component</h1>
      <p>This component was generated from your Figma design.</p>
    </div>
  );
};

export default GeneratedComponent;`;
  }

  private generateFallbackCSS(config: CodeGenerationConfig): string {
    return `.generated-component {
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
  font-family: Arial, sans-serif;
}

.generated-component h1 {
  color: #333;
  margin-bottom: 10px;
}

.generated-component p {
  color: #666;
  line-height: 1.5;
}`;
  }

  private detectLanguage(filename: string): string {
    const extension = filename.substring(filename.lastIndexOf('.'));
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.css': 'css',
      '.scss': 'scss',
      '.html': 'html',
      '.json': 'json'
    };
    
    return languageMap[extension] || 'text';
  }

  private extractImports(content: string): string[] {
    const importRegex = /import\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g;
    const imports = [];
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }

  private extractExports(content: string): string[] {
    const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g;
    const exports = [];
    let match;
    
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    
    return exports;
  }

  private generatePreview(componentCode: string): string {
    return `<!DOCTYPE html>
<html>
<head>
    <title>Generated Component Preview</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .preview { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="preview">
        <h2>Component Preview</h2>
        <p>This is a preview of your generated component.</p>
        <pre><code>${componentCode.substring(0, 200)}...</code></pre>
    </div>
</body>
</html>`;
  }
}

export const codeAssembler = CodeAssembler.getInstance();
