import { useState } from "react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Upload,
  GitCompare,
  CheckSquare,
  History,
  Bell,
  User,
  ChevronDown,
  Search,
  ListChecks,
  Shield,
  LayoutTemplate,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  Table,
  ChartArea,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Analytics", href: "/analytics", icon: ChartArea },
  { name: "Upload", href: "/upload", icon: Upload },
  { name: "Data Editor", href: "/editor", icon: Table },
  { name: "Compare", href: "/compare", icon: GitCompare },
  { name: "Governance", href: "/governance", icon: Shield },
  { name: "Change Review", href: "/change-review", icon: ListChecks },
  { name: "Review / Approvals", href: "/review", icon: CheckSquare },
  { name: "Version History", href: "/history", icon: History },
];

const railways = ["SBB", "AB", "AVA", "RBS"];

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="h-screen flex bg-zinc-50 font-sans text-zinc-900 antialiased selection:bg-zinc-200 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`
          relative flex flex-col shrink-0 bg-zinc-900 border-r border-zinc-800 transition-all duration-300 ease-in-out
          ${isCollapsed ? "w-[70px]" : "w-[260px]"}
        `}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 shadow-sm transition-colors"
          aria-label="Toggle sidebar"
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>

        {/* Logo */}
        <div
          className={`h-16 flex items-center ${
            isCollapsed ? "justify-center px-0" : "px-6"
          } border-b border-zinc-800 transition-all duration-300`}
        >
          <div className="flex items-center gap-3 font-semibold text-white">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/10 shrink-0">
              <div className="w-4 h-4 bg-white rounded-sm" />
            </div>
            {!isCollapsed && <span className="whitespace-nowrap">Catalyst</span>}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-6 space-y-1 overflow-y-auto overflow-x-hidden px-3">
          {!isCollapsed ? (
            <div className="px-3 mb-6">
              <Button
                variant="outline"
                className="w-full justify-between bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 font-normal h-9"
              >
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4" /> Search...
                </span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-zinc-700 bg-zinc-900 px-1.5 font-mono text-[10px] font-medium text-zinc-500 opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            </div>
          ) : (
            <div className="mb-6 flex justify-center">
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800" title="Search">
                <Search className="w-5 h-5" />
              </Button>
            </div>
          )}

          {!isCollapsed && (
            <p className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
              Platform
            </p>
          )}

          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  title={isCollapsed ? item.name : undefined}
                  className={`
                    group flex items-center h-10 rounded-md transition-all duration-200 ease-in-out
                    ${isCollapsed ? "justify-center px-0" : "px-3"}
                    ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    }
                  `}
                >
                  <Icon
                    className={`
                      transition-colors shrink-0
                      ${isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-3"}
                      ${isActive ? "text-white" : "text-zinc-400 group-hover:text-white"}
                    `}
                  />
                  {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer / User */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-900">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`
                  w-full hover:bg-zinc-800 h-12 transition-all duration-200
                  ${isCollapsed ? "justify-center px-0" : "justify-start px-2"}
                `}
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shrink-0 shadow-lg border border-white/10">
                  <User className="h-4 w-4 text-white" />
                </div>

                {!isCollapsed && (
                  <>
                    <div className="flex flex-col items-start ml-3 text-left overflow-hidden">
                      <span className="font-medium text-sm text-zinc-200 truncate w-32">Hans Müller</span>
                      <span className="text-xs text-zinc-500 truncate w-32">Engineering Lead</span>
                    </div>
                    <ChevronDown className="ml-auto h-4 w-4 text-zinc-500" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 bg-zinc-900 border-zinc-800 text-zinc-200"
              sideOffset={10}
              side={isCollapsed ? "right" : "top"}
            >
              <DropdownMenuLabel className="text-zinc-400">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem className="focus:bg-zinc-800 focus:text-white cursor-pointer">
                <User className="w-4 h-4 mr-2" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-zinc-800 focus:text-white cursor-pointer">
                <Settings className="w-4 h-4 mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem className="focus:bg-zinc-800 focus:text-white text-red-400 focus:text-red-400 cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-50 overflow-hidden">
        <header className="h-16 border-b border-zinc-200 flex items-center justify-between px-8 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="-ml-2 gap-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900">SBB</span>
                    <span className="text-zinc-300">/</span>
                    <span className="text-sm font-medium">Infrastructure Catalog</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {railways.map((railway) => (
                  <DropdownMenuItem key={railway} className="cursor-pointer">
                    {railway}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-700">System Operational</span>
            </span>
            <div className="h-6 w-px bg-zinc-200" />
            <Button variant="ghost" size="icon" className="relative text-zinc-400 hover:text-zinc-900" title="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-zinc-50 scroll-smooth">{children}</main>
      </div>
    </div>
  );
}
