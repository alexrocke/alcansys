import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { CompanyProvider } from "@/hooks/useCompany";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Projetos from "./pages/Projetos";
import Financeiro from "./pages/Financeiro";
import Clientes from "./pages/Clientes";
import Equipe from "./pages/Equipe";
import Marketing from "./pages/Marketing";
import Automacoes from "./pages/Automacoes";
import WhatsAppPage from "./pages/WhatsApp";
import Documentos from "./pages/Documentos";
import Configuracoes from "./pages/Configuracoes";
import Leads from "./pages/Leads";
import Conversas from "./pages/Conversas";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
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
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4">
            <SidebarTrigger />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/projetos" element={<Projetos />} />
              <Route path="/financeiro" element={<Financeiro />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/equipe" element={<Equipe />} />
              <Route path="/marketing" element={<Marketing />} />
              <Route path="/automacoes" element={<Automacoes />} />
              <Route path="/whatsapp" element={<WhatsAppPage />} />
              <Route path="/documentos" element={<Documentos />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/conversas" element={<Conversas />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/vendedores" element={<Vendedores />} />
              <Route path="/portal/*" element={<Navigate to="/" replace />} />
              <Route path="/vendedor/*" element={<Navigate to="/" replace />} />
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
              <Route path="/portal/servicos" element={<PortalServicos />} />
              <Route path="/portal/automacoes" element={<PortalAutomacoes />} />
              <Route path="/portal/faturas" element={<PortalFaturas />} />
              <Route path="/portal/sistemas" element={<PortalSistemas />} />
              <Route path="*" element={<Navigate to="/portal/servicos" replace />} />
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
