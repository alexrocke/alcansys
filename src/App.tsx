import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Suspense } from "react";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { CompanyProvider } from "@/hooks/useCompany";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ConfirmDialogHost } from "@/components/ConfirmDialog";
import { GlobalSearch } from "@/components/GlobalSearch";
import { PageSkeleton } from "@/components/ui/loading-state";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { VendedorSidebar } from "@/components/vendedor-portal/VendedorSidebar";

const Index = lazyWithRetry(() => import("./pages/Index"));
const Projetos = lazyWithRetry(() => import("./pages/Projetos"));
const ProjetoDetalhe = lazyWithRetry(() => import("./pages/ProjetoDetalhe"));
const Financeiro = lazyWithRetry(() => import("./pages/Financeiro"));
const Clientes = lazyWithRetry(() => import("./pages/Clientes"));
const ClienteDetalhe = lazyWithRetry(() => import("./pages/ClienteDetalhe"));
const Equipe = lazyWithRetry(() => import("./pages/Equipe"));
const Marketing = lazyWithRetry(() => import("./pages/Marketing"));
const Automacoes = lazyWithRetry(() => import("./pages/Automacoes"));
const WhatsAppPage = lazyWithRetry(() => import("./pages/WhatsApp"));
const Documentos = lazyWithRetry(() => import("./pages/Documentos"));
const Configuracoes = lazyWithRetry(() => import("./pages/Configuracoes"));
const Leads = lazyWithRetry(() => import("./pages/Leads"));
const Conversas = lazyWithRetry(() => import("./pages/Conversas"));
const Tarefas = lazyWithRetry(() => import("./pages/Tarefas"));
const AtividadeLog = lazyWithRetry(() => import("./pages/AtividadeLog"));
const Checkout = lazyWithRetry(() => import("./pages/Checkout"));
const CofreInterno = lazyWithRetry(() => import("./pages/CofreInterno"));
const Vendedores = lazyWithRetry(() => import("./pages/Vendedores"));
const PortalDashboard = lazyWithRetry(() => import("./pages/portal/PortalDashboard"));
const PortalServicos = lazyWithRetry(() => import("./pages/portal/PortalServicos"));
const PortalAutomacoes = lazyWithRetry(() => import("./pages/portal/PortalAutomacoes"));
const PortalFaturas = lazyWithRetry(() => import("./pages/portal/PortalFaturas"));
const PortalSistemas = lazyWithRetry(() => import("./pages/portal/PortalSistemas"));
const PortalProjetos = lazyWithRetry(() => import("./pages/portal/PortalProjetos"));
const PortalProjetoDetalhe = lazyWithRetry(() => import("./pages/portal/PortalProjetoDetalhe"));
const VendedorDashboard = lazyWithRetry(() => import("./pages/vendedor-portal/VendedorDashboard"));
const VendedorLeads = lazyWithRetry(() => import("./pages/vendedor-portal/VendedorLeads"));
const VendedorComissoes = lazyWithRetry(() => import("./pages/vendedor-portal/VendedorComissoes"));
const VendedorClientes = lazyWithRetry(() => import("./pages/vendedor-portal/VendedorClientes"));
const PoliticaPrivacidade = lazyWithRetry(() => import("./pages/legal/PoliticaPrivacidade"));
const TermosDeUso = lazyWithRetry(() => import("./pages/legal/TermosDeUso"));


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

function RouteFallback() {
  return <PageSkeleton />;
}

function InternalLayout() {
  const location = useLocation();
  const isPortalRoute = location.pathname.startsWith('/portal');

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {isPortalRoute ? <PortalSidebar /> : <AppSidebar />}
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4 gap-2">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <GlobalSearch />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Suspense fallback={<RouteFallback />}>
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
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/cofre" element={<CofreInterno />} />
                {/* Admin can access portal and vendedor routes */}
                <Route path="/portal" element={<PortalDashboard />} />
                <Route path="/portal/servicos" element={<PortalServicos />} />
                <Route path="/portal/automacoes" element={<PortalAutomacoes />} />
                <Route path="/portal/faturas" element={<PortalFaturas />} />
                <Route path="/portal/sistemas" element={<PortalSistemas />} />
                <Route path="/portal/projetos" element={<PortalProjetos />} />
                <Route path="/portal/projetos/:id" element={<PortalProjetoDetalhe />} />
                <Route path="/vendedor" element={<VendedorDashboard />} />
                <Route path="/vendedor/leads" element={<VendedorLeads />} />
                <Route path="/vendedor/comissoes" element={<VendedorComissoes />} />
                <Route path="/vendedor/clientes" element={<VendedorClientes />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
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
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/portal" element={<PortalDashboard />} />
                <Route path="/portal/servicos" element={<PortalServicos />} />
                <Route path="/portal/automacoes" element={<PortalAutomacoes />} />
                <Route path="/portal/faturas" element={<PortalFaturas />} />
                <Route path="/portal/sistemas" element={<PortalSistemas />} />
                <Route path="/portal/projetos" element={<PortalProjetos />} />
                <Route path="/portal/projetos/:id" element={<PortalProjetoDetalhe />} />
                <Route path="*" element={<Navigate to="/portal" replace />} />
              </Routes>
            </Suspense>
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
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/vendedor" element={<VendedorDashboard />} />
                <Route path="/vendedor/leads" element={<VendedorLeads />} />
                <Route path="/vendedor/comissoes" element={<VendedorComissoes />} />
                <Route path="/vendedor/clientes" element={<VendedorClientes />} />
                <Route path="*" element={<Navigate to="/vendedor" replace />} />
              </Routes>
            </Suspense>
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
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ConfirmDialogHost />
        <ErrorBoundary>
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route
                  path="/politica-de-privacidade"
                  element={
                    <Suspense fallback={<RouteFallback />}>
                      <PoliticaPrivacidade />
                    </Suspense>
                  }
                />
                <Route
                  path="/termos-de-uso"
                  element={
                    <Suspense fallback={<RouteFallback />}>
                      <TermosDeUso />
                    </Suspense>
                  }
                />

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
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
