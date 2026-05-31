import { useEffect } from "react";
import { io } from "socket.io-client";

const SOCKET_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SOCKET_URL) ||
  "http://localhost:5000";

function SocketTest() {
  useEffect(() => {
    const token = window?.localStorage?.getItem("token") || "";

    const socket = io(SOCKET_URL, {
      auth: {
        token: token ? `Bearer ${token}` : "",
      },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      // Debug-only page: don't hardcode ObjectIds or auto-emit.
      console.log("Connected");
    });
    

    socket.on("disconnect", () => {
      console.log("Disconnected");
    });
    

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 8 }}>Socket Debug</h2>
      <p style={{ opacity: 0.8 }}>
        This page is for local debugging only and is not linked from the app.
      </p>
    </div>
  );
}

export default SocketTest;
