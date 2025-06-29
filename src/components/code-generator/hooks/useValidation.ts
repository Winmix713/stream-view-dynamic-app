import { useState, useCallback, useMemo } from 'react';

interface ValidationResult {
  valid: boolean;
  message?: string;
}

interface ValidationState {
  isFigmaUrlValid: boolean;
  isAccessTokenValid: boolean;
  urlValidationMessage?: string;
  tokenValidationMessage?: string;
}

/**
 * Custom hook for form validation
 * Extracted from Step1Configuration for better separation of concerns
 */
export const useValidation = () => {
  const [validationState, setValidationState] = useState<ValidationState>({
    isFigmaUrlValid: true,
    isAccessTokenValid: true,
  });

  // Enhanced URL validation with detailed feedback
  const validateFigmaUrl = useCallback((url: string): ValidationResult => {
    if (!url.trim()) {
      return { valid: false, message: 'URL is required' };
    }

    const figmaUrlPatterns = [
      /^https:\/\/(?:www\.)?figma\.com\/file\/([a-zA-Z0-9]{22,128})(?:\/.*)?$/,
      /^https:\/\/(?:www\.)?figma\.com\/proto\/([a-zA-Z0-9]{22,128})(?:\/.*)?$/,
      /^https:\/\/(?:www\.)?figma\.com\/design\/([a-zA-Z0-9]{22,128})(?:\/.*)?$/,
    ];

    const isValid = figmaUrlPatterns.some(pattern => pattern.test(url));
    
    if (!isValid) {
      if (!url.includes('figma.com')) {
        return { valid: false, message: 'Must be a Figma URL (figma.com)' };
      }
      if (!url.startsWith('https://')) {
        return { valid: false, message: 'URL must use HTTPS protocol' };
      }
      return { valid: false, message: 'Invalid Figma file/design/proto URL format' };
    }

    return { valid: true };
  }, []);

  // Enhanced token validation
  const validateAccessToken = useCallback((token: string): ValidationResult => {
    if (!token.trim()) {
      return { valid: false, message: 'Access token is required for private files' };
    }

    if (token.length < 20) {
      return { valid: false, message: 'Token too short (minimum 20 characters)' };
    }

    if (token.length > 200) {
      return { valid: false, message: 'Token too long (maximum 200 characters)' };
    }

    // Check for common token patterns
    if (!/^[a-zA-Z0-9_-]+$/.test(token)) {
      return { valid: false, message: 'Token contains invalid characters' };
    }

    return { valid: true };
  }, []);

  // Validate inputs and update state
  const validateInputs = useCallback((url: string, token: string) => {
    const urlValidation = validateFigmaUrl(url);
    const tokenValidation = validateAccessToken(token);

    setValidationState({
      isFigmaUrlValid: urlValidation.valid,
      isAccessTokenValid: tokenValidation.valid,
      urlValidationMessage: urlValidation.message,
      tokenValidationMessage: tokenValidation.message,
    });

    return {
      isValid: urlValidation.valid && tokenValidation.valid,
      urlValid: urlValidation.valid,
      tokenValid: tokenValidation.valid
    };
  }, [validateFigmaUrl, validateAccessToken]);

  return {
    validationState,
    validateInputs,
    validateFigmaUrl,
    validateAccessToken
  };
};