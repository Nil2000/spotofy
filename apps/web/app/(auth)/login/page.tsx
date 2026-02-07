import Link from "next/link";
import { Music } from "lucide-react";
import { SignIn } from "./_components/signIn";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,var(--tw-gradient-stops))] from-primary/15 via-background to-background pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent pointer-events-none" />

      <div className="relative flex min-h-screen flex-col">
        {/* Header */}
        <header className="p-4 sm:p-6">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
              <Music className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
              PulseQ
            </span>
          </Link>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 items-center justify-center px-4 pb-12">
          <SignIn callbackURL="/" />
        </div>
      </div>
    </main>
  );
}
