const express = require('express');
const { generateFilingPDF, generateTextReport } = require('../utils/pdfGenerator');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Export filing as PDF
 * GET /api/export/filing/:id/pdf
 */
router.get('/filing/:id/pdf', authenticateToken, async (req, res, next) => {
  try {
    // In a real scenario, fetch the filing data from database
    // For now, use provided data or sample data
    const filingData = req.query || {
      'co-name': 'Sample Company Ltd',
      'co-crn': '12345678',
      'co-type': 'Private Limited',
      'co-addr': '123 High Street, London',
      'fy-end': '2025-12-31',
      'total-assets': '£100,000',
      'total-liab': '£100,000',
      'gross-profit': '£50,000',
      'op-profit': '£40,000',
      'net-profit': '£30,000',
      'net-cf': '£25,000'
    };

    const pdf = await generateFilingPDF(filingData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="annual-accounts.pdf"');
    res.send(pdf);

  } catch (error) {
    next(error);
  }
});

/**
 * Export filing as JSON
 * GET /api/export/filing/:id/json
 */
router.get('/filing/:id/json', authenticateToken, async (req, res, next) => {
  try {
    // Gather all form data (in real scenario, fetch from database)
    const filingData = {
      company: {
        name: req.query['co-name'] || '',
        number: req.query['co-crn'] || '',
        type: req.query['co-type'] || '',
        address: req.query['co-addr'] || ''
      },
      financialYearEnd: req.query['fy-end'] || '',
      balanceSheet: {
        totalAssets: req.query['total-assets'] || '£0',
        totalLiabilities: req.query['total-liab'] || '£0'
      },
      profitAndLoss: {
        grossProfit: req.query['gross-profit'] || '£0',
        operatingProfit: req.query['op-profit'] || '£0',
        netProfit: req.query['net-profit'] || '£0'
      },
      cashFlow: {
        netMovement: req.query['net-cf'] || '£0'
      },
      exportedAt: new Date().toISOString(),
      exportedBy: req.user.email
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="annual-accounts.json"');
    res.json(filingData);

  } catch (error) {
    next(error);
  }
});

/**
 * Export filing as CSV
 * GET /api/export/filing/:id/csv
 */
router.get('/filing/:id/csv', authenticateToken, async (req, res, next) => {
  try {
    const csv = `Company Filing Export
Date,${new Date().toISOString()}

COMPANY INFORMATION
Company Name,${req.query['co-name'] || ''}
CRN,${req.query['co-crn'] || ''}
Company Type,${req.query['co-type'] || ''}
Address,${req.query['co-addr'] || ''}

BALANCE SHEET
Total Assets,${req.query['total-assets'] || '£0'}
Total Liabilities & Equity,${req.query['total-liab'] || '£0'}

PROFIT & LOSS
Gross Profit,${req.query['gross-profit'] || '£0'}
Operating Profit,${req.query['op-profit'] || '£0'}
Net Profit,${req.query['net-profit'] || '£0'}

CASH FLOW
Net Cash Movement,${req.query['net-cf'] || '£0'}
`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="annual-accounts.csv"');
    res.send(csv);

  } catch (error) {
    next(error);
  }
});

/**
 * Export filing as TEXT
 * GET /api/export/filing/:id/text
 */
router.get('/filing/:id/text', authenticateToken, async (req, res, next) => {
  try {
    const filingData = req.query;
    const text = generateTextReport(filingData);

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="annual-accounts.txt"');
    res.send(text);

  } catch (error) {
    next(error);
  }
});

/**
 * Get export options
 * GET /api/export/options
 */
router.get('/options', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      formats: [
        {
          name: 'PDF Report',
          format: 'pdf',
          description: 'Professional PDF document for printing and archival',
          icon: '📄',
          endpoint: '/api/export/filing/:id/pdf'
        },
        {
          name: 'JSON Data',
          format: 'json',
          description: 'Structured JSON for data import and analysis',
          icon: '⚙️',
          endpoint: '/api/export/filing/:id/json'
        },
        {
          name: 'CSV Spreadsheet',
          format: 'csv',
          description: 'Spreadsheet format for Excel and data tools',
          icon: '📊',
          endpoint: '/api/export/filing/:id/csv'
        },
        {
          name: 'Text Report',
          format: 'text',
          description: 'Plain text format for easy viewing and notes',
          icon: '📝',
          endpoint: '/api/export/filing/:id/text'
        }
      ]
    }
  });
});

module.exports = router;
