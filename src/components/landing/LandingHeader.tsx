import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-alcansys.png";

export function LandingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[hsl(222,47%,11%)]/80 backdrop-blur-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 px-6 h-24 md:h-28">
        <img src={logo} alt="Scalefy" className="h-14 md:h-16 w-auto max-w-[240px] md:max-w-[300px] object-contain" />
        <nav className="hidden md:flex items-center gap-8 text-sm text-white/60">
          <a href="#servicos" className="hover:text-white transition-colors">Serviços</a>
          <a href="#numeros" className="hover:text-white transition-colors">Resultados</a>
          <a href="#contato" className="hover:text-white transition-colors">Contato</a>
        </nav>
        <Link to="/auth">
          <Button size="sm" className="bg-[hsl(217,91%,60%)] text-white hover:bg-[hsl(217,91%,50%)]">
            Entrar
          </Button>
        </Link>
      </div>
    </header>
  );
}
