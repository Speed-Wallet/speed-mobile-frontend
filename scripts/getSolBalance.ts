import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

export const CONNECTION = new Connection('https://solana-rpc.publicnode.com');


async function getNativeSolBalance(walletPublicKey: PublicKey): Promise<number> {
    try {
        const lamports = await CONNECTION.getBalance(walletPublicKey);
        return lamports / LAMPORTS_PER_SOL;
    } catch (error) {
        console.error("Error fetching SOL balance:", error);
        return 0;
    }
}


getNativeSolBalance(new PublicKey('CQo9Xb1Xk7E82etzmSsvpRvybnfh7oTi8EuEYibyKrzv'))
    .then(balance => console.log('Native SOL Balance:', balance))
    .catch(error => console.error('Error fetching native SOL balance:', error));