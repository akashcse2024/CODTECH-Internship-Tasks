const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

// 1. Setup Socket.io with CORS (Allows React Frontend to connect)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // This is where React will run
    methods: ["GET", "POST"],
  },
});

// 2. Connect to MongoDB (Optional: Works in memory if DB fails)
// If you have MongoDB installed locally, this will work.
const MONGODB_URI = "mongodb://127.0.0.1:27017/google-docs-clone";

mongoose.connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("⚠️ MongoDB Not Found (Running in In-Memory Mode)"));

// Define a simple Document Schema
const DocumentSchema = new mongoose.Schema({
  _id: String,
  data: Object,
});
const Document = mongoose.model("Document", DocumentSchema);

// In-memory fallback storage (if MongoDB is missing)
const memoryStore = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("get-document", async (documentId) => {
    const data = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", data);

    socket.on("send-changes", (delta) => {
      // Broadcast changes to everyone else in the same doc
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data) => {
      await updateDocument(documentId, data);
    });
  });
});

// Helper Functions
async function findOrCreateDocument(id) {
  if (id == null) return;

  // Try MongoDB first
  if (mongoose.connection.readyState === 1) {
    const document = await Document.findById(id);
    if (document) return document.data;
    return await Document.create({ _id: id, data: "" });
  } else {
    // Fallback to Memory
    if (!memoryStore[id]) memoryStore[id] = "";
    return memoryStore[id];
  }
}

async function updateDocument(id, data) {
  if (mongoose.connection.readyState === 1) {
    await Document.findByIdAndUpdate(id, { data });
  } else {
    memoryStore[id] = data;
  }
}

server.listen(3001, () => {
  console.log("🚀 Server running on http://localhost:3001");
});