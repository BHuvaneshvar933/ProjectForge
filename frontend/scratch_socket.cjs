const { io } = require("socket.io-client");
const token = process.argv[2];

const URL = "http://localhost:5001";
const MAX_CLIENTS = 100;
const CLIENT_CREATION_INTERVAL_IN_MS = 10;

let clientCount = 0;
let connectedCount = 0;
let latencies = [];

const createClient = () => {
  const socket = io(URL, { transports: ["websocket"], auth: { token } });
  
  const start = performance.now();

  socket.on("connect", () => {
    connectedCount++;
    latencies.push(performance.now() - start);
    socket.emit("ping");
    
    if (connectedCount === MAX_CLIENTS) {
      const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      console.log(`Successfully connected ${MAX_CLIENTS} concurrent socket clients.`);
      console.log(`Average connection latency: ${avg.toFixed(2)} ms`);
      process.exit(0);
    }
  });

  socket.on("connect_error", (err) => {
    // If the server rejects the connection because no token (Unauthorized), we expect that!
    // We just want to measure how fast the server handles the connection attempt.
    connectedCount++;
    latencies.push(performance.now() - start);
    
    if (connectedCount === MAX_CLIENTS) {
      const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      console.log(`Successfully handled ${MAX_CLIENTS} concurrent socket connection attempts (including Auth rejections).`);
      console.log(`Average latency: ${avg.toFixed(2)} ms`);
      process.exit(0);
    }
  });

  clientCount++;
  if (clientCount < MAX_CLIENTS) {
    setTimeout(createClient, CLIENT_CREATION_INTERVAL_IN_MS);
  }
};

createClient();
