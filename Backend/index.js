const express = require("express");
const path = require("path");
const app = express();
const ENV = require("../env");
const port = ENV.Back_Port;
const { rateLimit } = require("express-rate-limit");
const http = require("http"); // Import HTTP module
const { initializeSocket } = require("./socket"); // Import WebSocket logic

// Rate limiter to prevent DDoS attacks
// const limiter = rateLimit({
//     windowMs: 15 * 60 * 100000,
//     max: 100000,
//     message: "Too many requests from this IP, please try again after 15 minutes",
// });

const server = http.createServer(app); // Create HTTP server

// Initialize WebSocket Server
initializeSocket(server);

// Apply the rate limiter to all requests
// app.use(limiter);

const cors = require("cors");

const allowedOrigins = [ENV.Front_Origin, "http://localhost:5173"];

// Middleware to allow requests from other origins
app.use(
    cors({
        origin: function (origin, callback) {
            // Check if the origin is in the allowedOrigins array
            if (!origin || allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// Middleware to parse JSON request bodies
app.use(express.json());

// Serve the static folder (e.g., 'static/photos' where the images are stored)
app.use("/static", express.static(path.join(__dirname, "static")));

// Middleware to set the Content-Type header for PDF files (if any)
app.use((req, res, next) => {
    if (req.url.endsWith(".pdf")) {
        res.setHeader("Content-Type", "application/pdf");
    }
    next();
});

const fs = require('fs');
const fetch = require('node-fetch'); // Ensure you have node-fetch installed for Node.js versions below 18
const { User } = require("./db/Database");

/*
// fetch avatars from the avatar api
let changeUsersAvatar = async () => {
    // Get all users and update their avatars by getting last number after / and change to /static/number
    const users = await User.find();
    users.forEach(async (user) => {
        const avatar = user.avatar;
        const lastNumber = avatar.split('/').pop();
        const newAvatar = `${ENV.Back_Origin}/static/avatars/${lastNumber}.png`;
        user.avatar = newAvatar;
        await user.save();
    });
};
*/

// Importing routers
const UserRouter = require("./router/UserRouter");
const ProjectRouter = require("./router/ProjectRouter");
const TaskRouter = require("./router/TaskRouter");
const NotificationRouter = require("./router/NotificationRouter");
const StatsRouter = require("./router/StatsRouter");

// Middleware to monitor requests and responses
app.use((req, res, next) => {
    console.log();
    console.warn("------------------------------------------------------");
    console.log(`Request URL: ${req.url}, Request Method: ${req.method}`);
    console.warn("------------------------------------------------------");
    console.log();
    next();
});

// Linking routers to the app
app.use(UserRouter); app.use(ProjectRouter);
app.use(TaskRouter); app.use(NotificationRouter);
app.use(StatsRouter);

// Middleware to catch any errors
app.use((err, req, res, _) => {
    console.warn("------------------------------------------------------");
    console.error(err);
    console.warn("------------------------------------------------------");
    console.log();
    res.end();
});

// Middleware to catch any requests to non-existing routes
app.all("*", (req, res) => {
    return res.status(200).json({ error: "Wrong Path" });
});

// Start HTTP & WebSocket Server
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

module.exports = app;
