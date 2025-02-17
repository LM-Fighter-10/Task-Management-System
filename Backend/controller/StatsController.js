const { Task, Project, User, Comment, Notification } = require("../db/Database");

module.exports.getStatistics = async (req, res, next) => {
    try {
        // Get total counts for tasks
        const totalTasks = await Task.countDocuments();
        const completedTasksCount = await Task.countDocuments({ status: "completed" });
        const pendingTasksCount = await Task.countDocuments({ status: "pending" });

        // Get total counts for projects
        const totalProjects = await Project.countDocuments();
        const ongoingProjectsCount = await Project.countDocuments({ status: "active" });

        // Get total unique team members across all projects
        const teamMembersAggregation = await Project.aggregate([
            { $unwind: "$teamMembers" },
            { $group: { _id: "$teamMembers" } },
            { $count: "totalTeamMembers" }
        ]);
        const totalTeamMembers = teamMembersAggregation.length ? teamMembersAggregation[0].totalTeamMembers : 0;

        // Calculate percentages
        const completedTasksPercentage = totalTasks ? ((completedTasksCount / totalTasks) * 100).toFixed(2) : 0;
        const pendingTasksPercentage = totalTasks ? ((pendingTasksCount / totalTasks) * 100).toFixed(2) : 0;
        const ongoingProjectsPercentage = totalProjects ? ((ongoingProjectsCount / totalProjects) * 100).toFixed(2) : 0;
        const teamMembersPercentage = totalTeamMembers ? 100 : 0;

        // Generate last 7 months date ranges in UTC
        const currentDate = new Date();
        const last7Months = [];
        const Months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        let labels = [];

        for (let i = 0; i < 7; i++) {
            const firstDay = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() - i, 1, 0, 0, 0, 0));
            const lastDay = new Date(Date.UTC(firstDay.getUTCFullYear(), firstDay.getUTCMonth() + 1, 0, 23, 59, 59, 999));
            labels.push(Months[firstDay.getUTCMonth()]);

            last7Months.push({
                month: firstDay.toISOString().slice(0, 7),
                start: firstDay,
                end: lastDay
            });
        }

        // Aggregate task & project statistics per month
        const monthlyStats = await Promise.all(
            last7Months.map(async ({ month, start, end }) => {
                const completedAgg = await Task.countDocuments({ status: "completed", createdAt: { $gte: start, $lte: end } });
                const pendingAgg = await Task.countDocuments({ status: "pending", createdAt: { $gte: start, $lte: end } });
                const ongoingAgg = await Project.countDocuments({ status: "active", createdAt: { $gte: start, $lte: end } });

                return { month, completedTasks: completedAgg, pendingTasks: pendingAgg, ongoingProjects: ongoingAgg };
            })
        );

        // Extract data for dataset
        const dataset = [
            { label: "Completed Tasks", data: monthlyStats.map(stat => stat.completedTasks) },
            { label: "Pending Tasks", data: monthlyStats.map(stat => stat.pendingTasks) },
            { label: "Ongoing Projects", data: monthlyStats.map(stat => stat.ongoingProjects) }
        ];

        res.status(201).json({
            message: "Statistics retrieved successfully",
            data: {
                labels: labels.reverse(),
                completedTasks: {value: completedTasksCount, percent: completedTasksPercentage},
                pendingTasks: {value: pendingTasksCount, percent: pendingTasksPercentage},
                ongoingProjects: {value: ongoingProjectsCount, percent: ongoingProjectsPercentage},
                teamMembers: {value: totalTeamMembers, percent: teamMembersPercentage},
                dataset
            }
        });
    } catch (error) {
        res.status(200).json({ error: "Unexpected Error Occurred" });
        next(`ERROR IN: getStatistics function => ${error}`);
    }
};

module.exports.getRecentActivity = async (req, res, next) => {
    try {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        // Fetch recent 5 tasks that are not completed
        const newTasks =
            await Task.find({ status: { $ne: "completed" } }).countDocuments();

        // Fetch recent 5 completed tasks
        const completedTasks = await Task.find({ status: "completed" }).countDocuments();

        // Fetch recent 5 ongoing projects
        const ongoingProjects = await Project.find({ status: "active" }).countDocuments();

        // Fetch recent 5 users (role: "manager" or "user") who were added as team members
        const newTeamMembers = await User.aggregate([
            { $match: { role: { $in: ["manager", "user"] } } },
            {
                $lookup: {
                    from: "projects",
                    localField: "_id",
                    foreignField: "teamMembers",
                    as: "assignedProjects",
                }
            },
            { $match: { assignedProjects: { $ne: [] } } }, // Only users part of any project
            {
                $match: {
                    createdAt: { $gte: lastWeek }
                }
            },
            { $count: "newTeamMembers" }
        ]);

        res.status(201).json({
            message: "Recent activity retrieved successfully",
            data: {
                newTasks,
                completedTasks,
                ongoingProjects,
                newTeamMembers: newTeamMembers.length ? newTeamMembers[0].newTeamMembers : 0
            }
        });
    } catch (error) {
        res.status(200).json({ error: "Unexpected Error Occurred" });
        next(`ERROR IN: getRecentActivity function => ${error}`);
    }
};

module.exports.getProjectTaskStats = async (req, res, next) => {
    try {
        const { page = 1, limit = 5 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const projectStats = await Project.aggregate([
            {
                $lookup: {
                    from: "tasks",
                    localField: "_id",
                    foreignField: "project",
                    as: "tasks"
                }
            },
            {
                $addFields: {
                    newTasks: {
                        $size: {
                            $filter: {
                                input: "$tasks",
                                as: "task",
                                cond: { $ne: ["$$task.status", "completed"] }
                            }
                        }
                    },
                    completedTasks: {
                        $size: {
                            $filter: {
                                input: "$tasks",
                                as: "task",
                                cond: { $eq: ["$$task.status", "completed"] }
                            }
                        }
                    }
                }
            },
            { $sort: { name: 1 } },
            {
                $facet: {
                    totalCount: [{ $count: "count" }], // Total number of projects
                    paginatedResults: [
                        { $skip: skip },
                        { $limit: parseInt(limit) },
                        {
                            $project: {
                                projName: "$name",
                                projID: "$id",
                                newTasks: 1,
                                completedTasks: 1,
                                _id: 0
                            }
                        }
                    ]
                }
            }
        ]);

        // if no projects are found
        if (!projectStats[0].paginatedResults.length) {
            return res.status(200).json({ error: "No projects found" });
        }

        // Extract data and total count
        const totalDocs = projectStats[0].totalCount.length ? projectStats[0].totalCount[0].count : 0;
        const totalPages = Math.ceil(totalDocs / parseInt(limit));

        res.status(201).json({
            message: "Project task statistics retrieved successfully",
            data: projectStats[0].paginatedResults,
            totalDocs,
            totalPages,
            currentPage: parseInt(page)
        });
    } catch (error) {
        res.status(200).json({ error: "Unexpected Error Occurred" });
        next(`ERROR IN: getProjectTaskStats function => ${error}`);
    }
};

module.exports.getUserStats = async (req, res, next) => {
    try {
        // The logged-in user's information is assumed to be in req.user
        // Note: req.user.id is the custom UUID from the token.
        const userRecord = await User.findOne({ id: req.user.id }).select("_id");
        if (!userRecord) {
            return res.status(200).json({ error: "User not found" });
        }
        const userObjectId = userRecord._id;

        // Count tasks that belong to the user (either assigned to or created by them)
        const tasksCount = await Task.countDocuments({
            $or: [{ assignedTo: userObjectId }, { createdBy: userObjectId }]
        });

        // Count comments where the user is the author
        const commentsCount = await Comment.countDocuments({ author: userObjectId });

        // Count notifications for the user
        const notificationsCount = await Notification.countDocuments({ user: userObjectId });

        // Count projects that involve the user (either created by or where the user is a team member)
        const projectsCount = await Project.countDocuments({
            $or: [{ createdBy: userObjectId }, { teamMembers: userObjectId }]
        });

        res.status(201).json({
            message: "User statistics retrieved successfully",
            data: {
                tasks: tasksCount,
                comments: commentsCount,
                updates: notificationsCount,
                projects: projectsCount
            }
        });
    } catch (error) {
        res.status(200).json({ error: "Unexpected Error Occurred" });
        next(`ERROR IN: getUserStats function => ${error}`);
    }
};
