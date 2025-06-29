
/**
 * Figma Data Normalization Utility
 * Handles different Figma data structures and provides validation
 */

export interface NormalizedFigmaData {
  document: {
    children: any[];
  };
  name?: string;
  lastModified?: string;
}

export interface FigmaDataValidation {
  isValid: boolean;
  error?: string;
  structure: 'direct' | 'wrapped' | 'complex' | 'invalid';
  hasDocument: boolean;
  hasChildren: boolean;
  childrenCount: number;
}

/**
 * Normalize Figma data from different possible structures
 */
export function normalizeFigmaData(figmaData: any): NormalizedFigmaData | null {
  console.log('Normalizing Figma data structure:', {
    hasDocument: !!figmaData?.document,
    hasFile: !!figmaData?.file,
    topLevelKeys: figmaData ? Object.keys(figmaData) : []
  });

  if (!figmaData) {
    console.error('No Figma data provided');
    return null;
  }

  // Strategy 1: Direct document structure (figmaData.document.children)
  if (figmaData.document?.children) {
    console.log('Found direct document structure');
    return {
      document: figmaData.document,
      name: figmaData.name,
      lastModified: figmaData.lastModified
    };
  }

  // Strategy 2: Wrapped file structure (figmaData.file.document.children)
  if (figmaData.file?.document?.children) {
    console.log('Found wrapped file structure');
    return {
      document: figmaData.file.document,
      name: figmaData.file.name,
      lastModified: figmaData.file.lastModified
    };
  }

  // Strategy 3: Complex nested structure (multiple levels)
  if (figmaData.data?.file?.document?.children) {
    console.log('Found complex nested structure');
    return {
      document: figmaData.data.file.document,
      name: figmaData.data.file.name,
      lastModified: figmaData.data.file.lastModified
    };
  }

  // Strategy 4: Alternative structure where document is at root
  if (figmaData.children && Array.isArray(figmaData.children)) {
    console.log('Found alternative root children structure');
    return {
      document: { children: figmaData.children },
      name: figmaData.name,
      lastModified: figmaData.lastModified
    };
  }

  console.error('Unable to normalize Figma data - no valid structure found');
  return null;
}

/**
 * Validate Figma data structure and provide detailed information
 */
export function validateFigmaData(figmaData: any): FigmaDataValidation {
  if (!figmaData) {
    return {
      isValid: false,
      error: 'No Figma data provided',
      structure: 'invalid',
      hasDocument: false,
      hasChildren: false,
      childrenCount: 0
    };
  }

  let structure: 'direct' | 'wrapped' | 'complex' | 'invalid' = 'invalid';
  let hasDocument = false;
  let hasChildren = false;
  let childrenCount = 0;

  // Check different structure types
  if (figmaData.document?.children) {
    structure = 'direct';
    hasDocument = true;
    hasChildren = Array.isArray(figmaData.document.children);
    childrenCount = hasChildren ? figmaData.document.children.length : 0;
  } else if (figmaData.file?.document?.children) {
    structure = 'wrapped';
    hasDocument = true;
    hasChildren = Array.isArray(figmaData.file.document.children);
    childrenCount = hasChildren ? figmaData.file.document.children.length : 0;
  } else if (figmaData.data?.file?.document?.children) {
    structure = 'complex';
    hasDocument = true;
    hasChildren = Array.isArray(figmaData.data.file.document.children);
    childrenCount = hasChildren ? figmaData.data.file.document.children.length : 0;
  } else if (figmaData.children && Array.isArray(figmaData.children)) {
    structure = 'direct';
    hasDocument = true;
    hasChildren = true;
    childrenCount = figmaData.children.length;
  }

  const isValid = hasDocument && hasChildren && childrenCount > 0;

  return {
    isValid,
    error: !isValid ? `Invalid Figma structure: ${structure}, hasDocument: ${hasDocument}, hasChildren: ${hasChildren}, childrenCount: ${childrenCount}` : undefined,
    structure,
    hasDocument,
    hasChildren,
    childrenCount
  };
}
