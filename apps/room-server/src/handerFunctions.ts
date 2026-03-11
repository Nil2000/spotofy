import type { WebSocket } from "ws";
import { Room } from "./room";
import {
  IncomingMessageSchema,
  type ApproveSongMessage,
  type ClientConnection,
  type IncomingMessage,
  type JoinRoomMessage,
  type OutgoingMessage,
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
    if (conn.roomId === roomId) {
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

async function sendQueueUpdate(roomId: string, room: Room) {
  const queue = await room.loadSongs();
  broadcastToRoom(roomId, {
    type: "queue_update",
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

  connections.set(ws, { ws, user, roomId });
  room.addUser(user);

  if (user.userId === room.getAdminId()) {
    room.setAdminJoined();
  }

  if (!room.isAdminJoined()) {
    // send message to user that admin has not joined yet
    send(ws, {
      type: "admin_not_joined",
      payload: {},
    });
    return;
  }

  const queue = await room.loadSongs();

  // send joined room message to self
  send(ws, {
    type: "joined_room",
    payload: {
      roomId,
      config: room.getConfig(),
      queue,
    },
  });

  // send list users message to all users in room
  broadcastToRoom(roomId, {
    type: "list_users",
    payload: { users: room.getUsers() },
  });

  // send current song to this user
  const currentSong = await room.playCurrentSong();
  send(ws, {
    type: "now_playing_update",
    payload: { song: currentSong ?? null },
  });

  // send queue update to this user
  send(ws, {
    type: "queue_update",
    payload: { queue },
  });
}

async function handleRequestSong(ws: WebSocket, msg: RequestSongMessage) {
  const conn = connections.get(ws);
  if (!conn || !conn.user) {
    return send(ws, { type: "error", payload: { message: "Not in a room" } });
  }

  const room = await getRoom(conn.roomId);
  if (!room) {
    return send(ws, { type: "error", payload: { message: "Room not found" } });
  }

  const songData = await room.requestSong(msg.payload.song);

  if (room.isAutoApproveSongs()) {
    await sendQueueUpdate(conn.roomId, room);
  } else {
    sendToAdmin(conn.roomId, room, {
      type: "song_requested",
      payload: { song: songData },
    });
  }
}

async function handleUpvote(ws: WebSocket, msg: UpvoteSongMessage) {
  const conn = connections.get(ws);
  if (!conn || !conn.user) {
    return send(ws, { type: "error", payload: { message: "Not in a room" } });
  }

  const room = await getRoom(conn.roomId);
  if (!room) {
    return send(ws, { type: "error", payload: { message: "Room not found" } });
  }

  if (msg.payload.userId !== conn.user.userId) {
    return send(ws, {
      type: "error",
      payload: { message: "Invalid upvote user" },
    });
  }

  const result = await room.upvote(msg.payload.songId, conn.user.userId);
  if (result === "success") {
    return await sendQueueUpdate(conn.roomId, room);
  }

  if (result === "already_upvoted") {
    return send(ws, {
      type: "error",
      payload: { message: "You have already upvoted this song in this room" },
    });
  }

  return send(ws, {
    type: "error",
    payload: { message: "Song not found in queue" },
  });
}

async function handleApproveSong(ws: WebSocket, msg: ApproveSongMessage) {
  const conn = connections.get(ws);
  if (!conn || !conn.user) {
    return send(ws, { type: "error", payload: { message: "Not in a room" } });
  }

  const room = await getRoom(conn.roomId);
  if (!room) {
    return send(ws, { type: "error", payload: { message: "Room not found" } });
  }

  if (conn.user.userId !== room.getAdminId()) {
    return send(ws, {
      type: "error",
      payload: { message: "Only admin can approve songs" },
    });
  }

  const success = await room.approveSong(msg.payload.songId);
  if (success) {
    broadcastToRoom(conn.roomId, {
      type: "song_approved",
      payload: { songId: msg.payload.songId },
    });
    await sendQueueUpdate(conn.roomId, room);
  } else {
    send(ws, {
      type: "error",
      payload: { message: "Song not found in requests" },
    });
  }
}

async function handleRejectSong(ws: WebSocket, msg: RejectSongMessage) {
  const conn = connections.get(ws);
  if (!conn || !conn.user) {
    return send(ws, { type: "error", payload: { message: "Not in a room" } });
  }

  const room = await getRoom(conn.roomId);
  if (!room) {
    return send(ws, { type: "error", payload: { message: "Room not found" } });
  }

  if (conn.user.userId !== room.getAdminId()) {
    return send(ws, {
      type: "error",
      payload: { message: "Only admin can reject songs" },
    });
  }

  const success = await room.rejectSong(msg.payload.songId);
  if (success) {
    broadcastToRoom(conn.roomId, {
      type: "song_rejected",
      payload: { songId: msg.payload.songId },
    });
  } else {
    send(ws, {
      type: "error",
      payload: { message: "Song not found in requests" },
    });
  }
}

async function handleNextSong(ws: WebSocket) {
  const conn = connections.get(ws);
  if (!conn || !conn.user) {
    return send(ws, { type: "error", payload: { message: "Not in a room" } });
  }

  const room = await getRoom(conn.roomId);
  if (!room) {
    return send(ws, { type: "error", payload: { message: "Room not found" } });
  }

  if (conn.user.userId !== room.getAdminId()) {
    return send(ws, {
      type: "error",
      payload: { message: "Only admin can skip to next song" },
    });
  }

  const song = await room.playNextSong();

  broadcastToRoom(conn.roomId, {
    type: "now_playing_update",
    payload: { song: song ?? null },
  });

  await sendQueueUpdate(conn.roomId, room);
}

async function handlePlayCurrentSong(ws: WebSocket) {
  const conn = connections.get(ws);
  if (!conn || !conn.user) {
    return send(ws, { type: "error", payload: { message: "Not in a room" } });
  }

  const room = await getRoom(conn.roomId);
  if (!room) {
    return send(ws, { type: "error", payload: { message: "Room not found" } });
  }

  const song = await room.playCurrentSong();

  broadcastToRoom(conn.roomId, {
    type: "now_playing_update",
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
        type: "error",
        payload: { message: "Invalid message payload" },
      });
    }

    msg = parsedMessage.data;
  } catch {
    return send(ws, { type: "error", payload: { message: "Invalid JSON" } });
  }

  switch (msg.type) {
    case "join_room":
      return handleJoinRoom(ws, msg);
    case "request_song":
      return handleRequestSong(ws, msg);
    case "upvote_song":
      return handleUpvote(ws, msg);
    case "approve_song":
      return handleApproveSong(ws, msg);
    case "reject_song":
      return handleRejectSong(ws, msg);
    case "broadcast_now_playing":
      return handlePlayCurrentSong(ws);
    case "next_song":
      return handleNextSong(ws);
    default:
      console.log("MESSAGE_TYPE: ", msg);
      return send(ws, {
        type: "error",
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

  room.removeUser(conn.user.userId);

  broadcastToRoom(conn.roomId, {
    type: "list_users",
    payload: { users: room.getUsers() },
  });
}
