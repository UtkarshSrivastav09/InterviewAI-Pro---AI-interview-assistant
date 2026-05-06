import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { targetUrl, method = 'POST', headers = {}, body } = req.body;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing targetUrl' });
  }

  try {
    const response = await fetch(targetUrl, {
      method,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    // Add CORS headers to response
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Proxy Error:', error);
    return res.status(500).json({ error: 'Failed to proxy request', details: error.message });
  }
}
