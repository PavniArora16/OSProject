
const express = require("express");
const cors = require("cors");

const simulationRoutes = require("./routes/simulationRoutes");
const errorHandler = require("./middleware/errorHandler");

function createApp(io) {
  const app = express();

  app.set("io", io);

  app.use(cors({
    origin: ["http://localhost:5173"],
  }));

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "OS Synchronization Backend",
    });
  });

  app.use("/api/simulations", simulationRoutes);

  app.use((req, res) => {
    res.status(404).json({
      error: "Route not found",
    });
  });

  app.use(errorHandler);

  return app;
}

module.exports = createApp;
