const Document = require('../models/Document');
const Company = require('../models/Company');

exports.getDocuments = async (req, res, next) => {
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

    const documents = await Document.findAll(
      companyId,
      parseInt(limit),
      parseInt(offset)
    );
    res.json({
      success: true,
      data: documents,
      count: documents.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
      });
    }
    res.json({ success: true, data: document });
  } catch (error) {
    next(error);
  }
};

exports.uploadDocument = async (req, res, next) => {
  try {
    const data = req.body;

    const company = await Company.findById(data.company_id);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
      });
    }

    const newDocument = await Document.create(data);
    res.status(201).json({
      success: true,
      data: newDocument,
      message: 'Document uploaded successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
      });
    }

    await Document.delete(id);
    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
