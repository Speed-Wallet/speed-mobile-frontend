// This would be a Next.js API route if you're using Next.js
// For now, we'll make it call your backend Lambda directly

export default async function handler(req: any, res: any) {
  try {
    // Call your backend token prices Lambda
    const backendUrl = process.env.TOKEN_PRICES_LAMBDA_URL || 'https://your-api-gateway-url/dev/token-prices';
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend API returned ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching token prices:', error);
    res.status(500).json({ 
      error: 'Failed to fetch token prices',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
