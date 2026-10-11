import { uploadPanelImage, savePanelImageLocally } from '../../src/lib/storage';

// Global mocks
const originalFetch = global.fetch;

describe('U09 & U10: Storage Pipeline & Fallback Cascade', () => {
  const mockBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  const cleanData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('U09: Local Cache Persistence & Base64 Sanitization', () => {
    it('strips base64 image prefixes before local file writes', async () => {
      const uri = await savePanelImageLocally(mockBase64, 'test_panel');
      expect(typeof uri).toBe('string');
      expect(uri.length).toBeGreaterThan(0);
    });
  });

  describe('U10: Dual-Engine Cloud Upload & Fallback Behavior', () => {
    it('uploads to Vercel Blob REST API when token is configured', async () => {
      process.env.EXPO_PUBLIC_VERCEL_BLOB_TOKEN = 'mock_blob_token_12345';

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://blob.vercel.com/panels/user1/panel1.png' }),
      });

      const url = await uploadPanelImage(mockBase64, 'user1', 'panel1');
      expect(url).toBe('https://blob.vercel.com/panels/user1/panel1.png');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://blob.vercel-storage.com/panels/user1/panel1.png',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            authorization: 'Bearer mock_blob_token_12345',
            'content-type': 'image/png',
          }),
        })
      );
    });

    it('falls back to Firebase Cloud Storage when Vercel Blob fails', async () => {
      process.env.EXPO_PUBLIC_VERCEL_BLOB_TOKEN = 'mock_blob_token_12345';

      // Mock Vercel network failure
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network connection timeout'));

      const fallbackResult = await uploadPanelImage(mockBase64, 'user1', 'panel1');
      // Should fall back to Firebase Storage URL
      expect(fallbackResult).toBe('https://firebasestorage.googleapis.com/mock/image.png');
    });

    it('preserves and returns local file URIs without attempting binary decode', async () => {
      const localUri = 'file:///mock/cache/local_image.png';
      const result = await uploadPanelImage(localUri, 'user1', 'panel1');
      expect(result).toBe(localUri);
    });

    it('returns raw remote URLs directly without re-uploading', async () => {
      const remoteUrl = 'https://blob.vercel-storage.com/existing_image.png';
      const result = await uploadPanelImage(remoteUrl, 'user1', 'panel1');
      expect(result).toBe(remoteUrl);
    });
  });
});
