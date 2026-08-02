import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface MobileCtaBarProps {
  href: string;
  external: boolean;
  label: string;
}

export function MobileCtaBar({ href, external, label }: MobileCtaBarProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`md:hidden fixed bottom-0 left-0 right-0 z-50 p-3 bg-background/90 backdrop-blur-xl border-t border-border transition-transform duration-300 ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="block"
      >
        <Button className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-medium tracking-wide shadow-ember">
          <MessageCircle className="w-4 h-4" /> {label}
        </Button>
      </a>
    </div>
  );
}
