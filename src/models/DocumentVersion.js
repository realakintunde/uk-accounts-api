// Document Versioning Model
const { query } = require('../database/config');

class DocumentVersion {
  static async createVersion(documentId, companyId, content, createdBy, changeSummary) {
    // Get next version number
    const versionResult = await query(
      `SELECT MAX(version_number) as max_version FROM document_versions WHERE document_id = $1`,
      [documentId]
    );
    const nextVersion = (versionResult.rows[0]?.max_version || 0) + 1;

    const result = await query(
      `INSERT INTO document_versions (document_id, company_id, version_number, content, created_by, change_summary)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [documentId, companyId, nextVersion, JSON.stringify(content), createdBy, changeSummary]
    );
    return result.rows[0];
  }

  static async getDocumentVersions(documentId, limit = 50) {
    const result = await query(
      `SELECT dv.*, u.email as created_by_email FROM document_versions dv
       JOIN users u ON dv.created_by = u.id
       WHERE dv.document_id = $1
       ORDER BY dv.version_number DESC
       LIMIT $2`,
      [documentId, limit]
    );
    return result.rows;
  }

  static async getVersion(versionId) {
    const result = await query(
      `SELECT dv.*, u.email as created_by_email FROM document_versions dv
       JOIN users u ON dv.created_by = u.id
       WHERE dv.id = $1`,
      [versionId]
    );
    return result.rows[0];
  }

  static async updateVersionStatus(versionId, status) {
    const result = await query(
      `UPDATE document_versions SET status = $1 WHERE id = $2 RETURNING *`,
      [status, versionId]
    );
    return result.rows[0];
  }

  static async compareVersions(versionId1, versionId2) {
    const [v1, v2] = await Promise.all([
      this.getVersion(versionId1),
      this.getVersion(versionId2)
    ]);
    
    return {
      version1: v1,
      version2: v2,
      changes: this._diffObjects(JSON.parse(v1.content), JSON.parse(v2.content))
    };
  }

  static _diffObjects(obj1, obj2) {
    const changes = {};
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
    
    allKeys.forEach(key => {
      if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
        changes[key] = { from: obj1[key], to: obj2[key] };
      }
    });
    
    return changes;
  }
}

module.exports = DocumentVersion;
