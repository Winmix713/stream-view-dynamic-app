
import { FigmaValidationResult, FigmaFile, FigmaFileMetadata } from '@/types/figma';

class FigmaApiService {
  private baseUrl = 'https://api.figma.com/v1';

  async validateFigmaUrl(url: string): Promise<FigmaValidationResult> {
    const figmaUrlPatterns = [
      /^https:\/\/(?:www\.)?figma\.com\/file\/([a-zA-Z0-9]{22,128})(?:\/.*)?$/,
      /^https:\/\/(?:www\.)?figma\.com\/proto\/([a-zA-Z0-9]{22,128})(?:\/.*)?$/,
      /^https:\/\/(?:www\.)?figma\.com\/design\/([a-zA-Z0-9]{22,128})(?:\/.*)?$/,
    ];

    for (const pattern of figmaUrlPatterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          valid: true,
          fileId: match[1]
        };
      }
    }

    return {
      valid: false,
      error: 'Invalid Figma URL format'
    };
  }

  async fetchFigmaFile(fileId: string, accessToken: string): Promise<FigmaFile> {
    const response = await fetch(`${this.baseUrl}/files/${fileId}`, {
      headers: {
        'X-Figma-Token': accessToken
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Figma file: ${response.statusText}`);
    }

    return response.json();
  }

  async getFileMetadata(fileId: string, accessToken: string): Promise<FigmaFileMetadata> {
    const response = await fetch(`${this.baseUrl}/files/${fileId}`, {
      headers: {
        'X-Figma-Token': accessToken
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch file metadata: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      name: data.name,
      lastModified: data.lastModified,
      thumbnailUrl: data.thumbnailUrl,
      version: data.version,
      role: data.role,
      editorType: data.editorType,
      linkAccess: data.linkAccess
    };
  }

  async getFileComponents(fileId: string, accessToken: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/files/${fileId}/components`, {
      headers: {
        'X-Figma-Token': accessToken
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch components: ${response.statusText}`);
    }

    return response.json();
  }

  async getFileStyles(fileId: string, accessToken: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/files/${fileId}/styles`, {
      headers: {
        'X-Figma-Token': accessToken
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch styles: ${response.statusText}`);
    }

    return response.json();
  }
}

export const figmaApiService = new FigmaApiService();
