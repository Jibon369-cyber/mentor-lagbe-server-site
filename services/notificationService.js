import { notifications, users } from "../config/db.js";

/**
 * Creates a notification in the database.
 * @param {Object} notification - Notification data
 * @param {string} notification.recipientId - The user ID who should receive this notification
 * @param {string} notification.recipientRole - 'admin' | 'tutor' | 'student'
 * @param {string} notification.title - Notification title
 * @param {string} notification.message - Notification message
 * @param {string} notification.actionUrl - Clickable URL to navigate to
 * @param {string} notification.referenceId - Optional ID of related tuition/application/user
 * @param {string} notification.referenceType - Optional type: 'tuition' | 'application' | 'user'
 * @returns {Promise<InsertOneResult>}
 */
export async function createNotification(notification) {
  const notificationDoc = {
    ...notification,
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return notifications.insertOne(notificationDoc);
}

/**
 * Creates notifications for all admins
 */
export async function notifyAdmins(notification) {
  const adminUsers = await users.find({ role: "admin" }).toArray();

  const promises = adminUsers.map((admin) =>
    createNotification({
      ...notification,
      recipientId: admin._id.toString(),
    }),
  );

  return Promise.all(promises);
}

export default { createNotification, notifyAdmins };