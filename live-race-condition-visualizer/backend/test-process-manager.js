
const {
  startSimulation,
} = require("./src/services/processManager");

const simulationId = `test-${Date.now()}`;

console.log("Starting shared counter test...");

try {
  const result = startSimulation({
    simulationId,
    problem: "shared_counter",
    mode: "mutex",

    onEvent(event) {
      console.log("EVENT:", JSON.stringify(event));
    },

    onExit(result) {
      console.log("EXIT:", JSON.stringify(result));
    },
  });

  console.log("STARTED:", JSON.stringify(result));
} catch (error) {
  console.error("FAILED:", error.message);
  process.exitCode = 1;
}
