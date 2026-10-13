import { createContext, useContext, useState, useCallback } from "react";

const SimulationContext = createContext(null);

export function SimulationProvider({ children }) {
  const [simulation, setSimulation] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetSimulation = useCallback(() => {
    setSimulation(null);
    setEvents([]);
    setError("");
  }, []);

  const addEvent = useCallback((event) => {
    setEvents((previous) => [...previous, event].slice(-500));
  }, []);

  const value = {
    simulation,
    setSimulation,
    events,
    setEvents,
    addEvent,
    loading,
    setLoading,
    error,
    setError,
    resetSimulation,
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);

  if (!context) {
    throw new Error(
      "useSimulation must be used inside SimulationProvider"
    );
  }

  return context;
}
