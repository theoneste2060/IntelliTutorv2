import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Bell, 
  Moon, 
  Sun, 
  BarChart3, 
  Brain, 
  Settings, 
  LogOut,
  User
} from "lucide-react";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { Link, useLocation } from "wouter";

export default function Navigation() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = async () => {
    try {
      // Clear all cached queries
      queryClient.clear();
      
      // Call logout endpoint and redirect
      window.location.href = "/api/logout";
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback - clear cache and redirect anyway
      queryClient.clear();
      window.location.href = "/";
    }
  };

  const navItems = [
    {
      href: "/",
      label: "Dashboard",
      icon: BarChart3,
      active: location === "/",
    },
    {
      href: "/practice",
      label: "Practice",
      icon: Brain,
      active: location === "/practice",
    },
    {
      href: "/progress",
      label: "Progress",
      icon: BarChart3,
      active: location === "/progress",
    },
  ];

  // Add admin links if user is admin
  if (user?.role === 'admin') {
    navItems.push(
      {
        href: "/admin",
        label: "Admin",
        icon: Settings,
        active: location === "/admin",
      },
      {
        href: "/admin/students",
        label: "Students",
        icon: User,
        active: location === "/admin/students",
      }
    );
  }

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return "User";
  };

  return (
    <nav className="bg-slate-900 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <h1 className="text-2xl font-bold text-white cursor-pointer">IntelliTutor</h1>
                <p className="text-xs text-slate-300">AI-Powered Learning</p>
              </Link>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        item.active
                          ? "bg-blue-600 text-white"
                          : "text-slate-300 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      <Icon className="mr-2 w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-slate-800 transition-colors"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-slate-300" />
              ) : (
                <Moon className="w-4 h-4 text-slate-300" />
              )}
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="p-2 rounded-full hover:bg-slate-800 transition-colors"
            >
              <Bell className="w-4 h-4 text-slate-300" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 hover:bg-slate-800 transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={user?.profileImageUrl || undefined} 
                      alt={getUserDisplayName()}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden sm:block text-slate-300">
                    {getUserDisplayName()}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="flex items-center space-x-2 text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-border">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      item.active
                        ? "nav-link-active"
                        : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                    }`}
                  >
                    <Icon className="mr-2 w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
