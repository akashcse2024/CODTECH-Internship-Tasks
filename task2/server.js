const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    // User Joins
    socket.on('join', (username) => {
        socket.broadcast.emit('message', {
            user: 'System',
            text: `${username} has joined the chat`,
            type: 'system'
        });
    });

    // User Sends Message
    socket.on('chatMessage', (data) => {
        io.emit('message', data);
    });

    // User Disconnects
    socket.on('disconnect', () => {
        io.emit('message', {
            user: 'System',
            text: 'A user has left the chat',
            type: 'system'
        });
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});