import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarGroup, SidebarGroupContent } from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, FileText, PlusCircle } from "lucide-react";
import React from "react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <Sidebar>
          <SidebarHeader className="h-16 flex items-center px-6 border-b border-sidebar-border">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary tracking-tight">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <span>InvoicePro</span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/"}>
                      <Link href="/" className="flex items-center gap-3">
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/invoices"}>
                      <Link href="/invoices" className="flex items-center gap-3">
                        <FileText className="w-4 h-4" />
                        <span>Invoices</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem className="mt-4">
                    <SidebarMenuButton asChild variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md">
                      <Link href="/invoices/new" className="flex items-center justify-center gap-2 font-medium">
                        <PlusCircle className="w-4 h-4" />
                        <span>Create Invoice</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 flex flex-col min-h-screen overflow-auto">
          <div className="flex-1 w-full max-w-6xl mx-auto p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}