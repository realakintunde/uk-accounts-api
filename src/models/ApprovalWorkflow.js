// Approval Workflow Model
const { query } = require('../database/config');

class ApprovalWorkflow {
  static async createWorkflow(companyId, documentId, requestedBy, approverIds) {
    // Create workflow
    const workflowResult = await query(
      `INSERT INTO approval_workflows (company_id, document_id, requested_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [companyId, documentId, requestedBy]
    );
    const workflow = workflowResult.rows[0];

    // Add approval steps
    for (let i = 0; i < approverIds.length; i++) {
      await query(
        `INSERT INTO approval_steps (workflow_id, step_order, assigned_to)
         VALUES ($1, $2, $3)`,
        [workflow.id, i + 1, approverIds[i]]
      );
    }

    return workflow;
  }

  static async getWorkflow(workflowId) {
    const result = await query(
      `SELECT aw.*, u.email as requested_by_email FROM approval_workflows aw
       JOIN users u ON aw.requested_by = u.id
       WHERE aw.id = $1`,
      [workflowId]
    );
    return result.rows[0];
  }

  static async getWorkflowSteps(workflowId) {
    const result = await query(
      `SELECT ast.*, u.email FROM approval_steps ast
       JOIN users u ON ast.assigned_to = u.id
       WHERE ast.workflow_id = $1
       ORDER BY ast.step_order`,
      [workflowId]
    );
    return result.rows;
  }

  static async approveStep(stepId, comment) {
    const result = await query(
      `UPDATE approval_steps SET status = 'approved', approver_comment = $1, completed_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [comment, stepId]
    );
    
    const step = result.rows[0];
    
    // Check if all steps approved
    const workflowResult = await query(
      `SELECT workflow_id FROM approval_steps WHERE workflow_id = (
         SELECT workflow_id FROM approval_steps WHERE id = $1
       ) AND status != 'approved' AND status != 'skipped'`,
      [stepId]
    );
    
    if (workflowResult.rows.length === 0) {
      await query(
        `UPDATE approval_workflows SET status = 'approved', completed_at = NOW()
         WHERE id = (SELECT workflow_id FROM approval_steps WHERE id = $1)`,
        [stepId]
      );
    }

    return step;
  }

  static async rejectStep(stepId, comment) {
    const result = await query(
      `UPDATE approval_steps SET status = 'rejected', approver_comment = $1, completed_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [comment, stepId]
    );

    // Mark workflow as rejected
    await query(
      `UPDATE approval_workflows SET status = 'rejected', completed_at = NOW()
       WHERE id = (SELECT workflow_id FROM approval_steps WHERE id = $1)`,
      [stepId]
    );

    return result.rows[0];
  }

  static async getPendingApprovals(userId) {
    const result = await query(
      `SELECT ast.*, aw.document_id, d.description FROM approval_steps ast
       JOIN approval_workflows aw ON ast.workflow_id = aw.id
       JOIN documents d ON aw.document_id = d.id
       WHERE ast.assigned_to = $1 AND ast.status = 'pending'
       ORDER BY ast.created_at DESC`,
      [userId]
    );
    return result.rows;
  }
}

module.exports = ApprovalWorkflow;
