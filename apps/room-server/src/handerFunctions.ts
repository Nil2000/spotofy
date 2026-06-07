import type { WebSocket } from "ws";
import { ClientEvents, ServerEvents } from "./constants";
import { handleJoinRoom } from "./handlers/join";
import { handleNextSong, handlePlayCurrentSong } from "./handlers/playback";
import {
  handleApproveSong,
  handleRejectSong,
  handleRequestSong,
  handleUpvote,
} from "./handlers/songs";
import { handleApproveUser, handleRejectUser } from "./handlers/users";
import { connections, roomCache } from "./lib/context";
import { broadcastToRoom, send } from "./lib/messaging";
import { IncomingMessageSchema, type IncomingMessage } from "./types";

export async function handleMessage(ws: WebSocket, raw: string) {
  let msg: IncomingMessage;
  try {
    const parsedMessage = IncomingMessageSchema.safeParse(JSON.parse(raw));

    if (!parsedMessage.success) {
      return send(ws, {
        type: ServerEvents.ERROR,
        payload: { message: "Invalid message payload" },
      });
    }

    msg = parsedMessage.data;
  } catch {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Invalid JSON" },
    });
  }

  switch (msg.type) {
    case ClientEvents.JOIN_ROOM:
      return handleJoinRoom(ws, msg);
    case ClientEvents.REQUEST_SONG:
      return handleRequestSong(ws, msg);
    case ClientEvents.UPVOTE_SONG:
      return handleUpvote(ws, msg);
    case ClientEvents.APPROVE_SONG:
      return handleApproveSong(ws, msg);
    case ClientEvents.REJECT_SONG:
      return handleRejectSong(ws, msg);
    case ClientEvents.APPROVE_USER:
      return handleApproveUser(ws, msg);
    case ClientEvents.REJECT_USER:
      return handleRejectUser(ws, msg);
    case ClientEvents.SYNC_NOW_PLAYING:
      return handlePlayCurrentSong(ws);
    case ClientEvents.SKIP_TO_NEXT:
      return handleNextSong(ws);
    default:
      console.log("MESSAGE_TYPE: ", msg);
      return send(ws, {
        type: ServerEvents.ERROR,
        payload: { message: "Unknown message type" },
      });
  }
}

export function handleDisconnect(ws: WebSocket) {
  const conn = connections.get(ws);
  connections.delete(ws);

  if (!conn?.user) return;

  const room = roomCache.get(conn.roomId);
  if (!room) return;

  if (conn.user.isAdmin) {
    room.setAdminStatus(false);

    broadcastToRoom(conn.roomId, {
      type: ServerEvents.ADMIN_LEFT,
      payload: {},
    });
  }

  if (conn.status === "joined") {
    room.removeUser(conn.user.userId);
  } else {
    room.removeUserRequest(conn.user.userId);
  }

  broadcastToRoom(conn.roomId, {
    type: ServerEvents.MEMBERS_UPDATED,
    payload: { users: room.getUsers() },
  });

  const hasRemaining = Array.from(connections.values()).some(
    (c) => c.roomId === conn.roomId,
  );
  if (!hasRemaining) {
    roomCache.delete(conn.roomId);
  }
}
