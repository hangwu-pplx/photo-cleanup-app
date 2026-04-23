import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '../store/settingsStore';
import { clearCache } from '../lib/cache';

export default function SettingsScreen() {
  const {
    requireConfirmation,
    setRequireConfirmation,
    showFileNames,
    setShowFileNames,
  } = useSettingsStore();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Require confirmation before deletion</Text>
            <Pressable
              style={[styles.toggle, requireConfirmation && styles.toggleOn]}
              onPress={() => setRequireConfirmation(!requireConfirmation)}
            >
              <View style={[styles.toggleKnob, requireConfirmation && styles.toggleKnobOn]} />
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Show filenames in review</Text>
            <Pressable
              style={[styles.toggle, showFileNames && styles.toggleOn]}
              onPress={() => setShowFileNames(!showFileNames)}
            >
              <View style={[styles.toggleKnob, showFileNames && styles.toggleKnobOn]} />
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cache</Text>
          <Pressable style={styles.rowButton} onPress={async () => {
            await clearCache();
          }}>
            <Text style={styles.rowButtonText}>Clear Analysis Cache</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            Photo Cleanup MVP{'\n'}
            Version 1.0.0{'\n\n'}
            This app works entirely on your device. No photos are uploaded.{'\n'}
            Grouping uses time-based heuristics, not ML (yet).{'\n\n'}
            Deletion behavior depends on your platform:{'\n'}
            • iOS: Photos move to Recently Deleted for ~30 days{'\n'}
            • Android: Behavior varies by manufacturer
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowLabel: {
    fontSize: 16,
    color: '#222',
    flex: 1,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e5e5ea',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleOn: {
    backgroundColor: '#34c759',
  },
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    transform: [{ translateX: 0 }],
  },
  toggleKnobOn: {
    transform: [{ translateX: 20 }],
  },
  rowButton: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowButtonText: {
    fontSize: 16,
    color: '#ff3b30',
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});
