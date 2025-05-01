const { Server } = require("socket.io");

// Memory storage for active connections, chat messages, and user join times
let connections = {};      // { roomName: [socketId, ...] }
let messages = {};         // { roomName: [ { sender, data, socketId }, ... ] }
let timeOnline = {};       // { socketId: timestamp }

const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });

    // When a new user connects
    io.on("connection", (socket) => {
        console.log("something connected");

        // When user joins a room (like a video call)
        socket.on("join-call", (room) => {
            // Initialize the room if it doesn't exist
            if (!connections[room]) {
                connections[room] = [];
            }

            // Add the new user to the room
            connections[room].push(socket.id);
            timeOnline[socket.id] = new Date();

            // Notify everyone in the room that a new user has joined
            connections[room].forEach(id => {
                io.to(id).emit("user-joined", socket.id, connections[room]);
            });

            // Send old chat messages to the new user
            if (messages[room]) {
                messages[room].forEach(msg => {
                    io.to(socket.id).emit("chat-message", msg.data, msg.sender, msg.socketId);
                });
            }
        });

        // When a user sends a WebRTC signal (used for video/audio peer connections)
        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        // When a user sends a chat message
        socket.on("chat-message", (data, sender) => {
            let userRoom = null;

            // Find which room this user belongs to
            for (const [room, users] of Object.entries(connections)) {
                if (users.includes(socket.id)) {
                    userRoom = room;
                    break;
                }
            }

            // Store and broadcast the message
            if (userRoom) {
                if (!messages[userRoom]) {
                    messages[userRoom] = [];
                }

                const message = {
                    sender: sender,
                    data: data,
                    socketId: socket.id
                };
                messages[userRoom].push(message);

                // Send message to all users in the room
                connections[userRoom].forEach(id => {
                    const senderName = sender || "Anonymous";
                    io.to(id).emit("chat-message", data, senderName, socket.id);
                });

                console.log("message", userRoom, ":", sender, data);
            }
        });

        // When user disconnects
        socket.on("disconnect", () => {
            const disconnectTime = new Date();
            const connectTime = timeOnline[socket.id];
            const timeSpent = Math.abs(disconnectTime - connectTime);

            // Remove the user from the connections list
            for (const [room, users] of Object.entries(connections)) {
                if (users.includes(socket.id)) {
                    // Inform others in the room
                    users.forEach(id => {
                        io.to(id).emit("user-left", socket.id);
                    });

                    // Remove user from the room
                    connections[room] = users.filter(id => id !== socket.id);

                    // If room is empty, delete it
                    if (connections[room].length === 0) {
                        delete connections[room];
                        delete messages[room];
                    }

                    break;
                }
            }

            delete timeOnline[socket.id];
        });

    });

    return io;
};

module.exports = { connectToSocket };
