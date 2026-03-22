// Audit Log Model
const { query } = require('../database/config');

class AuditLog {
  static async log(companyId, userId, action, tableName, recordId, oldValues, newValues, ipAddress, userAgent) {
    const result = await query(
      `INSERT INTO audit_logs (company_id, user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [companyId, userId, action, tableName, recordId, JSON.stringify(oldValues), JSON.stringify(newValues), ipAddress, userAgent]
    );
    return result.rows[0];
  }

  static async getCompanyAuditLogs(companyId, limit = 100, offset = 0) {
    const result = await query(
      `SELECT al.*, u.email as user_email FROM audit_logs al
       JOIN users u ON al.user_id = u.id
       WHERE al.company_id = $1
       ORDER BY al.created_at DESC
       LIMIT $2 OFFSET $3`,
      [companyId, limit, offset]
    );
    return result.rows;
  }

  static async getAuditLog(logId) {
    const result = await query(
      `SELECT * FROM audit_logs WHERE id = $1`,
      [logId]
    );
    return result.rows[0];
  }

  static async getRecordHistory(recordId, tableName) {
    const result = await query(
      `SELECT * FROM audit_logs
       WHERE record_id = $1 AND table_name = $2
       ORDER BY created_at DESC`,
      [recordId, tableName]
    );
    return result.rows;
  }
}

module.exports = AuditLog;
