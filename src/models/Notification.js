// Notification Model
const { query } = require('../database/config');

class Notification {
  static async create(userId, type, title, message, relatedId = null, companyId = null) {
    const result = await query(
      `INSERT INTO notifications (user_id, company_id, type, title, message, related_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, companyId, type, title, message, relatedId]
    );
    return result.rows[0];
  }

  static async getUserNotifications(userId, limit = 50, unreadOnly = false) {
    let sql = `SELECT * FROM notifications WHERE user_id = $1`;
    const params = [userId];
    
    if (unreadOnly) {
      sql += ` AND is_read = FALSE`;
    }
    
    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(sql, params);
    return result.rows;
  }

  static async markAsRead(notificationId) {
    const result = await query(
      `UPDATE notifications SET is_read = TRUE, read_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [notificationId]
    );
    return result.rows[0];
  }

  static async markAllAsRead(userId) {
    await query(
      `UPDATE notifications SET is_read = TRUE, read_at = NOW()
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );
  }

  static async getUnreadCount(userId) {
    const result = await query(
      `SELECT COUNT(*) as count FROM notifications
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );
    return result.rows[0].count;
  }

  static async deleteNotification(notificationId) {
    await query(
      `DELETE FROM notifications WHERE id = $1`,
      [notificationId]
    );
  }

  static async deleteOldNotifications(daysOld = 30) {
    await query(
      `DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '${daysOld} days'`
    );
  }
}

module.exports = Notification;
