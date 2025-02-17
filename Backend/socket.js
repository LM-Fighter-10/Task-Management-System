const { Server } = require("socket.io");
const { Front_Origin } = require("../env");

let io;
const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: Front_Origin,
            methods: ["GET", "POST", "PUT", "DELETE"],
        },
    });

    io.on("connection", (socket) => {
        console.log("New WebSocket Connection Established");

        socket.on("joinNotifications", (userId) => {
            socket.join(userId);
            console.log(`User ${userId} joined notifications room`);
        });

        socket.on("disconnect", () => {
            console.log("User Disconnected from WebSocket");
        });
    });

    return io;
};

const sendNotificationUpdate = (userId, notification) => {
    if (io) {
        io.to(userId).emit("newNotification", notification);
    }
};

module.exports = { initializeSocket, sendNotificationUpdate };
