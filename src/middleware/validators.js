const validateCompany = (req, res, next) => {
  const { company_name, company_number } = req.body;

  if (!company_name || !company_number) {
    return res.status(400).json({
      success: false,
      error: 'Company name and number are required',
    });
  }

  if (!/^\d{8}$/.test(company_number)) {
    return res.status(400).json({
      success: false,
      error: 'Company number must be 8 digits',
    });
  }

  next();
};

const validateStatement = (req, res, next) => {
  const { company_id, statement_type, period_end_date } = req.body;

  if (!company_id || !statement_type || !period_end_date) {
    return res.status(400).json({
      success: false,
      error:
        'Company ID, statement type, and period end date are required',
    });
  }

  next();
};

module.exports = {
  validateCompany,
  validateStatement,
};
