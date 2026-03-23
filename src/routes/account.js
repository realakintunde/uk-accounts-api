import express from 'express';
import pool from '../db/pool.js';

const router = express.Router();

// Get current user account info
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('[ERROR] Get account:', err);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
});

export default router;
