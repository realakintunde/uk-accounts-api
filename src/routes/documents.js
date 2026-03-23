const express = require('express');
const {
  getDocuments,
  getDocumentById,
  uploadDocument,
  deleteDocument,
} = require('../controllers/documentController');
const { authenticateToken } = require('../middleware/auth');
const DocumentVersion = require('../models/DocumentVersion');
const ApprovalWorkflow = require('../models/ApprovalWorkflow');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

const router = express.Router();

// Basic CRUD operations
router.get('/', getDocuments);
router.get('/:id', getDocumentById);
router.post('/', authenticateToken, uploadDocument);
router.delete('/:id', authenticateToken, deleteDocument);

// DOCUMENT VERSIONING

// Create document version
router.post('/:documentId/versions', authenticateToken, async (req, res) => {
  try {
    const { content, changeSummary, companyId } = req.body;
    const version = await DocumentVersion.createVersion(
      req.params.documentId,
      companyId,
      content,
      req.user.id,
      changeSummary
    );

    await AuditLog.log(
      companyId,
      req.user.id,
      'document_versioned',
      'document_versions',
      version.id,
      null,
      version,
      req.ip,
      req.get('user-agent')
    );

    res.json(version);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get document versions
router.get('/:documentId/versions', authenticateToken, async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const versions = await DocumentVersion.getDocumentVersions(req.params.documentId, limit);
    res.json(versions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific version
router.get('/versions/:versionId', authenticateToken, async (req, res) => {
  try {
    const version = await DocumentVersion.getVersion(req.params.versionId);
    res.json(version);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compare versions
router.get('/:documentId/versions/compare', authenticateToken, async (req, res) => {
  try {
    const { fromVersionId, toVersionId } = req.query;
    const comparison = await DocumentVersion.compareVersions(fromVersionId, toVersionId);
    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add document comment
router.post('/:documentId/comments', authenticateToken, async (req, res) => {
  try {
    const { comment, versionId, companyId } = req.body;
    const { query } = require('../database/config');
    
    const result = await query(
      `INSERT INTO document_comments (document_id, version_id, user_id, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.params.documentId, versionId, req.user.id, comment]
    );

    await AuditLog.log(
      companyId,
      req.user.id,
      'comment_added',
      'document_comments',
      result.rows[0].id,
      null,
      result.rows[0],
      req.ip,
      req.get('user-agent')
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get document comments
router.get('/:documentId/comments', authenticateToken, async (req, res) => {
  try {
    const { query } = require('../database/config');
    const result = await query(
      `SELECT dc.*, u.email as user_email FROM document_comments dc
       JOIN users u ON dc.user_id = u.id
       WHERE dc.document_id = $1
       ORDER BY dc.created_at DESC`,
      [req.params.documentId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// APPROVAL WORKFLOWS

// Create approval workflow
router.post('/:companyId/approvals', authenticateToken, async (req, res) => {
  try {
    const { documentId, approverIds } = req.body;
    const workflow = await ApprovalWorkflow.createWorkflow(
      req.params.companyId,
      documentId,
      req.user.id,
      approverIds
    );

    // Send notifications to approvers
    for (const approverId of approverIds) {
      await Notification.create(
        approverId,
        'approval_requested',
        'Document Approval Requested',
        'A document requires your approval',
        workflow.id,
        req.params.companyId
      );
    }

    await AuditLog.log(
      req.params.companyId,
      req.user.id,
      'approval_workflow_created',
      'approval_workflows',
      workflow.id,
      null,
      workflow,
      req.ip,
      req.get('user-agent')
    );

    res.json(workflow);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get workflow
router.get('/:companyId/approvals/:workflowId', authenticateToken, async (req, res) => {
  try {
    const workflow = await ApprovalWorkflow.getWorkflow(req.params.workflowId);
    const steps = await ApprovalWorkflow.getWorkflowSteps(req.params.workflowId);
    
    res.json({
      ...workflow,
      steps
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve step
router.put('/:companyId/approvals/:workflowId/steps/:stepId/approve', authenticateToken, async (req, res) => {
  try {
    const { comment } = req.body;
    const step = await ApprovalWorkflow.approveStep(req.params.stepId, comment);

    await AuditLog.log(
      req.params.companyId,
      req.user.id,
      'approval_step_approved',
      'approval_steps',
      step.id,
      { status: 'pending' },
      step,
      req.ip,
      req.get('user-agent')
    );

    res.json(step);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject step
router.put('/:companyId/approvals/:workflowId/steps/:stepId/reject', authenticateToken, async (req, res) => {
  try {
    const { comment } = req.body;
    const step = await ApprovalWorkflow.rejectStep(req.params.stepId, comment);

    await AuditLog.log(
      req.params.companyId,
      req.user.id,
      'approval_step_rejected',
      'approval_steps',
      step.id,
      { status: 'pending' },
      step,
      req.ip,
      req.get('user-agent')
    );

    res.json(step);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending approvals
router.get('/approvals/pending', authenticateToken, async (req, res) => {
  try {
    const pending = await ApprovalWorkflow.getPendingApprovals(req.user.id);
    res.json(pending);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
