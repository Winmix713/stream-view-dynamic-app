
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FigmaNode {
  id: string;
  type: 'RECTANGLE' | 'ELLIPSE' | 'TEXT' | 'FRAME' | 'GROUP' | 'VECTOR' | 'STAR' | 'LINE' | 'POLYGON';
  name: string;
  visible?: boolean;
  locked?: boolean;
  absoluteBoundingBox?: BoundingBox;
  children?: FigmaNode[];
  characters?: string;
  style?: FigmaTextStyle;
  fills?: FigmaFill[];
  strokes?: FigmaStroke[];
  strokeWeight?: number;
  strokeAlign?: 'INSIDE' | 'OUTSIDE' | 'CENTER';
  cornerRadius?: number;
  exportSettings?: FigmaExportSetting[];
  effects?: FigmaEffect[];
  constraints?: FigmaConstraints;
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  primaryAxisSizingMode?: 'FIXED' | 'AUTO';
  counterAxisSizingMode?: 'FIXED' | 'AUTO';
  primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX';
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
}

export interface FigmaTextStyle {
  fontFamily: string;
  fontPostScriptName?: string;
  fontWeight: number;
  fontSize: number;
  lineHeightPx?: number;
  lineHeightPercent?: number;
  letterSpacing?: number;
  textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  textAlignVertical?: 'TOP' | 'CENTER' | 'BOTTOM';
}

export interface FigmaFill {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND' | 'IMAGE';
  visible?: boolean;
  opacity?: number;
  blendMode?: FigmaBlendMode;
  color?: FigmaColor;
  gradientHandlePositions?: FigmaVector[];
  gradientStops?: FigmaColorStop[];
  scaleMode?: 'FILL' | 'FIT' | 'CROP' | 'TILE';
  imageTransform?: number[][];
  scalingFactor?: number;
  imageRef?: string;
}

export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface FigmaVector {
  x: number;
  y: number;
}

export interface FigmaColorStop {
  color: FigmaColor;
  position: number;
}

export interface FigmaStroke {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND';
  visible?: boolean;
  opacity?: number;
  blendMode?: FigmaBlendMode;
  color?: FigmaColor;
  gradientHandlePositions?: FigmaVector[];
  gradientStops?: FigmaColorStop[];
}

export interface FigmaExportSetting {
  suffix: string;
  format: 'JPG' | 'PNG' | 'SVG' | 'PDF';
  constraint: {
    type: 'SCALE' | 'WIDTH' | 'HEIGHT';
    value: number;
  };
}

export interface FigmaEffect {
  type: 'INNER_SHADOW' | 'DROP_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR';
  visible?: boolean;
  radius: number;
  color?: FigmaColor;
  blendMode?: FigmaBlendMode;
  offset?: FigmaVector;
  spread?: number;
}

export interface FigmaConstraints {
  vertical: 'TOP' | 'BOTTOM' | 'CENTER' | 'TOP_BOTTOM' | 'SCALE';
  horizontal: 'LEFT' | 'RIGHT' | 'CENTER' | 'LEFT_RIGHT' | 'SCALE';
}

export type FigmaBlendMode = 
  | 'PASS_THROUGH'
  | 'NORMAL'
  | 'DARKEN'
  | 'MULTIPLY'
  | 'LINEAR_BURN'
  | 'COLOR_BURN'
  | 'LIGHTEN'
  | 'SCREEN'
  | 'LINEAR_DODGE'
  | 'COLOR_DODGE'
  | 'OVERLAY'
  | 'SOFT_LIGHT'
  | 'HARD_LIGHT'
  | 'DIFFERENCE'
  | 'EXCLUSION'
  | 'HUE'
  | 'SATURATION'
  | 'COLOR'
  | 'LUMINOSITY';

export interface FigmaFile {
  name: string;
  role: string;
  lastModified: string;
  editorType: string;
  thumbnailUrl: string;
  version: string;
  document: FigmaNode;
  components: Record<string, FigmaComponent>;
  componentSets: Record<string, FigmaComponentSet>;
  schemaVersion: number;
  styles: Record<string, FigmaStyle>;
}

export interface FigmaComponent {
  key: string;
  name: string;
  description: string;
  documentationLinks: FigmaDocumentationLink[];
  remote: boolean;
}

export interface FigmaComponentSet {
  key: string;
  name: string;
  description: string;
  documentationLinks: FigmaDocumentationLink[];
  remote: boolean;
}

export interface FigmaStyle {
  key: string;
  name: string;
  description: string;
  remote: boolean;
  styleType: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID';
}

export interface FigmaDocumentationLink {
  uri: string;
}

export interface FigmaFileMetadata {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  role: string;
  editorType: string;
  linkAccess: string;
}

export interface FigmaApiResponse<T> {
  error?: boolean;
  status?: number;
  err?: string;
  data?: T;
}

export interface FigmaValidationResult {
  valid: boolean;
  fileId?: string;
  error?: string;
}
