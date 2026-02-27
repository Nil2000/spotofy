import type { WebSocket } from "ws";
import { Room } from "./room";
import type {
  ClientConnection,
  IncomingMessage,
  JoinRoomMessage,
  RequestSongMessage,
  UpvoteSongMessage,
  ApproveSongMessage,
  RejectSongMessage,
  OutgoingMessage,
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

  if (room.isAutoApprove()) {
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

  const success = await room.upvote(msg.payload.songId);
  if (success) {
    await sendQueueUpdate(conn.roomId, room);
  } else {
    send(ws, {
      type: "error",
      payload: { message: "Song not found in queue" },
    });
  }
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

export async function handleMessage(ws: WebSocket, raw: string) {
  let msg: IncomingMessage;
  try {
    msg = JSON.parse(raw) as IncomingMessage;
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
    default:
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
