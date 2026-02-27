import dotenv from "dotenv";
import http from "http";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import "./src/models/index.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect DB
await connectDB();

// HTTP server
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});