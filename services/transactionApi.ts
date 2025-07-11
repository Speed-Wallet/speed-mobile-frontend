// Transaction-related API functions that don't require authentication
const BASE_BACKEND_URL = process.env.EXPO_PUBLIC_BASE_BACKEND_URL;

export async function registerSwap(
    signature: string,
    blockHash: string, 
    lastValidBlockHeight: number
) {
    try {
        await fetch(`${BASE_BACKEND_URL}registerSwap`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ signature, blockHash, lastValidBlockHeight })
        });
    } catch (err) {
        // todo 
        // retry logic
    }
}
