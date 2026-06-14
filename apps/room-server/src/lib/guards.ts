import type { WebSocket } from "ws";
import { ServerEvents } from "../constants";
import type { ClientConnection } from "../types";
import { connections } from "./context";
import { send } from "./messaging";

export type HandlerContext = {
  ws: WebSocket;
  conn: ClientConnection;
};

function sendError(ws: WebSocket, message: string) {
  send(ws, { type: ServerEvents.ERROR, payload: { message } });
}

export function getJoinedConnection(ws: WebSocket): HandlerContext | null {
  const conn = connections.get(ws);
  if (!conn || !conn.user) {
    sendError(ws, "Not in a room");
    return null;
  }
  if (conn.status !== "joined") {
    sendError(ws, "You have not joined this room yet");
    return null;
  }
  return { ws, conn };
}
