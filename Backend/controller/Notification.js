const { Notification, User } = require("../db/Database");
const { v4: uuidv4 } = require("uuid");
const {convertStringToType} = require("../../env");
const { sendNotificationUpdate } = require("../socket"); // Import from socket.js

// Add a new notification
module.exports.addNotification = async (req, res, next) => {
    try {
        const { type, message, user } = req.body;

        if (!type || !message || !user) {
            return res.status(200).json({ error: "Type, message, and user are required" });
        }

        const sentUser = await User.findOne({ id: user });
        if (!sentUser) {
            return res.status(200).json({ error: "User not found" });
        }

        // check for type of notification is in the list
        if (!["info", "warning", "error", "success", "admin"].includes(type)) {
            return res.status(200).json({ error: "Invalid notification type" });
        }

        // check for message length
        if (message.length > 255) {
            return res.status(200).json({ error: "Message is too long" });
        }

        // Check for duplicate notifications
        const duplicateNotification = await Notification.findOne({ type, message, user: sentUser._id });
        if (duplicateNotification) {
            return res.status(200).json({ error: "Notification already exists" });
        }

        const notification = new Notification({
            id: uuidv4(),
            type,
            message,
            user: sentUser._id,
            isRead: false, // Default value
        });

        await notification.save();

        // remove _id and __v from the response
        notification._doc.user = user;
        delete notification._doc._id;
        delete notification._doc.__v;

        // Emit real-time notification via WebSocket
        sendNotificationUpdate(user, notification._doc);

        res.status(201).json({ message: "Notification added successfully", data: notification._doc });
    } catch (error) {
        res.status(200).json({ error: "Unexpected Error Occurred" });
        next(`ERROR IN: addNotification function => ${error}`);
    }
};

// Get all notifications for a user
module.exports.getNotificationsByUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10, read = null } = req.query;

        // Build the query object.
        let query = {};
        // If a read value is provided (and convertStringToType returns non-null), add it to the query.
        if (convertStringToType(read) !== null) {
            query.isRead = !(convertStringToType(read));
        }

        let sentUser;
        // For non-admins, only allow notifications for the authenticated user.
        if (req.user.role !== "admin") {
            sentUser = await User.findOne({ id: userId });
            if (!sentUser) {
                return res.status(200).json({ error: "User not found" });
            }
            // Make sure a non-admin can only access their own notifications.
            if (req.user.id !== userId) {
                return res.status(200).json({ error: "Unauthorized access" });
            }
            query.user = sentUser._id;
        }

        // For admin, the query remains as is (possibly with the isRead condition)
        // Now use Notification.paginate with the query.
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 }, // Newest notifications first.
            select: "-__v -_id -user", // Exclude these fields from the response.
        };

        const notifications = await Notification.paginate(query, options);

        return res.status(201).json({
            message: "Notifications retrieved successfully",
            data: notifications.docs,
            totalPages: notifications.totalPages,
            totalDocs: notifications.totalDocs,
            currentPage: notifications.page,
        });
    } catch (error) {
        res.status(200).json({error: "Unexpected Error Occurred"});
        next(`ERROR IN: getNotificationsByUser function => ${error}`);
    }
};

// Get a notification by ID
module.exports.getNotification = async (req, res, next) => {
    try {
        const {id} = req.params;

        const notification = await Notification.findOne({id}).select("-__v -_id").populate("user", "id");
        if (!notification) {
            return res.status(200).json({error: "Notification not found"});
        }

        notification._doc.user = notification._doc.user.id;

        res.status(201).json({message: "Notification retrieved successfully", data: notification._doc});
    } catch (error) {
        res.status(200).json({error: "Unexpected Error Occurred"});
        next(`ERROR IN: getNotification function => ${error}`);
    }
}

// Get notifications by type with pagination
module.exports.getNotificationByType = async (req, res, next) => {
    try {
        let { type, page = 1, limit = 10 } = req.query;

        type = convertStringToType(type);

        // Validate the type
        if (!type && req.user.role.toLowerCase() !== "admin") {
            return res.status(200).json({ error: "Notification type is required" });
        }

        // Pagination setup
        page = parseInt(page); limit = parseInt(limit);
        const skip = (page - 1) * limit;

        // Build the aggregation pipeline dynamically
        const pipeline = [];

        // Add $match stage only if type is provided
        if (type) {
            pipeline.push({ $match: { type } });
        }

        // Add $lookup to fetch user details
        pipeline.push(
            {
                $lookup: {
                    from: "users", // The User collection name
                    localField: "user",
                    foreignField: "_id",
                    as: "userDetails", // Join user details
                },
            },
            {
                $addFields: {
                    user: { $arrayElemAt: ["$userDetails.id", 0] }, // Map user's `id` into the `user` field
                },
            },
            { $project: { userDetails: 0, __v: 0, _id: 0 } }, // Exclude unnecessary fields
            { $skip: skip }, // Skip documents for pagination
            { $limit: limit } // Limit the number of documents
        );

        // Execute the aggregation pipeline
        const notifications = await Notification.aggregate(pipeline);

        // Get total count for pagination metadata
        const totalCount = await Notification.countDocuments(type ? { type } : {});

        // Check if any notifications were found
        if (!notifications.length) {
            return res.status(200).json({ error: "No notifications found" });
        }

        res.status(201).json({
            message: "Notifications retrieved successfully",
            data: notifications,
            totalDocs: totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
        });
    } catch (error) {
        res.status(200).json({ error: "Unexpected Error Occurred" });
        next(`ERROR IN: getNotificationByType function => ${error}`);
    }
};

// Mark a notification as read
module.exports.markAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findOne({ id });

        if (!notification) {
            return res.status(200).json({ error: "Notification not found" });
        }

        notification.isRead = true;
        await notification.save();

        res.status(201).json({ message: "Notification marked as read", data: notification });
    } catch (error) {
        res.status(200).json({ error: "Unexpected Error Occurred" });
        next(`ERROR IN: markAsRead function => ${error}`);
    }
};

// Mark a notification as unread
module.exports.markAsUnread = async (req, res, next) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findOne({ id });

        if (!notification) {
            return res.status(200).json({ error: "Notification not found" });
        }

        notification.isRead = false;
        await notification.save();

        res.status(201).json({ message: "Notification marked as read", data: notification });
    } catch (error) {
        res.status(200).json({ error: "Unexpected Error Occurred" });
        next(`ERROR IN: markAsRead function => ${error}`);
    }
};

// Delete a notification
module.exports.deleteNotification = async (req, res, next) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findOneAndDelete({ id });

        if (!notification) {
            return res.status(200).json({ error: "Notification not found" });
        }

        res.status(201).json({ message: "Notification deleted successfully" });
    } catch (error) {
        res.status(200).json({ error: "Unexpected Error Occurred" });
        next(`ERROR IN: deleteNotification function => ${error}`);
    }
};

// Clear all notifications for a user
module.exports.clearNotifications = async (req, res, next) => {
    try {
        const {id} = req.params;

        const sentUser = await User.findOne({id});
        if (!sentUser) {
            return res.status(200).json({error: "User not found"});
        }

        if (req.user.role !== "admin" && req.user.id !== id) {
            return res.status(200).json({error: "Unauthorized access"});
        }

        const clearedNotifications = await Notification.deleteMany({user: sentUser._id});
        if (!clearedNotifications.deletedCount) {
            return res.status(200).json({error: "No notifications found for this user"});
        }
        res.status(201).json({message: "Notifications cleared successfully"});
    } catch (error) {
        res.status(200).json({error: "Unexpected Error Occurred"});
        next(`ERROR IN: clearNotifications function => ${error}`);
    }
}
