
// async function getTokenInfo(tokenAddress: string) {
//     const tokenInfoResponse = await (
//         await fetch(`https://lite-api.jup.ag/tokens/v1/token/${tokenAddress}`)
//     ).json();
//     console.log(tokenInfoResponse);
//     return tokenInfoResponse;
// }
// getTokenInfo('3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh')

import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

export const CONNECTION = new Connection('https://solana-rpc.publicnode.com');

const fetchTokenBalance = async (
    token: { address: string; symbol: string; decimals: number },
    walletPublicKey: PublicKey
): Promise<{ address: string; balance: number; rawBalance: bigint } | null> => {
    const mintPublicKey = new PublicKey(token.address);
    const ata = getAssociatedTokenAddressSync(mintPublicKey, walletPublicKey, false);
    try {
        const accountInfo = await getAccount(CONNECTION, ata);
        return {
            address: token.address,
            balance: Number(accountInfo.amount) / (10 ** token.decimals),
            rawBalance: accountInfo.amount,
        };
    } catch (e: any) {
        if (e.name === 'TokenAccountNotFoundError' || e.message?.includes('could not find account')) {
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


async function getNativeSolBalance(walletPublicKey: PublicKey): Promise<number> {
    try {
        const lamports = await CONNECTION.getBalance(walletPublicKey);
        return lamports / LAMPORTS_PER_SOL;
    } catch (error) {
        console.error("Error fetching SOL balance:", error);
        return 0;
    }
}


// fetchTokenBalance({
//     symbol: 'USDC',
//     address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
//     decimals: 6,
// }, new PublicKey('CQo9Xb1Xk7E82etzmSsvpRvybnfh7oTi8EuEYibyKrzv'))
//     .then(balance => console.log('Balance:', balance))
//     .catch(error => console.error('Error fetching token balance:', error));

// fetchTokenBalance({
//     symbol: 'SOL',
//     address: 'So11111111111111111111111111111111111111112',
//     decimals: 9,
// }, new PublicKey('CQo9Xb1Xk7E82etzmSsvpRvybnfh7oTi8EuEYibyKrzv'))
//     .then(balance => console.log('Balance:', balance))
//     .catch(error => console.error('Error fetching SOL balance:', error));

getNativeSolBalance(new PublicKey('CQo9Xb1Xk7E82etzmSsvpRvybnfh7oTi8EuEYibyKrzv'))
    .then(balance => console.log('Native SOL Balance:', balance))
    .catch(error => console.error('Error fetching native SOL balance:', error));