import type { WebSocket } from "ws";
import { ServerEvents } from "../constants";
import type { Room } from "../room";
import type { OutgoingMessage } from "../types";
import { connections } from "./context";

export function send(ws: WebSocket, message: OutgoingMessage) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

export function broadcastToRoom(roomId: string, message: OutgoingMessage) {
  for (const [, conn] of connections) {
    if (conn.roomId === roomId && conn.status === "joined") {
      send(conn.ws, message);
    }
  }
}

export function sendToAdmin(roomId: string, room: Room, message: OutgoingMessage) {
  const adminId = room.getAdminId();
  for (const [, conn] of connections) {
    if (conn.roomId === roomId && conn.user?.userId === adminId) {
      send(conn.ws, message);
    }
  }
}

export function sendToUser(userId: string, message: OutgoingMessage) {
  for (const [, conn] of connections) {
    if (conn.user?.userId === userId) {
      send(conn.ws, message);
    }
  }
}

export function sendUserLimitReached(ws: WebSocket, maxUsers: number) {
  send(ws, {
    type: ServerEvents.ROOM_USER_LIMIT_REACHED,
    payload: { maxUsers },
  });
}

export async function sendUserUpvotesUsage(
  ws: WebSocket,
  room: Room,
  userId: string,
) {
  const used = await room.getUserUpvoteCount(userId);
  send(ws, {
    type: ServerEvents.USER_UPVOTES_USAGE,
    payload: { used, maxUpvotes: room.getConfig().maxUpvotes },
  });
}
