-- Remove partial unique index; duplicate prevention is handled in room-server queue logic.
DROP INDEX IF EXISTS "song_roomId_songId_active_key";
