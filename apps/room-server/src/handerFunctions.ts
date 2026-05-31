import type { WebSocket } from "ws";
import { ClientEvents, ServerEvents } from "./constants";
import { Room } from "./room";
import {
  IncomingMessageSchema,
  type ApproveSongMessage,
  type ApproveUserMessage,
  type ClientConnection,
  type IncomingMessage,
  type JoinRoomMessage,
  type OutgoingMessage,
  type RejectUserMessage,
  type RejectSongMessage,
  type RequestSongMessage,
  type UpvoteSongMessage,
  type UserPayload,
} from "./types";

const roomCache = new Map<string, Room>();
const connections = new Map<WebSocket, ClientConnection>();

function send(ws: WebSocket, message: OutgoingMessage) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function broadcastToRoom(roomId: string, message: OutgoingMessage) {
  for (const [, conn] of connections) {
    if (conn.roomId === roomId && conn.status === "joined") {
      send(conn.ws, message);
    }
  }
}

function sendToAdmin(roomId: string, room: Room, message: OutgoingMessage) {
  const adminId = room.getAdminId();
  for (const [, conn] of connections) {
    if (conn.roomId === roomId && conn.user?.userId === adminId) {
      send(conn.ws, message);
      break;
    }
  }
}

function sendToUser(userId: string, message: OutgoingMessage) {
  for (const [, conn] of connections) {
    if (conn.user?.userId === userId) {
      send(conn.ws, message);
      break;
    }
  }
}

type UserPayloadWithWs = UserPayload & { ws: WebSocket };

async function admitUserToRoom(
  roomId: string,
  room: Room,
  user: UserPayloadWithWs,
) {
  connections.set(user.ws, {
    ws: user.ws,
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

  const queue = await room.loadSongs();

  send(user.ws, {
    type: ServerEvents.ROOM_JOINED,
    payload: {
      roomId,
      config: room.getConfig(),
      queue,
    },
  });

  broadcastToRoom(roomId, {
    type: ServerEvents.MEMBERS_UPDATED,
    payload: { users: room.getUsers() },
  });

  const currentSong = await room.playCurrentSong();
  send(user.ws, {
    type: ServerEvents.NOW_PLAYING_UPDATED,
    payload: { song: currentSong ?? null },
  });

  send(user.ws, {
    type: ServerEvents.QUEUE_UPDATED,
    payload: { queue },
  });

  send(user.ws, {
    type: ServerEvents.USER_APPROVED,
    payload: {
      userId: user.userId,
      username: user.username,
    },
  });
}

async function notifyPendingUsersOnAdminJoin(roomId: string, room: Room) {
  const pendingUsers = room.getPendingUserRequests();

  for (const pendingUser of pendingUsers) {
    if (room.isAutoApproveUsers()) {
      await admitUserToRoom(roomId, room, pendingUser);
    } else {
      send(pendingUser.ws, {
        type: ServerEvents.ADMIN_JOINED,
        payload: {},
      });
    }
  }
}

async function sendQueueUpdate(roomId: string, room: Room) {
  const queue = await room.loadSongs();
  broadcastToRoom(roomId, {
    type: ServerEvents.QUEUE_UPDATED,
    payload: { queue },
  });
}

async function getRoom(roomId: string): Promise<Room | null> {
  return roomCache.get(roomId) ?? null;
}

async function handleJoinRoom(ws: WebSocket, msg: JoinRoomMessage) {
  const { roomId, user } = msg.payload;

  let room = roomCache.get(roomId);
  if (!room) {
    room = await Room.findOrCreate(roomId, user.userId);
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

    // send list of users requested to join
    const userRequests = room.getUsersRequestedList();
    if (userRequests.length > 0) {
      send(ws, {
        type: ServerEvents.PENDING_JOIN_REQUESTS,
        payload: { users: userRequests },
      });
    }
  } else {
    if (!room.isAdminJoined()) {
      // send message to user that admin has not joined yet
      send(ws, {
        type: ServerEvents.WAITING_FOR_ADMIN,
        payload: {},
      });

      room.addUserRequest(user, ws);
      return;
    }
    if (!room.isAutoApproveUsers()) {
      if (room.checkUserRequestedAlready(user.userId)) {
        // send message to user that request is already sent
        send(ws, {
          type: ServerEvents.JOIN_ALREADY_PENDING,
          payload: {},
        });
        return;
      }

      room.addUserRequest(user, ws);

      // send to admin for approval
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

  const queue = await room.loadSongs();

  // send joined room message to self
  send(ws, {
    type: ServerEvents.ROOM_JOINED,
    payload: {
      roomId,
      config: room.getConfig(),
      queue,
    },
  });

  // send list users message to all users in room
  broadcastToRoom(roomId, {
    type: ServerEvents.MEMBERS_UPDATED,
    payload: { users: room.getUsers() },
  });

  // send current song to this user
  const currentSong = await room.playCurrentSong();
  send(ws, {
    type: ServerEvents.NOW_PLAYING_UPDATED,
    payload: { song: currentSong ?? null },
  });

  // send queue update to this user
  send(ws, {
    type: ServerEvents.QUEUE_UPDATED,
    payload: { queue },
  });
}

async function handleRejectUser(ws: WebSocket, msg: RejectUserMessage) {
  const conn = connections.get(ws);
  if (!conn || !conn.user) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Not in a room" },
    });
  }

  // check if user is admin
  if (!conn.user.isAdmin) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "User is not admin" },
    });
  }

  // get room
  const room = await getRoom(conn.roomId);
  if (!room) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Room not found" },
    });
  }

  // remove from the user requested list
  room.removeUserRequest(msg.payload.userId);

  // send to user that request is rejected
  sendToUser(msg.payload.userId, {
    type: ServerEvents.USER_REJECTED,
  });
}

async function handleApproveUser(ws: WebSocket, msg: ApproveUserMessage) {
  const conn = connections.get(ws);
  if (!conn || !conn.user) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Not in a room" },
    });
  }

  const room = await getRoom(conn.roomId);
  if (!room) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Room not found" },
    });
  }

  // check if user is admin
  if (!conn.user.isAdmin) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "User is not admin" },
    });
  }

  // get the user from requested list
  const user = room.getUserRequested(msg.payload.userId);
  if (!user) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "User not found in requested list" },
    });
  }

  await admitUserToRoom(conn.roomId, room, user);
}

async function handleRequestSong(ws: WebSocket, msg: RequestSongMessage) {
  const conn = connections.get(ws);
  if (!conn || !conn.user) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Not in a room" },
    });
  }

  const room = await getRoom(conn.roomId);
  if (!room) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Room not found" },
    });
  }

  // Need to add a check if same song requested by someone already

  const songData = await room.requestSong(msg.payload.song);

  if (room.isAutoApproveSongs()) {
    await sendQueueUpdate(conn.roomId, room);
  } else {
    sendToAdmin(conn.roomId, room, {
      type: ServerEvents.SONG_REQUESTED,
      payload: { song: songData },
    });
  }
}

async function handleUpvote(ws: WebSocket, msg: UpvoteSongMessage) {
  const conn = connections.get(ws);
  if (!conn || !conn.user) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Not in a room" },
    });
  }

  const room = await getRoom(conn.roomId);
  if (!room) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Room not found" },
    });
  }

  if (msg.payload.userId !== conn.user.userId) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Invalid upvote user" },
    });
  }

  const result = await room.upvote(msg.payload.songId, conn.user.userId);
  if (result === "success") {
    return await sendQueueUpdate(conn.roomId, room);
  }

  if (result === "already_upvoted") {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "You have already upvoted this song in this room" },
    });
  }

  return send(ws, {
    type: ServerEvents.ERROR,
    payload: { message: "Song not found in queue" },
  });
}

async function handleApproveSong(ws: WebSocket, msg: ApproveSongMessage) {
  const conn = connections.get(ws);
  if (!conn || !conn.user) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Not in a room" },
    });
  }

  const room = await getRoom(conn.roomId);
  if (!room) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Room not found" },
    });
  }

  if (conn.user.userId !== room.getAdminId()) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Only admin can approve songs" },
    });
  }

  const success = await room.approveSong(msg.payload.songId);
  if (!success) {
    send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Song not found in requests" },
    });
    return;
  }

  broadcastToRoom(conn.roomId, {
    type: ServerEvents.SONG_APPROVED,
    payload: { songId: msg.payload.songId },
  });

  // if there is no current song, play the next song
  const currentSong = await room.playCurrentSong();

  broadcastToRoom(conn.roomId, {
    type: ServerEvents.NOW_PLAYING_UPDATED,
    payload: { song: currentSong ?? null },
  });

  await sendQueueUpdate(conn.roomId, room);
}

async function handleRejectSong(ws: WebSocket, msg: RejectSongMessage) {
  const conn = connections.get(ws);
  if (!conn || !conn.user) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Not in a room" },
    });
  }

  const room = await getRoom(conn.roomId);
  if (!room) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Room not found" },
    });
  }

  if (conn.user.userId !== room.getAdminId()) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Only admin can reject songs" },
    });
  }

  const success = await room.rejectSong(msg.payload.songId);
  if (success) {
    broadcastToRoom(conn.roomId, {
      type: ServerEvents.SONG_REJECTED,
      payload: { songId: msg.payload.songId },
    });
  } else {
    send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Song not found in requests" },
    });
  }
}

async function handleNextSong(ws: WebSocket) {
  const conn = connections.get(ws);
  if (!conn || !conn.user) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Not in a room" },
    });
  }

  const room = await getRoom(conn.roomId);
  if (!room) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Room not found" },
    });
  }

  if (conn.user.userId !== room.getAdminId()) {
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

async function handlePlayCurrentSong(ws: WebSocket) {
  const conn = connections.get(ws);
  if (!conn || !conn.user) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Not in a room" },
    });
  }

  const room = await getRoom(conn.roomId);
  if (!room) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Room not found" },
    });
  }

  const song = await room.playCurrentSong();

  broadcastToRoom(conn.roomId, {
    type: ServerEvents.NOW_PLAYING_UPDATED,
    payload: { song: song ?? null },
  });

  await sendQueueUpdate(conn.roomId, room);
}

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

  // check if admin left
  if (conn.user.isAdmin) {
    room.setAdminStatus(false);

    // TODO: notify other users that admin left
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
}
