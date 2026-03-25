import { motion } from "motion/react";
import { Crown, Users } from "lucide-react";

import { Badge } from "@repo/ui/components/ui/badge";
import type { UserPayload } from "@/types/websocket";

type UsersSidebarProps = {
  users: UserPayload[];
  currentUserId: string;
};

export default function UsersSidebar({
  users,
  currentUserId,
}: UsersSidebarProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-4 shadow-xl"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">In This Room</h2>
        </div>
        <Badge
          variant="outline"
          className="text-xs px-2 py-1 h-auto rounded-full bg-primary/10 border-primary/20 text-primary font-medium"
        >
          {users.length} online
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {users.map((user) => {
          const isSelf = user.userId === currentUserId;
          return (
            <div
              key={user.userId}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50"
            >
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-xs font-medium">
                {user.username}
                {isSelf && " (you)"}
              </span>
              {user.isAdmin && <Crown className="w-3 h-3 text-yellow-500" />}
            </div>
          );
        })}
      </div>
    </motion.aside>
  );
}
