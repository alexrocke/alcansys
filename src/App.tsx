import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { CompanyProvider } from "@/hooks/useCompany";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Projetos from "./pages/Projetos";
import ProjetoDetalhe from "./pages/ProjetoDetalhe";
import Financeiro from "./pages/Financeiro";
import Clientes from "./pages/Clientes";
import ClienteDetalhe from "./pages/ClienteDetalhe";
import Equipe from "./pages/Equipe";
import Marketing from "./pages/Marketing";
import Automacoes from "./pages/Automacoes";
import WhatsAppPage from "./pages/WhatsApp";
import Documentos from "./pages/Documentos";
import Configuracoes from "./pages/Configuracoes";
import Leads from "./pages/Leads";
import Conversas from "./pages/Conversas";
import Tarefas from "./pages/Tarefas";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AtividadeLog from "./pages/AtividadeLog";
import PortalDashboard from "./pages/portal/PortalDashboard";
import PortalServicos from "./pages/portal/PortalServicos";
import PortalAutomacoes from "./pages/portal/PortalAutomacoes";
import PortalFaturas from "./pages/portal/PortalFaturas";
import PortalSistemas from "./pages/portal/PortalSistemas";
import Vendedores from "./pages/Vendedores";
import { VendedorSidebar } from "@/components/vendedor-portal/VendedorSidebar";
import VendedorDashboard from "./pages/vendedor-portal/VendedorDashboard";
import VendedorLeads from "./pages/vendedor-portal/VendedorLeads";
import VendedorComissoes from "./pages/vendedor-portal/VendedorComissoes";
import VendedorClientes from "./pages/vendedor-portal/VendedorClientes";

const queryClient = new QueryClient();

function InternalLayout() {
  const location = useLocation();
  const isPortalRoute = location.pathname.startsWith('/portal');

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {isPortalRoute ? <PortalSidebar /> : <AppSidebar />}
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4">
            <SidebarTrigger />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/dashboard" element={<Index />} />
              <Route path="/projetos" element={<Projetos />} />
              <Route path="/projetos/:id" element={<ProjetoDetalhe />} />
              <Route path="/tarefas" element={<Tarefas />} />
              <Route path="/financeiro" element={<Financeiro />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/clientes/:id" element={<ClienteDetalhe />} />
              <Route path="/equipe" element={<Equipe />} />
              <Route path="/marketing" element={<Marketing />} />
              <Route path="/automacoes" element={<Automacoes />} />
              <Route path="/whatsapp" element={<WhatsAppPage />} />
              <Route path="/documentos" element={<Documentos />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/conversas" element={<Conversas />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/atividades" element={<AtividadeLog />} />
              <Route path="/vendedores" element={<Vendedores />} />
              {/* Admin can access portal and vendedor routes */}
              <Route path="/portal" element={<PortalDashboard />} />
              <Route path="/portal/servicos" element={<PortalServicos />} />
              <Route path="/portal/automacoes" element={<PortalAutomacoes />} />
              <Route path="/portal/faturas" element={<PortalFaturas />} />
              <Route path="/portal/sistemas" element={<PortalSistemas />} />
              <Route path="/vendedor" element={<VendedorDashboard />} />
              <Route path="/vendedor/leads" element={<VendedorLeads />} />
              <Route path="/vendedor/comissoes" element={<VendedorComissoes />} />
              <Route path="/vendedor/clientes" element={<VendedorClientes />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function PortalLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <PortalSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4">
            <SidebarTrigger />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/portal" element={<PortalDashboard />} />
              <Route path="/portal/servicos" element={<PortalServicos />} />
              <Route path="/portal/automacoes" element={<PortalAutomacoes />} />
              <Route path="/portal/faturas" element={<PortalFaturas />} />
              <Route path="/portal/sistemas" element={<PortalSistemas />} />
              <Route path="*" element={<Navigate to="/portal" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function VendedorLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <VendedorSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4">
            <SidebarTrigger />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/vendedor" element={<VendedorDashboard />} />
              <Route path="/vendedor/leads" element={<VendedorLeads />} />
              <Route path="/vendedor/comissoes" element={<VendedorComissoes />} />
              <Route path="/vendedor/clientes" element={<VendedorClientes />} />
              <Route path="*" element={<Navigate to="/vendedor" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppRoutes() {
  const { userRole, roleLoading } = useAuth();

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  const isClientPortal = !userRole;
  const isVendedor = userRole === 'vendedor';

  return (
    <CompanyProvider>
      {isClientPortal ? <PortalLayout /> : isVendedor ? <VendedorLayout /> : <InternalLayout />}
    </CompanyProvider>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppRoutes />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
