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
    }
  }
}

function sendToUser(userId: string, message: OutgoingMessage) {
  for (const [, conn] of connections) {
    if (conn.user?.userId === userId) {
      send(conn.ws, message);
    }
  }
}

function sendUserLimitReached(ws: WebSocket, maxUsers: number) {
  send(ws, {
    type: ServerEvents.ROOM_USER_LIMIT_REACHED,
    payload: { maxUsers },
  });
}

async function sendUserUpvotesUsage(ws: WebSocket, room: Room, userId: string) {
  const used = await room.getUserUpvoteCount(userId);
  send(ws, {
    type: ServerEvents.USER_UPVOTES_USAGE,
    payload: { used, maxUpvotes: room.getConfig().maxUpvotes },
  });
}

type UserPayloadWithWs = UserPayload & { ws: WebSocket };

async function admitUserToRoom(
  roomId: string,
  room: Room,
  user: UserPayloadWithWs,
) {
  if (room.isAtUserCapacity(user.userId)) {
    sendUserLimitReached(user.ws, room.getConfig().maxUsers);
    return false;
  }

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

  const currentSong = await room.getCurrentSong();
  const queue = await room.loadSongs();
  const upvotesUsed = await room.getUserUpvoteCount(user.userId);

  send(user.ws, {
    type: ServerEvents.ROOM_JOINED,
    payload: {
      roomId,
      config: room.getConfig(),
      upvotesUsed,
    },
  });

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

  return true;
}

async function notifyPendingUsersOnAdminJoin(roomId: string, room: Room) {
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

async function sendQueueUpdate(roomId: string, room: Room) {
  const queue = await room.loadSongs();
  broadcastToRoom(roomId, {
    type: ServerEvents.QUEUE_UPDATED,
    payload: { queue },
  });
}

function sendPendingListToAdmin(roomId: string, room: Room) {
  sendToAdmin(roomId, room, {
    type: ServerEvents.PENDING_JOIN_REQUESTS,
    payload: { users: room.getUsersRequestedList() },
  });
}

async function getRoom(roomId: string): Promise<Room | null> {
  return roomCache.get(roomId) ?? null;
}

async function handleJoinRoom(ws: WebSocket, msg: JoinRoomMessage) {
  const { roomId, user } = msg.payload;

  // Idempotency: if this socket is already joined for the same room+user, just
  // resend authoritative state instead of resetting the connection to pending.
  const existing = connections.get(ws);
  if (
    existing?.status === "joined" &&
    existing.roomId === roomId &&
    existing.user?.userId === user.userId
  ) {
    const cachedRoom = roomCache.get(roomId);
    if (cachedRoom) {
      const currentSong = await cachedRoom.getCurrentSong();
      const queue = await cachedRoom.loadSongs();
      const upvotesUsed = await cachedRoom.getUserUpvoteCount(user.userId);
      send(ws, {
        type: ServerEvents.ROOM_JOINED,
        payload: { roomId, config: cachedRoom.getConfig(), upvotesUsed },
      });
      send(ws, {
        type: ServerEvents.MEMBERS_UPDATED,
        payload: { users: cachedRoom.getUsers() },
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

    // send list of users requested to join
    const userRequests = room.getUsersRequestedList();
    if (userRequests.length > 0) {
      send(ws, {
        type: ServerEvents.PENDING_JOIN_REQUESTS,
        payload: { users: userRequests },
      });
    }

    // send backlog of songs pending admin approval
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

  const currentSong = await room.getCurrentSong();
  const queue = await room.loadSongs();
  const upvotesUsed = await room.getUserUpvoteCount(user.userId);

  // send joined room message to self
  send(ws, {
    type: ServerEvents.ROOM_JOINED,
    payload: {
      roomId,
      config: room.getConfig(),
      upvotesUsed,
    },
  });

  // send list users message to all users in room
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

async function handleRejectUser(ws: WebSocket, msg: RejectUserMessage) {
  const conn = connections.get(ws);
  if (!conn || !conn.user) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Not in a room" },
    });
  }

  if (conn.status !== "joined") {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "You have not joined this room yet" },
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
    payload: {
      roomId: conn.roomId,
      message: "Your entry request was rejected by the admin.",
    },
  });

  // push authoritative pending list back to admin so all tabs are in sync
  sendPendingListToAdmin(conn.roomId, room);
}

async function handleApproveUser(ws: WebSocket, msg: ApproveUserMessage) {
  const conn = connections.get(ws);
  if (!conn || !conn.user) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Not in a room" },
    });
  }

  if (conn.status !== "joined") {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "You have not joined this room yet" },
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

  // push authoritative pending list back to admin so all tabs are in sync
  sendPendingListToAdmin(conn.roomId, room);
}

async function handleRequestSong(ws: WebSocket, msg: RequestSongMessage) {
  const conn = connections.get(ws);
  if (!conn || !conn.user) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Not in a room" },
    });
  }

  if (conn.status !== "joined") {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "You have not joined this room yet" },
    });
  }

  const room = await getRoom(conn.roomId);
  if (!room) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Room not found" },
    });
  }

  const result = await room.requestSong(msg.payload.song, conn.user.userId);

  if (result === "duplicate") {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: {
        message: "This song is already in the queue or pending approval",
      },
    });
  }

  const songData = result;

  if (room.isAutoApproveSongs()) {
    await sendQueueUpdate(conn.roomId, room);
    // Start playback if nothing is currently playing
    const currentSong = await room.getCurrentSong();
    if (!currentSong) {
      const next = await room.playNextSong();
      broadcastToRoom(conn.roomId, {
        type: ServerEvents.NOW_PLAYING_UPDATED,
        payload: { song: next ?? null },
      });
    }
  } else {
    send(conn.ws, {
      type: ServerEvents.SONG_REQUEST_SUBMITTED,
      payload: { song: songData },
    });
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

  if (conn.status !== "joined") {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "You have not joined this room yet" },
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
    await sendUserUpvotesUsage(ws, room, conn.user.userId);
    return await sendQueueUpdate(conn.roomId, room);
  }

  if (result === "upvote_limit_reached") {
    return send(ws, {
      type: ServerEvents.ROOM_UPVOTE_LIMIT_REACHED,
      payload: { maxUpvotes: room.getConfig().maxUpvotes },
    });
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

  if (conn.status !== "joined") {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "You have not joined this room yet" },
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

  // Start playback only if nothing is currently playing
  let currentSong = await room.getCurrentSong();
  if (!currentSong) {
    currentSong = await room.playNextSong();
    broadcastToRoom(conn.roomId, {
      type: ServerEvents.NOW_PLAYING_UPDATED,
      payload: { song: currentSong ?? null },
    });
  }

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

  if (conn.status !== "joined") {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "You have not joined this room yet" },
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
      payload: {
        songId: success.id,
        name: success.name,
        artist: success.artist,
        requestedByUserId: success.requestedByUserId,
      },
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

  if (conn.status !== "joined") {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "You have not joined this room yet" },
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

  if (conn.status !== "joined") {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "You have not joined this room yet" },
    });
  }

  const room = await getRoom(conn.roomId);
  if (!room) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Room not found" },
    });
  }

  // Read-only resync: broadcast the current PLAYING song without promoting queue
  const song = await room.getCurrentSong();

  broadcastToRoom(conn.roomId, {
    type: ServerEvents.NOW_PLAYING_UPDATED,
    payload: { song: song ?? null },
  });
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

  // Evict room from cache when no connections remain to free memory
  const hasRemaining = Array.from(connections.values()).some(
    (c) => c.roomId === conn.roomId,
  );
  if (!hasRemaining) {
    roomCache.delete(conn.roomId);
  }
}
