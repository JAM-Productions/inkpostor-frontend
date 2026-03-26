import { io } from "socket.io-client";

// the service runs on 3001 locally, can be overridden by VITE_BACKEND_URL
export const SERVICE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.MODE === "production" ? undefined : "http://localhost:3001");

export const socket = io(SERVICE_URL as string, {
  autoConnect: false, // Wait until user joins
});
