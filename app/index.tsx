import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Photo Cleanup</Text>
        <Text style={styles.subtitle}>
          Find duplicate and burst shots. Review before you delete.{'\n'}
          100% offline — no cloud, no accounts, no ads.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>How it works</Text>
          <Text style={styles.cardText}>
            1. Select 20-50 photos{'\n'}
            2. We group likely duplicates and bursts{'\n'}
            3. Review recommendations and choose what to keep{'\n'}
            4. Delete the rest safely after explicit confirmation
          </Text>
        </View>

        <Pressable style={styles.button} onPress={() => router.push('/picker')}>
          <Text style={styles.buttonText}>Select Photos</Text>
        </Pressable>

        <Pressable style={[styles.button, styles.secondaryButton]} onPress={() => router.push('/settings')}>
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>Settings</Text>
        </Pressable>
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
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
    color: '#111',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  card: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 10,
    color: '#222',
  },
  cardText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  button: {
    width: '100%',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: '#f2f2f7',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
});
