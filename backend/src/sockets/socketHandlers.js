import mongoose from "mongoose";
import Team from "../models/team.model.js";
import Message from "../models/message.model.js";

const ensureProjectMember = async ({ projectId, userId }) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid projectId");
  }

  const membership = await Team.findOne({
    projectId,
    userId,
    status: "active",
    isDeleted: false,
  })
    .select("_id")
    .lean();

  if (!membership) {
    throw new Error("Access denied");
  }

  return true;
};

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

       console.log("Checking membership for user:", String(socket.user._id));

       await ensureProjectMember({ projectId, userId: socket.user._id });

       const roomName = `project-${projectId}`;

      socket.join(roomName);

      console.log(`User ${socket.user._id} joined ${roomName}`);

      socket.emit("joined-project", roomName);
      if (typeof ack === "function") ack({ ok: true, room: roomName });

    } catch (err) {
        console.error("Join error FULL:", err);
      console.error("Join error:", err.message);
      const msg = err?.message === "Invalid projectId" ? "Invalid projectId" : err?.message === "Access denied" ? "Access denied" : "Failed to join project";
      if (typeof ack === "function") ack({ ok: false, error: msg });
      else socket.emit("error", msg);
      console.log("");
    }
  });

  //Send message
  socket.on("send-message", async ({ projectId, content, attachments }, ack) => {
    try {
      if (!socket.user || !socket.user._id) {
        socket.disconnect(true);
        return;
      }

      const hasContent = typeof content === "string" && content.trim().length > 0;
      const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

      if (!hasContent && !hasAttachments) {
         if (typeof ack === "function") ack({ ok: false, error: "Invalid message data" });
         else socket.emit("error", "Invalid message data");
         return;
      }

       await ensureProjectMember({ projectId, userId: socket.user._id });

      const roomName = `project-${projectId}`;

      //Save message
      const message = await Message.create({
        projectId,
        senderId: socket.user._id,
        content: content ? content.trim() : "",
        messageType: "text",
        attachments: hasAttachments ? attachments : [],
      });

      await message.populate("senderId", "name email avatar");

      // Broadcast to room
      io.to(roomName).emit("new-message", {
        _id: message._id,
        projectId: String(message.projectId),
        sender: message.senderId,
        content: message.content,
        messageType: message.messageType,
        attachments: message.attachments,
        isEdited: message.isEdited,
        isDeleted: message.isDeleted,
        createdAt: message.createdAt,
      });

      if (typeof ack === "function") ack({ ok: true, data: { messageId: message._id } });

    } catch (err) {
      console.error("❌ Message error:", err.message);
      const msg = err?.message === "Invalid projectId" ? "Invalid projectId" : err?.message === "Access denied" ? "Access denied" : "Failed to send message";
      if (typeof ack === "function") ack({ ok: false, error: msg });
      else socket.emit("error", msg);
    }
  });

  // Edit Message
  socket.on("edit-message", async ({ projectId, messageId, content }, ack) => {
    try {
      if (!socket.user || !socket.user._id) {
        return;
      }

      await ensureProjectMember({ projectId, userId: socket.user._id });

      const message = await Message.findOne({ _id: messageId, projectId, senderId: socket.user._id, isDeleted: false });
      if (!message) {
        if (typeof ack === "function") ack({ ok: false, error: "Message not found or access denied" });
        return;
      }

      message.content = content.trim();
      message.isEdited = true;
      message.editedAt = new Date();
      await message.save();

      const roomName = `project-${projectId}`;
      io.to(roomName).emit("message-edited", {
        _id: message._id,
        content: message.content,
        isEdited: true,
        editedAt: message.editedAt,
      });

      if (typeof ack === "function") ack({ ok: true });
    } catch (err) {
      if (typeof ack === "function") ack({ ok: false, error: "Failed to edit message" });
    }
  });

  // Delete Message
  socket.on("delete-message", async ({ projectId, messageId }, ack) => {
    try {
      if (!socket.user || !socket.user._id) {
        return;
      }

      await ensureProjectMember({ projectId, userId: socket.user._id });

      const message = await Message.findOne({ _id: messageId, projectId, senderId: socket.user._id });
      if (!message) {
        if (typeof ack === "function") ack({ ok: false, error: "Message not found or access denied" });
        return;
      }

      message.isDeleted = true;
      message.deletedAt = new Date();
      await message.save();

      const roomName = `project-${projectId}`;
      io.to(roomName).emit("message-deleted", {
        _id: message._id,
      });

      if (typeof ack === "function") ack({ ok: true });
    } catch (err) {
      if (typeof ack === "function") ack({ ok: false, error: "Failed to delete message" });
    }
  });

   // TYPING START
  socket.on("typing", async ({ projectId }, ack) => {
    try {
      if (!socket.user || !socket.user._id) {
        socket.disconnect(true);
        return;
      }

      await ensureProjectMember({ projectId, userId: socket.user._id });

      const roomName = `project-${projectId}`;

      socket.to(roomName).emit("user-typing", {
        userId: socket.user._id,
        name: socket.user.name,
      });

      if (typeof ack === "function") ack({ ok: true });
    } catch (err) {
      const msg = err?.message === "Invalid projectId" ? "Invalid projectId" : err?.message === "Access denied" ? "Access denied" : "Failed";
      if (typeof ack === "function") ack({ ok: false, error: msg });
    }
  });

  // STOP TYPING
  socket.on("stop-typing", async ({ projectId }, ack) => {
    try {
      if (!socket.user || !socket.user._id) {
        socket.disconnect(true);
        return;
      }

      await ensureProjectMember({ projectId, userId: socket.user._id });

      const roomName = `project-${projectId}`;

      socket.to(roomName).emit("user-stop-typing", {
        userId: socket.user._id,
      });

      if (typeof ack === "function") ack({ ok: true });
    } catch (err) {
      const msg = err?.message === "Invalid projectId" ? "Invalid projectId" : err?.message === "Access denied" ? "Access denied" : "Failed";
      if (typeof ack === "function") ack({ ok: false, error: msg });
    }
  });

};
