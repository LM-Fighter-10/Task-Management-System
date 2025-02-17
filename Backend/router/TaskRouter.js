const { Router } = require("express");
const Controller = require("../controller/Task");
const verifyToken = require("../controller/VerifyToken");
const router = Router();

// Routes for Task management
router.post("/addTask", verifyToken(), Controller.addTask); // Add a new task
router.get("/getTask/:id", verifyToken(), Controller.getTask); // Get a task by ID
router.get("/getTasksByProject/:projectId", verifyToken(), Controller.getTasksByProject); // Get all tasks for a specific project
router.get("/getTasksAssignedToUser/:id", verifyToken(), Controller.getTasksAssignedToUser);
router.get("/getTasksCreatedByUser/:id", verifyToken(), Controller.getTasksCreatedByUser);
router.get("/assignedOrCreatedByUser/:id", verifyToken(), Controller.getTasksAssignedOrCreatedByUser);
router.put("/updateTask/:id", verifyToken(), Controller.updateTask); // Update a task
router.delete("/deleteTask/:id", verifyToken(), Controller.deleteTask); // Delete a task

// Comment routes
router.post("/addCommentToTask/:id", verifyToken(), Controller.addCommentToTask); // Add a comment to a task
router.get("/getCommentsForTask/:id", verifyToken(), Controller.getCommentsForTask); // Get all comments for a task
router.put("/updateComment/:id", verifyToken(), Controller.updateComment); // Update a comment
router.delete("/deleteComment/:id", verifyToken(), Controller.deleteComment); // Delete a comment

module.exports = router;
