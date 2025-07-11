import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Modal } from 'react-native';
import { Gift, Trophy, Star, Users, ArrowRight, Medal, Crown, Zap, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@/constants/colors';
import UserData from '@/data/user';
import ScreenContainer from '@/components/ScreenContainer';
import TabScreenHeader from '@/components/TabScreenHeader';

const { width } = Dimensions.get('window');

const TIERS = {
  BRONZE: { 
    name: 'Bronze', 
    color: '#CD7F32', 
    points: 0,
    gradient: ['#8D6E63', '#6D4C41'],
    perks: ['Basic Trading', 'Standard Support']
  },
  SILVER: { 
    name: 'Silver', 
    color: '#C0C0C0', 
    points: 1000,
    gradient: ['#BDBDBD', '#9E9E9E'],
    perks: ['Lower Fees', 'Priority Support']
  },
  GOLD: { 
    name: 'Gold', 
    color: '#A17917', // Adjusted for an even more opaque/subdued gold appearance
    points: 5000,
    gradient: ['#FFC107', '#FFA000'],
    perks: ['VIP Trading', 'Exclusive Events']
  },
  PLATINUM: { 
    name: 'Platinum', 
    color: '#E5E4E2', 
    points: 10000,
    gradient: ['#E0E0E0', '#BDBDBD'],
    perks: ['Zero Fees', '24/7 Support', 'Custom Benefits']
  },
};

const FULL_LEADERBOARD = [
  { id: 1, name: 'Alex Thompson', points: 12500, tier: 'PLATINUM', avatar: 'https://randomuser.me/api/portraits/men/1.jpg', weeklyGain: 2500 },
  { id: 2, name: 'Sarah Chen', points: 11200, tier: 'PLATINUM', avatar: 'https://randomuser.me/api/portraits/women/2.jpg', weeklyGain: 1800 },
  { id: 3, name: 'Mike Johnson', points: 9800, tier: 'GOLD', avatar: 'https://randomuser.me/api/portraits/men/3.jpg', weeklyGain: 1200 },
  { id: 4, name: 'Emma Davis', points: 8500, tier: 'GOLD', avatar: 'https://randomuser.me/api/portraits/women/4.jpg', weeklyGain: 900 },
  { id: 5, name: 'James Wilson', points: 7200, tier: 'GOLD', avatar: 'https://randomuser.me/api/portraits/men/5.jpg', weeklyGain: 800 },
  { id: 6, name: UserData.name, points: 6800, tier: 'GOLD', avatar: UserData.avatar || 'https://randomuser.me/api/portraits/men/6.jpg', weeklyGain: 750, isCurrentUser: true },
  { id: 7, name: 'Sophie Brown', points: 6200, tier: 'SILVER', avatar: 'https://randomuser.me/api/portraits/women/7.jpg', weeklyGain: 600 },
  { id: 8, name: 'David Lee', points: 5800, tier: 'SILVER', avatar: 'https://randomuser.me/api/portraits/men/8.jpg', weeklyGain: 500 },
  { id: 9, name: 'Lisa Wang', points: 5200, tier: 'SILVER', avatar: 'https://randomuser.me/api/portraits/women/9.jpg', weeklyGain: 400 },
  { id: 10, name: 'Tom Harris', points: 4800, tier: 'SILVER', avatar: 'https://randomuser.me/api/portraits/men/10.jpg', weeklyGain: 300 },
];

const TOP_3 = FULL_LEADERBOARD.slice(0, 3);

export default function RewardsScreen() {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [userPoints] = useState(3500);
  const [userTier, setUserTier] = useState('GOLD');
  const [dailyTasksCompleted] = useState(3);
  const totalDailyTasks = 5;

  const getCurrentTierProgress = () => {
    const currentTier = TIERS[userTier];
    const nextTier = Object.values(TIERS).find(tier => tier.points > currentTier.points);
    if (!nextTier) return 100;
    
    const progress = ((userPoints - currentTier.points) / (nextTier.points - currentTier.points)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const LeaderboardModal = () => (
    <Modal
      visible={showLeaderboard}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <Crown size={24} color={colors.warning} />
              <Text style={styles.modalTitle}>Global Rankings</Text>
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowLeaderboard(false)}
            >
              <X size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalList}>
            {FULL_LEADERBOARD.map((user, index) => (
              <LinearGradient
                key={user.id}
                colors={
                  user.isCurrentUser 
                    ? ['#5D5FEF20', '#7577FF20']
                    : index === 0 
                      ? ['#FFD70020', '#FFA00020']
                      : ['#1E1E1E', '#2C2C2C']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.leaderboardItem,
                  user.isCurrentUser && styles.currentUserItem
                ]}
              >
                <View style={styles.rankContainer}>
                  <Text style={[
                    styles.rank,
                    index === 0 && styles.topRank,
                    user.isCurrentUser && styles.currentUserRank
                  ]}>#{index + 1}</Text>
                </View>
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
                <View style={styles.userInfo}>
                  <Text style={[
                    styles.userName,
                    user.isCurrentUser && styles.currentUserText
                  ]}>{user.name}</Text>
                  <View style={styles.userStats}>
                    <Text style={styles.userPoints}>{user.points} Points</Text>
                    <View style={styles.weeklyGain}>
                      <Zap size={12} color={colors.success} />
                      <Text style={styles.gainText}>+{user.weeklyGain} this week</Text>
                    </View>
                  </View>
                </View>
                <View style={[
                  styles.tierIndicator,
                  { backgroundColor: TIERS[user.tier].color + '20' }
                ]}>
                  <Text style={[
                    styles.tierIndicatorText,
                    { color: TIERS[user.tier].color }
                  ]}>
                    {TIERS[user.tier].name}
                  </Text>
                </View>
              </LinearGradient>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderTierCard = () => (
    <LinearGradient
      colors={TIERS[userTier].gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.tierCard}
    >
      <View style={styles.tierHeader}>
        <View style={styles.tierBadgeContainer}>
          <Medal size={32} color={TIERS[userTier].color} />
          <View>
            <Text style={styles.tierName}>{TIERS[userTier].name} Tier</Text>
            <Text style={styles.pointsText}>{userPoints} Points</Text>
          </View>
        </View>
        <View style={styles.perksContainer}>
          {TIERS[userTier].perks.map((perk, index) => (
            <View key={index} style={styles.perkBadge}>
              <Star size={12} color={TIERS[userTier].color} />
              <Text style={styles.perkText}>{perk}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progress, { width: `${getCurrentTierProgress()}%` }]} />
        </View>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {Math.round(getCurrentTierProgress())}% to {
              Object.values(TIERS).find(tier => tier.points > TIERS[userTier].points)?.name || 'Max'
            }
          </Text>
          <Text style={styles.pointsNeeded}>
            {Object.values(TIERS).find(tier => tier.points > TIERS[userTier].points)?.points - userPoints || 0} points needed
          </Text>
        </View>
      </View>
    </LinearGradient>
  );

  const renderLeaderboard = () => (
    <View style={styles.leaderboardContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.headerLeft}>
          <Crown size={24} color={colors.warning} />
          <Text style={styles.sectionTitle}>Top Players</Text>
        </View>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => setShowLeaderboard(true)}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <ArrowRight size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {TOP_3.map((user, index) => (
        <LinearGradient
          key={user.id}
          colors={index === 0 ? ['#FFD700', '#FFA000'] : ['#1E1E1E', '#2C2C2C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.leaderboardItem}
        >
          <View style={styles.rankContainer}>
            <Text style={[styles.rank, index === 0 && styles.topRank]}>#{index + 1}</Text>
          </View>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <View style={styles.userStats}>
              <Text style={styles.userPoints}>{user.points} Points</Text>
              <View style={styles.weeklyGain}>
                <Zap size={12} color={colors.success} />
                <Text style={styles.gainText}>+{user.weeklyGain} this week</Text>
              </View>
            </View>
          </View>
          <View style={[styles.tierIndicator, { backgroundColor: TIERS[user.tier].color + '20' }]}>
            <Text style={[styles.tierIndicatorText, { color: TIERS[user.tier].color }]}>
              {TIERS[user.tier].name}
            </Text>
          </View>
        </LinearGradient>
      ))}

      <TouchableOpacity 
        style={styles.yourRankingButton}
        onPress={() => setShowLeaderboard(true)}
      >
        <Text style={styles.yourRankingText}>
          Your Ranking: #6 • {userPoints} Points
        </Text>
        <ArrowRight size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      {LeaderboardModal()}
    </View>
  );

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <TabScreenHeader 
        title="Rewards" 
        subtitle="Compete and earn rewards" 
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderTierCard()}
        {renderLeaderboard()}
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Tasks</Text>
            <Text style={styles.taskProgress}>{dailyTasksCompleted}/{totalDailyTasks}</Text>
          </View>
          
          <View style={styles.tasksContainer}>
            <TouchableOpacity style={styles.taskCard}>
              <View style={styles.taskIcon}>
                <Trophy size={24} color={colors.primary} />
              </View>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>Complete 3 Trades</Text>
                <Text style={styles.taskReward}>+50 Points</Text>
              </View>
              <View style={[styles.taskStatus, styles.taskCompleted]}>
                <Text style={styles.taskStatusText}>Done</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.taskCard}>
              <View style={styles.taskIcon}>
                <Users size={24} color={colors.primary} />
              </View>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>Invite a Friend</Text>
                <Text style={styles.taskReward}>+100 Points</Text>
              </View>
              <View style={styles.taskStatus}>
                <Text style={styles.taskStatusText}>Start</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Rewards</Text>
          <TouchableOpacity style={styles.rewardCard}>
            <View style={styles.rewardIcon}>
              <Star size={24} color={colors.warning} />
            </View>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardTitle}>Premium Features</Text>
              <Text style={styles.rewardDescription}>Unlock advanced trading tools</Text>
            </View>
            <Text style={styles.rewardCost}>5000 pts</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.rewardCard}>
            <View style={styles.rewardIcon}>
              <Gift size={24} color={colors.success} />
            </View>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardTitle}>NFT Collection</Text>
              <Text style={styles.rewardDescription}>Exclusive digital collectibles</Text>
            </View>
            <Text style={styles.rewardCost}>10000 pts</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tierCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  tierHeader: {
    marginBottom: 20,
  },
  tierBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  tierName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: colors.white,
    marginBottom: 4,
  },
  pointsText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
    opacity: 0.8,
  },
  perksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  perkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  perkText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: colors.white,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progress: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 4,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
  },
  pointsNeeded: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: colors.white,
    opacity: 0.8,
  },
  leaderboardContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.primary,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rank: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
  },
  topRank: {
    color: colors.warning,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: colors.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
    marginBottom: 4,
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userPoints: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.white,
    opacity: 0.8,
  },
  weeklyGain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gainText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: colors.success,
  },
  tierIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tierIndicatorText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  section: {
    marginBottom: 24,
  },
  taskProgress: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.primary,
  },
  tasksContainer: {
    gap: 12,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundMedium,
    borderRadius: 16,
    padding: 16,
  },
  taskIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  taskReward: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.primary,
  },
  taskStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  taskCompleted: {
    backgroundColor: colors.success + '20',
  },
  taskStatusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundMedium,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  rewardCost: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundMedium,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
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
  modalList: {
    padding: 16,
  },
  currentUserItem: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  currentUserRank: {
    color: colors.primary,
  },
  currentUserText: {
    color: colors.primary,
  },
  yourRankingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundMedium,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  yourRankingText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.textSecondary,
  },
});