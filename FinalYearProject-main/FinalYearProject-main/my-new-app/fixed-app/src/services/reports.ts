import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';

export async function saveReport(response: Response, filename: string, mime: string) {
  if (!response.headers.get('content-type')?.includes(mime)) throw new Error('The reporting service did not return the expected file.');
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = filename; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  if (!await Sharing.isAvailableAsync()) throw new Error('File sharing is not available on this device.');
  const file = new File(Paths.cache, filename);
  try {
    file.write(new Uint8Array(await response.arrayBuffer()));
    await Sharing.shareAsync(file.uri, { mimeType: mime });
  } finally { if (file.exists) file.delete(); }
}
