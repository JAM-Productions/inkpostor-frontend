import { io } from "socket.io-client";
import { SERVICE_URL } from "./config";

// Re-exported so existing importers keep working; the definition lives in
// ./config, which carries no socket.io weight.
export { SERVICE_URL };

export const socket = io(SERVICE_URL as string, {
  autoConnect: false, // Wait until user joins
});
