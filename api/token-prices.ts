// This would be a Next.js API route if you're using Next.js
// For now, we'll make it call your backend Lambda directly

export default async function handler(req: any, res: any) {
  try {
    // Get the backend URL from environment variables
    const backendUrl = process.env.EXPO_PUBLIC_BASE_BACKEND_URL;

    if (!backendUrl) {
      throw new Error(
        'Backend URL not configured - please set EXPO_PUBLIC_BASE_BACKEND_URL',
      );
    }

    const response = await fetch(`${backendUrl}/api/prices/tokens`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add Authorization header if needed
        ...(req.headers.authorization && {
          Authorization: req.headers.authorization,
        }),
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
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
