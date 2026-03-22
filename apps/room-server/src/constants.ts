export const SONG_REQUEST_TIMEOUT = 10000;

export const CLIENT_TO_SERVER_MESSAGE_TYPES = {
  JOIN_ROOM: "join_room",
  REQUEST_SONG: "request_song",
  UPVOTE_SONG: "upvote_song",
  APPROVE_SONG: "approve_song",
  REJECT_SONG: "reject_song",
  APPROVE_USER: "approve_user",
  REJECT_USER: "reject_user",
  BROADCAST_NOW_PLAYING: "broadcast_now_playing",
  NEXT_SONG: "next_song",
} as const;

export const SERVER_TO_CLIENT_MESSAGE_TYPES = {
  QUEUE_UPDATE: "queue_update",
  SONG_REQUESTED: "song_requested",
  SONG_APPROVED: "song_approved",
  SONG_REJECTED: "song_rejected",
  ERROR: "error",
  ADMIN_NOT_JOINED: "admin_not_joined",
  ADMIN_LEFT: "admin_left",
  JOINED_ROOM: "joined_room",
  LIST_USERS: "list_users",
  JOIN_REQUESTED: "join_requested",
  REQUEST_ALREADY_SENT: "request_already_sent",
  ADMIN_JOINED: "admin_joined",
  USER_APPROVED: "user_approved",
  USER_REJECTED: "user_rejected",
  USERS_REQUESTED_LIST: "users_requested_list",
  NOW_PLAYING_UPDATE: "now_playing_update",
} as const;

export const ALL_CLIENT_TO_SERVER_MESSAGE_TYPES = Object.values(
  CLIENT_TO_SERVER_MESSAGE_TYPES,
);

export const ALL_SERVER_TO_CLIENT_MESSAGE_TYPES = Object.values(
  SERVER_TO_CLIENT_MESSAGE_TYPES,
);
