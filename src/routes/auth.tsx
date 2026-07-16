import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Leaf } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — EcoTrack Novatic" },
      { name: "description", content: "Sign in or create an EcoTrack Novatic account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [user, loading, navigate]);

  const onGoogle = async () => {
    setBusy(true);
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (res.error) {
      toast.error(res.error.message ?? "Google sign-in failed");
      setBusy(false);
      return;
    }
    if (res.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Account created. Check your email to verify.");
        setMode("signin");
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/dashboard", replace: true });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Password reset email sent.");
        setMode("signin");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div
        className="relative hidden flex-col justify-between p-10 lg:flex"
        style={{ background: "var(--gradient-primary)" }}
      >
        <Link to="/" className="flex items-center gap-2 text-primary-foreground">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
            <Leaf className="h-4 w-4" />
          </div>
          <span className="font-semibold">EcoTrack Novatic</span>
        </Link>
        <div className="text-primary-foreground">
          <p className="text-2xl font-medium leading-snug">
            "We've cut our reporting time by 70% while improving the integrity of our tree data."
          </p>
          <p className="mt-3 text-sm opacity-80">— Reforestation Lead, Field NGO</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Leaf className="h-4 w-4" />
            </div>
            <span className="font-semibold">EcoTrack Novatic</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "signup"
              ? "Create your account"
              : mode === "forgot"
                ? "Reset password"
                : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signup"
              ? "Start tracking environmental impact in minutes."
              : mode === "forgot"
                ? "We'll send you a reset link by email."
                : "Sign in to your EcoTrack workspace."}
          </p>

          {mode !== "forgot" && (
            <>
              <Tabs
                value={mode}
                onValueChange={(v) => setMode(v as "signin" | "signup")}
                className="mt-6"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Sign up</TabsTrigger>
                </TabsList>
                <TabsContent value={mode} />
              </Tabs>
              <Button onClick={onGoogle} disabled={busy} variant="outline" className="mt-4 w-full">
                Continue with Google
              </Button>
              <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" /> or{" "}
                <div className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}
            <Button type="submit" disabled={busy} className="w-full">
              {busy
                ? "Please wait…"
                : mode === "signup"
                  ? "Create account"
                  : mode === "forgot"
                    ? "Send reset link"
                    : "Sign in"}
            </Button>
            {mode === "forgot" && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setMode("signin")}
              >
                Back to sign in
              </Button>
            )}
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing you agree to our terms and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}
