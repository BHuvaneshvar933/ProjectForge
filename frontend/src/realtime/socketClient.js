import { io } from "socket.io-client";

let socket;

const SOCKET_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SOCKET_URL) ||
  "";

const getToken = () => {
  try {
    return (
      window?.localStorage?.getItem("token") ||
      window?.localStorage?.getItem("pf_token") ||
      window?.localStorage?.getItem("projectforge_token") ||
      ""
    );
  } catch {
    return "";
  }
};

export const getSocket = () => {
  if (socket?.connected) return socket;
  if (socket) return socket;

  const token = getToken();

  socket = io(SOCKET_URL, {
    auth: (cb) => {
      const freshToken = getToken();
      cb({ token: freshToken ? `Bearer ${freshToken}` : "" });
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connect_error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.warn("Socket disconnected:", reason);
    if (reason === "io server disconnect") {
      socket.connect();
    }
  });

  socket.on("reconnect", (attemptNumber) => {
  });

  return socket;
};

export const disconnectSocket = () => {
  if (!socket) return;
  socket.disconnect();
  socket = undefined;
};
