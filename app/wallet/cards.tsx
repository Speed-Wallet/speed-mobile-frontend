import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Plus, Zap, Shield, Globe } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import colors from '@/constants/colors';
import UserData from '@/data/user';

const virtualCards = [
  {
    id: 'speed-pay',
    name: 'SPEED PAY',
    cardNumber: '**** **** **** 4242',
    expiryDate: '12/25',
    cardHolder: UserData.name.toUpperCase(),
    backgroundColor: '#121212',
  }
];

export default function CardsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Virtual Cards</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {virtualCards.map((card, index) => (
          <Animated.View 
            key={card.id}
            entering={FadeIn.delay(index * 100)}
          >
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.brandContainer}>
                  <Zap size={20} color={colors.white} />
                  <Text style={styles.brandText}>SPEED</Text>
                </View>
                <Image 
                  source={{ uri: 'https://brand.mastercard.com/content/dam/mccom/brandcenter/thumbnails/mastercard_vrt_rev_92px_2x.png' }}
                  style={styles.mastercardLogo}
                />
              </View>

              <Text style={styles.cardNumber}>{card.cardNumber}</Text>

              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.cardLabel}>CARD HOLDER</Text>
                  <Text style={styles.cardValue}>{card.cardHolder}</Text>
                </View>
                <View>
                  <Text style={styles.cardLabel}>EXPIRES</Text>
                  <Text style={styles.cardValue}>{card.expiryDate}</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        ))}

        <Animated.View entering={FadeIn.delay(200)}>
          <TouchableOpacity style={styles.addCard}>
            <View style={styles.addCardHeader}>
              <View style={styles.addCardLeft}>
                <Plus size={24} color={colors.textPrimary} />
                <Text style={styles.addCardText}>ADD NEW CARD</Text>
              </View>
              <Image 
                source={{ uri: 'https://brand.mastercard.com/content/dam/mccom/brandcenter/thumbnails/mastercard_vrt_rev_92px_2x.png' }}
                style={styles.mastercardLogo}
              />
            </View>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About SPEED PAY</Text>
          <Text style={styles.infoText}>
            SPEED PAY is our virtual payment solution that enables instant, secure transactions across the globe. Powered by advanced blockchain technology and protected by state-of-the-art security measures.
          </Text>
          
          <View style={styles.features}>
            <View style={styles.featureItem}>
              <Zap size={20} color={colors.primary} />
              <Text style={styles.featureText}>Instant Payments</Text>
            </View>
            <View style={styles.featureItem}>
              <Shield size={20} color={colors.primary} />
              <Text style={styles.featureText}>Secure Transactions</Text>
            </View>
            <View style={styles.featureItem}>
              <Globe size={20} color={colors.primary} />
              <Text style={styles.featureText}>Global Acceptance</Text>
            </View>
          </View>
        </View>
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
  closeButton: {
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
  },
  card: {
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    height: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: colors.white,
  },
  mastercardLogo: {
    width: 48,
    height: 32,
    resizeMode: 'contain',
  },
  cardNumber: {
    fontSize: 22,
    fontFamily: 'Inter-Medium',
    color: colors.white,
    letterSpacing: 2,
    marginBottom: 40,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.white,
  },
  addCard: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: 16,
    padding: 24,
    height: 200,
  },
  addCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addCardText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  infoSection: {
    marginTop: 32,
  },
  infoTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  featureItem: {
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
});