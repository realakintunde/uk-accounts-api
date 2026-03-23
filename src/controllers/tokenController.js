// src/controllers/tokenController.js
const jwt = require('jsonwebtoken');

async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );
    
    // Issue new access token (1 hour expiry)
    const newAccessToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    return res.status(200).json({
      data: {
        token: newAccessToken
      }
    });
  } catch (e) {
    console.error('[TOKEN] Refresh token error:', e.message);
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
}

module.exports = {
  refreshToken
};
