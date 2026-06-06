import type { SongStatus } from "@repo/db";

import { z } from "zod";
import {
  ClientEvents,
  ServerEvents,
} from "@/lib/constants";

export const SongStatusSchema = z.enum([
  "REQUESTED",
  "QUEUED",
  "REJECTED",
  "PLAYING",
]) satisfies z.ZodType<SongStatus>;

export const UserPayloadSchema = z.object({
  userId: z.string().min(1),
  email: z.email(),
  username: z.string().min(1),
  isAdmin: z.boolean(),
});

export type UserPayload = z.infer<typeof UserPayloadSchema>;

export const UserShortPayloadSchema = UserPayloadSchema.omit({
  email: true,
  isAdmin: true,
});

export type UserShortPayload = z.infer<typeof UserShortPayloadSchema>;

export const SongSchema = z.object({
  id: z.string().min(1),
  songId: z.string().min(1),
  name: z.string().min(1),
  artist: z.string().min(1),
  url: z.url(),
  upvotes: z.number().int().nonnegative(),
  imgUrl: z.url(),
});

export type Song = z.infer<typeof SongSchema>;

export const SongPayloadSchema = SongSchema.omit({
  id: true,
  upvotes: true,
});

export type SongPayload = z.infer<typeof SongPayloadSchema>;

export const SongDataSchema = SongSchema.extend({
  status: SongStatusSchema,
});

export type SongData = z.infer<typeof SongDataSchema>;

export const RoomConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  admin: z.string().min(1),
  maxUpvotes: z.number().int().nonnegative(),
  maxUsers: z.number().int().nonnegative(),
  autoApproveSongs: z.boolean(),
  autoApproveUsers: z.boolean(),
});

export type RoomConfig = z.infer<typeof RoomConfigSchema>;

// --- Client -> Server Messages (Outgoing from client) ---

export const JoinRoomMessageSchema = z.object({
  type: z.literal(ClientEvents.JOIN_ROOM),
  payload: z.object({
    roomId: z.string().min(1),
    user: UserPayloadSchema,
  }),
});

export type JoinRoomMessage = z.infer<typeof JoinRoomMessageSchema>;

export const RequestSongMessageSchema = z.object({
  type: z.literal(ClientEvents.REQUEST_SONG),
  payload: z.object({
    song: SongPayloadSchema,
  }),
});

export type RequestSongMessage = z.infer<typeof RequestSongMessageSchema>;

export const UpvoteSongMessageSchema = z.object({
  type: z.literal(ClientEvents.UPVOTE_SONG),
  payload: z.object({
    songId: z.string().min(1),
    userId: z.string().min(1),
  }),
});

export type UpvoteSongMessage = z.infer<typeof UpvoteSongMessageSchema>;

export const ApproveSongMessageSchema = z.object({
  type: z.literal(ClientEvents.APPROVE_SONG),
  payload: z.object({
    songId: z.string().min(1),
  }),
});

export type ApproveSongMessage = z.infer<typeof ApproveSongMessageSchema>;

export const RejectSongMessageSchema = z.object({
  type: z.literal(ClientEvents.REJECT_SONG),
  payload: z.object({
    songId: z.string().min(1),
  }),
});

export type RejectSongMessage = z.infer<typeof RejectSongMessageSchema>;

export const BroadcastNowPlayingMessageSchema = z.object({
  type: z.literal(ClientEvents.SYNC_NOW_PLAYING),
});

export type BroadcastNowPlayingMessage = z.infer<
  typeof BroadcastNowPlayingMessageSchema
>;

export const NextSongMessageSchema = z.object({
  type: z.literal(ClientEvents.SKIP_TO_NEXT),
});

export type NextSongMessage = z.infer<typeof NextSongMessageSchema>;

export const ApproveUserMessageSchema = z.object({
  type: z.literal(ClientEvents.APPROVE_USER),
  payload: UserShortPayloadSchema,
});

export type ApproveUserMessage = z.infer<typeof ApproveUserMessageSchema>;

export const RejectUserMessageSchema = z.object({
  type: z.literal(ClientEvents.REJECT_USER),
  payload: UserShortPayloadSchema,
});

export type RejectUserMessage = z.infer<typeof RejectUserMessageSchema>;

export const ClientMessageSchema = z.discriminatedUnion("type", [
  JoinRoomMessageSchema,
  RequestSongMessageSchema,
  UpvoteSongMessageSchema,
  ApproveSongMessageSchema,
  RejectSongMessageSchema,
  BroadcastNowPlayingMessageSchema,
  NextSongMessageSchema,
  ApproveUserMessageSchema,
  RejectUserMessageSchema,
]);

export type ClientMessage = z.infer<typeof ClientMessageSchema>;

// --- Server -> Client Messages (Incoming to client) ---

export const QueueUpdateMessageSchema = z.object({
  type: z.literal(ServerEvents.QUEUE_UPDATED),
  payload: z.object({
    queue: z.array(SongDataSchema),
  }),
});

export type QueueUpdateMessage = z.infer<typeof QueueUpdateMessageSchema>;

export const SongRequestedMessageSchema = z.object({
  type: z.literal(ServerEvents.SONG_REQUESTED),
  payload: z.object({
    song: SongDataSchema,
  }),
});

export type SongRequestedMessage = z.infer<typeof SongRequestedMessageSchema>;

export const SongRequestSubmittedMessageSchema = z.object({
  type: z.literal(ServerEvents.SONG_REQUEST_SUBMITTED),
  payload: z.object({
    song: SongDataSchema,
  }),
});

export type SongRequestSubmittedMessage = z.infer<
  typeof SongRequestSubmittedMessageSchema
>;

export const SongApprovedMessageSchema = z.object({
  type: z.literal(ServerEvents.SONG_APPROVED),
  payload: z.object({
    songId: z.string().min(1),
  }),
});

export type SongApprovedMessage = z.infer<typeof SongApprovedMessageSchema>;

export const SongRejectedMessageSchema = z.object({
  type: z.literal(ServerEvents.SONG_REJECTED),
  payload: z.object({
    songId: z.string().min(1),
    name: z.string().min(1),
    artist: z.string().min(1),
    requestedByUserId: z.string().min(1).nullable(),
  }),
});

export type SongRejectedMessage = z.infer<typeof SongRejectedMessageSchema>;

export const ErrorMessageSchema = z.object({
  type: z.literal(ServerEvents.ERROR),
  payload: z.object({
    message: z.string().min(1),
  }),
});

export type ErrorMessage = z.infer<typeof ErrorMessageSchema>;

export const AdminNotJoinedMessageSchema = z.object({
  type: z.literal(ServerEvents.WAITING_FOR_ADMIN),
  payload: z.object({}),
});

export type AdminNotJoinedMessage = z.infer<typeof AdminNotJoinedMessageSchema>;

export const AdminLeftMessageSchema = z.object({
  type: z.literal(ServerEvents.ADMIN_LEFT),
  payload: z.object({}),
});

export type AdminLeftMessage = z.infer<typeof AdminLeftMessageSchema>;

export const AdminJoinedMessageSchema = z.object({
  type: z.literal(ServerEvents.ADMIN_JOINED),
  payload: z.object({}),
});

export type AdminJoinedMessage = z.infer<typeof AdminJoinedMessageSchema>;

export const JoinedRoomMessageSchema = z.object({
  type: z.literal(ServerEvents.ROOM_JOINED),
  payload: z.object({
    roomId: z.string().min(1),
    config: RoomConfigSchema,
    queue: z.array(SongDataSchema),
    upvotesUsed: z.number().int().nonnegative(),
  }),
});

export const RoomUserLimitReachedMessageSchema = z.object({
  type: z.literal(ServerEvents.ROOM_USER_LIMIT_REACHED),
  payload: z.object({
    maxUsers: z.number().int().nonnegative(),
  }),
});

export type RoomUserLimitReachedMessage = z.infer<
  typeof RoomUserLimitReachedMessageSchema
>;

export const RoomUpvoteLimitReachedMessageSchema = z.object({
  type: z.literal(ServerEvents.ROOM_UPVOTE_LIMIT_REACHED),
  payload: z.object({
    maxUpvotes: z.number().int().nonnegative(),
  }),
});

export type RoomUpvoteLimitReachedMessage = z.infer<
  typeof RoomUpvoteLimitReachedMessageSchema
>;

export const UserUpvotesUsageMessageSchema = z.object({
  type: z.literal(ServerEvents.USER_UPVOTES_USAGE),
  payload: z.object({
    used: z.number().int().nonnegative(),
    maxUpvotes: z.number().int().nonnegative(),
  }),
});

export type UserUpvotesUsageMessage = z.infer<
  typeof UserUpvotesUsageMessageSchema
>;

export type JoinedRoomMessage = z.infer<typeof JoinedRoomMessageSchema>;

export const ListUsersMessageSchema = z.object({
  type: z.literal(ServerEvents.MEMBERS_UPDATED),
  payload: z.object({
    users: z.array(UserPayloadSchema),
  }),
});

export type ListUsersMessage = z.infer<typeof ListUsersMessageSchema>;

export const JoinRequestedMessageSchema = z.object({
  type: z.literal(ServerEvents.USER_JOIN_REQUESTED),
  payload: UserShortPayloadSchema,
});

export type JoinRequestedMessage = z.infer<typeof JoinRequestedMessageSchema>;

export const RequestAlreadySentMessageSchema = z.object({
  type: z.literal(ServerEvents.JOIN_ALREADY_PENDING),
  payload: z.object({}),
});

export type RequestAlreadySentMessage = z.infer<
  typeof RequestAlreadySentMessageSchema
>;

export const UserApprovedMessageSchema = z.object({
  type: z.literal(ServerEvents.USER_APPROVED),
  payload: UserShortPayloadSchema,
});

export type UserApprovedMessage = z.infer<typeof UserApprovedMessageSchema>;

export const UserRejectedMessageSchema = z.object({
  type: z.literal(ServerEvents.USER_REJECTED),
  payload: z.object({}),
});

export type UserRejectedMessage = z.infer<typeof UserRejectedMessageSchema>;

export const UsersRequestedListMessageSchema = z.object({
  type: z.literal(ServerEvents.PENDING_JOIN_REQUESTS),
  payload: z.object({
    users: z.array(UserShortPayloadSchema),
  }),
});

export type UsersRequestedListMessage = z.infer<
  typeof UsersRequestedListMessageSchema
>;

export const NowPlayingUpdateMessageSchema = z.object({
  type: z.literal(ServerEvents.NOW_PLAYING_UPDATED),
  payload: z.object({
    song: SongDataSchema.nullable(),
  }),
});

export type NowPlayingUpdateMessage = z.infer<
  typeof NowPlayingUpdateMessageSchema
>;

export const ServerMessageSchema = z.discriminatedUnion("type", [
  QueueUpdateMessageSchema,
  SongRequestedMessageSchema,
  SongRequestSubmittedMessageSchema,
  SongApprovedMessageSchema,
  SongRejectedMessageSchema,
  ErrorMessageSchema,
  AdminNotJoinedMessageSchema,
  AdminLeftMessageSchema,
  AdminJoinedMessageSchema,
  JoinedRoomMessageSchema,
  RoomUserLimitReachedMessageSchema,
  RoomUpvoteLimitReachedMessageSchema,
  UserUpvotesUsageMessageSchema,
  ListUsersMessageSchema,
  JoinRequestedMessageSchema,
  RequestAlreadySentMessageSchema,
  UserApprovedMessageSchema,
  UserRejectedMessageSchema,
  UsersRequestedListMessageSchema,
  NowPlayingUpdateMessageSchema,
]);

export type ServerMessage = z.infer<typeof ServerMessageSchema>;

// --- WebSocket Hook Types ---

export type ConnectionState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export type JoinState =
  | "idle"
  | "joining"
  | "joined"
  | "blocked"
  | "rejected"
  | "full";

export type UseWebSocketReturn = {
  connectionState: ConnectionState;
  joinState: JoinState;
  joinError: string | null;
  isConnected: boolean;
  error: string | null;
  roomConfig: RoomConfig | null;
  queue: SongData[];
  pendingRequests: SongData[];
  joinRoom: (roomId: string, user: UserPayload) => void;
  requestSong: (song: SongPayload) => void;
  upvoteSong: (songId: string, userId: string) => void;
  approveSong: (songId: string) => void;
  rejectSong: (songId: string) => void;
  approveUser: (userId: string, username: string) => void;
  rejectUser: (userId: string, username: string) => void;
  sendMessage: (message: ClientMessage) => void;
};
