"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  StickyNote,
  BarChart3,
  Landmark,
  ChevronsLeft,
  ChevronsRight,
  X,
  Boxes,
  Package,
  LogOut,
} from "lucide-react";
import { logout } from "@/app/login/actions";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/factory-stock", label: "Factory Stock", icon: Package },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/ledger", label: "Ledger", icon: Landmark },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const content = (
    <>
      <div className="flex items-center justify-between px-4 py-5">
        <div className={`flex items-center gap-2 overflow-hidden ${collapsed ? "md:justify-center md:w-full" : ""}`}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
            <Boxes size={18} />
          </span>
          {!collapsed && (
            <span className="truncate text-sm font-semibold text-foreground">
              Honest International
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-lg p-1 text-foreground/60 hover:bg-primary-light md:hidden"
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-white shadow-sm"
                  : "text-foreground/70 hover:bg-primary-light hover:text-primary"
              } ${collapsed ? "md:justify-center" : ""}`}
            >
              <Icon size={19} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 px-3 pb-4">
        <form action={logout}>
          <button
            type="submit"
            title={collapsed ? "Sign out" : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/60 hover:bg-primary-light hover:text-primary ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut size={19} className="shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </form>

        <button
          type="button"
          onClick={onToggleCollapsed}
          className={`hidden w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/60 hover:bg-primary-light hover:text-primary md:flex ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {collapsed ? <ChevronsRight size={19} /> : <ChevronsLeft size={19} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-black/5 bg-surface transition-all duration-200 md:flex ${
          collapsed ? "w-[76px]" : "w-64"
        }`}
      >
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={onCloseMobile} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-surface shadow-xl">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
