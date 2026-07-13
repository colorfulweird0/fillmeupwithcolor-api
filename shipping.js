export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Get token
    const creds = Buffer.from(`${process.env.LULU_CLIENT_KEY}:${process.env.LULU_CLIENT_SECRET}`).toString('base64');
    const tokenRes = await fetch('https://api.lulu.com/auth/realms/glasstree/protocol/openid-connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${creds}`
      },
      body: 'grant_type=client_credentials'
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      return res.status(401).json({ error: 'Auth failed', detail: err });
    }

    const { access_token } = await tokenRes.json();
    const apiBase = process.env.SANDBOX === 'true'
      ? 'https://api.sandbox.lulu.com'
      : 'https://api.lulu.com';

    // Fetch shipping options
    const shippingRes = await fetch(`${apiBase}/shipping-options/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const data = await shippingRes.json();
    return res.status(shippingRes.status).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
