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
  BadgeDollarSign,
  Activity,
  CreditCard,
  KeyRound
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import logoIcon from "@/assets/logo-icon.png";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { CompanySelector } from "@/components/CompanySelector";
import { NotificationBell } from "@/components/NotificationBell";
import { usePermissions } from "@/hooks/usePermissions";

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

interface MenuItem {
  title: string;
  url: string;
  pageKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainItems: MenuItem[] = [
  { title: "Dashboard", url: "/dashboard", pageKey: "dashboard", icon: LayoutDashboard },
  { title: "Projetos", url: "/projetos", pageKey: "projetos", icon: FolderKanban },
  { title: "Tarefas", url: "/tarefas", pageKey: "tarefas", icon: ListChecks },
  { title: "Financeiro", url: "/financeiro", pageKey: "financeiro", icon: DollarSign },
  { title: "Leads & CRM", url: "/leads", pageKey: "leads", icon: Contact },
  { title: "Conversas", url: "/conversas", pageKey: "conversas", icon: MessagesSquare },
  { title: "Marketing", url: "/marketing", pageKey: "marketing", icon: TrendingUp },
  { title: "Automações", url: "/automacoes", pageKey: "automacoes", icon: Zap },
  { title: "WhatsApp", url: "/whatsapp", pageKey: "whatsapp", icon: MessageCircle },
  { title: "Clientes", url: "/clientes", pageKey: "clientes", icon: Users },
  { title: "Documentos", url: "/documentos", pageKey: "documentos", icon: FileText },
  { title: "Vendedores", url: "/vendedores", pageKey: "vendedores", icon: BadgeDollarSign },
  { title: "Equipe", url: "/equipe", pageKey: "equipe", icon: UsersRound },
  { title: "Checkout", url: "/checkout", pageKey: "financeiro", icon: CreditCard },
];

const settingsItems: MenuItem[] = [
  { title: "Cofre Interno", url: "/cofre", pageKey: "configuracoes", icon: KeyRound },
  { title: "Configurações", url: "/configuracoes", pageKey: "configuracoes", icon: Settings },
  { title: "Atividades", url: "/atividades", pageKey: "atividades", icon: Activity },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const { signOut } = useAuth();
  const { hasPageAccess } = usePermissions();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/dashboard") return currentPath === "/dashboard";
    return currentPath.startsWith(path);
  };

  const visibleMain = mainItems.filter((item) => hasPageAccess(item.pageKey));
  const visibleSettings = settingsItems.filter((item) => hasPageAccess(item.pageKey));

  return (
    <Sidebar className="border-r border-border">
      <SidebarContent>
        <div className={`${open ? 'px-4 py-1' : 'px-2 py-1 flex justify-center'}`}>
          <div className={`flex items-center ${open ? 'justify-between' : 'justify-center'} gap-2`}>
            <img src={logoIcon} alt="Scalefy" className={`${open ? 'h-24 w-24' : 'w-10 h-10'} shrink-0 object-contain`} />
            {open && <NotificationBell />}
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
                      end={item.url === "/dashboard"}
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
