
const { spawn } = require("node:child_process");
const path = require("node:path");
const readline = require("node:readline");

const PROJECT_ROOT = path.resolve(__dirname, "../../../");
const ENGINE_BIN = path.join(PROJECT_ROOT, "engine", "bin");

const SIMULATIONS = {
  shared_counter: {
    executable: "shared_counter",
    modes: ["race", "mutex"],
  },
  producer_consumer: {
    executable: "producer_consumer",
    modes: [],
  },
  dining_philosophers: {
    executable: "dining_philosophers",
    modes: ["deadlock", "prevention"],
  },
  readers_writers: {
    executable: "readers_writers",
    modes: [],
  },
};

const activeSimulations = new Map();

function startSimulation({
  simulationId,
  problem,
  mode,
  onEvent,
  onExit,
}) {
  const config = SIMULATIONS[problem];

  if (!config) {
    throw new Error(`Unknown simulation problem: ${problem}`);
  }

  if (activeSimulations.has(simulationId)) {
    throw new Error(`Simulation ID already exists: ${simulationId}`);
  }

  if (config.modes.length > 0 && !config.modes.includes(mode)) {
    throw new Error(
      `Invalid mode "${mode}" for simulation "${problem}"`
    );
  }

  const executablePath = path.join(
    ENGINE_BIN,
    config.executable
  );

  const args = [];

  if (problem === "shared_counter") {
    args.push(mode === "mutex" ? "1" : "0");
  }

  if (problem === "dining_philosophers") {
    args.push(mode === "prevention" ? "1" : "0");
  }

  const child = spawn(executablePath, args, {
    cwd: PROJECT_ROOT,
    stdio: ["ignore", "pipe", "pipe"],
  });

  const stdout = readline.createInterface({
    input: child.stdout,
    crlfDelay: Infinity,
  });

  const stderr = readline.createInterface({
    input: child.stderr,
    crlfDelay: Infinity,
  });

  const simulation = {
    simulationId,
    problem,
    mode: mode || null,
    process: child,
    status: "running",
    startedAt: new Date().toISOString(),
    stderrMessages: [],
  };

  activeSimulations.set(simulationId, simulation);

  stdout.on("line", (line) => {
    try {
      const event = JSON.parse(line);

      onEvent({
        simulationId,
        ...event,
      });
    } catch (error) {
      onEvent({
        simulationId,
        event: "engine_output_error",
        message: "The C engine emitted invalid JSON.",
        output: line,
      });
    }
  });

  stderr.on("line", (line) => {
    simulation.stderrMessages.push(line);
  });

  child.on("error", (error) => {
    simulation.status = "failed";

    onEvent({
      simulationId,
      event: "simulation_error",
      message: error.message,
    });
  });

  child.on("close", (code, signal) => {
    simulation.status = code === 0 ? "completed" : "failed";
    simulation.exitCode = code;
    simulation.signal = signal;
    simulation.finishedAt = new Date().toISOString();

    onExit({
      simulationId,
      problem,
      mode: mode || null,
      status: simulation.status,
      exitCode: code,
      signal,
      stderr: simulation.stderrMessages,
    });

    activeSimulations.delete(simulationId);
  });

  return {
    simulationId,
    problem,
    mode: mode || null,
    pid: child.pid,
    status: simulation.status,
  };
}

function getActiveSimulations() {
  return Array.from(activeSimulations.values()).map(
    ({ process, stderrMessages, ...simulation }) => simulation
  );
}

function stopSimulation(simulationId) {
  const simulation = activeSimulations.get(simulationId);

  if (!simulation) {
    return false;
  }

  simulation.process.kill("SIGTERM");
  return true;
}

module.exports = {
  startSimulation,
  getActiveSimulations,
  stopSimulation,
  SIMULATIONS,
};
