import { WebSocketServer } from "ws";
import { handleMessage, handleDisconnect } from "./handerFunctions";

const PORT = Number(process.env.WS_PORT) || 3001;
const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws) => {
  console.log("client connected");

  ws.on("message", (data) => {
    handleMessage(ws, data.toString()).catch((err) => {
      console.error("message handler error:", err);
    });
  });

  ws.on("close", () => {
    console.log("client disconnected");
    handleDisconnect(ws);
  });

  ws.on("error", (err) => {
    console.error("ws error:", err);
    handleDisconnect(ws);
  });
});

console.log(`WebSocket server running on port ${PORT}`);
