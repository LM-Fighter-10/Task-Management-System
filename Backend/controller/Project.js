const { Project, Task, User, Notification } = require("../db/Database");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const { sendNotificationUpdate } = require("../socket"); // Import sendNotificationUpdate function

// Add a new project
module.exports.addProject = async (req, res, next) => {
    try {
        let { name, description, createdBy, teamMembers, status } = req.body;

        if (!name) {
            return res.status(200).json({ error: "Name is required" });
        }

        if (!createdBy) {
            return res.status(200).json({ error: "Project creator is required" });
        }

        const sentUser = await User.findOne({ id: createdBy });
        if (!sentUser) {
            return res.status(200).json({ error: "Project creator not found" });
        }

        const id = uuidv4();

        let matchedUsers = [];
        if (teamMembers.length) {
            matchedUsers = await User.aggregate([
                { $match: { id: { $in: teamMembers } } }, // Match users with "id" in the provided list
                { $project: { _id: 1 } } // Only return the "id" field
            ]);

            if (matchedUsers.length !== teamMembers.length) {
                return res.status(200).json({ error: "One or more team members not found" });
            }
            status = "active";
        } else {
            status = "on-hold";
        }

        const project = new Project({
            id,
            name,
            description,
            createdBy: sentUser._id,
            teamMembers: matchedUsers,
            status: status || "active",
        });

        await project.save();

        // remove any object id from the response and _v
        project._doc.createdBy = createdBy;
        project._doc.teamMembers = teamMembers;
        delete project._doc._id;
        delete project._doc.__v;

        res.status(201).json({ message: `Project (${project.name}) added successfully`, data: project._doc });
    } catch (error) {
        res.status(200).json({ error: "Unexpected Error Occurred" });
        next(`ERROR IN: addProject function => ${error}`);
    }
};

// Assign team members to a project
module.exports.assignTeamMembers = async (req, res, next) => {
    try {
        const { id } = req.params; // Project id (v4)
        const { teamMembers } = req.body; // Now an array of usernames

        let project = await Project.findOne({ id }).populate("createdBy");
        if (!project) {
            return res.status(200).json({ error: "Project not found" });
        }

        // Look up team members by their username
        let matchedUsers = await User.find({ username: { $in: teamMembers } }).select("_id id username");
        if (matchedUsers.length !== teamMembers.length) {
            return res.status(200).json({ error: "One or more team members not found" });
        }

        // Check for creator removal
        if (!matchedUsers.find(user => user.username === project.createdBy.username)) {
            return res.status(200).json({ error: "Creator cannot be removed from the project" });
        }

        // (Optionally) You might also want to compute removed members here if needed.
        project.teamMembers = matchedUsers.map(user => user._id);
        // Update status based on teamMembers count.
        project.status = teamMembers.length ? "active" : "on-hold";
        await project.save();

        // (Optional) Send notifications as before…

        // Populate createdBy for response transformation
        project = await project.populate("createdBy", "id -_id");

        // Transform response (set teamMembers to the usernames)
        project._doc.createdBy = project.createdBy.id;
        project._doc.teamMembers = teamMembers;
        delete project._doc._id;
        delete project._doc.__v;

        res.status(201).json({
            message: `Team members assigned to project (${project.name}) successfully`,
            data: project._doc,
        });
    } catch (error) {
        next(`ERROR IN: assignTeamMembers function => ${error}`);
        res.status(200).json({ error: "Unexpected Error Occurred" });
    }
};

// Get a project by ID
module.exports.getProject = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Convert createdBy to UUID instead of ObjectId and teamMembers to UUIDs using aggregation
        const project = await Project.aggregate([
            { $match: { id } },
            {
                $lookup: {
                    from: "users",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "createdBy"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "teamMembers",
                    foreignField: "_id",
                    as: "teamMembers"
                }
            },
            { $unwind: "$createdBy" },
            {
                $project: {
                    _id: 0,
                    id: 1,
                    name: 1,
                    description: 1,
                    status: 1,
                    createdBy: "$createdBy.id",
                    teamMembers: "$teamMembers.id"
                }
            }
        ]);

        if (!project.length) {
            return res.status(200).json({ error: "Project not found" });
        }

        res.status(200).json({ data: project[0] });
    } catch (error) {
        res.status(200).json({ error: "Unexpected Error Occurred" });
        next(`ERROR IN: getProject function => ${error}`);
    }
};

// Update a project
module.exports.updateProject = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updatedProject = req.body;

        // Find the existing project by UUID
        const oldProject = await Project.findOne({ id });
        if (!oldProject) {
            return res.status(200).json({ error: "Project not found" });
        }

        // Update fields if they are provided
        if (updatedProject.name) oldProject.name = updatedProject.name;
        if (updatedProject.description) oldProject.description = updatedProject.description;
        if (updatedProject.status) oldProject.status = updatedProject.status;

        // Convert teamMembers UUIDs to ObjectIds before saving
        if (updatedProject.teamMembers) {
            const users = await User.find({
                $expr: {
                    $in: [
                        "$id",
                        {
                            $map: {
                                input: updatedProject.teamMembers, // array of objects (or strings)
                                as: "tm",
                                in: {
                                    // If the element is an object, use its id; otherwise, return the element as-is.
                                    $cond: {
                                        if: { $isArray: [ { $objectToArray: "$$tm" } ] }, // crude check if object
                                        then: "$$tm.id",
                                        else: "$$tm"
                                    }
                                }
                            }
                        }
                    ]
                }
            }).select("_id").lean();
            oldProject.teamMembers = users.map(user => user._id);
        }

        oldProject.updatedAt = new Date();
        await oldProject.save();

        // Convert createdBy to UUID instead of ObjectId
        const userCreator = await User.findOne({ _id: oldProject.createdBy }).select("id -_id").lean();
        oldProject._doc.createdBy = userCreator.id;

        // Remove unnecessary fields (_id, __v)
        delete oldProject._doc._id;
        delete oldProject._doc.__v;

        // Populate teamMembers and remove sensitive fields
        await oldProject.populate("teamMembers", "id -_id");
        oldProject._doc.teamMembers = oldProject.teamMembers.map(member => member.id);

        res.status(201).json({ message: `Project (${oldProject.name}) updated successfully`, data: oldProject._doc });
    } catch (error) {
        res.status(200).json({ error: "Unexpected Error Occurred" });
        next(`ERROR IN: updateProject function => ${error}`);
    }
};

// Delete a project
module.exports.deleteProject = async (req, res, next) => {
    try {
        const { id } = req.params;

        const project = await Project.findOneAndDelete({ id });

        if (!project) {
            return res.status(200).json({ message: "Project not found" });
        }

        // Delete associated tasks
        await Task.deleteMany({ project: project._id });

        res.status(201).json({ message: `Project (${project.name}) and associated tasks deleted successfully` });
    } catch (error) {
        res.status(200).json({ error: "Unexpected Error Occurred" });
        next(`ERROR IN: deleteProject function => ${error}`);
    }
};

// List all projects with pagination
module.exports.getAllProjects = async (req, res, next) => {
    try {
        const { page = 1, limit = 6 } = req.query; // Pagination options from query params
        const { role, id: userId } = req.user; // Extract role and user ID from the request (set by middleware)

        // Build query based on role
        let query = {};
        if (role !== "admin") {
            // For non-admins, filter projects where the user is in teamMembers
            const userObjectId = await User.findOne({ id: userId }).select("_id").lean();
            query = { teamMembers: userObjectId._id };
        }

        const projects = await Project.aggregate([
            { $match: query }, // Filter projects
            { $sort: { createdAt: -1 } },
            { $skip: (parseInt(page) - 1) * limit },
            { $limit: parseInt(limit) },

            // Lookup and replace `createdBy` with only id and name
            {
                $lookup: {
                    from: "users",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "createdBy"
                }
            },
            // select only id and name from createdBy
            {
                $addFields: {
                    createdBy: {
                        $arrayElemAt: [
                            {
                                $map: {
                                    input: "$createdBy",
                                    as: "user",
                                    in: { id: "$$user.id", name: "$$user.name", username: "$$user.username" }
                                }
                            },
                            0
                        ]
                    }
                }
            },

            // Lookup and replace `teamMembers` with objects containing id and name
            {
                $lookup: {
                    from: "users",
                    localField: "teamMembers",
                    foreignField: "_id",
                    as: "teamMembers"
                }
            },
            {
                $addFields: {
                    teamMembers: {
                        $map: {
                            input: "$teamMembers",
                            as: "member",
                            in: { id: "$$member.id", name: "$$member.name", username: "$$member.username" }
                        }
                    }
                }
            },

            { $unset: ["_id", "__v", "assignedUsers"] } // Remove unnecessary fields
        ]);

        // Get total count for pagination
        const totalDocs = await Project.countDocuments(query);
        const totalPages = Math.ceil(totalDocs / limit);

        res.status(201).json({
            message: "Projects retrieved successfully",
            data: projects,
            totalDocs,
            totalPages,
            currentPage: parseInt(page),
        });
    } catch (error) {
        res.status(200).json({ error: "Unexpected Error Occurred" });
        next(`ERROR IN: getAllProjects function => ${error}`);
    }
};

// Get all team members for a project with pagination
module.exports.getTeamMembers = async (req, res, next) => {
    try {
        const { id } = req.params;

        const project = await Project.findOne({ id });
        if (!project) {
            return res.status(200).json({ error: "Project not found" });
        }

        const teamMembers = await User.aggregate([
            { $match: { _id: { $in: project.teamMembers } } },
            {
                $project: {
                    _id: 0,
                    id: 1,
                    name: 1,
                    username: 1,
                    email: 1,
                    role: 1,
                    gender: 1,
                    avatar: 1,
                }
            },
            { $sort: { createdAt: -1 } },
        ]);

        res.status(201).json({
            message: "Team members retrieved successfully",
            data: teamMembers,
        });
    } catch (error) {
        res.status(200).json({ error: "Unexpected Error Occurred" });
        next(`ERROR IN: getTeamMembers function => ${error}`);
    }
};

// Get all team members for a project for the dashboard
module.exports.getMembersForProjDashboard= async (req, res, next) => {
    try {
        const { id } = req.params;

        const project = await Project.findOne({ id });
        if (!project) {
            return res.status(200).json({ error: "Project not found" });
        }

        const teamMembers = await User.aggregate([
            { $match: { _id: { $in: project.teamMembers } } },
            {
                $lookup: {
                    from: "tasks",
                    localField: "_id",
                    foreignField: "assignedTo",
                    as: "tasks"
                }
            },
            {
                $addFields: {
                    totalTasks: { $size: "$tasks" },
                    completedTasks: {
                        $size: {
                            $filter: {
                                input: "$tasks",
                                as: "task",
                                cond: { $eq: ["$$task.status", "completed"] }
                            }
                        }
                    },
                    // add lastLogin field if exists else set to null
                    lastLogin: { $ifNull: ["$lastLogin", null] }
                }
            },
            { $unset: ["_id", "password", "resetPasswordExpires", "resetPasswordToken", "tasks", "__v"] },
            { $sort: { createdAt: -1 } },
        ]);

        if (!teamMembers.length) {
            return res.status(200).json({ error: "No team members found" });
        }

        res.status(201).json({
            message: "Team members retrieved successfully",
            data: teamMembers,
        });
    } catch (error) {
        res.status(200).json({ error: "Unexpected Error Occurred" });
        next(`ERROR IN: getTeamMembers function => ${error}`);
    }
};
