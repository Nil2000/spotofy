import Navbar from "@/components/navbar";
import { SignIn } from "./_components/signIn";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,var(--tw-gradient-stops))] from-primary/15 via-background to-background pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent pointer-events-none" />

      <div className="relative flex min-h-screen flex-col">
        <Navbar variant="simple" />

        {/* Main Content */}
        <div className="flex flex-1 items-center justify-center px-4 pb-12">
          <SignIn callbackURL="/" />
        </div>
      </div>
    </main>
  );
}
