const { BASE_BACKEND_URL } = process.env;

export async function registerSwapAttempt(txSig: string) {
    return;

    // todo
    const response = await fetch(`${BASE_BACKEND_URL}registerSwapAttempt`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({

        })
    });
}
