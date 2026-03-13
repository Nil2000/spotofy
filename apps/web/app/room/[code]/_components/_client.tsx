"use client";

import { useEffect, useState } from "react";

import { useWebSocket } from "@/hooks/useWebSocket";
import type { JWTPayload } from "@/types/websocket";
import JoinStatusScreen from "./join-status-screen";
import NowPlayingSection from "./now-playing-section";
import PendingRequestsSection from "./pending-requests-section";
import PendingUsersSection from "./pending-users-section";
import QueueSidebar from "./queue-sidebar";
import RequestSongSection from "./request-song-section";
import RoomHeader from "./room-header";
import UsersSidebar from "./users-sidebar";

type ClientPageProps = {
  code: string;
  user: JWTPayload;
  spotifyToken: string | null;
};

export default function ClientPage({
  code,
  user,
  spotifyToken,
}: ClientPageProps) {
  const {
    connectionState,
    isConnected,
    joinState,
    joinError,
    roomConfig,
    queue,
    pendingRequests,
    pendingUsers,
    joinRoom,
    requestSong,
    upvoteSong,
    approveSong,
    rejectSong,
    approveUser,
    rejectUser,
    requestNextSong,
    users,
    nowPlaying,
  } = useWebSocket();

  const [isAdmin] = useState(user.isAdmin);

  useEffect(() => {
    if (isConnected) {
      joinRoom(code, user);
    }
  }, [isConnected, code, user, joinRoom, isAdmin]);

  const isJoiningScreenVisible = !isAdmin && joinState !== "joined";

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden font-sans">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,var(--tw-gradient-stops))] from-accent/8 via-transparent to-transparent pointer-events-none" />

      <div className="relative">
        <RoomHeader code={code} connectionState={connectionState} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {isJoiningScreenVisible ? (
            <JoinStatusScreen
              connectionState={connectionState}
              joinState={joinState}
              joinError={joinError}
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <NowPlayingSection
                  isAdmin={isAdmin}
                  spotifyToken={spotifyToken}
                  nowPlaying={nowPlaying}
                  requestNextSong={requestNextSong}
                />

                <RequestSongSection
                  code={code}
                  isConnected={isConnected}
                  autoApproveSongs={roomConfig?.autoApproveSongs ?? false}
                  requestSong={requestSong}
                />

                {isAdmin && (
                  <>
                    <PendingUsersSection
                      pendingUsers={pendingUsers}
                      approveUser={approveUser}
                      rejectUser={rejectUser}
                    />
                    <PendingRequestsSection
                      pendingRequests={pendingRequests}
                      approveSong={approveSong}
                      rejectSong={rejectSong}
                    />
                  </>
                )}
              </div>

              <div className="space-y-6">
                <QueueSidebar
                  queue={queue}
                  userId={user.userId}
                  isConnected={isConnected}
                  upvoteSong={upvoteSong}
                />

                <UsersSidebar users={users} currentUserId={user.userId} />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
