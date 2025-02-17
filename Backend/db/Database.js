const { v4 } = require("uuid");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { Database_URI } = require("../../env");
const mongoosePaginate = require("mongoose-paginate-v2"); // Import the plugin

// Connect to MongoDB (Online - Cloud)
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };
async function run() {
    try {
        // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
        await mongoose.connect(Database_URI, clientOptions);
        await mongoose.connection.db.admin().command({ ping: 1 });
        console.log("Connected to MongoDB (Online - Cloud)");
    } catch (e) {
        throw new Error("Error connecting to MongoDB (Online - Cloud)");
    }
}
run().catch(e => console.error(e));

// Create the User model
const userSchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    gender: {
        type: String,
        enum: ["Male", "Female"],
        required: true,
    },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'manager', 'user'], default: 'user' },
    avatar: { type: String, default: 'https://avatar.iran.liara.run/public/1' },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: null },
});
userSchema.plugin(mongoosePaginate); // Apply the plugin to the schema

// Create the Project, Task, Notification, and Comment models
const projectSchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ['active', 'completed', 'on-hold'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
projectSchema.plugin(mongoosePaginate); // Apply the plugin to the schema

const taskSchema = new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'] },
    dueDate: { type: Date },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }], // NEW FIELD
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
taskSchema.plugin(mongoosePaginate); // Apply the plugin to the schema

const notificationSchema = new mongoose.Schema({
    id: {type: String, required: true},
    type: {
        type: String,
        required: true,
        enum: [
            "info",    // General information (e.g., announcements or updates)
            "success", // Success notifications (e.g., task completed successfully)
            "error",   // Error notifications (e.g., failed actions or system issues)
            "warning",  // Warnings (e.g., approaching deadlines or permissions issues)
            "admin"  // Admin notifications (e.g., new user registration or project creation)
        ],
    },
    message: {
        type: String,
        required: true,
        maxlength: 255,
    },
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    isRead: {type: Boolean, default: false},
    createdAt: {type: Date, default: Date.now},
});
notificationSchema.plugin(mongoosePaginate); // Apply the plugin to the schema

// NEW: Comment Schema
const commentSchema = new mongoose.Schema({
    id: { type: String, required: true },
    content: { type: String, required: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
commentSchema.plugin(mongoosePaginate); // Apply the plugin to the schema

const User = mongoose.model('User', userSchema);
const Project = mongoose.model('Project', projectSchema);
const Task = mongoose.model('Task', taskSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const Comment = mongoose.model('Comment', commentSchema); // NEW EXPORT

//--------------------------------------------

module.exports = {
    User,
    Project,
    Task,
    Notification,
    Comment // NEW EXPORT
};
