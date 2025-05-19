import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import BackButton from '@/components/BackButton';

export default function CreateAccountScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Create Account</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>MANAGE WALLETS</Text>
        <TextInput
          style={styles.input}
          placeholder="Account 2"
          placeholderTextColor={colors.textSecondary}
        />

        <TouchableOpacity style={styles.createButton}>
          <Text style={styles.createButtonText}>CREATE</Text>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 16,
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: 12,
    padding: 16,
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  createButton: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});