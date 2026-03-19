import { ShoppingBag, Zap, Receipt, Monitor, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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

const portalItems = [
  { title: "Serviços", url: "/portal/servicos", icon: ShoppingBag },
  { title: "Automações", url: "/portal/automacoes", icon: Zap },
  { title: "Faturas", url: "/portal/faturas", icon: Receipt },
  { title: "Sistemas", url: "/portal/sistemas", icon: Monitor },
];

export function PortalSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const { signOut } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath.startsWith(path);

  return (
    <Sidebar className="border-r border-border">
      <SidebarContent>
        <div className="px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-primary-foreground">A</span>
            </div>
            {open && (
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-foreground truncate">Alcansys</h1>
                <p className="text-xs text-muted-foreground truncate">Portal do Cliente</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Portal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {portalItems.map((item) => (
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
        <Button variant="outline" onClick={signOut} className="w-full justify-start gap-3">
          <LogOut className="h-5 w-5" />
          {open && <span>Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
