import { io } from "socket.io-client";

const SOCKET_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SOCKET_URL) ||
  "http://localhost:5000";

let socketInstance = null;

export const getSocket = () => {
  if (!socketInstance) {
    const token = (() => {
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
    })();

    socketInstance = io(SOCKET_URL, {
      auth: {
        token: token ? `Bearer ${token}` : "",
      },
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }
  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};

