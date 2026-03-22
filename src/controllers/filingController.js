const Filing = require('../models/Filing');
const Company = require('../models/Company');

exports.getFilings = async (req, res, next) => {
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

    const filings = await Filing.findAll(
      companyId,
      parseInt(limit),
      parseInt(offset)
    );
    res.json({
      success: true,
      data: filings,
      count: filings.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.getFilingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const filing = await Filing.findById(id);
    if (!filing) {
      return res.status(404).json({
        success: false,
        error: 'Filing not found',
      });
    }
    res.json({ success: true, data: filing });
  } catch (error) {
    next(error);
  }
};

exports.createFiling = async (req, res, next) => {
  try {
    const data = req.body;

    const company = await Company.findById(data.company_id);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
      });
    }

    const newFiling = await Filing.create(data);
    res.status(201).json({
      success: true,
      data: newFiling,
      message: 'Filing created successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.updateFiling = async (req, res, next) => {
  try {
    const { id } = req.params;
    const filing = await Filing.findById(id);
    if (!filing) {
      return res.status(404).json({
        success: false,
        error: 'Filing not found',
      });
    }

    const updatedFiling = await Filing.update(id, req.body);
    res.json({
      success: true,
      data: updatedFiling,
      message: 'Filing updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteFiling = async (req, res, next) => {
  try {
    const { id } = req.params;
    const filing = await Filing.findById(id);
    if (!filing) {
      return res.status(404).json({
        success: false,
        error: 'Filing not found',
      });
    }

    await Filing.delete(id);
    res.json({
      success: true,
      message: 'Filing deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
