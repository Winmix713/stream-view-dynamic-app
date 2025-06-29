export interface FigmaFile {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  document: FigmaNode;
  components: Record<string, FigmaComponent>;
  schemaVersion: number;
  styles: Record<string, FigmaStyle>;
  key?: string;
  thumbnail_url?: string;
  last_modified?: string;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  backgroundColor?: FigmaColor;
  fills?: FigmaFill[];
  strokeWeight?: number;
  strokeAlign?: string;
  effects?: FigmaEffect[];
  characters?: string;
  style?: FigmaTextStyle;
  absoluteBoundingBox?: FigmaBoundingBox;
  componentId?: string;
  componentSetId?: string;
}

export interface FigmaComponent {
  name: string;
  description: string;
  key: string;
  file_key: string;
  node_id: string;
  thumbnail_url: string;
  created_at: string;
  updated_at: string;
  user: FigmaUser;
  containing_frame: FigmaFrame;
}

export interface FigmaUser {
  id: string;
  handle: string;
  img_url: string;
  email?: string;
}

export interface FigmaFrame {
  name: string;
  node_id: string;
  background_color: string;
}

export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface FigmaFill {
  type: string;
  color?: FigmaColor;
  gradientHandlePositions?: FigmaVector[];
  gradientStops?: FigmaColorStop[];
  scaleMode?: string;
  imageRef?: string;
}

export interface FigmaEffect {
  type: string;
  visible: boolean;
  radius: number;
  color?: FigmaColor;
  offset?: FigmaVector;
  spread?: number;
}

export interface FigmaTextStyle {
  fontFamily: string;
  fontPostScriptName?: string;
  paragraphSpacing?: number;
  paragraphIndent?: number;
  listSpacing?: number;
  hangingPunctuation?: boolean;
  hangingList?: boolean;
  lineHeightPx: number;
  lineHeightPercent?: number;
  lineHeightPercentFontSize?: number;
  lineHeightUnit: string;
  fontSize: number;
  textDecoration: string;
  textCase: string;
  textTruncation: string;
  maxLines?: number;
  textAutoResize: string;
  textAlignHorizontal: string;
  textAlignVertical: string;
  letterSpacing: number;
  fills: FigmaFill[];
  hyperlink?: string;
  opentypeFlags?: Record<string, number>;
}

export interface FigmaVector {
  x: number;
  y: number;
}

export interface FigmaColorStop {
  position: number;
  color: FigmaColor;
}

export interface FigmaBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FigmaStyle {
  key: string;
  file_key: string;
  node_id: string;
  style_type: string;
  thumbnail_url: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  user: FigmaUser;
  sort_position: string;
}

export interface FigmaApiResponse<T = any> {
  data?: T;
  error?: string;
  err?: string;
  status?: number;
  name?: string;
  lastModified?: string;
  thumbnailUrl?: string;
  version?: string;
  document?: FigmaNode;
  components?: Record<string, FigmaComponent>;
  schemaVersion?: number;
  styles?: Record<string, FigmaStyle>;
  meta?: {
    components?: Record<string, FigmaComponent>;
    styles?: Record<string, FigmaStyle>;
  };
}

export interface FigmaConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  lastConnected?: Date;
  rateLimitRemaining?: number;
  rateLimitReset?: Date;
  error?: string;
}

export interface FigmaProcessingStatus {
  isProcessing: boolean;
  progress: number;
  stage: 'connecting' | 'fetching' | 'parsing' | 'complete' | 'error';
  message: string;
  startTime?: Date;
  estimatedTimeRemaining?: number;
}

export interface ProcessingPhase {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  metrics?: {
    nodesProcessed?: number;
    componentsGenerated?: number;
    stylesExtracted?: number;
    qualityScore?: number;
    performanceScore?: number;
    accessibilityScore?: number;
  };
}

export interface FigmaError extends Error {
  code: FigmaErrorCode;
  details?: Record<string, any>;
  recoverable: boolean;
  retryAfter?: number;
  timestamp: Date;
}

export enum FigmaErrorCode {
  // Authentication errors
  INVALID_API_KEY = 'INVALID_API_KEY',
  API_KEY_EXPIRED = 'API_KEY_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // File access errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_ACCESS_DENIED = 'FILE_ACCESS_DENIED',
  INVALID_FILE_URL = 'INVALID_FILE_URL',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  DNS_ERROR = 'DNS_ERROR',
  
  // Data processing errors
  INVALID_FILE_FORMAT = 'INVALID_FILE_FORMAT',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  MEMORY_ERROR = 'MEMORY_ERROR',
  
  // Security errors
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  ENCRYPTED_DATA_ERROR = 'ENCRYPTED_DATA_ERROR',
  
  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}