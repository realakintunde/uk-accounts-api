const express = require('express');
const {
  getStatements,
  getStatementById,
  createStatement,
  updateStatement,
  deleteStatement,
} = require('../controllers/statementController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', getStatements);
router.get('/:id', getStatementById);
router.post('/', authenticateToken, createStatement);
router.put('/:id', authenticateToken, updateStatement);
router.delete('/:id', authenticateToken, deleteStatement);

module.exports = router;
