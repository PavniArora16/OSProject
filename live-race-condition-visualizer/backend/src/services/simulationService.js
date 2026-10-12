
const { randomUUID } = require("node:crypto");

const {
  startSimulation: launchProcess,
  getActiveSimulations,
  stopSimulation,
  SIMULATIONS,
} = require("./processManager");

const simulationHistory = new Map();
const MAX_EVENTS_PER_SIMULATION = 500;

function start(problem, mode, io) {
  if (!SIMULATIONS[problem]) {
    throw new Error(`Unknown problem: ${problem}`);
  }

  const simulationId = randomUUID();

  const record = {
    simulationId,
    problem,
    mode: mode || null,
    status: "starting",
    events: [],
    startedAt: new Date().toISOString(),
    result: null,
  };

  simulationHistory.set(simulationId, record);

  try {
    const started = launchProcess({
      simulationId,
      problem,
      mode,

      onEvent(event) {
        record.events.push(event);

        if (record.events.length > MAX_EVENTS_PER_SIMULATION) {
          record.events.shift();
        }

        if (event.event === "simulation_started") {
          record.status = "running";
        }

        io.emit("simulation:event", event);
      },

      onExit(result) {
        record.status = result.status;
        record.finishedAt = new Date().toISOString();
        record.result = result;

        io.emit("simulation:finished", result);
      },
    });

    record.pid = started.pid;
    record.status = started.status;

    return {
      simulationId,
      problem,
      mode: mode || null,
      pid: started.pid,
      status: record.status,
    };
  } catch (error) {
    simulationHistory.delete(simulationId);
    throw error;
  }
}

function listSimulations() {
  return Array.from(simulationHistory.values()).map(
    ({ events, ...simulation }) => ({
      ...simulation,
      eventCount: events.length,
    })
  );
}

function getSimulation(simulationId) {
  return simulationHistory.get(simulationId) || null;
}

function stop(simulationId) {
  return stopSimulation(simulationId);
}

module.exports = {
  start,
  listSimulations,
  getSimulation,
  stop,
  SIMULATIONS,
};
