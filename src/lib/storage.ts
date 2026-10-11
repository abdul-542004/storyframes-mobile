import { File, Paths } from 'expo-file-system';
import { storage, ref, uploadString, getDownloadURL } from './firebase';

export async function savePanelImageLocally(base64Png: string, id: string): Promise<string> {
  try {
    const cleanBase64 = base64Png.replace(/^data:image\/\w+;base64,/, '');
    const file = new File(Paths.document, `panel_${id}_${Date.now()}.png`);
    await file.write(cleanBase64);
    return file.uri;
  } catch (error) {
    console.warn('Failed to save panel image locally:', error);
    return base64Png; // Return data uri fallback
  }
}

export async function uploadPanelImage(
  dataUriOrBase64: string,
  userId: string,
  panelId: string
): Promise<string> {
  if (!dataUriOrBase64 || dataUriOrBase64.startsWith('http://') || dataUriOrBase64.startsWith('https://')) {
    return dataUriOrBase64;
  }

  if (dataUriOrBase64.startsWith('file://')) {
    return dataUriOrBase64;
  }

  const cleanBase64 = dataUriOrBase64.replace(/^data:image\/\w+;base64,/, '');

  // 1. Try Vercel Blob if token is configured
  const vercelBlobToken =
    process.env.EXPO_PUBLIC_VERCEL_BLOB_TOKEN;
  if (vercelBlobToken) {
    try {
      const pathname = `panels/${userId}/${panelId}.png`;
      const binaryString = atob(cleanBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const res = await fetch(`https://blob.vercel-storage.com/${pathname}`, {
        method: 'PUT',
        headers: {
          'authorization': `Bearer ${vercelBlobToken}`,
          'x-api-version': '7',
          'content-type': 'image/png',
          'x-add-random-suffix': '1',
        },
        body: bytes,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          return data.url;
        }
      }
    } catch (err) {
      console.warn('Vercel Blob upload failed, trying next fallback:', err);
    }
  }

  // 2. Try Firebase Cloud Storage if available
  try {
    if (storage && storage.app) {
      const storageRef = ref(storage, `users/${userId}/panels/${panelId}.png`);
      await uploadString(storageRef, cleanBase64, 'base64', {
        contentType: 'image/png',
      });
      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    }
  } catch (error) {
    console.warn('Firebase Cloud Storage failed, falling back to local image URI:', error);
  }

  // 3. Fallback: local image URI or data URI
  return dataUriOrBase64;
}
