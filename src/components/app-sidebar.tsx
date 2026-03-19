import { 
  LayoutDashboard, 
  FolderKanban, 
  DollarSign, 
  TrendingUp, 
  Zap, 
  Users, 
  FileText, 
  UsersRound,
  Settings,
  LogOut,
  MessageCircle,
  Contact,
  MessagesSquare
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
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

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Projetos", url: "/projetos", icon: FolderKanban },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "Leads & CRM", url: "/leads", icon: Contact },
  { title: "Conversas", url: "/conversas", icon: MessagesSquare },
  { title: "Marketing", url: "/marketing", icon: TrendingUp },
  { title: "Automações", url: "/automacoes", icon: Zap },
  { title: "WhatsApp", url: "/whatsapp", icon: MessageCircle },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Documentos", url: "/documentos", icon: FileText },
  { title: "Equipe", url: "/equipe", icon: UsersRound },
];

const settingsItems = [
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const { signOut } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarContent>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-white">A</span>
              </div>
              {open && (
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-foreground truncate">Alcansys</h1>
                  <p className="text-xs text-muted-foreground truncate">Gestão Corporativa</p>
                </div>
              )}
            </div>
            <NotificationBell />
          </div>
          <CompanySelector />
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
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

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
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
