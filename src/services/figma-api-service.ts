import { FigmaFile, FigmaApiResponse, ProcessingPhase } from '@/types/figma-api';

export class FigmaApiService {
  private static instance: FigmaApiService;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly API_BASE_URL = 'https://api.figma.com/v1';

  static getInstance(): FigmaApiService {
    if (!FigmaApiService.instance) {
      FigmaApiService.instance = new FigmaApiService();
    }
    return FigmaApiService.instance;
  }

  private constructor() {}

  async fetchFigmaFile(fileId: string, accessToken?: string): Promise<FigmaFile> {
    const cacheKey = `file-${fileId}`;
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers['X-Figma-Token'] = accessToken;
      }

      const response = await fetch(`${this.API_BASE_URL}/files/${fileId}`, {
        headers,
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. This Figma file requires authentication. Please provide a valid Figma Personal Access Token. You can generate one from your Figma account settings under "Personal access tokens".');
        }
        if (response.status === 404) {
          throw new Error('Figma file not found. Please check if the file exists and the URL is correct.');
        }
        if (response.status === 401) {
          throw new Error('Invalid or expired access token. Please check your Figma Personal Access Token and try again.');
        }
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
      }

      const data: FigmaApiResponse = await response.json();

      if (data.err) {
        throw new Error(`Figma API error: ${data.err}`);
      }

      const figmaFile: FigmaFile = {
        key: fileId,
        name: data.name || 'Untitled',
        lastModified: data.lastModified || new Date().toISOString(),
        thumbnailUrl: data.thumbnailUrl || '',
        version: '1.0',
        document: data.document!,
        components: data.components || {},
        schemaVersion: data.schemaVersion || 0,
        styles: data.styles || {},
      };

      this.setCachedData(cacheKey, figmaFile);
      return figmaFile;
    } catch (error) {
      console.error('Error fetching Figma file:', error);
      throw error;
    }
  }

  async validateFigmaUrl(url: string): Promise<{ valid: boolean; fileId?: string; error?: string }> {
    try {
      // Enhanced URL pattern to support more Figma URL formats
      const figmaUrlPatterns = [
        /^https:\/\/(?:www\.)?figma\.com\/(?:file|proto|design)\/([a-zA-Z0-9]{22,128})(?:\/.*)?$/,
        /^https:\/\/(?:www\.)?figma\.com\/(?:file|proto|design)\/([a-zA-Z0-9]{22,128})$/,
        /figma\.com\/(?:file|proto|design)\/([a-zA-Z0-9]{22,128})/
      ];

      let fileId: string | null = null;
      
      for (const pattern of figmaUrlPatterns) {
        const match = url.match(pattern);
        if (match) {
          fileId = match[1];
          break;
        }
      }

      if (!fileId) {
        return {
          valid: false,
          error: 'Invalid Figma URL format. Please provide a valid Figma file, prototype, or design URL.',
        };
      }

      // Validate file ID format
      if (fileId.length < 22) {
        return {
          valid: false,
          error: 'Invalid Figma file ID. The file ID appears to be too short.',
        };
      }

      return {
        valid: true,
        fileId,
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Error validating Figma URL. Please try again.',
      };
    }
  }

  async getFileMetadata(fileId: string, accessToken?: string) {
    const cacheKey = `metadata-${fileId}`;
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers['X-Figma-Token'] = accessToken;
      }

      const response = await fetch(`${this.API_BASE_URL}/files/${fileId}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch file metadata: ${response.statusText}`);
      }

      const data = await response.json();
      
      const metadata = {
        name: data.name,
        lastModified: data.lastModified,
        thumbnailUrl: data.thumbnailUrl,
        version: data.version,
        schemaVersion: data.schemaVersion,
        nodeCount: this.countNodes(data.document),
        componentCount: Object.keys(data.components || {}).length,
        styleCount: Object.keys(data.styles || {}).length,
      };

      this.setCachedData(cacheKey, metadata);
      return metadata;
    } catch (error) {
      console.error('Error fetching file metadata:', error);
      throw error;
    }
  }

  async getFileComponents(fileId: string, accessToken?: string) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers['X-Figma-Token'] = accessToken;
      }

      const response = await fetch(`${this.API_BASE_URL}/files/${fileId}/components`, {
        headers,
      });

      if (!response.ok) {
        // Don't throw error for components endpoint, just return empty
        console.warn(`Failed to fetch components: ${response.statusText}`);
        return { meta: { components: [] } };
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching components:', error);
      return { meta: { components: [] } };
    }
  }

  async getFileStyles(fileId: string, accessToken?: string) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers['X-Figma-Token'] = accessToken;
      }

      const response = await fetch(`${this.API_BASE_URL}/files/${fileId}/styles`, {
        headers,
      });

      if (!response.ok) {
        // Don't throw error for styles endpoint, just return empty
        console.warn(`Failed to fetch styles: ${response.statusText}`);
        return { meta: { styles: [] } };
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching styles:', error);
      return { meta: { styles: [] } };
    }
  }

  private countNodes(node: any): number {
    let count = 1;
    if (node.children) {
      for (const child of node.children) {
        count += this.countNodes(child);
      }
    }
    return count;
  }

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clearCache(): void {
    this.cache.clear();
  }

  async exportImages(fileId: string, nodeIds: string[], format: 'jpg' | 'png' | 'svg' | 'pdf' = 'png', scale: number = 1, accessToken?: string) {
    try {
      const params = new URLSearchParams({
        ids: nodeIds.join(','),
        format,
        scale: scale.toString(),
      });

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers['X-Figma-Token'] = accessToken;
      }

      const response = await fetch(`${this.API_BASE_URL}/images/${fileId}?${params}`, {
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to export images: ${response.statusText}`);
      }

      const data = await response.json();
      return data.images;
    } catch (error) {
      console.error('Error exporting images:', error);
      throw error;
    }
  }

  // Simulate processing phases for demo purposes
  async simulateProcessing(fileId: string, callback: (phase: ProcessingPhase) => void): Promise<void> {
    const phases: Omit<ProcessingPhase, 'startTime' | 'endTime'>[] = [
      {
        id: 'fetch',
        name: 'Fetching Figma Data',
        description: 'Retrieving file structure and metadata from Figma API',
        status: 'pending',
        progress: 0,
      },
      {
        id: 'analyze',
        name: 'Analyzing Design Structure',
        description: 'Processing nodes, components, and design tokens',
        status: 'pending',
        progress: 0,
      },
      {
        id: 'generate',
        name: 'Generating Code',
        description: 'Creating components and implementing styles',
        status: 'pending',
        progress: 0,
      },
      {
        id: 'optimize',
        name: 'Optimizing Output',
        description: 'Applying performance and accessibility optimizations',
        status: 'pending',
        progress: 0,
      },
      {
        id: 'assess',
        name: 'Quality Assessment',
        description: 'Running quality checks and generating reports',
        status: 'pending',
        progress: 0,
      },
    ];

    for (const phase of phases) {
      const startTime = new Date();
      callback({ ...phase, status: 'running', startTime });

      // Simulate processing with realistic timing
      const duration = Math.random() * 2000 + 1000; // 1-3 seconds
      const steps = 20;
      const stepDelay = duration / steps;

      for (let i = 0; i <= steps; i++) {
        await new Promise(resolve => setTimeout(resolve, stepDelay));
        callback({
          ...phase,
          status: 'running',
          progress: (i / steps) * 100,
          startTime,
        });
      }

      const endTime = new Date();
      callback({
        ...phase,
        status: 'completed',
        progress: 100,
        startTime,
        endTime,
        metrics: this.generateMockMetrics(),
      });
    }
  }

  private generateMockMetrics() {
    return {
      nodesProcessed: Math.floor(Math.random() * 100) + 50,
      componentsGenerated: Math.floor(Math.random() * 20) + 5,
      stylesExtracted: Math.floor(Math.random() * 30) + 10,
      qualityScore: Math.random() * 20 + 80, // 80-100
      performanceScore: Math.random() * 15 + 85, // 85-100
      accessibilityScore: Math.random() * 10 + 90, // 90-100
    };
  }
}

export const figmaApiService = FigmaApiService.getInstance();
