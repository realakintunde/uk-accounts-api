const express = require('express');
const {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyFinancialStatements,
} = require('../controllers/companyController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAllCompanies);
router.get('/:id', getCompanyById);
router.get('/:id/statements', getCompanyFinancialStatements);
router.post('/', authenticateToken, createCompany);
router.put('/:id', authenticateToken, updateCompany);
router.delete('/:id', authenticateToken, deleteCompany);

module.exports = router;
