"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  BarChart,
  Settings,
  Search,
  LogOut,
  User as UserIcon,
  ChevronRight,
  Users
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { Logo } from "@/components/ui/logo";

const navItems = [
  { href: "/", label: "工作台", icon: LayoutDashboard },
  { href: "/logs", label: "工作日志", icon: FileText },
  { href: "/reports/weekly", label: "周报", icon: BarChart },
  { href: "/reports/monthly", label: "月报", icon: BarChart },
  { href: "/reports/yearly", label: "年报", icon: BarChart },
];

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { ChangePasswordDialog } from "./ChangePasswordDialog";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  return (
    <div className="flex h-full w-72 flex-col border-r border-border/60 bg-card/50 backdrop-blur-xl text-card-foreground shadow-sm z-50">
      {/* Brand Header */}
      <div className="flex h-20 items-center px-8 border-b border-border/40">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 transition-all group-hover:bg-primary/20 group-hover:scale-105">
             <Logo className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Log<span className="text-primary">Mind</span>
          </span>
        </Link>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-8">
        <div className="space-y-2">
          <p className="px-4 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Menu</p>
          <ul className="space-y-1">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <li key={index}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ease-in-out border border-transparent",
                      isActive 
                        ? "bg-primary/10 text-primary border-primary/10 shadow-sm" 
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground hover:border-border/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                      {item.label}
                    </div>
                    {isActive && <ChevronRight className="h-3 w-3 opacity-50" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Settings Section */}
        <div className="space-y-2">
          <p className="px-4 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">System</p>
          <ul className="space-y-1">
             {isAdmin && (
               <li>
                 <Link
                   href="/settings/users"
                   className={cn(
                     "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ease-in-out border border-transparent",
                     pathname?.startsWith("/settings/users")
                       ? "bg-primary/10 text-primary border-primary/10 shadow-sm"
                       : "text-muted-foreground hover:bg-accent/50 hover:text-foreground hover:border-border/50"
                   )}
                 >
                   <Users className="h-4 w-4" />
                   用户管理
                 </Link>
               </li>
             )}
             {isAdmin && (
               <li>
                  <Link
                    href="/settings"
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ease-in-out border border-transparent",
                      pathname === "/settings"
                        ? "bg-primary/10 text-primary border-primary/10 shadow-sm"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground hover:border-border/50"
                    )}
                  >
                    <Settings className="h-4 w-4" />
                    系统设置
                  </Link>
               </li>
             )}
          </ul>
        </div>
      </nav>

      {/* User Profile */}
      <div className="border-t border-border/40 p-4 m-4 mt-0 bg-accent/30 rounded-2xl backdrop-blur-sm">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 cursor-pointer hover:bg-accent/50 p-2 -m-2 rounded-xl transition-colors">
               <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 flex items-center justify-center shadow-inner">
                 <UserIcon className="h-5 w-5 text-foreground/80" />
               </div>
               <div className="flex-1 overflow-hidden">
                 <p className="text-sm font-semibold truncate text-foreground">{session?.user?.name || 'User'}</p>
                 <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
               </div>
               <div className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                 <Settings className="h-4 w-4" />
               </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" side="right" sideOffset={10}>
            <DropdownMenuLabel>我的账户</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowPasswordDialog(true)}>
              <Settings className="mr-2 h-4 w-4" />
              <span>修改密码</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>退出登录</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ChangePasswordDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog} />
    </div>
  );
}
