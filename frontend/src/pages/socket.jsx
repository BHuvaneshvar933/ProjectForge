import { useEffect } from "react";
import { io } from "socket.io-client";

function SocketTest() {
  useEffect(() => {
    const socket = io("http://localhost:5000", {
  auth: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YTJhODI3MWU2NzBkYjM4NGQxNzY1MCIsImlhdCI6MTc3NDI1OTc2MCwiZXhwIjoxNzc0ODY0NTYwfQ.SoZo5_NvFmkyar-ksvf1a-GLh67rgRz0eOL4x9tE72o" //token: localStorage.getItem("token")
  }
});

    socket.on("connect", () => {
      console.log("✅ Connected:", socket.id);
      socket.emit("join-project", "69a291151ac032db518673d0");
      socket.emit("send-message", {
  projectId: "69a291151ac032db518673d0",
  content: "Hello from ProjectForge 🚀",
});
socket.on("new-message", (msg) => {
  console.log("📩 New message:", msg);
});
    });
    

    socket.on("disconnect", () => {
      console.log("❌ Disconnected");
    });
    

    return () => {
      socket.disconnect();
    };
  }, []);

  return <div>Socket Test Running (check console)</div>;
}

export default SocketTest;