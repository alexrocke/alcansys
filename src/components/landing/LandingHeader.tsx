import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-scalefy.png";

export function LandingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-6 md:px-10 h-20">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Scalefy" className="h-10 md:h-12 w-auto object-contain" />
        </Link>
        <nav className="hidden md:flex items-center gap-10 text-sm text-muted-foreground font-medium">
          <a href="#servicos" className="hover:text-foreground transition-colors">Serviços</a>
          <a href="#processo" className="hover:text-foreground transition-colors">Processo</a>
          <a href="#numeros" className="hover:text-foreground transition-colors">Resultados</a>
          <a href="#contato" className="hover:text-foreground transition-colors">Contato</a>
        </nav>
        <Link to="/auth">
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium tracking-wide">
            Entrar
          </Button>
        </Link>
      </div>
    </header>
  );
}
