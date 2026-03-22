const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a professional PDF report of financial statements
 * 
 * @param {Object} data - Filing data with company info and statements
 * @returns {Buffer} PDF document buffer
 */
async function generateFilingPDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      const buffers = [];
      
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.registerFont('Helvetica-Bold', 'Helvetica-Bold');
      doc.fontSize(24).font('Helvetica-Bold').text('Annual Accounts Report', {
        align: 'center'
      });
      
      doc.fontSize(12).font('Helvetica').text(data['co-name'] || 'Company Name', {
        align: 'center'
      });
      
      doc.fontSize(10).fillColor('#666666').text(`CRN: ${data['co-crn'] || 'N/A'}`, {
        align: 'center'
      });
      
      doc.fillColor('#000000');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      
      // Report Date
      doc.fontSize(10).text(`Report Generated: ${new Date().toLocaleDateString()}`, {
        align: 'right',
        margin: [20, 0, 20, 0]
      });

      // Section 1: Company Information
      doc.fontSize(14).font('Helvetica-Bold').text('1. Company Information', { margin: [20, 0, 10, 0] });
      doc.fontSize(10).font('Helvetica');
      
      const companyTable = [
        ['Company Name:', data['co-name'] || 'N/A'],
        ['Registration Number:', data['co-crn'] || 'N/A'],
        ['Company Type:', data['co-type'] || 'N/A'],
        ['Registered Address:', data['co-addr'] || 'N/A'],
        ['Financial Year End:', data['fy-end'] || 'N/A']
      ];

      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      let tableY = doc.y + 10;
      
      companyTable.forEach((row, i) => {
        doc.fontSize(10).text(row[0], 60, tableY + (i * 18), { width: 150 });
        doc.text(row[1], 220, tableY + (i * 18), { width: 330 });
      });
      
      doc.y = tableY + (companyTable.length * 18) + 10;

      // Section 2: Balance Sheet
      doc.addPage().fontSize(14).font('Helvetica-Bold').text('2. Balance Sheet', { margin: [20, 0, 10, 0] });
      doc.fontSize(9).font('Helvetica');
      
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      
      const balanceData = [
        { label: 'ASSETS', value: '' },
        { label: 'Cash at Bank', value: '£0' },
        { label: 'Trade Debtors', value: '£0' },
        { label: 'Stock', value: '£0' },
        { label: 'Plant & Equipment', value: '£0' },
        { label: 'Total Assets', value: data['total-assets'] || '£0' },
        { label: '', value: '' },
        { label: 'LIABILITIES & EQUITY', value: '' },
        { label: 'Trade Creditors', value: '£0' },
        { label: 'Bank Loans', value: '£0' },
        { label: 'Share Capital', value: '£0' },
        { label: 'Retained Earnings', value: '£0' },
        { label: 'Total Liabilities & Equity', value: data['total-liab'] || '£0' }
      ];

      let balanceY = doc.y + 10;
      balanceData.forEach((item, i) => {
        const weight = item.label.includes('Total') ? 'Helvetica-Bold' : 'Helvetica';
        doc.font(weight).fontSize(9);
        doc.text(item.label, 60, balanceY + (i * 16), { width: 300 });
        doc.text(item.value, 450, balanceY + (i * 16), { width: 100, align: 'right' });
      });
      
      doc.y = balanceY + (balanceData.length * 16) + 10;

      // Section 3: Profit & Loss
      doc.addPage().fontSize(14).font('Helvetica-Bold').text('3. Profit & Loss Account', { margin: [20, 0, 10, 0] });
      doc.fontSize(9).font('Helvetica');
      
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      
      const plData = [
        { label: 'Turnover', value: '£0' },
        { label: 'Cost of Sales', value: '£0' },
        { label: 'Gross Profit', value: data['gross-profit'] || '£0' },
        { label: 'Operating Expenses', value: '£0' },
        { label: 'Operating Profit', value: data['op-profit'] || '£0' },
        { label: 'Tax', value: '£0' },
        { label: 'NET PROFIT', value: data['net-profit'] || '£0' }
      ];

      let plY = doc.y + 10;
      plData.forEach((item, i) => {
        const weight = item.label.includes('PROFIT') || item.label.includes('Gross') || item.label.includes('Operating') ? 'Helvetica-Bold' : 'Helvetica';
        doc.font(weight).fontSize(9);
        doc.text(item.label, 60, plY + (i * 16), { width: 300 });
        doc.text(item.value, 450, plY + (i * 16), { width: 100, align: 'right' });
      });
      
      doc.y = plY + (plData.length * 16) + 10;

      // Section 4: Cash Flow
      doc.addPage().fontSize(14).font('Helvetica-Bold').text('4. Cash Flow Statement', { margin: [20, 0, 10, 0] });
      doc.fontSize(9).font('Helvetica');
      
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      
      const cfData = [
        { label: 'Profit from Operations', value: '£0' },
        { label: 'Capital Expenditure', value: '£0' },
        { label: 'New Borrowing', value: '£0' },
        { label: 'NET CASH MOVEMENT', value: data['net-cf'] || '£0' }
      ];

      let cfY = doc.y + 10;
      cfData.forEach((item, i) => {
        const weight = item.label.includes('NET') ? 'Helvetica-Bold' : 'Helvetica';
        doc.font(weight).fontSize(9);
        doc.text(item.label, 60, cfY + (i * 16), { width: 300 });
        doc.text(item.value, 450, cfY + (i * 16), { width: 100, align: 'right' });
      });

      // Footer
      doc.fontSize(8).fillColor('#999999');
      doc.text(`Generated by UK Annual Accounts Filing System | ${new Date().toLocaleString()}`, {
        align: 'center',
        y: doc.page.height - 30
      });

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate a simple text invoice summary
 */
function generateTextReport(data) {
  const lines = [
    '═'.repeat(60),
    'UK ANNUAL ACCOUNTS FILING REPORT',
    '═'.repeat(60),
    '',
    'COMPANY INFORMATION:',
    `Company Name: ${data['co-name'] || 'N/A'}`,
    `CRN: ${data['co-crn'] || 'N/A'}`,
    `Type: ${data['co-type'] || 'N/A'}`,
    `Address: ${data['co-addr'] || 'N/A'}`,
    `FY End: ${data['fy-end'] || 'N/A'}`,
    '',
    'BALANCE SHEET:',
    `Total Assets: ${data['total-assets'] || '£0'}`,
    `Total Liabilities & Equity: ${data['total-liab'] || '£0'}`,
    '',
    'PROFIT & LOSS:',
    `Gross Profit: ${data['gross-profit'] || '£0'}`,
    `Operating Profit: ${data['op-profit'] || '£0'}`,
    `Net Profit: ${data['net-profit'] || '£0'}`,
    '',
    'CASH FLOW:',
    `Net Cash Movement: ${data['net-cf'] || '£0'}`,
    '',
    '═'.repeat(60),
    `Generated: ${new Date().toLocaleString()}`,
    '═'.repeat(60)
  ];

  return lines.join('\n');
}

module.exports = {
  generateFilingPDF,
  generateTextReport
};
