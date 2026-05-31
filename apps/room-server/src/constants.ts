export const ClientEvents = {
  JOIN_ROOM: "room.join",
  REQUEST_SONG: "song.request",
  UPVOTE_SONG: "song.upvote",
  APPROVE_SONG: "song.approve",
  REJECT_SONG: "song.reject",
  APPROVE_USER: "user.approve",
  REJECT_USER: "user.reject",
  SYNC_NOW_PLAYING: "now_playing.sync",
  SKIP_TO_NEXT: "queue.next",
} as const;

export const ServerEvents = {
  QUEUE_UPDATED: "queue.updated",
  SONG_REQUESTED: "song.requested",
  SONG_APPROVED: "song.approved",
  SONG_REJECTED: "song.rejected",
  ERROR: "error",
  WAITING_FOR_ADMIN: "room.waiting_for_admin",
  ADMIN_LEFT: "room.admin_left",
  ADMIN_JOINED: "room.admin_joined",
  ROOM_JOINED: "room.joined",
  MEMBERS_UPDATED: "room.members_updated",
  USER_JOIN_REQUESTED: "user.join_requested",
  JOIN_ALREADY_PENDING: "user.join_already_pending",
  USER_APPROVED: "user.approved",
  USER_REJECTED: "user.rejected",
  PENDING_JOIN_REQUESTS: "room.pending_join_requests",
  NOW_PLAYING_UPDATED: "now_playing.updated",
} as const;

export const ALL_CLIENT_EVENTS = Object.values(ClientEvents);

export const ALL_SERVER_EVENTS = Object.values(ServerEvents);
