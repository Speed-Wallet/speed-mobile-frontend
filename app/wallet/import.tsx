import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import colors from '@/constants/colors';

export default function ImportPhraseScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Import Recovery Phrase</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Secret Recovery Phrase</Text>
        <Text style={styles.subtitle}>
          Restore an existing wallet with your 12 or 24 word secret recovery phrase
        </Text>

        <TextInput
          style={styles.phraseInput}
          placeholder="Secret Recovery Phrase"
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.importButton}>
          <Text style={styles.importButtonText}>IMPORT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 16,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginBottom: 24,
  },
  phraseInput: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: 12,
    padding: 16,
    height: 120,
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlignVertical: 'top',
  },
  importButton: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  importButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});