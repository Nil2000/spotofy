-- Clean up orphaned rows that would violate the new FK constraints
DELETE FROM "song_upvote_history" h
WHERE NOT EXISTS (SELECT 1 FROM "room" r WHERE r."id" = h."roomId")
   OR NOT EXISTS (SELECT 1 FROM "song" s WHERE s."id" = h."songId")
   OR NOT EXISTS (SELECT 1 FROM "user" u WHERE u."id" = h."userId");

-- AddForeignKey
ALTER TABLE "song_upvote_history" ADD CONSTRAINT "song_upvote_history_roomId_fkey"
  FOREIGN KEY ("roomId") REFERENCES "room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_upvote_history" ADD CONSTRAINT "song_upvote_history_songId_fkey"
  FOREIGN KEY ("songId") REFERENCES "song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_upvote_history" ADD CONSTRAINT "song_upvote_history_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
