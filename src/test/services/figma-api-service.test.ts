import { figmaApiService } from '@/services/figma-api-service';

// Mock fetch
global.fetch = jest.fn();

describe('FigmaApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates Figma URLs correctly', async () => {
    const validUrl = 'https://www.figma.com/file/abc123def456/Test-File';
    const invalidUrl = 'https://example.com/not-figma';

    const validResult = await figmaApiService.validateFigmaUrl(validUrl);
    const invalidResult = await figmaApiService.validateFigmaUrl(invalidUrl);

    expect(validResult.valid).toBe(true);
    expect(validResult.fileId).toBe('abc123def456');
    expect(invalidResult.valid).toBe(false);
  });

  it('handles API errors gracefully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });

    await expect(
      figmaApiService.fetchFigmaFile('invalid-id')
    ).rejects.toThrow('Figma file not found');
  });
});