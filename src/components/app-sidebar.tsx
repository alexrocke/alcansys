import { 
  LayoutDashboard, 
  FolderKanban, 
  DollarSign,
  ListChecks,
  TrendingUp, 
  Zap, 
  Users, 
  FileText, 
  UsersRound,
  Settings,
  LogOut,
  MessageCircle,
  Contact,
  MessagesSquare,
  BadgeDollarSign
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import logoIcon from "@/assets/logo-icon.png";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { CompanySelector } from "@/components/CompanySelector";
import { NotificationBell } from "@/components/NotificationBell";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

type AppRole = 'admin' | 'gestor' | 'colaborador' | 'financeiro' | 'marketing' | 'vendedor';

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: AppRole[];
}

const allRoles: AppRole[] = ['admin', 'gestor', 'colaborador', 'financeiro', 'marketing', 'vendedor'];

const mainItems: MenuItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, allowedRoles: allRoles },
  { title: "Projetos", url: "/projetos", icon: FolderKanban, allowedRoles: ['admin', 'gestor', 'colaborador'] },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign, allowedRoles: ['admin', 'financeiro'] },
  { title: "Leads & CRM", url: "/leads", icon: Contact, allowedRoles: ['admin', 'gestor', 'marketing'] },
  { title: "Conversas", url: "/conversas", icon: MessagesSquare, allowedRoles: ['admin', 'gestor', 'marketing'] },
  { title: "Marketing", url: "/marketing", icon: TrendingUp, allowedRoles: ['admin', 'marketing'] },
  { title: "Automações", url: "/automacoes", icon: Zap, allowedRoles: ['admin', 'marketing'] },
  { title: "WhatsApp", url: "/whatsapp", icon: MessageCircle, allowedRoles: ['admin'] },
  { title: "Clientes", url: "/clientes", icon: Users, allowedRoles: ['admin', 'gestor', 'financeiro'] },
  { title: "Documentos", url: "/documentos", icon: FileText, allowedRoles: ['admin', 'gestor', 'colaborador', 'financeiro'] },
  { title: "Vendedores", url: "/vendedores", icon: BadgeDollarSign, allowedRoles: ['admin', 'gestor'] },
  { title: "Equipe", url: "/equipe", icon: UsersRound, allowedRoles: ['admin', 'gestor'] },
];

const settingsItems: MenuItem[] = [
  { title: "Configurações", url: "/configuracoes", icon: Settings, allowedRoles: ['admin'] },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const { signOut, userRole } = useAuth();
  const currentPath = location.pathname;
  const role = (userRole as AppRole) || 'colaborador';

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const visibleMain = mainItems.filter((item) => item.allowedRoles.includes(role));
  const visibleSettings = settingsItems.filter((item) => item.allowedRoles.includes(role));

  return (
    <Sidebar className="border-r border-border">
      <SidebarContent>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <img src={logoIcon} alt="Alcansys" className="w-10 h-10 shrink-0 object-contain" />
              {open && (
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-foreground truncate">Alcansys</h1>
                </div>
              )}
            </div>
            <NotificationBell />
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"}
                      className="flex items-center gap-3"
                      activeClassName="bg-primary/10 text-primary font-semibold"
                    >
                      <item.icon className="h-5 w-5" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {visibleSettings.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Sistema</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleSettings.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink 
                        to={item.url}
                        className="flex items-center gap-3"
                        activeClassName="bg-primary/10 text-primary font-semibold"
                      >
                        <item.icon className="h-5 w-5" />
                        {open && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button 
          variant="outline" 
          onClick={signOut}
          className="w-full justify-start gap-3"
        >
          <LogOut className="h-5 w-5" />
          {open && <span>Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
