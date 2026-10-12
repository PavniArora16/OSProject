
function setupSimulationSocket(io) {
  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.emit("connection:ready", {
      message: "Connected to the OS simulation server",
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}

module.exports = setupSimulationSocket;
