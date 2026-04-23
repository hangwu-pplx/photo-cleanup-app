import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: true }}>
        <Stack.Screen name="index" options={{ title: 'Photo Cleanup' }} />
        <Stack.Screen name="picker" options={{ title: 'Select Photos' }} />
        <Stack.Screen name="processing" options={{ title: 'Analyzing' }} />
        <Stack.Screen name="review" options={{ title: 'Review Groups' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
