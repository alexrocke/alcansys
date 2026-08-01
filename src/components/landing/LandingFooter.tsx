import { Link, useNavigate, useLocation } from "react-router-dom";
import { useLandingContent } from "@/hooks/useLandingContent";
import logo from "@/assets/logo-scalefy.png";

export function LandingFooter() {
  const content = useLandingContent();
  const footer = content.get("footer");
  const products = content.get("products");
  const navigate = useNavigate();
  const location = useLocation();
  const rawWhatsapp = (footer.whatsapp_url || "").trim();
  const isPlaceholder = !rawWhatsapp || /0{6,}/.test(rawWhatsapp);

  const goToSection = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname !== "/") {
      navigate("/#" + id);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer id="contato" className="border-t border-border py-14 px-6 md:px-10 bg-background">
      <div className="max-w-7xl mx-auto grid gap-10 md:grid-cols-4">
        <div className="space-y-3">
          <img src={logo} alt="Scalefy" className="h-10 w-auto object-contain" />
          <p className="text-sm text-muted-foreground max-w-xs">{footer.description}</p>
        </div>

        <div className="space-y-3">
          <div className="text-xs uppercase tracking-[0.25em] text-primary">Navegação</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="/#servicos" onClick={goToSection("servicos")} className="hover:text-primary transition-colors cursor-pointer">Serviços</a></li>
            <li><a href="/#projetos" onClick={goToSection("projetos")} className="hover:text-primary transition-colors cursor-pointer">Projetos</a></li>
            <li><a href="/#processo" onClick={goToSection("processo")} className="hover:text-primary transition-colors cursor-pointer">Processo</a></li>
            <li><a href="/#contato" onClick={goToSection("contato")} className="hover:text-primary transition-colors cursor-pointer">Contato</a></li>
          </ul>
        </div>

        <div className="space-y-3">
          <div className="text-xs uppercase tracking-[0.25em] text-primary">Produtos</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {(products.items || []).slice(0, 5).map((p: any) => (
              <li key={p.name}>
                <a href="/#projetos" onClick={goToSection("projetos")} className="hover:text-primary transition-colors cursor-pointer">{p.name}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <div className="text-xs uppercase tracking-[0.25em] text-primary">Contato</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a href={`mailto:${footer.email}`} className="hover:text-primary transition-colors">
                {footer.email}
              </a>
            </li>
            {!isPlaceholder ? (
              <li>
                <a href={rawWhatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  {footer.whatsapp_label || "WhatsApp"}
                </a>
              </li>
            ) : null}
            <li>
              <Link to="/politica-de-privacidade" className="hover:text-primary transition-colors">
                Política de Privacidade
              </Link>
            </li>
            <li>
              <Link to="/termos-de-uso" className="hover:text-primary transition-colors">
                Termos de Uso
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-border text-sm text-muted-foreground">
        © {new Date().getFullYear()} {footer.company_name || "Scalefy"}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
