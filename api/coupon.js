import cookie from 'cookie';
import generateCoupon from '../src/couponGenerator';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  let cookies = {};
  if (req.headers.cookie) {
    cookies = cookie.parse(req.headers.cookie);
  }
  let sessionId = cookies.sessionId || Math.random().toString(36).substr(2, 16);
  let couponCode = cookies.couponCode || null;
  let generated = false;
  if (!couponCode) {
    couponCode = generateCoupon();
    generated = true;
  }
  // Set/refresh cookies
  res.setHeader('Set-Cookie', [
    cookie.serialize('sessionId', sessionId, {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    }),
    cookie.serialize('couponCode', couponCode, {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
  ]);
  res.status(200).json({ sessionId, couponCode, generated });
}
