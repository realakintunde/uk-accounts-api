// User Management Model
const { query } = require('../database/config');

class UserManagement {
  // Add user to company with role
  static async addUserToCompany(companyId, userId, roleId, invitedBy) {
    const result = await query(
      `INSERT INTO company_users (company_id, user_id, role_id, invited_by, status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING *`,
      [companyId, userId, roleId, invitedBy]
    );
    return result.rows[0];
  }

  // Get company members
  static async getCompanyMembers(companyId) {
    const result = await query(
      `SELECT u.id, u.email, u.name, r.name as role, cu.status, cu.created_at
       FROM company_users cu
       JOIN users u ON cu.user_id = u.id
       JOIN roles r ON cu.role_id = r.id
       WHERE cu.company_id = $1
       ORDER BY cu.created_at DESC`,
      [companyId]
    );
    return result.rows;
  }

  // Update user role
  static async updateUserRole(companyId, userId, roleId) {
    const result = await query(
      `UPDATE company_users SET role_id = $1
       WHERE company_id = $2 AND user_id = $3
       RETURNING *`,
      [roleId, companyId, userId]
    );
    return result.rows[0];
  }

  // Get user's companies
  static async getUserCompanies(userId) {
    const result = await query(
      `SELECT c.*, r.name as role FROM companies c
       JOIN company_users cu ON c.id = cu.company_id
       JOIN roles r ON cu.role_id = r.id
       WHERE cu.user_id = $1 AND cu.status = 'active'`,
      [userId]
    );
    return result.rows;
  }

  // Check user role in company
  static async getUserRole(companyId, userId) {
    const result = await query(
      `SELECT r.name FROM company_users cu
       JOIN roles r ON cu.role_id = r.id
       WHERE cu.company_id = $1 AND cu.user_id = $2`,
      [companyId, userId]
    );
    return result.rows[0]?.name;
  }

  // Remove user from company
  static async removeUserFromCompany(companyId, userId) {
    await query(
      `DELETE FROM company_users WHERE company_id = $1 AND user_id = $2`,
      [companyId, userId]
    );
  }
}

module.exports = UserManagement;
