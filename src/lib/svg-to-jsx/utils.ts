/**
 * Professional SVG to JSX Utilities
 * Based on industry best practices and optimized for performance
 */

// Allowed HTML and SVG attributes for security
const ALLOWED_HTML_ATTRIBUTES = [
  'accept', 'acceptCharset', 'accessKey', 'action', 'allowFullScreen', 'allowTransparency',
  'alt', 'async', 'autoComplete', 'autoFocus', 'autoPlay', 'cellPadding', 'cellSpacing',
  'charSet', 'checked', 'classID', 'className', 'colSpan', 'cols', 'content', 'contentEditable',
  'contextMenu', 'controls', 'coords', 'crossOrigin', 'data', 'dateTime', 'defer', 'dir',
  'disabled', 'download', 'draggable', 'encType', 'form', 'formAction', 'formEncType',
  'formMethod', 'formNoValidate', 'formTarget', 'frameBorder', 'headers', 'height', 'hidden',
  'high', 'href', 'hrefLang', 'htmlFor', 'httpEquiv', 'icon', 'id', 'label', 'lang', 'list',
  'loop', 'low', 'manifest', 'marginHeight', 'marginWidth', 'max', 'maxLength', 'media',
  'mediaGroup', 'method', 'min', 'multiple', 'muted', 'name', 'noValidate', 'open', 'optimum',
  'pattern', 'placeholder', 'poster', 'preload', 'radioGroup', 'readOnly', 'rel', 'required',
  'role', 'rowSpan', 'rows', 'sandbox', 'scope', 'scoped', 'scrolling', 'seamless', 'selected',
  'shape', 'size', 'sizes', 'span', 'spellCheck', 'src', 'srcDoc', 'srcSet', 'start', 'step',
  'style', 'tabIndex', 'target', 'title', 'type', 'useMap', 'value', 'width', 'wmode'
];

const ALLOWED_SVG_ATTRIBUTES = [
  'clipPath', 'cx', 'cy', 'd', 'dx', 'dy', 'fill', 'fillOpacity', 'fontFamily', 'fillRule',
  'fontSize', 'fx', 'fy', 'gradientTransform', 'gradientUnits', 'markerEnd', 'markerMid',
  'markerStart', 'offset', 'opacity', 'patternContentUnits', 'patternUnits', 'points',
  'preserveAspectRatio', 'r', 'rx', 'ry', 'spreadMethod', 'stopColor', 'stopOpacity', 'stroke',
  'strokeDasharray', 'strokeLinecap', 'strokeLinejoin', 'strokeMiterlimit', 'strokeOpacity',
  'strokeWidth', 'textAnchor', 'transform', 'vectorEffect', 'version', 'viewBox', 'xmlns',
  'x1', 'x2', 'x', 'y1', 'y2', 'y', 'xlinkActuate', 'xlinkArcrole', 'xlinkHref', 'xlinkRole',
  'xlinkShow', 'xlinkTitle', 'xlinkType', 'xmlBase', 'xmlLang', 'xmlSpace', 'mask', 'maskUnits',
  'filter', 'filterUnits', 'filterRes', 'result', 'in', 'in2', 'stdDeviation', 'colorInterpolationFilters',
  'floodOpacity', 'primitiveUnits', 'baseFrequency', 'numOctaves', 'seed', 'stitchTiles', 'type',
  'values', 'tableValues', 'slope', 'intercept', 'amplitude', 'exponent', 'k1', 'k2', 'k3', 'k4'
];

const ALLOWED_ATTRIBUTES = new Set([...ALLOWED_HTML_ATTRIBUTES, ...ALLOWED_SVG_ATTRIBUTES]);

const ALLOWED_TAGS = new Set([
  'circle', 'clipPath', 'defs', 'ellipse', 'g', 'image', 'line', 'linearGradient', 'mask',
  'path', 'pattern', 'polygon', 'polyline', 'radialGradient', 'rect', 'stop', 'svg', 'text',
  'use', 'tspan', 'title', 'style', 'filter', 'feFlood', 'feBlend', 'feGaussianBlur',
  'feOffset', 'feColorMatrix', 'feMorphology', 'feConvolveMatrix', 'feDropShadow',
  'foreignObject', 'switch', 'symbol', 'marker', 'textPath', 'animate', 'animateTransform'
]);

// Regex patterns for validation
const DATA_ATTRIBUTE = /^data-/i;
const ARIA_ATTRIBUTE = /^aria-/i;
const XLINK_ATTRIBUTE = /^xlink:/i;
const XML_ATTRIBUTE = /^xml:/i;

/**
 * Converts kebab-case and snake_case strings to camelCase
 * Optimized for performance with caching
 */
const camelCaseCache = new Map<string, string>();

export function camelCase(string: string): string {
  if (camelCaseCache.has(string)) {
    return camelCaseCache.get(string)!;
  }

  if (string.indexOf('--') === 0) {
    camelCaseCache.set(string, string);
    return string;
  }

  const result = string.replace(/(?:-|_)([a-z])/g, (_, char) => char.toUpperCase());
  camelCaseCache.set(string, result);
  return result;
}

/**
 * Converts CSS property names to camelCase for React styles
 */
export function cssProperty(string: string): string {
  const unprefixed = string.replace(/^-ms/, 'ms');
  return camelCase(unprefixed);
}

/**
 * Processes attribute names for JSX compatibility
 * Handles special cases and namespaced attributes
 */
export function processAttributeName(name: string): string {
  // Keep data and aria attributes as-is
  if (DATA_ATTRIBUTE.test(name) || ARIA_ATTRIBUTE.test(name)) {
    return name;
  }
  
  // Handle special cases
  const specialCases: Record<string, string> = {
    'class': 'className',
    'for': 'htmlFor',
    'xlink:href': 'xlinkHref',
    'xlink:actuate': 'xlinkActuate',
    'xlink:arcrole': 'xlinkArcrole',
    'xlink:role': 'xlinkRole',
    'xlink:show': 'xlinkShow',
    'xlink:title': 'xlinkTitle',
    'xlink:type': 'xlinkType',
    'xml:lang': 'xmlLang',
    'xml:space': 'xmlSpace',
    'xml:base': 'xmlBase'
  };
  
  if (specialCases[name]) {
    return specialCases[name];
  }
  
  // Handle namespaced attributes
  if (XLINK_ATTRIBUTE.test(name) || XML_ATTRIBUTE.test(name)) {
    return unnamespaceAttributeName(name);
  }
  
  return camelCase(name);
}

/**
 * Removes namespace prefixes and converts to camelCase
 */
export function unnamespaceAttributeName(name: string): string {
  return name.replace(/(\w+):(\w)/i, (match, namespace, char) => {
    return namespace + char.toUpperCase();
  });
}

/**
 * Sanitizes attributes for React compatibility and security
 */
export function sanitizeAttributes(attributes: Record<string, any>): Record<string, any> {
  if (!attributes || typeof attributes !== 'object') {
    return {};
  }

  const result: Record<string, any> = {};

  // Handle class -> className conversion
  if (attributes.class) {
    result.className = attributes.class;
  }

  // Process each attribute
  Object.keys(attributes).forEach(name => {
    const value = attributes[name];
    
    // Skip null, undefined, or empty values
    if (value == null || value === '') {
      return;
    }

    // Allow data and aria attributes
    if (DATA_ATTRIBUTE.test(name) || ARIA_ATTRIBUTE.test(name)) {
      result[name] = value;
      return;
    }

    // Skip class as it's already handled
    if (name === 'class') {
      return;
    }

    // Process allowed attributes
    if (ALLOWED_ATTRIBUTES.has(name)) {
      const processedName = processAttributeName(name);
      
      // Handle style attribute specially
      if (name === 'style') {
        result[processedName] = parseStyleString(value);
      } else {
        result[processedName] = value;
      }
    }
  });

  return result;
}

/**
 * Parses CSS style string into React style object
 */
export function parseStyleString(styleString: string): Record<string, any> {
  if (!styleString || typeof styleString !== 'string') {
    return {};
  }
  
  const styles: Record<string, any> = {};
  
  styleString.split(/\s*;\s*/g)
    .filter(Boolean)
    .forEach(declaration => {
      const [property, ...valueParts] = declaration.split(/\s*:\s*/);
      if (property && valueParts.length > 0) {
        const value = valueParts.join(':').trim();
        const camelProperty = cssProperty(property.trim());
        
        // Convert numeric values
        if (/^\d+(\.\d+)?$/.test(value)) {
          styles[camelProperty] = parseFloat(value);
        } else {
          styles[camelProperty] = value;
        }
      }
    });
  
  return styles;
}

/**
 * Sanitizes children elements
 */
export function sanitizeChildren(children: any[]): any[] {
  if (!Array.isArray(children)) {
    return [];
  }

  return children.filter(child => {
    if (!child) return false;
    
    const tagName = child.tagName || child.name;
    return ALLOWED_TAGS.has(tagName);
  });
}

/**
 * Formats style object for JSX
 */
export function formatStyleForJSX(style: Record<string, any>): string {
  if (!style || typeof style !== 'object') {
    return '';
  }

  const styleEntries = Object.entries(style)
    .map(([property, value]) => {
      const formattedValue = typeof value === 'string' ? `"${value}"` : value;
      return `${property}: ${formattedValue}`;
    })
    .join(', ');

  return `{{${styleEntries}}}`;
}

/**
 * Traverses element tree and applies callback to each element
 */
export function forEach(element: any, callback: (element: any) => void): void {
  if (!element) return;
  
  callback(element);
  
  if (element.children && Array.isArray(element.children)) {
    element.children.forEach((child: any) => {
      forEach(child, callback);
    });
  }
}

/**
 * Filters elements based on test function
 */
export function filter(element: any, test: (element: any) => boolean): any[] {
  const filtered: any[] = [];
  
  forEach(element, (child) => {
    if (test(child)) {
      filtered.push(child);
    }
  });
  
  return filtered;
}

/**
 * Finds element by ID
 */
export function findById(element: any, id: string): any | null {
  const results = filter(element, (node) => {
    return node.attributes?.id === id;
  });
  
  return results[0] || null;
}

/**
 * Checks if element supports all attributes (custom elements)
 */
export function supportsAllAttributes(element: any): boolean {
  const tagName = element.tagName || element.name || '';
  const hasHyphen = tagName.indexOf('-') !== -1;
  const hasIsAttribute = element.attributes && 'is' in element.attributes;
  
  return hasHyphen || hasIsAttribute;
}

/**
 * Validates SVG content
 */
export function validateSVGContent(content: string): { valid: boolean; error?: string } {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Content must be a non-empty string' };
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return { valid: false, error: 'Content cannot be empty or whitespace only' };
  }

  // Check for SVG elements
  const hasSvgElements = /(<svg|<path|<rect|<circle|<ellipse|<line|<polygon|<polyline|<g)/i.test(trimmed);
  if (!hasSvgElements) {
    return { valid: false, error: 'No SVG elements found in content' };
  }

  return { valid: true };
}

/**
 * Creates a fallback SVG element for error cases
 */
export function createFallbackSVG(errorMessage: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="400" height="200">
    <rect width="400" height="200" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="2"/>
    <text x="200" y="100" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fill="#6b7280">
      SVG Error: ${errorMessage.slice(0, 50)}${errorMessage.length > 50 ? '...' : ''}
    </text>
  </svg>`;
}

/**
 * Performance optimization: Clear caches
 */
export function clearCaches(): void {
  camelCaseCache.clear();
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats(): { camelCaseCache: number } {
  return {
    camelCaseCache: camelCaseCache.size
  };
}