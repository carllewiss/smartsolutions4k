import {
  LayoutDashboard, FileText, Users, Package, ShoppingCart, Receipt, TrendingUp, UserCog, Settings, ShieldCheck,
  Store, MessageSquare, Newspaper, Undo2, BookOpen,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { state } = useSidebar();
  const { isAdmin } = useAuth();
  const collapsed = state === "collapsed";

  const mainItems = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "New Invoice", url: "/invoices/new", icon: FileText },
    { title: "Invoices", url: "/invoices", icon: Receipt },
    ...(isAdmin ? [{ title: "Credit Notes", url: "/credit-notes", icon: Undo2 }] : []),
    { title: "Customers", url: "/customers", icon: Users },
  ];

  const inventoryItems = isAdmin ? [
    { title: "Inventory", url: "/inventory", icon: Package },
    { title: "Purchases", url: "/purchases", icon: ShoppingCart },
  ] : [];

  const financeItems = isAdmin ? [
    { title: "Profit & Loss", url: "/finance", icon: TrendingUp },
    { title: "Accounting", url: "/accounting", icon: BookOpen },
  ] : [];

  const adminItems = isAdmin ? [
    { title: "Shop Orders", url: "/admin/shop-orders", icon: Store },
    { title: "Service Inquiries", url: "/admin/inquiries", icon: MessageSquare },
    { title: "Blog Posts", url: "/admin/blog", icon: Newspaper },
    { title: "eTIMS Sync", url: "/etims", icon: ShieldCheck },
    { title: "User Management", url: "/users", icon: UserCog },
    { title: "Settings", url: "/settings", icon: Settings },
  ] : [];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        {!collapsed ? (
          <div>
            <h1 className="text-lg font-bold font-heading text-sidebar-primary-foreground tracking-tight">
              4K SMART
            </h1>
            <p className="text-xs text-sidebar-foreground/60">Solutions Ltd</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="text-lg font-bold text-sidebar-primary-foreground">4K</span>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Main" items={mainItems} collapsed={collapsed} />
        {inventoryItems.length > 0 && <NavGroup label="Stock" items={inventoryItems} collapsed={collapsed} />}
        {financeItems.length > 0 && <NavGroup label="Finance" items={financeItems} collapsed={collapsed} />}
        {adminItems.length > 0 && <NavGroup label="Admin" items={adminItems} collapsed={collapsed} />}
      </SidebarContent>
    </Sidebar>
  );
}

function NavGroup({ label, items, collapsed }: { label: string; items: { title: string; url: string; icon: any }[]; collapsed: boolean }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink to={item.url} end={item.url === "/"} className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                  <item.icon className="mr-2 h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
