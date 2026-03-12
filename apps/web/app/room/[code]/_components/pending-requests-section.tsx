import { motion } from "motion/react";
import { CheckCircle, Clock, Music, XCircle } from "lucide-react";

import { Button } from "@repo/ui/components/ui/button";
import type { SongData } from "@/types/websocket";

type PendingRequestsSectionProps = {
  pendingRequests: SongData[];
  approveSong: (songId: string) => void;
  rejectSong: (songId: string) => void;
};

export default function PendingRequestsSection({
  pendingRequests,
  approveSong,
  rejectSong,
}: PendingRequestsSectionProps) {
  if (pendingRequests.length === 0) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-4 sm:p-6 shadow-xl"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
          <Clock className="w-5 h-5 text-yellow-500" />
        </div>
        <div>
          <h3 className="font-semibold">Pending Requests</h3>
          <p className="text-xs text-muted-foreground">
            Approve or reject song requests
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {pendingRequests.map((song) => (
          <motion.div
            key={song.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-background/50"
          >
            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-primary/10 to-accent/10 flex items-center justify-center shrink-0">
              <Music className="w-4 h-4 text-primary/60" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{song.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {song.artist}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => approveSong(song.id)}
                  variant="outline"
                  className="h-auto rounded-lg bg-green-500/10 hover:bg-green-500/20 px-2 py-1.5 text-xs font-medium text-green-600"
                  type="button"
                >
                  <CheckCircle className="w-3 h-3" />
                  Approve
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => rejectSong(song.id)}
                  variant="outline"
                  className="h-auto rounded-lg bg-red-500/10 hover:bg-red-500/20 px-2 py-1.5 text-xs font-medium text-red-600"
                  type="button"
                >
                  <XCircle className="w-3 h-3" />
                  Reject
                </Button>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
