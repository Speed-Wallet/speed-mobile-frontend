import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Plus } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import colors from '@/constants/colors';
import BackButton from '@/components/BackButton';

const virtualCards = [
	{
		id: 'metamask',
		name: 'MetaMask',
		color: '#E2FFF4',
		logo: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
		connected: true,
	},
	{
		id: 'phantom',
		name: 'Phantom',
		color: '#E5E0FF',
		logo: 'https://phantom.app/img/phantom-logo.svg',
		connected: true,
	},
];

export default function CardsScreen() {
	const router = useRouter();

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<BackButton style={styles.closeButton} />
				<Text style={styles.headerTitle}>Pay With</Text>
				<View style={styles.placeholder} />
			</View>

			<View style={styles.content}>
				{virtualCards.map((card, index) => (
					<Animated.View
						key={card.id}
						entering={FadeIn.delay(index * 100)}
						style={[styles.card, { backgroundColor: card.color }]}
					>
						<View style={styles.cardHeader}>
							<Image
								source={{ uri: card.logo }}
								style={styles.cardLogo}
							/>
							<Image
								source={{
									uri: 'https://brand.mastercard.com/content/dam/mccom/brandcenter/thumbnails/mastercard_vrt_rev_92px_2x.png',
								}}
								style={styles.mastercardLogo}
							/>
						</View>
					</Animated.View>
				))}

				<Animated.View entering={FadeIn.delay(200)}>
					<TouchableOpacity style={styles.addCard}>
						<View style={styles.addCardHeader}>
							<View style={styles.addCardLeft}>
								<Plus size={24} color={colors.textPrimary} />
								<Text style={styles.addCardText}>ADD WALLET</Text>
							</View>
							<Image
								source={{
									uri: 'https://brand.mastercard.com/content/dam/mccom/brandcenter/thumbnails/mastercard_vrt_rev_92px_2x.png',
								}}
								style={styles.mastercardLogo}
							/>
						</View>
					</TouchableOpacity>
				</Animated.View>
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
		borderRadius: 16,
		marginBottom: 16,
		height: 200,
		padding: 20,
	},
	cardHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	cardLogo: {
		width: 32,
		height: 32,
		resizeMode: 'contain',
	},
	mastercardLogo: {
		width: 48,
		height: 32,
		resizeMode: 'contain',
	},
	addCard: {
		backgroundColor: colors.backgroundMedium,
		borderRadius: 16,
		height: 200,
		padding: 20,
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
		color: colors.textPrimary,
		fontSize: 14,
		fontFamily: 'Inter-SemiBold',
	},
});