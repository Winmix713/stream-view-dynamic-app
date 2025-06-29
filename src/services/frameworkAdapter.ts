
import { CodeGenerationConfig } from '@/types/code-generation';

export interface FrameworkTemplate {
  name: string;
  extension: string;
  dependencies: string[];
  devDependencies: string[];
  configFiles: { [filename: string]: string };
}

export class FrameworkAdapter {
  private static instance: FrameworkAdapter;

  static getInstance(): FrameworkAdapter {
    if (!FrameworkAdapter.instance) {
      FrameworkAdapter.instance = new FrameworkAdapter();
    }
    return FrameworkAdapter.instance;
  }

  private constructor() {}

  async adaptToFramework(
    jsxCode: string, 
    cssCode: string, 
    config: CodeGenerationConfig
  ): Promise<{
    componentCode: string;
    styleCode: string;
    additionalFiles: { [filename: string]: string };
    template: FrameworkTemplate;
  }> {
    
    switch (config.framework) {
      case 'vue':
        return this.adaptToVue(jsxCode, cssCode, config);
      case 'angular':
        return this.adaptToAngular(jsxCode, cssCode, config);
      case 'svelte':
        return this.adaptToSvelte(jsxCode, cssCode, config);
      case 'react':
      default:
        return this.adaptToReact(jsxCode, cssCode, config);
    }
  }

  private async adaptToVue(jsxCode: string, cssCode: string, config: CodeGenerationConfig) {
    const componentName = 'GeneratedComponent';
    
    // Convert JSX to Vue template
    const vueTemplate = this.convertJSXToVueTemplate(jsxCode);
    
    const componentCode = `<template>
${vueTemplate}
</template>

<script ${config.typescript ? 'lang="ts"' : ''}>
import { defineComponent } from 'vue';

export default defineComponent({
  name: '${componentName}',
  props: {
    className: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    return {
      ...props
    };
  }
});
</script>

<style scoped>
${cssCode}
</style>`;

    const vueFrameworkTemplate: FrameworkTemplate = {
      name: 'Vue',
      extension: '.vue',
      dependencies: ['vue@^3.3.0'],
      devDependencies: [
        '@vitejs/plugin-vue@^4.0.0',
        ...(config.typescript ? ['@vue/tsconfig@^0.4.0'] : [])
      ],
      configFiles: {
        'vite.config.js': this.getVueViteConfig(config.typescript),
        ...(config.typescript ? { 'tsconfig.json': this.getVueTSConfig() } : {})
      }
    };

    return {
      componentCode,
      styleCode: cssCode,
      additionalFiles: {},
      template: vueFrameworkTemplate
    };
  }

  private async adaptToAngular(jsxCode: string, cssCode: string, config: CodeGenerationConfig) {
    const componentName = 'GeneratedComponent';
    const selector = 'app-generated';
    
    // Convert JSX to Angular template
    const angularTemplate = this.convertJSXToAngularTemplate(jsxCode);
    
    const componentCode = `import { Component, Input } from '@angular/core';

@Component({
  selector: '${selector}',
  template: \`
${angularTemplate}
  \`,
  styleUrls: ['./${componentName.toLowerCase()}.component.${config.styling === 'scss' ? 'scss' : 'css'}']
})
export class ${componentName}Component {
  @Input() className: string = '';
}`;

    const moduleCode = `import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ${componentName}Component } from './${componentName.toLowerCase()}.component';

@NgModule({
  declarations: [${componentName}Component],
  imports: [CommonModule],
  exports: [${componentName}Component]
})
export class ${componentName}Module {}`;

    const angularFrameworkTemplate: FrameworkTemplate = {
      name: 'Angular',
      extension: '.component.ts',
      dependencies: [
        '@angular/core@^16.0.0',
        '@angular/common@^16.0.0'
      ],
      devDependencies: [
        '@angular/cli@^16.0.0',
        'typescript@^5.0.0'
      ],
      configFiles: {
        'angular.json': this.getAngularConfig(),
        'tsconfig.json': this.getAngularTSConfig()
      }
    };

    return {
      componentCode,
      styleCode: cssCode,
      additionalFiles: {
        [`${componentName.toLowerCase()}.module.ts`]: moduleCode
      },
      template: angularFrameworkTemplate
    };
  }

  private async adaptToSvelte(jsxCode: string, cssCode: string, config: CodeGenerationConfig) {
    const componentName = 'GeneratedComponent';
    
    // Convert JSX to Svelte template
    const svelteTemplate = this.convertJSXToSvelteTemplate(jsxCode);
    
    const componentCode = `<script ${config.typescript ? 'lang="ts"' : ''}>
  export let className = '';
</script>

${svelteTemplate}

<style>
${cssCode}
</style>`;

    const svelteFrameworkTemplate: FrameworkTemplate = {
      name: 'Svelte',
      extension: '.svelte',
      dependencies: ['svelte@^4.0.0'],
      devDependencies: [
        '@sveltejs/adapter-auto@^2.0.0',
        '@sveltejs/kit@^1.20.0',
        'vite@^4.4.0',
        ...(config.typescript ? ['@sveltejs/adapter-auto@^2.0.0', 'tslib@^2.4.1'] : [])
      ],
      configFiles: {
        'svelte.config.js': this.getSvelteConfig(config.typescript),
        'vite.config.js': this.getSvelteViteConfig(),
        ...(config.typescript ? { 'tsconfig.json': this.getSvelteTSConfig() } : {})
      }
    };

    return {
      componentCode,
      styleCode: cssCode,
      additionalFiles: {},
      template: svelteFrameworkTemplate
    };
  }

  private async adaptToReact(jsxCode: string, cssCode: string, config: CodeGenerationConfig) {
    const componentName = 'GeneratedComponent';
    const extension = config.typescript ? '.tsx' : '.jsx';
    
    const componentCode = `import React from 'react';
${config.styling === 'css' ? `import './${componentName}.css';` : ''}

interface ${componentName}Props {
  className?: string;
  [key: string]: any;
}

const ${componentName}: React.FC<${componentName}Props> = ({ className = '', ...props }) => {
  return (
${jsxCode}
  );
};

export default ${componentName};`;

    const reactFrameworkTemplate: FrameworkTemplate = {
      name: 'React',
      extension,
      dependencies: ['react@^18.2.0', 'react-dom@^18.2.0'],
      devDependencies: [
        '@vitejs/plugin-react@^4.0.0',
        'vite@^4.4.0',
        ...(config.typescript ? ['@types/react@^18.2.0', '@types/react-dom@^18.2.0', 'typescript@^5.0.0'] : [])
      ],
      configFiles: {
        'vite.config.js': this.getReactViteConfig(config.typescript)
      }
    };

    return {
      componentCode,
      styleCode: cssCode,
      additionalFiles: {},
      template: reactFrameworkTemplate
    };
  }

  private convertJSXToVueTemplate(jsx: string): string {
    return jsx
      .replace(/className=/g, 'class=')
      .replace(/\{([^}]+)\}/g, '{{ $1 }}')
      .replace(/onClick=/g, '@click=')
      .replace(/onChange=/g, '@input=');
  }

  private convertJSXToAngularTemplate(jsx: string): string {
    return jsx
      .replace(/className=/g, '[class]=')
      .replace(/\{([^}]+)\}/g, '{{ $1 }}')
      .replace(/onClick=/g, '(click)=')
      .replace(/onChange=/g, '(change)=');
  }

  private convertJSXToSvelteTemplate(jsx: string): string {
    return jsx
      .replace(/className=/g, 'class=')
      .replace(/onClick=/g, 'on:click=')
      .replace(/onChange=/g, 'on:change=');
  }

  private getVueViteConfig(typescript: boolean): string {
    return `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  ${typescript ? `resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },` : ''}
})`;
  }

  private getVueTSConfig(): string {
    return `{
  "extends": "@vue/tsconfig/tsconfig.web.json",
  "include": ["env.d.ts", "src/**/*", "src/**/*.vue"],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}`;
  }

  private getAngularConfig(): string {
    return `{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "generated-app": {
      "projectType": "application",
      "schematics": {},
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:browser",
          "options": {
            "outputPath": "dist/generated-app",
            "index": "src/index.html",
            "main": "src/main.ts",
            "polyfills": "src/polyfills.ts",
            "tsConfig": "tsconfig.app.json"
          }
        }
      }
    }
  }
}`;
  }

  private getAngularTSConfig(): string {
    return `{
  "compileOnSave": false,
  "compilerOptions": {
    "baseUrl": "./",
    "outDir": "./dist/out-tsc",
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "sourceMap": true,
    "declaration": false,
    "downlevelIteration": true,
    "experimentalDecorators": true,
    "moduleResolution": "node",
    "importHelpers": true,
    "target": "ES2022",
    "module": "ES2022",
    "useDefineForClassFields": false,
    "lib": ["ES2022", "dom"]
  }
}`;
  }

  private getSvelteConfig(typescript: boolean): string {
    return `import adapter from '@sveltejs/adapter-auto';

const config = {
  kit: {
    adapter: adapter()
  }${typescript ? `,
  preprocess: {
    typescript: true
  }` : ''}
};

export default config;`;
  }

  private getSvelteViteConfig(): string {
    return `import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()]
});`;
  }

  private getSvelteTSConfig(): string {
    return `{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "strict": true
  }
}`;
  }

  private getReactViteConfig(typescript: boolean): string {
    return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  ${typescript ? `resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },` : ''}
})`;
  }
}

export const frameworkAdapter = FrameworkAdapter.getInstance();
