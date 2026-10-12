
const simulationService = require("../services/simulationService");

function startSimulation(req, res, next) {
  try {
    const { problem, mode } = req.body || {};
    const io = req.app.get("io");

    const started = simulationService.start(problem, mode, io);

    res.status(202).json({
      message: "Simulation started",
      simulation: started,
    });
  } catch (error) {
    next(error);
  }
}

function listSimulations(req, res) {
  res.json({
    simulations: simulationService.listSimulations(),
  });
}

function getSimulation(req, res) {
  const simulation = simulationService.getSimulation(
    req.params.id
  );

  if (!simulation) {
    return res.status(404).json({
      error: "Simulation not found",
    });
  }

  res.json({ simulation });
}

function stopSimulation(req, res) {
  const stopped = simulationService.stop(req.params.id);

  if (!stopped) {
    return res.status(404).json({
      error: "Simulation is not active",
    });
  }

  res.json({ message: "Stop signal sent" });
}

module.exports = {
  startSimulation,
  listSimulations,
  getSimulation,
  stopSimulation,
};
