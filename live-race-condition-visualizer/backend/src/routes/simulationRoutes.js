
const express = require("express");

const controller = require("../controllers/simulationController");

const router = express.Router();

router.post("/", controller.startSimulation);
router.get("/", controller.listSimulations);
router.get("/:id", controller.getSimulation);
router.post("/:id/stop", controller.stopSimulation);

module.exports = router;
