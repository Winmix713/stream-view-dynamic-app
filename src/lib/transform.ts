import { camelCase } from 'lodash';
import { svgToJsx } from './svg-to-jsx';
import { sanitizeAttributes, parseStyleString } from './svg-to-jsx/utils';

interface TransformConfig {
  framework: 'react' | 'vue' | 'angular' | 'html';
  typescript: boolean;
  styling: 'css' | 'scss' | 'tailwind' | 'styled-components';
  componentName?: string;
  memo?: boolean;
  passProps?: boolean;
  renderChildren?: boolean | string;
}

interface TransformedElement {
  tagName: string;
  attributes: Record<string, any>;
  children: TransformedElement[];
  text?: string;
}

const CUSTOM_ATTRIBUTES = {
  class: 'className',
  for: 'htmlFor'
};

function transformStyle(style: string | Record<string, any>): Record<string, any> {
  if (typeof style === 'object') {
    return style;
  }
  
  return parseStyleString(style);
}

export function transform(node: any): TransformedElement {
  if (typeof node === 'string') {
    return {
      tagName: 'text',
      attributes: {},
      children: [],
      text: node
    };
  }

  if (!node || (!node.children && !node.tagName && !node.name)) {
    return {
      tagName: 'fragment',
      attributes: {},
      children: []
    };
  }

  // Handle parsed SVG structure
  const tagName = node.tagName || node.name || 'div';
  const rawAttributes = node.properties || node.attributes || {};
  
  // Transform attributes
  const attributes = Object.keys(rawAttributes).reduce((acc, attributeName) => {
    const attribute = rawAttributes[attributeName];
    const isStyleAttribute = attributeName === 'style';
    const isDataAttribute = attributeName.startsWith('data-');
    const isAriaAttribute = attributeName.startsWith('aria-');

    if (isDataAttribute || isAriaAttribute) {
      return {
        ...acc,
        [attributeName]: attribute
      };
    }

    if (isStyleAttribute) {
      return {
        ...acc,
        [attributeName]: transformStyle(attribute)
      };
    }

    if (CUSTOM_ATTRIBUTES[attributeName]) {
      return {
        ...acc,
        [CUSTOM_ATTRIBUTES[attributeName]]: attribute
      };
    }

    return {
      ...acc,
      [camelCase(attributeName)]: attribute
    };
  }, {});

  // Transform children recursively
  const children = (node.children || []).map(transform);

  return {
    tagName,
    attributes,
    children,
    text: node.value || node.text
  };
}

/**
 * Clean-up and transform SVG into valid JSX React component.
 */
export async function transformer(svg: string, config: TransformConfig = {} as TransformConfig): Promise<string> {
  try {
    const {
      framework = 'react',
      typescript = true,
      styling = 'tailwind',
      componentName = 'GeneratedComponent',
      memo = false,
      passProps = false,
      renderChildren = false
    } = config;

    // Parse and transform SVG to JSX
    const jsxResult = await svgToJsx(svg, {
      passProps,
      renderChildren
    });

    // Extract the JSX string from the result
    const jsxString = typeof jsxResult === 'string' ? jsxResult : jsxResult.jsx;

    // Generate complete React component based on framework
    switch (framework) {
      case 'react':
        return generateReactComponent(jsxString, {
          componentName,
          typescript,
          memo,
          styling,
          passProps
        });
      
      case 'vue':
        return generateVueComponent(jsxString, {
          componentName,
          typescript,
          styling
        });
      
      case 'angular':
        return generateAngularComponent(jsxString, {
          componentName,
          typescript,
          styling
        });
      
      case 'html':
        return generateHTMLComponent(jsxString, {
          componentName,
          styling
        });
      
      default:
        return generateReactComponent(jsxString, {
          componentName,
          typescript,
          memo,
          styling,
          passProps
        });
    }

  } catch (error) {
    console.error('Transform error:', error);
    throw new Error(`Transformation failed: ${error.message}`);
  }
}

function generateReactComponent(jsx: string, options: any): string {
  const { componentName, typescript, memo, styling, passProps } = options;
  
  const imports = ['import React from "react";'];
  
  if (styling === 'styled-components') {
    imports.push('import styled from "styled-components";');
  }
  
  // Generate TypeScript interface if needed
  const propsInterface = typescript ? `
interface ${componentName}Props {
  className?: string;
  style?: React.CSSProperties;
  onClick?: (event: React.MouseEvent<SVGElement>) => void;
  [key: string]: any;
}

` : '';
  
  // Generate component
  const propsParam = typescript ? `props: ${componentName}Props` : 'props';
  const propsDestructuring = passProps ? 'const { className, style, ...restProps } = props;' : 'const { className, style } = props;';
  
  // Clean up the JSX to ensure it's properly formatted
  const cleanJsx = jsx
    .replace(/^<svg/, '<svg className={className} style={style}')
    .replace(/\{\.\.\.props\}/g, passProps ? '{...restProps}' : '');
  
  const componentBody = `const ${componentName} = (${propsParam}) => {
  ${propsDestructuring}
  
  return (
    ${cleanJsx}
  );
};`;

  const exportStatement = memo 
    ? `export default React.memo(${componentName});`
    : `export default ${componentName};`;

  return `${imports.join('\n')}

${propsInterface}${componentBody}

${exportStatement}`;
}

function generateVueComponent(jsx: string, options: any): string {
  const { componentName, typescript, styling } = options;
  
  // Convert JSX to Vue template syntax
  const template = jsx
    .replace(/className=/g, 'class=')
    .replace(/\{([^}]+)\}/g, '{{ $1 }}');
  
  const scriptLang = typescript ? ' lang="ts"' : '';
  
  return `<template>
  ${template}
</template>

<script${scriptLang}>
import { defineComponent } from 'vue';

export default defineComponent({
  name: '${componentName}',
  props: {
    className: String,
    style: Object
  }
});
</script>

<style scoped>
/* Component styles */
</style>`;
}

function generateAngularComponent(jsx: string, options: any): string {
  const { componentName, typescript, styling } = options;
  
  // Convert JSX to Angular template syntax
  const template = jsx
    .replace(/className=/g, 'class=')
    .replace(/\{([^}]+)\}/g, '{{ $1 }}');
  
  return `import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-${componentName.toLowerCase()}',
  template: \`
    ${template}
  \`,
  styleUrls: ['./${componentName.toLowerCase()}.component.${styling === 'scss' ? 'scss' : 'css'}']
})
export class ${componentName}Component {
  @Input() className?: string;
  @Input() style?: any;
}`;
}

function generateHTMLComponent(jsx: string, options: any): string {
  const { componentName, styling } = options;
  
  // Convert JSX to plain HTML
  const html = jsx
    .replace(/className=/g, 'class=')
    .replace(/\{[^}]+\}/g, '');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${componentName}</title>
  ${styling === 'tailwind' ? '<script src="https://cdn.tailwindcss.com"></script>' : ''}
</head>
<body>
  ${html}
</body>
</html>`;
}

export default transformer;