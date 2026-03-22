const express = require('express');
const {
  getFilings,
  getFilingById,
  createFiling,
  updateFiling,
  deleteFiling,
} = require('../controllers/filingController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', getFilings);
router.get('/:id', getFilingById);
router.post('/', authenticateToken, createFiling);
router.put('/:id', authenticateToken, updateFiling);
router.delete('/:id', authenticateToken, deleteFiling);

module.exports = router;
