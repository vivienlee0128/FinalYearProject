
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
} from 'expo-router/ui';

import {
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import {
  Colors,
  MaxContentWidth,
  Spacing,
} from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();

  const theme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <Tabs>
        <TabSlot style={styles.content} />

        <TabList
          style={[
            styles.tabList,
            {
              backgroundColor: colors.backgroundElement,
            },
          ]}
        >
          <TabTrigger
            name="home"
            href="/home"
            style={styles.tabTrigger}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.text },
              ]}
            >
              Home
            </Text>
          </TabTrigger>

          <TabTrigger
            name="scan"
            href="/scan"
            style={styles.tabTrigger}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.text },
              ]}
            >
              Scan QR
            </Text>
          </TabTrigger>

          <TabTrigger
            name="attendance"
            href="/attendance"
            style={styles.tabTrigger}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.text },
              ]}
            >
              Attendance
            </Text>
          </TabTrigger>

          <TabTrigger
            name="profile"
            href="/profile"
            style={styles.tabTrigger}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.text },
              ]}
            >
              Profile
            </Text>
          </TabTrigger>
        </TabList>
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },

  content: {
    flex: 1,
  },

  tabList: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopLeftRadius: Spacing.three,
    borderTopRightRadius: Spacing.three,
  },

  tabTrigger: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.one,
    minHeight: 48,
  },

  tabText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
