const FinancialStatement = require('../models/FinancialStatement');
const Company = require('../models/Company');

exports.getStatements = async (req, res, next) => {
  try {
    const { companyId } = req.query;
    const { limit = 10, offset = 0 } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: 'Company ID is required',
      });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
      });
    }

    const statements = await FinancialStatement.findAll(
      companyId,
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

exports.getStatementById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const statement = await FinancialStatement.findById(id);
    if (!statement) {
      return res.status(404).json({
        success: false,
        error: 'Financial statement not found',
      });
    }
    res.json({ success: true, data: statement });
  } catch (error) {
    next(error);
  }
};

exports.createStatement = async (req, res, next) => {
  try {
    const data = req.body;
    const company = await Company.findById(data.company_id);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
      });
    }

    const newStatement = await FinancialStatement.create(data);
    res.status(201).json({
      success: true,
      data: newStatement,
      message: 'Financial statement created successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.updateStatement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const statement = await FinancialStatement.findById(id);
    if (!statement) {
      return res.status(404).json({
        success: false,
        error: 'Financial statement not found',
      });
    }

    const updatedStatement = await FinancialStatement.update(id, req.body);
    res.json({
      success: true,
      data: updatedStatement,
      message: 'Financial statement updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteStatement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const statement = await FinancialStatement.findById(id);
    if (!statement) {
      return res.status(404).json({
        success: false,
        error: 'Financial statement not found',
      });
    }

    await FinancialStatement.delete(id);
    res.json({
      success: true,
      message: 'Financial statement deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
