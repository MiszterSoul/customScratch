// Express server for scratch card app
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { saveSession, retrieveSession } = require('./db/localDatabase');
const generateCoupon = require('./couponGenerator');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

// Helper to get user session id from cookie or header
function getSessionId(req, res) {
  let sessionId = req.cookies?.sessionId || null;
  if (!sessionId) {
    sessionId = Math.random().toString(36).substr(2, 16);
    res.cookie('sessionId', sessionId, { httpOnly: false, sameSite: 'lax', maxAge: 1000*60*60*24*30 });
  }
  return sessionId;
}

app.post('/api/coupon', (req, res) => {
  let sessionId = getSessionId(req, res);
  let session = retrieveSession(sessionId);
  let generated = false;
  if (!session) {
    const couponCode = generateCoupon();
    session = { sessionId, couponCode, created: new Date().toISOString() };
    saveSession(session);
    generated = true;
  }
  // Set cookie again to refresh expiration
  res.cookie('sessionId', sessionId, { httpOnly: false, sameSite: 'lax', maxAge: 1000*60*60*24*30 });
  res.json({ sessionId: session.sessionId, couponCode: session.couponCode, generated });
});

// Ensure /api/session uses getSessionId with response and refresh cookie
app.get('/api/session', (req, res) => {
  const sessionId = getSessionId(req, res);
  const session = retrieveSession(sessionId);
  res.json({ sessionId, couponCode: session ? session.couponCode : null });
});

// Listen on all network interfaces for LAN access
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT} (accessible on your LAN at http://<your-ip>:${PORT})`);
});