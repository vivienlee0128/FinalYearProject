import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import {
  Alert,
  Button,
  View
} from 'react-native';

export default function PdfTestScreen() {

  async function testPdf() {

    try {

      console.log('[PDF TEST] Starting...');

      const html = `
        <!DOCTYPE html>
        <html>
          <body>

            <h1>
              Attendance Report Test
            </h1>

            <p>
              Student ID: 104404156
            </p>

            <p>
              PDF generation is working.
            </p>

          </body>
        </html>
      `;

      const result =
        await Print.printToFileAsync({
          html
        });

      console.log(
        '[PDF TEST] Generated:',
        result.uri
      );

      const sharingAvailable =
        await Sharing.isAvailableAsync();

      if (sharingAvailable) {

        await Sharing.shareAsync(
          result.uri,
          {
            mimeType: 'application/pdf',
            UTI: 'com.adobe.pdf'
          }
        );

      } else {

        Alert.alert(
          'PDF Generated',
          result.uri
        );

      }

    } catch (error) {

      console.error(
        '[PDF TEST] Error:',
        error
      );

      Alert.alert(
        'PDF Error',
        error instanceof Error
          ? error.message
          : 'Unknown PDF error'
      );

    }

  }

  return (

    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        padding: 24
      }}
    >

      <Button
        title="Test PDF Generation"
        onPress={() => void testPdf()}
      />

    </View>

  );

}