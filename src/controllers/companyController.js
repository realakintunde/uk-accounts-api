const Company = require('../models/Company');
const FinancialStatement = require('../models/FinancialStatement');

exports.getAllCompanies = async (req, res, next) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const companies = await Company.findAll(
      parseInt(limit),
      parseInt(offset)
    );
    res.json({
      success: true,
      data: companies,
      count: companies.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.getCompanyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
      });
    }
    res.json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
};

exports.createCompany = async (req, res, next) => {
  try {
    const data = req.body;
    const newCompany = await Company.create(data);
    res.status(201).json({
      success: true,
      data: newCompany,
      message: 'Company created successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
      });
    }
    const updatedCompany = await Company.update(id, req.body);
    res.json({
      success: true,
      data: updatedCompany,
      message: 'Company updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
      });
    }
    await Company.delete(id);
    res.json({
      success: true,
      message: 'Company deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.getCompanyFinancialStatements = async (req, res, next) => {
  try {
    const { id } = req.params;
    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
      });
    }
    const { limit = 10, offset = 0 } = req.query;
    const statements = await FinancialStatement.findAll(
      id,
      parseInt(limit),
      parseInt(offset)
    );
    res.json({
      success: true,
      data: statements,
      count: statements.length,
    });
  } catch (error) {
    next(error);
  }
};
