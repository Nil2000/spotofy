import type { WebSocket } from "ws";
import { ServerEvents } from "../constants";
import { getRoom } from "../lib/context";
import { getJoinedConnection } from "../lib/guards";
import { sendQueueUpdate } from "../lib/join-helpers";
import { broadcastToRoom, send } from "../lib/messaging";

export async function handleNextSong(ws: WebSocket) {
  const ctx = getJoinedConnection(ws);
  if (!ctx) return;

  const { conn } = ctx;

  const room = getRoom(conn.roomId);
  if (!room) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Room not found" },
    });
  }

  if (conn.user!.userId !== room.getAdminId()) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Only admin can skip to next song" },
    });
  }

  const song = await room.playNextSong();

  broadcastToRoom(conn.roomId, {
    type: ServerEvents.NOW_PLAYING_UPDATED,
    payload: { song: song ?? null },
  });

  await sendQueueUpdate(conn.roomId, room);
}

export async function handlePlayCurrentSong(ws: WebSocket) {
  const ctx = getJoinedConnection(ws);
  if (!ctx) return;

  const { conn } = ctx;

  const room = getRoom(conn.roomId);
  if (!room) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Room not found" },
    });
  }

  const song = await room.getCurrentSong();

  broadcastToRoom(conn.roomId, {
    type: ServerEvents.NOW_PLAYING_UPDATED,
    payload: { song: song ?? null },
  });
}
