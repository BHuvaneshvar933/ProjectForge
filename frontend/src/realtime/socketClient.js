import { io } from "socket.io-client";

let socket;

const SOCKET_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SOCKET_URL) ||
  "http://localhost:5000";

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
    auth: {
      token: token ? `Bearer ${token}` : "",
    },
    transports: ["websocket"],
  });

  return socket;
};

export const disconnectSocket = () => {
  if (!socket) return;
  socket.disconnect();
  socket = undefined;
};
