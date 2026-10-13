const API_URL = "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

export function startSimulation(problem, mode) {
  return request("/simulations", {
    method: "POST",
    body: JSON.stringify({ problem, mode }),
  });
}

export function getSimulation(id) {
  return request(`/simulations/${id}`);
}

export function getSimulations() {
  return request("/simulations");
}

export function stopSimulation(id) {
  return request(`/simulations/${id}/stop`, {
    method: "POST",
  });
}