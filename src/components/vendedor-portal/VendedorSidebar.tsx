import { LayoutDashboard, Contact, DollarSign, Users, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import logoIcon from "@/assets/logo-icon.png";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar, SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const items = [
  { title: "Dashboard", url: "/vendedor", icon: LayoutDashboard },
  { title: "Meus Leads", url: "/vendedor/leads", icon: Contact },
  { title: "Minhas Comissões", url: "/vendedor/comissoes", icon: DollarSign },
  { title: "Meus Clientes", url: "/vendedor/clientes", icon: Users },
];

export function VendedorSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const { signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === "/vendedor") return location.pathname === "/vendedor";
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarContent>
        <div className="px-6 py-4">
          <div className="flex items-center gap-2">
            <img src={logoIcon} alt="Scalefy" className={`${open ? 'h-10' : 'w-10 h-10'} shrink-0 object-contain`} />
            {open && (
              <p className="text-xs text-muted-foreground">Portal do Vendedor</p>
            )}
          </div>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end={item.url === "/vendedor"} className="flex items-center gap-3" activeClassName="bg-primary/10 text-primary font-semibold">
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
