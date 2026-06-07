import type { WebSocket } from "ws";
import { ServerEvents } from "../constants";
import { getRoom } from "../lib/context";
import { getJoinedConnection } from "../lib/guards";
import {
  admitUserToRoom,
  sendPendingListToAdmin,
} from "../lib/join-helpers";
import { send, sendToUser } from "../lib/messaging";
import type { ApproveUserMessage, RejectUserMessage } from "../types";

export async function handleRejectUser(ws: WebSocket, msg: RejectUserMessage) {
  const ctx = getJoinedConnection(ws);
  if (!ctx) return;

  const { conn } = ctx;

  if (!conn.user!.isAdmin) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "User is not admin" },
    });
  }

  const room = getRoom(conn.roomId);
  if (!room) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Room not found" },
    });
  }

  room.removeUserRequest(msg.payload.userId);

  sendToUser(msg.payload.userId, {
    type: ServerEvents.USER_REJECTED,
    payload: {
      roomId: conn.roomId,
      message: "Your entry request was rejected by the admin.",
    },
  });

  sendPendingListToAdmin(conn.roomId, room);
}

export async function handleApproveUser(
  ws: WebSocket,
  msg: ApproveUserMessage,
) {
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

  if (!conn.user!.isAdmin) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "User is not admin" },
    });
  }

  const user = room.getUserRequested(msg.payload.userId);
  if (!user) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "User not found in requested list" },
    });
  }

  if (room.isAtUserCapacity(user.userId)) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: {
        message: `Room is full (${room.getConfig().maxUsers} users max)`,
      },
    });
  }

  const admitted = await admitUserToRoom(conn.roomId, room, user);
  if (!admitted) {
    send(ws, {
      type: ServerEvents.ERROR,
      payload: {
        message: `Room is full (${room.getConfig().maxUsers} users max)`,
      },
    });
    return;
  }

  sendPendingListToAdmin(conn.roomId, room);
}
