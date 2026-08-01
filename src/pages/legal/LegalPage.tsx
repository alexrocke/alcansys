import { useEffect } from "react";
import { useTheme } from "next-themes";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { useLandingContent } from "@/hooks/useLandingContent";

export function LegalPage({ section }: { section: "privacy" | "terms" }) {
  const { setTheme } = useTheme();
  const content = useLandingContent();
  const page = content.get(section);

  useEffect(() => {
    setTheme("dark");
  }, [setTheme]);

  useEffect(() => {
    document.title = `${page.title} · Scalefy Sistemas`;
  }, [page.title]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <LandingHeader />

      <main className="pt-32 md:pt-40 pb-24 px-6 md:px-10">
        <div className="max-w-3xl mx-auto">
          <div className="relative mb-12">
            <div className="pointer-events-none absolute -top-24 -left-16 w-72 h-72 rounded-full bg-primary/15 blur-[120px]" />
            <div className="relative space-y-4">
              <div className="text-xs uppercase tracking-[0.25em] text-primary">Scalefy Sistemas</div>
              <h1 className="font-display text-4xl md:text-5xl leading-tight">{page.title}</h1>
              {page.updated ? (
                <p className="text-sm text-muted-foreground">Última atualização: {page.updated}</p>
              ) : null}
              {page.intro ? (
                <p className="text-lg text-muted-foreground leading-relaxed">{page.intro}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-px bg-border rounded-2xl overflow-hidden border border-border">
            {(page.sections || []).map((s: any) => (
              <section key={s.heading} className="bg-background p-7 md:p-9 space-y-3">
                <h2 className="font-display text-xl md:text-2xl">{s.heading}</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{s.body}</p>
              </section>
            ))}
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
