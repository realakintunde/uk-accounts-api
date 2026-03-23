const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const UserManagement = require('../models/UserManagement');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

// USER MANAGEMENT ROUTES

// Get company members
router.get('/:companyId/members', authenticateToken, async (req, res) => {
  try {
    const members = await UserManagement.getCompanyMembers(req.params.companyId);
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add user to company
router.post('/:companyId/members', authenticateToken, async (req, res) => {
  try {
    const { userId, roleId } = req.body;
    const member = await UserManagement.addUserToCompany(
      req.params.companyId,
      userId,
      roleId,
      req.user.id
    );
    
    // Log audit
    await AuditLog.log(
      req.params.companyId,
      req.user.id,
      'user_added',
      'company_users',
      member.id,
      null,
      member,
      req.ip,
      req.get('user-agent')
    );

    // Send notification
    await Notification.create(
      userId,
      'user_added_to_company',
      'Added to Company',
      'You have been added to a company',
      req.params.companyId
    );

    res.json(member);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user role
router.put('/:companyId/members/:userId', authenticateToken, async (req, res) => {
  try {
    const { roleId } = req.body;
    const updated = await UserManagement.updateUserRole(
      req.params.companyId,
      req.params.userId,
      roleId
    );

    await AuditLog.log(
      req.params.companyId,
      req.user.id,
      'role_updated',
      'company_users',
      updated.id,
      { roleId: req.body.oldRoleId },
      updated,
      req.ip,
      req.get('user-agent')
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove user from company
router.delete('/:companyId/members/:userId', authenticateToken, async (req, res) => {
  try {
    await UserManagement.removeUserFromCompany(req.params.companyId, req.params.userId);

    await AuditLog.log(
      req.params.companyId,
      req.user.id,
      'user_removed',
      'company_users',
      null,
      { userId: req.params.userId },
      null,
      req.ip,
      req.get('user-agent')
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AUDIT LOG ROUTES

// Get audit logs
router.get('/:companyId/audit-logs', authenticateToken, async (req, res) => {
  try {
    const limit = req.query.limit || 100;
    const offset = req.query.offset || 0;
    const logs = await AuditLog.getCompanyAuditLogs(req.params.companyId, limit, offset);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get record history
router.get('/:companyId/audit-logs/record/:recordId', authenticateToken, async (req, res) => {
  try {
    const { tableName } = req.query;
    const history = await AuditLog.getRecordHistory(req.params.recordId, tableName);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// NOTIFICATION ROUTES

// Get user notifications
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    const limit = req.query.limit || 50;
    const notifications = await Notification.getUserNotifications(req.user.id, limit, unreadOnly);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread count
router.get('/notifications/unread/count', authenticateToken, async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.id);
    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.put('/notifications/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.markAsRead(req.params.notificationId);
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all as read
router.put('/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    await Notification.markAllAsRead(req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete notification
router.delete('/notifications/:notificationId', authenticateToken, async (req, res) => {
  try {
    await Notification.deleteNotification(req.params.notificationId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
