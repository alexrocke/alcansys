export function LandingFooter() {
  return (
    <footer id="contato" className="border-t border-white/10 py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-white/40">
        <p>© {new Date().getFullYear()} Alcansys. Todos os direitos reservados.</p>
        <div className="flex gap-6">
          <a href="mailto:contato@alcansys.com.br" className="hover:text-white transition-colors">contato@alcansys.com.br</a>
          <a href="https://wa.me/5500000000000" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp</a>
        </div>
      </div>
    </footer>
  );
}
