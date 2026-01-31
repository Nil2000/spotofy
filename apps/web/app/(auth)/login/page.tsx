import { SignIn } from "./_components/signIn";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-background to-secondary/10" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <SignIn callbackURL="/" />
      </div>
    </main>
  );
}
