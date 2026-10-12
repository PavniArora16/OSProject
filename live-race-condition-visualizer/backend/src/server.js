
const http = require("node:http");
const { Server } = require("socket.io");

const createApp = require("./app");
const setupSimulationSocket = require("./sockets/simulationSocket");

const PORT = process.env.PORT || 5000;

const app = createApp(null);
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST"],
  },
});

app.set("io", io);
setupSimulationSocket(io);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
