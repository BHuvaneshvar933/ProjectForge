import mongoose from "mongoose";
import Team from "../models/team.model.js";
import Message from "../models/message.model.js";

export const registerSocketHandlers = (io, socket) => {
  console.log("Handlers registered for:", socket.id);
  // Join Project Room
  socket.on("join-project", async (projectId, ack) => {
    console.log("EVENT TRIGGERED");
    try {
      console.log("Project ID:", projectId);
      if (!socket.user || !socket.user._id) {
        socket.disconnect(true);
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        if (typeof ack === "function") ack({ ok: false, error: "Invalid projectId" });
        else socket.emit("error", "Invalid projectId");
        return;
      }

      console.log("Checking membership for user:", String(socket.user._id));

      const membership = await Team.findOne({
        projectId,
        userId: socket.user._id,
        status: "active",
        isDeleted: false,
      }).select("_id");

      console.log("Membership found:", Boolean(membership));

      if (!membership) {
        if (typeof ack === "function") ack({ ok: false, error: "Access denied" });
        else socket.emit("error", "Access denied");
        return;
      }

      const roomName = `project-${projectId}`;

      socket.join(roomName);

      console.log(`User ${socket.user._id} joined ${roomName}`);

      socket.emit("joined-project", roomName);
      if (typeof ack === "function") ack({ ok: true, room: roomName });

    } catch (err) {
        console.error("Join error FULL:", err);
      console.error("Join error:", err.message);
      if (typeof ack === "function") ack({ ok: false, error: "Failed to join project" });
      else socket.emit("error", "Failed to join project");
      console.log("");
    }
  });

  //Send message
  socket.on("send-message", async ({ projectId, content }, ack) => {
    try {
      if (!socket.user || !socket.user._id) {
        socket.disconnect(true);
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        if (typeof ack === "function") ack({ ok: false, error: "Invalid projectId" });
        else socket.emit("error", "Invalid projectId");
        return;
      }

      if (typeof content !== "string" || content.trim().length === 0) {
        if (typeof ack === "function") ack({ ok: false, error: "Invalid message data" });
        else socket.emit("error", "Invalid message data");
        return;
      }

      // to check sender is an active team member
      const membership = await Team.findOne({
        projectId,
        userId: socket.user._id,
        status: "active",
        isDeleted: false,
      }).select("_id");

      if (!membership) {
        if (typeof ack === "function") ack({ ok: false, error: "Access denied" });
        else socket.emit("error", "Access denied");
        return;
      }

      const roomName = `project-${projectId}`;

      //Save message
      const message = await Message.create({
        projectId,
        senderId: socket.user._id,
        content: content.trim(),
        messageType: "text",
      });

      await message.populate("senderId", "name email avatar");

      // Broadcast to room
      io.to(roomName).emit("new-message", {
        _id: message._id,
        projectId: String(message.projectId),
        sender: message.senderId,
        content: message.content,
        messageType: message.messageType,
        createdAt: message.createdAt,
      });

      if (typeof ack === "function") ack({ ok: true, data: { messageId: message._id } });

    } catch (err) {
      console.error("❌ Message error:", err.message);
      if (typeof ack === "function") ack({ ok: false, error: "Failed to send message" });
      else socket.emit("error", "Failed to send message");
    }
  });

   // TYPING START
  socket.on("typing", ({ projectId }) => {
    const roomName = `project-${projectId}`;

    socket.to(roomName).emit("user-typing", {
      userId: socket.user._id,
      name: socket.user.name, 
    });
  });

  // STOP TYPING
  socket.on("stop-typing", ({ projectId }) => {
    const roomName = `project-${projectId}`;

    socket.to(roomName).emit("user-stop-typing", {
      userId: socket.user._id,
    });
  });

};
