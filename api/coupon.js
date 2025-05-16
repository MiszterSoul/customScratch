import cookie from 'cookie';
import generateCoupon from '../src/couponGenerator';

export default function handler(req, res) {
  let cookies = {};
  if (req.headers.cookie) {
    cookies = cookie.parse(req.headers.cookie);
  }
  let sessionId = cookies.sessionId || Math.random().toString(36).substr(2, 16);
  let couponCode = cookies.couponCode || null;
  let generated = false;

  // If user requests a new coupon, clear coupon and give new sessionId (user must scratch to get new coupon)
  if (req.method === 'POST' && req.body && req.body.newCoupon) {
    sessionId = Math.random().toString(36).substr(2, 16);
    couponCode = null;
    // Set/refresh cookies (no coupon yet)
    res.setHeader('Set-Cookie', [
      cookie.serialize('sessionId', sessionId, {
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      }),
      cookie.serialize('couponCode', '', {
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      })
    ]);
    res.status(200).json({ sessionId, couponCode: null, generated: false });
    return;
  }

  // Only generate coupon if not present and user is scratching (normal POST)
  if (req.method === 'POST') {
    if (!couponCode) {
      couponCode = generateCoupon();
      generated = true;
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Set/refresh cookies
  res.setHeader('Set-Cookie', [
    cookie.serialize('sessionId', sessionId, {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    }),
    cookie.serialize('couponCode', couponCode || '', {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: couponCode ? 60 * 60 * 24 * 30 : 0,
      path: '/',
    })
  ]);
  res.status(200).json({ sessionId, couponCode, generated });
}
