import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./routes/auth";
import itemRoutes from "./routes/items";
import claimRoutes from "./routes/claims";
import messageRoutes from "./routes/messages";
import notificationRoutes from "./routes/notifications";
import adminRoutes from "./routes/admin";

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map(s => s.trim())
  : ["http://localhost:5173"];

const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
});

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

app.get("/health", (_, res) => res.json({ status: "ok" }));

io.on("connection", (socket) => {
  socket.on("join-room", (roomId: string) => socket.join(roomId));
  socket.on("leave-room", (roomId: string) => socket.leave(roomId));
  socket.on("send-message", (data: { roomId: string; message: unknown }) => {
    io.to(data.roomId).emit("new-message", data.message);
  });
  socket.on("join-user", (userId: string) => socket.join(`user-${userId}`));
  socket.on("notification", (data: { userId: string; notification: unknown }) => {
    io.to(`user-${data.userId}`).emit("new-notification", data.notification);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
