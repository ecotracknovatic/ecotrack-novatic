import { createFileRoute, Link } from "@tanstack/react-router";
import { Leaf, TreePine, ShieldCheck, BarChart3, Map, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EcoTrack Novatic — Environmental Project Intelligence" },
      {
        name: "description",
        content:
          "Plan, implement, monitor, verify and report environmental and climate action projects with AI-powered intelligence.",
      },
      { property: "og:title", content: "EcoTrack Novatic" },
      {
        property: "og:description",
        content: "AI-powered environmental project management and intelligence.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[var(--shadow-elegant)]">
              <Leaf className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">EcoTrack</div>
              <div className="text-[10px] text-muted-foreground">Novatic</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Button asChild>
                <Link to="/dashboard">Open dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link to="/auth">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth" search={{ mode: "signup" } as never}>
                    Get started
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0 -z-10 opacity-60"
            style={{ background: "var(--gradient-subtle)" }}
            aria-hidden
          />
          <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" /> Environmental intelligence, simplified
            </div>
            <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
              Plan, verify and report your climate projects with confidence.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              EcoTrack Novatic helps governments, NGOs, schools and communities track trees, measure
              impact, and produce trustworthy environmental reports — all in one place.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link to="/auth">
                  Start free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to={user ? "/dashboard" : "/auth"}>View dashboard</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition hover:shadow-[var(--shadow-elegant)]"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="font-medium">{f.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{f.body}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} EcoTrack Novatic. Built for a greener planet.
      </footer>
    </div>
  );
}

const features = [
  {
    icon: TreePine,
    title: "Tree Tracking",
    body: "Register trees with GPS, photos, species and health.",
  },
  {
    icon: ShieldCheck,
    title: "Field Verification",
    body: "Field officers verify and approve records with evidence.",
  },
  { icon: Map, title: "Maps & GPS", body: "Visualize projects and trees on interactive maps." },
  {
    icon: BarChart3,
    title: "Reports",
    body: "Generate impact summaries and downloadable reports.",
  },
];
