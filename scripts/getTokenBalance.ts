import { WSOL_ADDRESS, USDC_ADDRESS } from '@/constants/popularTokens';
import { CONNECTION } from '@/services/walletService';
import { getAccount, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';

const fetchTokenBalance = async (
  token: { address: string; symbol: string; decimals: number },
  walletPublicKey: PublicKey,
): Promise<{ address: string; balance: number; rawBalance: bigint } | null> => {
  const mintPublicKey = new PublicKey(token.address);
  const ata = getAssociatedTokenAddressSync(
    mintPublicKey,
    walletPublicKey,
    false,
  );
  try {
    const accountInfo = await getAccount(CONNECTION, ata);
    return {
      address: token.address,
      balance: Number(accountInfo.amount) / 10 ** token.decimals,
      rawBalance: accountInfo.amount,
    };
  } catch (e: any) {
    if (
      e.name === 'TokenAccountNotFoundError' ||
      e.message?.includes('could not find account')
    ) {
      return {
        address: token.address,
        balance: 0,
        rawBalance: BigInt(0),
      };
    }
    console.error(`Error fetching balance for ${token.symbol}:`, e);
    // For a single token fetch error, we might still return 0 balance or let it be handled by overall error state
    return { address: token.address, balance: 0, rawBalance: BigInt(0) }; // Or throw to set global error
  }
};

fetchTokenBalance(
  {
    symbol: 'USDC',
    address: USDC_ADDRESS,
    decimals: 6,
  },
  new PublicKey('CQo9Xb1Xk7E82etzmSsvpRvybnfh7oTi8EuEYibyKrzv'),
)
  .then((balance) => console.log('Balance:', balance))
  .catch((error) => console.error('Error fetching token balance:', error));

fetchTokenBalance(
  {
    symbol: 'SOL',
    address: WSOL_ADDRESS,
    decimals: 9,
  },
  new PublicKey('CQo9Xb1Xk7E82etzmSsvpRvybnfh7oTi8EuEYibyKrzv'),
)
  .then((balance) => console.log('Balance:', balance))
  .catch((error) => console.error('Error fetching SOL balance:', error));
