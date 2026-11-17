
/**
 * Application theme hook.
 *
 * Supports light and dark appearance.
 * Defaults to light mode when the system
 * does not provide a color scheme.
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();

  const theme: keyof typeof Colors =
    scheme === 'dark' ? 'dark' : 'light';

  return Colors[theme];
}
