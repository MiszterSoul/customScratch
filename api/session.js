// Vercel serverless function for /api/session
// Stores coupon code in cookie only (no DB)

const cookie = require('cookie');

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  let cookies = {};
  if (req.headers.cookie) {
    cookies = cookie.parse(req.headers.cookie);
  }
  let sessionId = cookies.sessionId || Math.random().toString(36).substr(2, 16);
  let couponCode = cookies.couponCode || null;
  // Set/refresh cookies
  res.setHeader('Set-Cookie', [
    cookie.serialize('sessionId', sessionId, {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    }),
    couponCode ? cookie.serialize('couponCode', couponCode, {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    }) : null
  ].filter(Boolean));
  res.status(200).json({ sessionId, couponCode });
}
