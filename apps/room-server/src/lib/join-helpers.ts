import type { WebSocket } from "ws";
import { ServerEvents } from "../constants";
import type { Room } from "../room";
import type { UserPayload } from "../types";
import { connections } from "./context";
import {
  broadcastToRoom,
  send,
  sendToAdmin,
  sendUserLimitReached,
} from "./messaging";

export type UserPayloadWithWs = UserPayload & { ws: WebSocket };

export async function sendQueueUpdate(roomId: string, room: Room) {
  const queue = await room.loadSongs();
  broadcastToRoom(roomId, {
    type: ServerEvents.QUEUE_UPDATED,
    payload: { queue },
  });
}

export function sendPendingListToAdmin(roomId: string, room: Room) {
  sendToAdmin(roomId, room, {
    type: ServerEvents.PENDING_JOIN_REQUESTS,
    payload: { users: room.getUsersRequestedList() },
  });
}

async function broadcastRoomSnapshot(roomId: string, room: Room) {
  const currentSong = await room.getCurrentSong();
  const queue = await room.loadSongs();

  broadcastToRoom(roomId, {
    type: ServerEvents.MEMBERS_UPDATED,
    payload: { users: room.getUsers() },
  });

  broadcastToRoom(roomId, {
    type: ServerEvents.NOW_PLAYING_UPDATED,
    payload: { song: currentSong ?? null },
  });

  broadcastToRoom(roomId, {
    type: ServerEvents.QUEUE_UPDATED,
    payload: { queue },
  });
}

export async function sendJoinedSnapshotToClient(
  ws: WebSocket,
  roomId: string,
  room: Room,
  userId: string,
) {
  const currentSong = await room.getCurrentSong();
  const queue = await room.loadSongs();
  const upvotesUsed = await room.getUserUpvoteCount(userId);

  send(ws, {
    type: ServerEvents.ROOM_JOINED,
    payload: { roomId, config: room.getConfig(), upvotesUsed },
  });
  send(ws, {
    type: ServerEvents.MEMBERS_UPDATED,
    payload: { users: room.getUsers() },
  });
  send(ws, {
    type: ServerEvents.NOW_PLAYING_UPDATED,
    payload: { song: currentSong ?? null },
  });
  send(ws, {
    type: ServerEvents.QUEUE_UPDATED,
    payload: { queue },
  });
}

export async function admitUserToRoom(
  roomId: string,
  room: Room,
  user: UserPayloadWithWs,
) {
  if (room.isAtUserCapacity(user.userId)) {
    sendUserLimitReached(user.ws, room.getConfig().maxUsers);
    return false;
  }

  const existing = connections.get(user.ws);
  if (!existing?.auth) {
    return false;
  }

  connections.set(user.ws, {
    ...existing,
    user: {
      userId: user.userId,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
    },
    roomId,
    status: "joined",
  });
  room.addUser({
    userId: user.userId,
    email: user.email,
    username: user.username,
    isAdmin: user.isAdmin,
  });
  room.removeUserRequest(user.userId);

  const upvotesUsed = await room.getUserUpvoteCount(user.userId);

  send(user.ws, {
    type: ServerEvents.ROOM_JOINED,
    payload: {
      roomId,
      config: room.getConfig(),
      upvotesUsed,
    },
  });

  await broadcastRoomSnapshot(roomId, room);
  return true;
}

export async function notifyPendingUsersOnAdminJoin(
  roomId: string,
  room: Room,
) {
  const pendingUsers = room.getPendingUserRequests();

  for (const pendingUser of pendingUsers) {
    if (room.isAutoApproveUsers()) {
      const admitted = await admitUserToRoom(roomId, room, pendingUser);
      if (!admitted) {
        room.removeUserRequest(pendingUser.userId);
      }
    } else if (!room.isAtUserCapacity(pendingUser.userId)) {
      send(pendingUser.ws, {
        type: ServerEvents.ADMIN_JOINED,
        payload: {},
      });
    } else {
      sendUserLimitReached(pendingUser.ws, room.getConfig().maxUsers);
      room.removeUserRequest(pendingUser.userId);
    }
  }
}

export async function completeDirectJoin(
  ws: WebSocket,
  roomId: string,
  room: Room,
  userId: string,
) {
  const upvotesUsed = await room.getUserUpvoteCount(userId);

  send(ws, {
    type: ServerEvents.ROOM_JOINED,
    payload: {
      roomId,
      config: room.getConfig(),
      upvotesUsed,
    },
  });

  await broadcastRoomSnapshot(roomId, room);
}
