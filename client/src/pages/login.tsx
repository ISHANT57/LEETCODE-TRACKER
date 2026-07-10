import { useState } from "react";
import { Code2, Mail, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

export default function Login() {
  const { signInWithPassword, signUp, signInWithOtp, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<null | "signin" | "signup" | "google" | "magic">(null);

  const notConfigured = !isSupabaseConfigured;

  function handleError(err: unknown) {
    toast({
      title: "Authentication failed",
      description: err instanceof Error ? err.message : "Something went wrong. Please try again.",
      variant: "destructive",
    });
  }

  async function onSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy("signin");
    try {
      await signInWithPassword(email, password);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(null);
    }
  }

  async function onSignUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy("signup");
    try {
      const { needsConfirmation } = await signUp(email, password);
      if (needsConfirmation) {
        toast({
          title: "Check your email",
          description: "We sent a confirmation link to finish creating your account.",
        });
      }
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(null);
    }
  }

  async function onMagicLink() {
    if (!email) {
      toast({ title: "Enter your email first", variant: "destructive" });
      return;
    }
    setBusy("magic");
    try {
      await signInWithOtp(email);
      toast({
        title: "Magic link sent",
        description: `Check ${email} for a link to sign in.`,
      });
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(null);
    }
  }

  async function onGoogle() {
    setBusy("google");
    try {
      await signInWithGoogle();
      // Redirects away on success.
    } catch (err) {
      handleError(err);
      setBusy(null);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-muted/40 px-4 py-10 safe-top safe-bottom">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-900/25">
            <Code2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">LeetCode Tracker</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to access the dashboard</p>
        </div>

        <div className="card-elevated p-6">
          {notConfigured && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              Supabase isn’t configured. Set <code>VITE_SUPABASE_URL</code> and{" "}
              <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env</code>, then restart.
            </div>
          )}

          {/* Google */}
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={onGoogle}
            disabled={busy !== null || notConfigured}
          >
            {busy === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </Button>

          <div className="my-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-4">
              <form onSubmit={onSignIn} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email-in">Email</Label>
                  <Input id="email-in" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pw-in">Password</Label>
                  <Input id="pw-in" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <Button type="submit" className="w-full" disabled={busy !== null || notConfigured}>
                  {busy === "signin" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-4">
              <form onSubmit={onSignUp} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email-up">Email</Label>
                  <Input id="email-up" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pw-up">Password</Label>
                  <Input id="pw-up" type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
                </div>
                <Button type="submit" className="w-full" disabled={busy !== null || notConfigured}>
                  {busy === "signup" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Magic link */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={onMagicLink}
              disabled={busy !== null || notConfigured}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-50"
            >
              {busy === "magic" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
              Email me a magic link instead
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Protected dashboard · Sign in to continue
        </p>
      </div>
    </div>
  );
}
