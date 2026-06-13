import { WebSocketServer } from "ws";
import { handleMessage, handleDisconnect } from "./handerFunctions";
import { connections } from "./lib/context";
import { verifyRoomToken } from "./lib/ws-auth";

const PORT = Number(process.env.WS_PORT) || 3001;
const ALLOWED_ORIGIN =
  process.env.NEXT_PUBLIC_WEB_APP_URL || process.env.WEB_APP_URL;

const wss = new WebSocketServer({
  port: PORT,
  maxPayload: 64 * 1024,
  verifyClient: (info, callback) => {
    if (!ALLOWED_ORIGIN) {
      callback(true);
      return;
    }

    const origin = info.origin;
    if (!origin || origin === ALLOWED_ORIGIN) {
      callback(true);
      return;
    }

    callback(false, 403, "Forbidden");
  },
});

wss.on("connection", async (ws, req) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const auth = await verifyRoomToken(url.searchParams.get("token"));

  if (!auth) {
    ws.close(4401, "Unauthorized");
    return;
  }

  connections.set(ws, {
    ws,
    auth,
    user: null,
    roomId: "",
    status: "pending",
  });

  console.log(`Client connected (user=${auth.userId}, room=${auth.roomId})`);

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
