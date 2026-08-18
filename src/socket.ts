import { io } from "socket.io-client";
import { SERVICE_URL } from "./config";

export { SERVICE_URL };

export const socket = io(SERVICE_URL as string, {
  autoConnect: false, // Wait until user joins
});
