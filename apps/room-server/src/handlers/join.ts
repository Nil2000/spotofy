import type { WebSocket } from "ws";
import { ServerEvents } from "../constants";
import { connections, roomCache } from "../lib/context";
import {
  completeDirectJoin,
  notifyPendingUsersOnAdminJoin,
  sendJoinedSnapshotToClient,
} from "../lib/join-helpers";
import {
  broadcastToRoom,
  send,
  sendToAdmin,
  sendUserLimitReached,
} from "../lib/messaging";
import { Room } from "../room";
import type { JoinRoomMessage } from "../types";

export async function handleJoinRoom(ws: WebSocket, msg: JoinRoomMessage) {
  const { roomId, user } = msg.payload;

  const existing = connections.get(ws);
  if (
    existing?.status === "joined" &&
    existing.roomId === roomId &&
    existing.user?.userId === user.userId
  ) {
    const cachedRoom = roomCache.get(roomId);
    if (cachedRoom) {
      await sendJoinedSnapshotToClient(ws, roomId, cachedRoom, user.userId);
    }
    return;
  }

  let room: Room | null = roomCache.get(roomId) ?? null;
  if (!room) {
    room = await Room.find(roomId);
    if (!room) {
      send(ws, {
        type: ServerEvents.ERROR,
        payload: { message: "Room not found" },
      });
      connections.delete(ws);
      return;
    }
    roomCache.set(roomId, room);
  }

  connections.set(ws, { ws, user, roomId, status: "pending" });

  if (user.userId === room.getAdminId()) {
    room.setAdminStatus(true);
    broadcastToRoom(roomId, {
      type: ServerEvents.ADMIN_JOINED,
      payload: {},
    });

    await notifyPendingUsersOnAdminJoin(roomId, room);

    const userRequests = room.getUsersRequestedList();
    if (userRequests.length > 0) {
      send(ws, {
        type: ServerEvents.PENDING_JOIN_REQUESTS,
        payload: { users: userRequests },
      });
    }

    const requestedSongs = await room.loadRequestedSongs();
    if (requestedSongs.length > 0) {
      send(ws, {
        type: ServerEvents.PENDING_SONG_REQUESTS,
        payload: { songs: requestedSongs },
      });
    }
  } else {
    if (room.isAtUserCapacity(user.userId)) {
      sendUserLimitReached(ws, room.getConfig().maxUsers);
      return;
    }

    if (!room.isAdminJoined()) {
      send(ws, {
        type: ServerEvents.WAITING_FOR_ADMIN,
        payload: {},
      });

      room.addUserRequest(user, ws);
      return;
    }
    if (!room.isAutoApproveUsers()) {
      if (room.checkUserRequestedAlready(user.userId)) {
        send(ws, {
          type: ServerEvents.JOIN_ALREADY_PENDING,
          payload: {},
        });
        return;
      }

      room.addUserRequest(user, ws);

      sendToAdmin(roomId, room, {
        type: ServerEvents.USER_JOIN_REQUESTED,
        payload: {
          userId: user.userId,
          username: user.username,
        },
      });
      return;
    }
  }

  connections.get(ws)!.status = "joined";
  room.addUser(user);

  await completeDirectJoin(ws, roomId, room, user.userId);
}
