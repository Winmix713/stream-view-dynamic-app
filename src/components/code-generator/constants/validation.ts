/**
 * Validation constants and patterns
 * Extracted for better maintainability
 */

export const FIGMA_URL_PATTERNS = [
  /^https:\/\/(?:www\.)?figma\.com\/file\/([a-zA-Z0-9]{22,128})(?:\/.*)?$/,
  /^https:\/\/(?:www\.)?figma\.com\/proto\/([a-zA-Z0-9]{22,128})(?:\/.*)?$/,
  /^https:\/\/(?:www\.)?figma\.com\/design\/([a-zA-Z0-9]{22,128})(?:\/.*)?$/,
];

export const TOKEN_CONSTRAINTS = {
  MIN_LENGTH: 20,
  MAX_LENGTH: 200,
  PATTERN: /^[a-zA-Z0-9_-]+$/
} as const;

export const CONNECTION_QUALITY_THRESHOLDS = {
  EXCELLENT: 2000, // ms
  GOOD: 5000, // ms
} as const;

export const STEP_NAMES = {
  step1: 'Figma Configuration',
  step2: 'SVG Generation',
  step3: 'CSS Implementation',
  step4: 'Final Generation'
} as const;

export const ERROR_MESSAGES = {
  URL_REQUIRED: 'URL is required',
  URL_INVALID_DOMAIN: 'Must be a Figma URL (figma.com)',
  URL_INVALID_PROTOCOL: 'URL must use HTTPS protocol',
  URL_INVALID_FORMAT: 'Invalid Figma file/design/proto URL format',
  TOKEN_REQUIRED: 'Access token is required for private files',
  TOKEN_TOO_SHORT: 'Token too short (minimum 20 characters)',
  TOKEN_TOO_LONG: 'Token too long (maximum 200 characters)',
  TOKEN_INVALID_CHARS: 'Token contains invalid characters',
  CONNECTION_FAILED: 'Please provide both Figma URL and Access Token'
} as const;