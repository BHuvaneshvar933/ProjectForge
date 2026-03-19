import mongoose from "mongoose";
import Team from "../models/team.model.js";
import Message from "../models/message.model.js";

const roomForProject = (projectId) => `project-${projectId}`;

const ensureProjectMember = async ({ projectId, userId }) => {
  const membership = await Team.findOne({
    projectId,
    userId,
    status: "active",
    isDeleted: false,
  }).select("_id");

  return Boolean(membership);
};

export const registerSocketHandlers = (io, socket) => {
  socket.on("join-project", async (projectId, ack) => {
    try {
      if (!socket.user || !socket.user.id) {
        socket.disconnect(true);
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        if (typeof ack === "function") ack({ ok: false, error: "Invalid projectId" });
        return;
      }

      const ok = await ensureProjectMember({
        projectId,
        userId: socket.user?.id,
      });

      if (!ok) {
        if (typeof ack === "function") ack({ ok: false, error: "Not authorized" });
        return;
      }

      const room = roomForProject(projectId);
      if (!socket.rooms.has(room)) {
        socket.join(room);
      }
      if (typeof ack === "function") ack({ ok: true });
    } catch {
      if (typeof ack === "function") ack({ ok: false, error: "Join failed" });
    }
  });

  socket.on("send-message", async (data, ack) => {
    try {
      if (!socket.user || !socket.user.id) {
        socket.disconnect(true);
        return;
      }

      const projectId = data?.projectId;
      const content = data?.content;
      const messageType = data?.messageType || "text";

      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        if (typeof ack === "function") ack({ ok: false, error: "Invalid projectId" });
        return;
      }

      if (typeof content !== "string" || content.trim().length === 0) {
        if (typeof ack === "function") ack({ ok: false, error: "Message content required" });
        return;
      }

      if (content.length > 2000) {
        if (typeof ack === "function") ack({ ok: false, error: "Message too long" });
        return;
      }

      const ok = await ensureProjectMember({
        projectId,
        userId: socket.user?.id,
      });

      if (!ok) {
        if (typeof ack === "function") ack({ ok: false, error: "Not authorized" });
        return;
      }

      const message = await Message.create({
        projectId,
        senderId: socket.user.id,
        content: content.trim(),
        messageType,
      });

      io.to(roomForProject(projectId)).emit("new-message", {
        _id: message._id,
        projectId,
        senderId: socket.user.id,
        content: message.content,
        messageType: message.messageType,
        createdAt: message.createdAt,
      });

      if (typeof ack === "function") ack({ ok: true, data: { messageId: message._id } });
    } catch {
      if (typeof ack === "function") ack({ ok: false, error: "Send failed" });
    }
  });

  socket.on("typing", (projectId) => {
    if (!socket.user || !socket.user.id) {
      socket.disconnect(true);
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) return;

    socket.to(roomForProject(projectId)).emit("user-typing", {
      userId: socket.user?.id,
    });
  });

  socket.on("stop-typing", (projectId) => {
    if (!socket.user || !socket.user.id) {
      socket.disconnect(true);
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) return;

    socket.to(roomForProject(projectId)).emit("user-stop-typing", {
      userId: socket.user?.id,
    });
  });
};
