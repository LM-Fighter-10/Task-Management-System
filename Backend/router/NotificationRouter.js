const { Router } = require("express");
const Controller = require("../controller/Notification");
const verifyToken = require("../controller/VerifyToken");
const router = Router();

// Routes for notification management
router.post("/addNotification", verifyToken(), Controller.addNotification); // Add a new notification
router.get("/getNotifications/:userId", verifyToken(), Controller.getNotificationsByUser); // Get all notifications for a user
router.get("/getNotification/:id", verifyToken(), Controller.getNotification); // Get a notification by ID
router.get("/getNotificationByType", verifyToken(), Controller.getNotificationByType); // Get a notification by type
router.put("/markAsRead/:id", verifyToken(), Controller.markAsRead); // Mark a notification as read
router.put("/markAsUnread/:id", verifyToken(), Controller.markAsUnread); // Mark a notification as unread
router.delete("/deleteNotification/:id", verifyToken(), Controller.deleteNotification); // Delete a notification
router.delete("/clearNotifications/:id", verifyToken(), Controller.clearNotifications); // Clear all notifications for a user

module.exports = router;
