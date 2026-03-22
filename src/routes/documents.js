const express = require('express');
const {
  getDocuments,
  getDocumentById,
  uploadDocument,
  deleteDocument,
} = require('../controllers/documentController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', getDocuments);
router.get('/:id', getDocumentById);
router.post('/', authenticateToken, uploadDocument);
router.delete('/:id', authenticateToken, deleteDocument);

module.exports = router;
