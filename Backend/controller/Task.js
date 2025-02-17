const { Task, Project, User, Comment, Notification } = require("../db/Database");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const { convertStringToType, Secret_Key} = require("../../env");
const jwt = require("jsonwebtoken");
const { sendNotificationUpdate } = require("../socket"); // Import sendNotificationUpdate function

// Helper function to remove extra attributes from the task object
const removeExtraAttr = async (taskId) => {
    let task = await Task.aggregate([
        { $match: { id: taskId } }, // Match the task by UUID
        {
            $lookup: {
                from: "projects",
                localField: "project",
                foreignField: "_id",
                as: "project",
            },
        },
        { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } }, // Ensure `project` is an object

        // Lookup for project.createdBy (convert ObjectId to UUID)
        {
            $lookup: {
                from: "users",
                localField: "project.createdBy",
                foreignField: "_id",
                as: "projectCreator",
            },
        },
        { $unwind: { path: "$projectCreator", preserveNullAndEmptyArrays: true } },

        {
            $lookup: {
                from: "users",
                localField: "assignedTo",
                foreignField: "_id",
                as: "assignedTo",
            },
        },
        { $unwind: { path: "$assignedTo", preserveNullAndEmptyArrays: true } },

        {
            $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdBy",
            },
        },
        { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },

        // Lookup for project.teamMembers
        {
            $lookup: {
                from: "users",
                localField: "project.teamMembers",
                foreignField: "_id",
                as: "project.teamMembers",
            },
        },

        {
            $lookup: {
                from: "comments",
                localField: "comments",
                foreignField: "_id",
                as: "comments",
            }
        },

        {
            $addFields: {
                comments: { $map: { input: "$comments", as: "comment", in: "$$comment.id" } },
                "project.teamMembers": { $map: { input: "$project.teamMembers", as: "member", in: "$$member.id" } }, // Convert teamMembers to list of UUIDs
                "project.createdBy": "$projectCreator.id" // Replace ObjectId with UUID
            }
        },

        {
            $unset: [
                "_id", "__v",
                "project._id", "project.__v", "projectCreator",
                "assignedTo._id", "assignedTo.__v", "assignedTo.password", "assignedTo.resetPasswordToken", "assignedTo.resetPasswordExpires",
                "createdBy._id", "createdBy.__v", "createdBy.password", "createdBy.resetPasswordToken", "createdBy.resetPasswordExpires"
            ]
        }
    ]);

    return task.length ? task[0] : null;
};

// Helper function to fetch tasks based on a filter (assignedTo or createdBy)
const getFilteredTasks = async (filterField, userId, page, limit, search = null, priority = null) => {
    // Convert user UUID to ObjectId
    const currentUser = await User.findOne({ id: userId });
    if (!currentUser) {
        return { error: "User not found" };
    }

    let query = {};
    // Query based on the filter field (assignedTo or createdBy)
    if (filterField !== "assignedOrCreated"){
        query = { [filterField]: currentUser._id };
    } else {
        if (currentUser.role === "admin") {
            query = {};
        } else {
            // Query for tasks assigned to or created by the user and has no project
            query = {
                $or: [
                    { assignedTo: currentUser._id },
                    { createdBy: currentUser._id }
                ],
                project: null
            };
        }
        if (search) {
            query = {
                $and: [
                    query,
                    { title: { $regex: search, $options: "i" } }
                ]
            }
        }
        if (priority) {
            query = {
                $and: [
                    query,
                    { priority: priority }
                ]
            }
        }
    }

    // Fetch tasks using aggregation pipeline
    const tasks = await Task.aggregate([
        { $match: query }, // Filter by assigned user or creator

        // Lookup project details
        {
            $lookup: {
                from: "projects",
                localField: "project",
                foreignField: "_id",
                as: "project",
            },
        },
        { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } },

        // Lookup project.teamMembers (convert ObjectIds to UUIDs)
        {
            $lookup: {
                from: "users",
                localField: "project.teamMembers",
                foreignField: "_id",
                as: "project.teamMembers",
            },
        },
        {
            $addFields: {
                "project.teamMembers": {
                    $map: { input: "$project.teamMembers", as: "member", in: "$$member.id" }
                },
            }
        },

        // Lookup project.createdBy (convert ObjectId to UUID)
        {
            $lookup: {
                from: "users",
                localField: "project.createdBy",
                foreignField: "_id",
                as: "projectCreator",
            },
        },
        { $unwind: { path: "$projectCreator", preserveNullAndEmptyArrays: true } },
        {
            $addFields: {
                "project.createdBy": "$projectCreator.id",
            }
        },

        {
            $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdBy",
            },
        },
        { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },

        {
            $addFields: {
                "createdBy": "$createdBy.id",
            }
        },

        {
            $lookup: {
                from: "users",
                localField: "assignedTo",
                foreignField: "_id",
                as: "assignedTo",
            },
        },
        { $unwind: { path: "$assignedTo", preserveNullAndEmptyArrays: true } },

        {
            $addFields: {
                "assignedTo": "$assignedTo.id",
            }
        },

        // Lookup comments (convert ObjectIds to UUIDs)
        {
            $lookup: {
                from: "comments",
                localField: "comments",
                foreignField: "_id",
                as: "comments",
            }
        },
        {
            $addFields: {
                comments: { $map: { input: "$comments", as: "comment", in: "$$comment.id" } },
            }
        },
        {
            $unset: [
                "_id", "__v", filterField, // Remove the main field
                "project._id", "project.__v", "projectCreator"
            ]
        },

        { $sort: { createdAt: -1 } },
        { $skip: (parseInt(page) - 1) * limit },
        { $limit: limit }
    ]);

    // Get total count of tasks
    const totalDocs = await Task.countDocuments(query);
    const totalPages = Math.ceil(totalDocs / limit);

    return { tasks, totalDocs, totalPages };
};

// Add a new task
module.exports.addTask = async (req, res, next) => {
    try {
        let { title, description, status, priority, dueDate, assignedTo, createdBy, project } = req.body;

        // Validate input
        if (!title || !createdBy) {
            return res.status(200).json({ error: "Title and createdBy are required" });
        }

        if (!project) {
            project = null;
        }

        const id = uuidv4();

        // Check if the project exists
        let projectExists = null, currentProject = null, assignedToUser = null;
        if (project) {
            currentProject = await Project.findOne({ id: project });
            if (!currentProject) {
                return res.status(200).json({ error: "Project not found" });
            }
            projectExists = currentProject._id;
        }

        if (assignedTo && assignedTo !== createdBy) {
            // Convert the assigned user ID to an ObjectId
            assignedToUser = await User.findOne({ id: assignedTo });
            if (!assignedToUser) {
                return res.status(200).json({ error: "Assigned user not found" });
            }
            assignedTo = assignedToUser._id;
            // Create Notification for the assigned user
            const notification = new Notification({
                id: uuidv4(),
                message: `You have been assigned to a task (${title})`,
                type: "info",
                user: assignedToUser._id,
            });
            await notification.save();
            // Emit real-time notification
            sendNotificationUpdate(assignedToUser.id, {
                message: `You have been assigned to a task (${title})`,
                task: title,
                userId: assignedToUser.id,
            });
        } else {
            assignedTo = createdBy;
        }

        // Convert the created user ID to an ObjectId
        let createdByUser = await User.findOne({ id: createdBy });
        if (!createdByUser) {
            return res.status(200).json({ error: "Created user not found" });
        }
        if (assignedTo === createdBy) {
            assignedTo = createdByUser._id;
        }
        createdBy = createdByUser._id;


        let task = new Task({
            id,
            title,
            description: description || null,
            status: status || "pending",
            priority: priority || "medium",
            dueDate : dueDate || null,
            project: projectExists,
            assignedTo,
            createdBy,
        });

        await task.save();

        task = await removeExtraAttr(task.id);

        res.status(201).json({ message: `Task (${task.title}) added successfully`, data: task });
    } catch (error) {
        res.status(200).json({ error: "Unexpected Error Occurred" });
        next(`ERROR IN: addTask function => ${error}`);
    }
};

// Get a task by ID
module.exports.getTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        let task = await Task.findOne({ id });

        if (!task) {
            return res.status(200).json({ error: "Task not found" });
        }

        task = await removeExtraAttr(task.id);

        res.status(201).json({ data: task });
    } catch (error) {
        res.status(200).json({ error: "Unexpected Error Occurred" });
        next(`ERROR IN: getTask function => ${error}`);
    }
};

// Update a task
module.exports.updateTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updatedTask = req.body;

        let task = await Task.findOne({ id });
        if (!task) {
            return res.status(200).json({ error: "Task not found" });
        }

        if (updatedTask.assignedTo) {
            let assignedToUser = await User.findOne({ id: updatedTask.assignedTo });
            const oldAssignedToUser = await User.findOne({ _id: task.assignedTo });
            if (!assignedToUser) {
                return res.status(200).json({ error: "Assigned user not found" });
            }

            if (updatedTask.assignedTo !== oldAssignedToUser.id) {
                // Create Notification for the assigned user
                const notification = new Notification({
                    id: uuidv4(),
                    message: `You have been assigned to a task (${task.title})`,
                    type: "info",
                    user: assignedToUser._id,
                });
                await notification.save();
                // Emit real-time notification
                sendNotificationUpdate(assignedToUser.id, {
                    message: `You have been assigned to a task (${task.title})`,
                    task: task.title,
                    userId: assignedToUser.id,
                });
            }

            if (oldAssignedToUser.id !== assignedToUser.id) {
                // Create Notification for the unassigned user
                const notification2 = new Notification({
                    id: uuidv4(),
                    message: `You have been unassigned from a task (${task.title})`,
                    type: "info",
                    user: task.assignedTo,
                });
                await notification2.save();

                // Emit real-time notification
                sendNotificationUpdate(oldAssignedToUser.id, {
                    message: `You have been unassigned from a task (${task.title})`,
                    task: task.title,
                    userId: oldAssignedToUser.id,
                });
            }
            task.assignedTo = assignedToUser._id;
            task.status = "in-progress";
        } else if (updatedTask.assignedTo === null && task.assignedTo) {
            let assignedToUser = await User.findOne({ id: task.assignedTo });
            // Create Notification for the unassigned user
            const notification = new Notification({
                id: uuidv4(),
                message: `You have been unassigned from a task (${task.title})`,
                type: "info",
                user: assignedToUser._id,
            });
            await notification.save();
            // Emit real-time notification
            sendNotificationUpdate(assignedToUser.id, {
                message: `You have been unassigned from a task (${task.title})`,
                task: task.title,
                userId: assignedToUser.id,
            });
            task.assignedTo = undefined;
            task.status = "pending";
        }

        if (updatedTask.project === null && task.project) {
            task.project = undefined;
        } else if (updatedTask.project?.id) {
            let project = await Project.findOne({ id: updatedTask.project.id });
            if (!project) {
                return res.status(200).json({ error: "Project not found" });
            }
            task.project = project._id;
        }

        if (updatedTask.title) task.title = updatedTask.title;
        if (updatedTask.description) task.description = updatedTask.description;
        if (updatedTask.status) task.status = updatedTask.status;
        if (updatedTask.priority) task.priority = updatedTask.priority;
        if (updatedTask.dueDate) task.dueDate = updatedTask.dueDate;
        if (updatedTask.comments === null || updatedTask.comments === []) task.comments = [];

        task.updatedAt = Date.now();
        await task.save();
        task = await removeExtraAttr(task.id);

        res.status(201).json({ message: `Task (${task.title}) updated successfully`, data: task });
    } catch (error) {
        res.status(200).json({ error: "Unexpected Error Occurred" });
        next(`ERROR IN: updateTask function => ${error}`);
    }
};

// Delete a task
module.exports.deleteTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        const task = await Task.findOneAndDelete({ id });

        if (!task) {
            return res.status(200).json({ message: "Task not found" });
        }

        res.status(201).json({ message: `Task (${task.title}) deleted successfully` });
    } catch (error) {
        res.status(200).json({ error: "Unexpected Error Occurred" });
        next(`ERROR IN: deleteTask function => ${error}`);
    }
};

// List all tasks for a project (or all tasks for admin) with pagination
module.exports.getTasksByProject = async (req, res, next) => {
    try {
        let { projectId } = req.params; // Project ID from URL params (optional)
        const { page = 1, limit = 10 } = req.query; // Pagination options

        // Convert projectId if needed (remove if not needed)
        projectId = convertStringToType ? convertStringToType(projectId) : projectId;

        // If projectId is not provided and the user is not an admin, return an error.
        if (!projectId && req.user.role !== "admin") {
            return res.status(200).json({ error: "Project ID is required" });
        }

        // Build the query object.
        const query = {};
        if (projectId) {
            // Get the ObjectId of the project from the provided v4 id.
            const project = await Project.findOne({ id: projectId }).select("_id").lean();
            if (!project) {
                return res.status(200).json({ error: "Project not found" });
            }
            query.project = project._id;
        }

        // Set up pagination and population options.
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { updatedAt: -1 }, // Newest tasks first.
            populate: [
                {
                    path: "assignedTo",
                    select: "id name -_id",
                },
                {
                    path: "createdBy",
                    select: "id name -_id",
                },
                {
                    path: "comments",
                    select: "id content -_id",  // <-- This ensures each task's comments return only id and content.
                },
            ],
            select: "-_id -project", // Exclude the internal _id and project fields.
        };

        // Use Task.paginate (assuming you have set up mongoose-paginate-v2)
        const tasks = await Task.paginate(query, options);

        res.status(201).json({
            message: "Tasks retrieved successfully",
            data: tasks.docs,
            totalDocs: tasks.totalDocs,
            totalPages: tasks.totalPages,
            currentPage: tasks.page,
        });
    } catch (error) {
        next(`ERROR IN: getTasksByProject function => ${error}`);
        res.status(200).json({ error: "Unexpected Error Occurred" });
    }
};

// Middleware for getting tasks assigned to a user
module.exports.getTasksAssignedToUser = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        let { id: userId } = req.params;

        userId = convertStringToType(userId);

        const result = await getFilteredTasks("assignedTo", userId, page, limit);
        if (result.error) {
            return res.status(200).json({ error: result.error });
        }

        if (!result.tasks.length) {
            return res.status(200).json({ error: "No tasks found assigned to the user" });
        }

        res.status(201).json({
            message: "Tasks retrieved successfully",
            data: result.tasks,
            totalDocs: result.totalDocs,
            totalPages: result.totalPages,
            currentPage: parseInt(page),
        });
    } catch (error) {
        res.status(200).json({ error: "Unexpected Error Occurred" });
        next(`ERROR IN: getTasksAssignedToUser function => ${error}`);
    }
};

// Middleware for getting tasks assigned or created by a user and has no project
module.exports.getTasksAssignedOrCreatedByUser = async (req, res, next) => {
    try {
        let { page = 1, limit = 10, search = null, priority = null } = req.query;
        page = parseInt(page); limit = parseInt(limit);
        search = convertStringToType(search); priority = convertStringToType(priority);
        let { id: userId } = req.params;

        userId = convertStringToType(userId);

        const result = await getFilteredTasks("assignedOrCreated", userId, page, limit, search, priority);
        if (result.error) {
            return res.status(200).json({ error: result.error });
        }

        res.status(201).json({
            message: "Tasks retrieved successfully",
            data: result.tasks,
            totalDocs: result.totalDocs,
            totalPages: result.totalPages,
            currentPage: parseInt(page),
        });
    } catch (error) {
        res.status(200).json({ error: "Unexpected Error Occurred" });
        next(`ERROR IN: getTasksAssignedToUser function => ${error}`);
    }
}

// Middleware for getting tasks created by a user
module.exports.getTasksCreatedByUser = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        let { id: userId } = req.params;

        userId = convertStringToType(userId);

        const result = await getFilteredTasks("createdBy", userId, page, limit);
        if (result.error) {
            return res.status(200).json({ error: result.error });
        }

        if (!result.tasks.length) {
            return res.status(200).json({ error: "No tasks found created by the user" });
        }

        res.status(201).json({
            message: "Tasks retrieved successfully",
            data: result.tasks,
            totalDocs: result.totalDocs,
            totalPages: result.totalPages,
            currentPage: parseInt(page),
        });
    } catch (error) {
        res.status(200).json({ error: "Unexpected Error Occurred" });
        next(`ERROR IN: getTasksCreatedByUser function => ${error}`);
    }
};

// Comment section
// Add a comment to a task
module.exports.addCommentToTask = async (req, res, next) => {
    try {
        const { id: taskId } = req.params; // Task ID from URL params
        const { content, author: authId } = req.body;

        const author = await User.findOne({ id: authId });

        // Validate input
        if (!content || !author) {
            return res.status(200).json({ error: "Content and author are required" });
        }

        if (author.id !== req.user.id) {
            return res.status(200).json({ error: "You are not allowed to add a comment" });
        }

        // Check if task exists
        const task = await Task.findOne({ id: taskId });
        if (!task) {
            return res.status(200).json({ error: "Task not found" });
        }

        const comment = new Comment({
            id: uuidv4(),
            content,
            task: task._id,
            author: author._id,
        });

        await comment.save();

        // Add the comment to the task's comment list
        task.comments.push(comment._id);
        await task.save();

        // remove _id and __v from the response and any object id
        comment._doc.author = author.id;
        comment._doc.task = task.id;
        delete comment._doc._id;
        delete comment._doc.__v;

        res.status(201).json({ message: "Comment added successfully", data: comment });
    } catch (error) {
        res.status(200).json({ error: "Unexpected Error Occurred" });
        next(`ERROR IN: addCommentToTask function => ${error}`);
    }
};

// Get all comments for a task
module.exports.getCommentsForTask = async (req, res, next) => {
    try {
        const { id: taskId } = req.params; // Task ID from URL params
        const { page = 1, limit = 5 } = req.query; // Pagination options from query params

        // Find the task by its ID
        const task = await Task.findOne({ id: taskId }).select("_id").lean();
        if (!task) {
            return res.status(200).json({ error: "Task not found" });
        }

        // Paginate comments for the task
        const comments = await Comment.paginate(
            { task: task._id }, // Filter comments by task ID
            {
                page: parseInt(page),
                limit: limit,
                sort: { createdAt: -1 }, // Sort by creation date (newest first)
                populate: {
                    path: "author",
                    select: "name email id -_id"
                },
                select: "-_id id content createdAt updatedAt author", // Select fields to return
            }
        );

        res.status(201).json({
            message: "Comments retrieved successfully",
            data: comments.docs,
            totalDocs: comments.totalDocs,
            totalPages: comments.totalPages,
            currentPage: comments.page,
        });
    } catch (error) {
        res.status(200).json({ error: "Unexpected Error Occurred" });
        next(`ERROR IN: getCommentsForTask function => ${error}`);
    }
};


// Update a comment
module.exports.updateComment = async (req, res, next) => {
    try {
        const { id: commentId } = req.params; // Comment ID from URL params
        const { content } = req.body;

        const commentSent = await Comment.findOne({ id: commentId });
        if (!commentSent) {
            return res.status(200).json({ error: "Comment not found" });
        }

        if (!content) {
            return res.status(200).json({ error: "Content is required" });
        }

        const commentAuthor = await User.findOne({ _id: commentSent.author });

        // Update only if the comment author is the same as the logged-in user
        if (commentAuthor.id !== req.user.id && req.user.role !== "admin") {
            return res.status(200).json({ error: "You are not allowed to update this comment" });
        }

        const updateComment = await Comment.findOneAndUpdate(
            { id: commentId },
            { content, updatedAt: Date.now() },
            { new: true }
        );

        // remove _id and __v from the response and any object id
        const commentTask = await Task.findOne({ _id: commentSent.task }).select("id").lean();
        updateComment._doc.author = commentAuthor.id;
        updateComment._doc.task = commentTask.id;
        delete updateComment._doc._id;
        delete updateComment._doc.__v;

        res.status(201).json({ message: "Comment updated successfully", data: updateComment });
    } catch (error) {
        res.status(200).json({ error: "Unexpected Error Occurred" });
        next(`ERROR IN: updateComment function => ${error}`);
    }
};

// Delete a comment
module.exports.deleteComment = async (req, res, next) => {
    try {
        const { id: commentId } = req.params; // Comment ID from URL params

        const comment = await Comment.findOne({ id: commentId });
        if (!comment) {
            return res.status(200).json({ error: "Comment not found" });
        }

        const commentAuthor = await User.findOne({ _id: comment.author });

        // Delete only comments created by the user
        if (req.user.role !== "admin") {
            if (commentAuthor.id !== req.user.id) {
                return res.status(200).json({ error: "You are not allowed to delete this comment" });
            }
        }

        await Comment.findOneAndDelete({ id: commentId });

        // Remove the comment from the task's comment list
        await Task.updateOne({ comments: comment._id }, { $pull: { comments: comment._id } });

        res.status(201).json({ message: "Comment deleted successfully" });
    } catch (error) {
        res.status(200).json({ error: "Unexpected Error Occurred" });
        next(`ERROR IN: deleteComment function => ${error}`);
    }
};
