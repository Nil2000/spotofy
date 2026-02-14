import type { SongStatus } from "@repo/db";

export type JWTPayload = {
  userId: string;
  email: string;
  username: string;
  isAdmin: boolean;
};

export type Song = {
  id: string;
  name: string;
  artist: string;
  url: string;
  upvotes: number;
  imgUrl: string;
};

export type SongPayload = Omit<Song, "id" | "upvotes">;

export type SongData = {
  id: string;
  name: string;
  artist: string;
  url: string;
  upvotes: number;
  imgUrl: string;
  status: SongStatus;
};

export type RoomConfig = {
  id: string;
  name: string;
  admin: string;
  maxUpvotes: number;
  maxUsers: number;
  autoApprove: boolean;
};

// --- Client -> Server Messages (Outgoing from client) ---

export type JoinRoomMessage = {
  type: "join_room";
  payload: {
    roomId: string;
    user: JWTPayload;
  };
};

export type RequestSongMessage = {
  type: "request_song";
  payload: {
    song: SongPayload;
  };
};

export type UpvoteSongMessage = {
  type: "upvote_song";
  payload: {
    songId: string;
  };
};

export type ApproveSongMessage = {
  type: "approve_song";
  payload: {
    songId: string;
  };
};

export type RejectSongMessage = {
  type: "reject_song";
  payload: {
    songId: string;
  };
};

export type ClientMessage =
  | JoinRoomMessage
  | RequestSongMessage
  | UpvoteSongMessage
  | ApproveSongMessage
  | RejectSongMessage;

// --- Server -> Client Messages (Incoming to client) ---

export type QueueUpdateMessage = {
  type: "queue_update";
  payload: {
    queue: SongData[];
  };
};

export type SongRequestedMessage = {
  type: "song_requested";
  payload: {
    song: SongData;
  };
};

export type SongApprovedMessage = {
  type: "song_approved";
  payload: {
    songId: string;
  };
};

export type SongRejectedMessage = {
  type: "song_rejected";
  payload: {
    songId: string;
  };
};

export type ErrorMessage = {
  type: "error";
  payload: {
    message: string;
  };
};

export type JoinedRoomMessage = {
  type: "joined_room";
  payload: {
    roomId: string;
    config: RoomConfig;
    queue: SongData[];
  };
};

export type ServerMessage =
  | QueueUpdateMessage
  | SongRequestedMessage
  | SongApprovedMessage
  | SongRejectedMessage
  | ErrorMessage
  | JoinedRoomMessage;

// --- WebSocket Hook Types ---

export type ConnectionState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export type UseWebSocketReturn = {
  connectionState: ConnectionState;
  isConnected: boolean;
  error: string | null;
  roomConfig: RoomConfig | null;
  queue: SongData[];
  pendingRequests: SongData[];
  joinRoom: (roomId: string, user: JWTPayload) => void;
  requestSong: (song: SongPayload) => void;
  upvoteSong: (songId: string) => void;
  approveSong: (songId: string) => void;
  rejectSong: (songId: string) => void;
  sendMessage: (message: ClientMessage) => void;
};
