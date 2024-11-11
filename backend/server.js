const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const colors = require("colors");
const cors = require("cors");

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:3001", // Update with your frontend URL if needed
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// Routes
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// -------------------------- Deployment ------------------------------
const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/frontend/build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running...");
  });
}
// -------------------------- Deployment ------------------------------

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () =>
  console.log(`Server running on PORT ${PORT}...`.yellow.bold)
);

// -------------------------- Socket.IO Setup -------------------------
const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log(`User joined Room: ${room}`);
  });

  socket.on("startCall", (data) => {
    const { room, caller, receiver } = data;
    if (!room || !caller || !receiver) {
      console.log("Invalid call data received:", data);
      return; // Prevent call if data is invalid
    }
    io.to(room).emit("callStarted", { caller, receiver });
    console.log(`Call started in Room: ${room}`);
  });

  socket.on("endCall", (data) => {
    const { room } = data;
    io.to(room).emit("callEnded", { message: "The call has ended." });
    console.log(`Call ended in Room: ${room}`);
  });

  socket.on("sendMessage", (messageData) => {
    const { room, message, sender, timestamp } = messageData;
    io.to(room).emit("messageReceived", { message, sender, timestamp });
    console.log(`Message sent in Room: ${room}`);
  });

  socket.on("disconnect", () => {
    console.log("USER DISCONNECTED");
  });
});
