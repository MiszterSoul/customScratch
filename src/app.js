// Express server for scratch card app
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { saveSession, retrieveSession } = require('./db/localDatabase');
const generateCoupon = require('./couponGenerator');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// Helper to get user session id from cookie or header
function getSessionId(req) {
  return req.headers['x-session-id'] || req.cookies?.sessionId || null;
}

app.post('/api/coupon', (req, res) => {
  let sessionId = getSessionId(req);
  if (!sessionId) {
    sessionId = Math.random().toString(36).substr(2, 16);
  }
  let session = retrieveSession(sessionId);
  let generated = false;
  if (!session) {
    const couponCode = generateCoupon();
    session = { sessionId, couponCode, created: new Date().toISOString() };
    saveSession(session);
    generated = true;
  }
  res.json({ sessionId: session.sessionId, couponCode: session.couponCode, generated });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});