import { io } from "socket.io-client";

// the server runs on 3001 locally
export const SERVER_URL =
  import.meta.env.MODE === "production" ? undefined : "http://localhost:3001";

export const socket = io(SERVER_URL as string, {
  autoConnect: false, // Wait until user joins
});
