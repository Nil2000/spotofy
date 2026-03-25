import type { WebSocket } from "ws";
import {
  CLIENT_TO_SERVER_MESSAGE_TYPES,
  SERVER_TO_CLIENT_MESSAGE_TYPES,
} from "./constants";
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

async function sendQueueUpdate(roomId: string, room: Room) {
  const queue = await room.loadSongs();
  broadcastToRoom(roomId, {
    type: SERVER_TO_CLIENT_MESSAGE_TYPES.QUEUE_UPDATE,
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
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.ADMIN_JOINED,
      payload: {},
    });

    // send list of users requested to join
    const userRequests = room.getUsersRequestedList();
    if (userRequests.length > 0) {
      send(ws, {
        type: SERVER_TO_CLIENT_MESSAGE_TYPES.USERS_REQUESTED_LIST,
        payload: { users: userRequests },
      });
    }
  } else {
    if (!room.isAdminJoined()) {
      // send message to user that admin has not joined yet
      send(ws, {
        type: SERVER_TO_CLIENT_MESSAGE_TYPES.ADMIN_NOT_JOINED,
        payload: {},
      });

      room.addUserRequest(user, ws);
      return;
    }
    if (!room.isAutoApproveUsers()) {
      if (room.checkUserRequestedAlready(user.userId)) {
        // send message to user that request is already sent
        send(ws, {
          type: SERVER_TO_CLIENT_MESSAGE_TYPES.REQUEST_ALREADY_SENT,
          payload: {},
        });
        return;
      }

      room.addUserRequest(user, ws);

      // send to admin for approval
      sendToAdmin(roomId, room, {
        type: SERVER_TO_CLIENT_MESSAGE_TYPES.JOIN_REQUESTED,
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
    type: SERVER_TO_CLIENT_MESSAGE_TYPES.JOINED_ROOM,
    payload: {
      roomId,
      config: room.getConfig(),
      queue,
    },
  });

  // send list users message to all users in room
  broadcastToRoom(roomId, {
    type: SERVER_TO_CLIENT_MESSAGE_TYPES.LIST_USERS,
    payload: { users: room.getUsers() },
  });

  // send current song to this user
  const currentSong = await room.playCurrentSong();
  send(ws, {
    type: SERVER_TO_CLIENT_MESSAGE_TYPES.NOW_PLAYING_UPDATE,
    payload: { song: currentSong ?? null },
  });

  // send queue update to this user
  send(ws, {
    type: SERVER_TO_CLIENT_MESSAGE_TYPES.QUEUE_UPDATE,
    payload: { queue },
  });
}

async function handleRejectUser(ws: WebSocket, msg: RejectUserMessage) {
  const conn = connections.get(ws);
  if (!conn || !conn.user) {
    return send(ws, {
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR,
      payload: { message: "Not in a room" },
    });
  }

  // check if user is admin
  if (!conn.user.isAdmin) {
    return send(ws, {
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR,
      payload: { message: "User is not admin" },
    });
  }

  // get room
  const room = await getRoom(conn.roomId);
  if (!room) {
    return send(ws, {
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR,
      payload: { message: "Room not found" },
    });
  }

  // remove from the user requested list
  room.removeUserRequest(msg.payload.userId);

  // send to user that request is rejected
  sendToUser(msg.payload.userId, {
    type: SERVER_TO_CLIENT_MESSAGE_TYPES.USER_REJECTED,
  });
}

async function handleApproveUser(ws: WebSocket, msg: ApproveUserMessage) {
  const conn = connections.get(ws);
  if (!conn || !conn.user) {
    return send(ws, {
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR,
      payload: { message: "Not in a room" },
    });
  }

  const room = await getRoom(conn.roomId);
  if (!room) {
    return send(ws, {
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR,
      payload: { message: "Room not found" },
    });
  }

  // check if user is admin
  if (!conn.user.isAdmin) {
    return send(ws, {
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR,
      payload: { message: "User is not admin" },
    });
  }

  // get the user from requested list
  const user = room.getUserRequested(msg.payload.userId);
  if (!user) {
    return send(ws, {
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR,
      payload: { message: "User not found in requested list" },
    });
  }

  // add to connection and user list
  connections.set(user.ws, {
    ws: user.ws,
    user: {
      userId: user.userId,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
    },
    roomId: conn.roomId,
    status: "joined",
  });
  room.addUser({
    userId: user.userId,
    email: user.email,
    username: user.username,
    isAdmin: user.isAdmin,
  });

  // remove the user from requested list
  room.removeUserRequest(msg.payload.userId);

  const queue = await room.loadSongs();

  // send joined message to user
  sendToUser(msg.payload.userId, {
    type: SERVER_TO_CLIENT_MESSAGE_TYPES.JOINED_ROOM,
    payload: {
      roomId: conn.roomId,
      config: room.getConfig(),
      queue,
    },
  });

  // send list users message to all users in room
  broadcastToRoom(conn.roomId, {
    type: SERVER_TO_CLIENT_MESSAGE_TYPES.LIST_USERS,
    payload: { users: room.getUsers() },
  });

  // send current song to this user
  const currentSong = await room.playCurrentSong();
  sendToUser(msg.payload.userId, {
    type: SERVER_TO_CLIENT_MESSAGE_TYPES.NOW_PLAYING_UPDATE,
    payload: { song: currentSong ?? null },
  });

  // send queue update to this user
  sendToUser(msg.payload.userId, {
    type: SERVER_TO_CLIENT_MESSAGE_TYPES.QUEUE_UPDATE,
    payload: { queue },
  });

  // send to user that request is approved
  sendToUser(msg.payload.userId, {
    type: SERVER_TO_CLIENT_MESSAGE_TYPES.USER_APPROVED,
    payload: {
      userId: msg.payload.userId,
      username: msg.payload.username,
    },
  });
}

async function handleRequestSong(ws: WebSocket, msg: RequestSongMessage) {
  const conn = connections.get(ws);
  if (!conn || !conn.user) {
    return send(ws, {
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR,
      payload: { message: "Not in a room" },
    });
  }

  const room = await getRoom(conn.roomId);
  if (!room) {
    return send(ws, {
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR,
      payload: { message: "Room not found" },
    });
  }

  // Need to add a check if same song requested by someone already

  const songData = await room.requestSong(msg.payload.song);

  if (room.isAutoApproveSongs()) {
    await sendQueueUpdate(conn.roomId, room);
  } else {
    sendToAdmin(conn.roomId, room, {
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.SONG_REQUESTED,
      payload: { song: songData },
    });
  }
}

async function handleUpvote(ws: WebSocket, msg: UpvoteSongMessage) {
  const conn = connections.get(ws);
  if (!conn || !conn.user) {
    return send(ws, {
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR,
      payload: { message: "Not in a room" },
    });
  }

  const room = await getRoom(conn.roomId);
  if (!room) {
    return send(ws, {
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR,
      payload: { message: "Room not found" },
    });
  }

  if (msg.payload.userId !== conn.user.userId) {
    return send(ws, {
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR,
      payload: { message: "Invalid upvote user" },
    });
  }

  const result = await room.upvote(msg.payload.songId, conn.user.userId);
  if (result === "success") {
    return await sendQueueUpdate(conn.roomId, room);
  }

  if (result === "already_upvoted") {
    return send(ws, {
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR,
      payload: { message: "You have already upvoted this song in this room" },
    });
  }

  return send(ws, {
    type: SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR,
    payload: { message: "Song not found in queue" },
  });
}

async function handleApproveSong(ws: WebSocket, msg: ApproveSongMessage) {
  const conn = connections.get(ws);
  if (!conn || !conn.user) {
    return send(ws, {
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR,
      payload: { message: "Not in a room" },
    });
  }

  const room = await getRoom(conn.roomId);
  if (!room) {
    return send(ws, {
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR,
      payload: { message: "Room not found" },
    });
  }

  if (conn.user.userId !== room.getAdminId()) {
    return send(ws, {
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR,
      payload: { message: "Only admin can approve songs" },
    });
  }

  const success = await room.approveSong(msg.payload.songId);
  if (success) {
    broadcastToRoom(conn.roomId, {
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.SONG_APPROVED,
      payload: { songId: msg.payload.songId },
    });
    await sendQueueUpdate(conn.roomId, room);
  } else {
    send(ws, {
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR,
      payload: { message: "Song not found in requests" },
    });
  }
}

async function handleRejectSong(ws: WebSocket, msg: RejectSongMessage) {
  const conn = connections.get(ws);
  if (!conn || !conn.user) {
    return send(ws, {
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR,
      payload: { message: "Not in a room" },
    });
  }

  const room = await getRoom(conn.roomId);
  if (!room) {
    return send(ws, {
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR,
      payload: { message: "Room not found" },
    });
  }

  if (conn.user.userId !== room.getAdminId()) {
    return send(ws, {
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR,
      payload: { message: "Only admin can reject songs" },
    });
  }

  const success = await room.rejectSong(msg.payload.songId);
  if (success) {
    broadcastToRoom(conn.roomId, {
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.SONG_REJECTED,
      payload: { songId: msg.payload.songId },
    });
  } else {
    send(ws, {
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR,
      payload: { message: "Song not found in requests" },
    });
  }
}

async function handleNextSong(ws: WebSocket) {
  const conn = connections.get(ws);
  if (!conn || !conn.user) {
    return send(ws, {
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR,
      payload: { message: "Not in a room" },
    });
  }

  const room = await getRoom(conn.roomId);
  if (!room) {
    return send(ws, {
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR,
      payload: { message: "Room not found" },
    });
  }

  if (conn.user.userId !== room.getAdminId()) {
    return send(ws, {
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR,
      payload: { message: "Only admin can skip to next song" },
    });
  }

  const song = await room.playNextSong();

  broadcastToRoom(conn.roomId, {
    type: SERVER_TO_CLIENT_MESSAGE_TYPES.NOW_PLAYING_UPDATE,
    payload: { song: song ?? null },
  });

  await sendQueueUpdate(conn.roomId, room);
}

async function handlePlayCurrentSong(ws: WebSocket) {
  const conn = connections.get(ws);
  if (!conn || !conn.user) {
    return send(ws, {
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR,
      payload: { message: "Not in a room" },
    });
  }

  const room = await getRoom(conn.roomId);
  if (!room) {
    return send(ws, {
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR,
      payload: { message: "Room not found" },
    });
  }

  const song = await room.playCurrentSong();

  broadcastToRoom(conn.roomId, {
    type: SERVER_TO_CLIENT_MESSAGE_TYPES.NOW_PLAYING_UPDATE,
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
        type: SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR,
        payload: { message: "Invalid message payload" },
      });
    }

    msg = parsedMessage.data;
  } catch {
    return send(ws, {
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR,
      payload: { message: "Invalid JSON" },
    });
  }

  switch (msg.type) {
    case CLIENT_TO_SERVER_MESSAGE_TYPES.JOIN_ROOM:
      return handleJoinRoom(ws, msg);
    case CLIENT_TO_SERVER_MESSAGE_TYPES.REQUEST_SONG:
      return handleRequestSong(ws, msg);
    case CLIENT_TO_SERVER_MESSAGE_TYPES.UPVOTE_SONG:
      return handleUpvote(ws, msg);
    case CLIENT_TO_SERVER_MESSAGE_TYPES.APPROVE_SONG:
      return handleApproveSong(ws, msg);
    case CLIENT_TO_SERVER_MESSAGE_TYPES.REJECT_SONG:
      return handleRejectSong(ws, msg);
    case CLIENT_TO_SERVER_MESSAGE_TYPES.APPROVE_USER:
      return handleApproveUser(ws, msg);
    case CLIENT_TO_SERVER_MESSAGE_TYPES.REJECT_USER:
      return handleRejectUser(ws, msg);
    case CLIENT_TO_SERVER_MESSAGE_TYPES.BROADCAST_NOW_PLAYING:
      return handlePlayCurrentSong(ws);
    case CLIENT_TO_SERVER_MESSAGE_TYPES.NEXT_SONG:
      return handleNextSong(ws);
    default:
      console.log("MESSAGE_TYPE: ", msg);
      return send(ws, {
        type: SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR,
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
      type: SERVER_TO_CLIENT_MESSAGE_TYPES.ADMIN_LEFT,
      payload: {},
    });
  }

  if (conn.status === "joined") {
    room.removeUser(conn.user.userId);
  } else {
    room.removeUserRequest(conn.user.userId);
  }

  broadcastToRoom(conn.roomId, {
    type: SERVER_TO_CLIENT_MESSAGE_TYPES.LIST_USERS,
    payload: { users: room.getUsers() },
  });
}
