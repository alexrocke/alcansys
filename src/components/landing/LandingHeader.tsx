import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logoIcon from "@/assets/logo-icon.png";

export function LandingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[hsl(222,47%,11%)]/80 backdrop-blur-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-3">
          <img src={logoIcon} alt="Alcansys" className="w-9 h-9 object-contain" />
          <span className="text-xl font-bold text-white">Alcansys</span>
        </div>
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
