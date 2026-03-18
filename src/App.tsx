import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider } from "@/hooks/useAuth";
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
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
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
                  <CompanyProvider>
                    <SidebarProvider>
                      <div className="flex min-h-screen w-full">
                        <AppSidebar />
                        <div className="flex-1 flex flex-col">
                          <header className="h-14 border-b border-border bg-background flex items-center px-4">
                            <SidebarTrigger />
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
                              <Route path="/documentos" element={<Documentos />} />
                              <Route path="/configuracoes" element={<Configuracoes />} />
                              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </main>
                        </div>
                      </div>
                    </SidebarProvider>
                  </CompanyProvider>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
