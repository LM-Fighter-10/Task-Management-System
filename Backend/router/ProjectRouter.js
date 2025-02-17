const { Router } = require("express");
const Controller = require("../controller/Project");
const verifyToken = require("../controller/VerifyToken");
const router = Router();

router.post("/addProject", verifyToken(), Controller.addProject); // Add a new project
router.put("/assignTeamMembers/:id", verifyToken("manager"), Controller.assignTeamMembers); // Assign team members to a project
router.get("/getProject/:id", verifyToken(), Controller.getProject); // Get a project by ID
router.get("/getAllProjects", verifyToken(), Controller.getAllProjects); // Get a project by ID
router.get("/getUsersByProject/:id", verifyToken(), Controller.getTeamMembers); // Get all projects for a specific user
router.get("/getMembersForProjDashboard/:id", verifyToken(), Controller.getMembersForProjDashboard); // Get all projects for a specific
// user
router.put("/updateProject/:id", verifyToken(), Controller.updateProject); // Update a project
router.delete("/deleteProject/:id", verifyToken(), Controller.deleteProject); // Delete a project

module.exports = router;
