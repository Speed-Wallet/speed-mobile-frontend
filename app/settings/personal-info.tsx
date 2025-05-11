import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import colors from '@/constants/colors';
import UserData from '@/data/user';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const [name, setName] = useState(UserData.name);
  const [email, setEmail] = useState(UserData.email);
  const [phone, setPhone] = useState('+27 60 123 4567');
  const [address, setAddress] = useState('Cape Town');
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    // In a real app, this would update the user data in the backend
    setIsEditing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Info</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => isEditing ? handleSave() : setIsEditing(true)}
        >
          {isEditing ? (
            <Check size={24} color={colors.success} />
          ) : (
            <Text style={styles.editText}>Edit</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Name & Surname</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={name}
            onChangeText={setName}
            editable={isEditing}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Verification Level</Text>
          <View style={styles.verificationContainer}>
            <Text style={styles.verificationText}>Fully Verified</Text>
            <View style={styles.verificationBadge}>
              <Text style={styles.verificationBadgeText}>Level 2</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={email}
            onChangeText={setEmail}
            editable={isEditing}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={phone}
            onChangeText={setPhone}
            editable={isEditing}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={address}
            onChangeText={setAddress}
            editable={isEditing}
          />
        </View>
      </ScrollView>
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
  editButton: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editText: {
    color: colors.primary,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: 12,
    padding: 16,
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  inputDisabled: {
    opacity: 0.7,
  },
  verificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundMedium,
    borderRadius: 12,
    padding: 16,
  },
  verificationText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textPrimary,
  },
  verificationBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  verificationBadgeText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.success,
  },
});