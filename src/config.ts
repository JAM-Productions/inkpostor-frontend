// Where the game service lives. It sits in its own module rather than next to
// the socket, so that reading it does not drag socket.io-client into whatever
// is doing the reading — the join screen only wants a URL to health-check.
export const SERVICE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.MODE === "production" ? undefined : "http://localhost:3001");
