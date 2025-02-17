const { Router } = require("express");
const Controller = require("../controller/StatsController");
const verifyToken = require("../controller/VerifyToken");
const router = Router();

router.get("/getStatistics", verifyToken(), Controller.getStatistics);
router.get("/getRecentActivity", verifyToken(), Controller.getRecentActivity);
router.get("/getProjectTaskStats", verifyToken(), Controller.getProjectTaskStats);
router.get("/getUserStats", verifyToken(), Controller.getUserStats);

module.exports = router;
