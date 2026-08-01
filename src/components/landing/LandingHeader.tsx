import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-scalefy.png";

const WHATSAPP_URL = "https://wa.me/5500000000000";

export function LandingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-6 md:px-10 h-24">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Scalefy" className="h-12 md:h-16 w-auto object-contain" />
        </Link>
        <nav className="hidden md:flex items-center gap-10 text-sm text-muted-foreground font-medium">
          <a href="#servicos" className="hover:text-foreground transition-colors">Serviços</a>
          <a href="#projetos" className="hover:text-foreground transition-colors">Projetos</a>
          <a href="#processo" className="hover:text-foreground transition-colors">Processo</a>
          <a href="#contato" className="hover:text-foreground transition-colors">Contato</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link
            to="/auth"
            className="hidden sm:inline text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Entrar
          </Link>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium tracking-wide">
              Falar com a Scalefy
            </Button>
          </a>
        </div>
      </div>
    </header>
  );
}
