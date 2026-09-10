const USE_MOCK = !import.meta.env.VITE_API_URL;

function generateTeamId() {
  const n = Math.floor(Math.random() * 50) + 1;
  return `BIT-AI-${String(n).padStart(3, "0")}`;
}

async function callBackend(action, payload) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    if (action === "REGISTER_TEAM") {
      return { success: true, teamId: generateTeamId() };
    }
    if (action === "GET_DOMAINS") {
      return {
        domains: [
          { id: "AGR", name: "AgriTech AI", capacity: 12, filled: 8, status: "OPEN" },
          { id: "HLT", name: "HealthTech AI", capacity: 12, filled: 12, status: "FULL" },
          { id: "FIN", name: "FinTech AI", capacity: 12, filled: 5, status: "OPEN" },
          { id: "EDU", name: "EdTech AI", capacity: 12, filled: 3, status: "OPEN" },
        ],
      };
    }
    return { success: true };
  }

  const res = await fetch(import.meta.env.VITE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action, ...payload }),
  });
  return res.json();
}

export const registerTeam = (data) => callBackend("REGISTER_TEAM", data);
export const getDomains = () => callBackend("GET_DOMAINS");