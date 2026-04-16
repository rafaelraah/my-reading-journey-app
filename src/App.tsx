import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, NavLink } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Library, ScrollText, User, TrendingUp, Compass, PlusCircle, LogOut, Users, Bell } from "lucide-react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useSocial } from "@/hooks/useSocial";
import Index from "./pages/Index.tsx";
import History from "./pages/History.tsx";
import Profile from "./pages/Profile.tsx";
import Insights from "./pages/Insights.tsx";
import Explore from "./pages/Explore.tsx";
import AddBook from "./pages/AddBook.tsx";
import UsersPage from "./pages/Users.tsx";
import PublicProfile from "./pages/PublicProfile.tsx";
import Notifications from "./pages/Notifications.tsx";
import Login from "./pages/Login.tsx";
import NotFound from "./pages/NotFound.tsx";
import { Button } from "@/components/ui/button";

const queryClient = new QueryClient();

const navItems = [
  { to: "/", label: "Kanban", icon: Library, end: true },
  { to: "/historico", label: "Histórico", icon: ScrollText },
  { to: "/insights", label: "Insights", icon: TrendingUp },
  { to: "/explorar", label: "Explorar", icon: Compass },
  { to: "/adicionar", label: "Adicionar", icon: PlusCircle },
  { to: "/usuarios", label: "Usuários", icon: Users },
  { to: "/perfil", label: "Perfil", icon: User },
];

function AppContent() {
  const { user, loading, logout } = useAuth();
  const { unreadCount } = useSocial();

  if (loading) return null;
  if (!user) return <Login />;

  return (
    <>
      <nav className="parchment-bg border-b border-border">
        <div className="container max-w-7xl mx-auto px-4 flex items-center pt-2 overflow-x-auto">
          <div className="flex gap-1 flex-1">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2.5 font-display text-sm rounded-t-lg transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-background text-foreground border border-b-0 border-border -mb-px'
                        : 'text-muted-foreground hover:text-foreground'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
            <NavLink
              to="/notificacoes"
              className={({ isActive }) =>
                `relative flex items-center gap-2 px-4 py-2.5 font-display text-sm rounded-t-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-background text-foreground border border-b-0 border-border -mb-px'
                    : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>
          </div>
          <div className="flex items-center gap-2 pb-1">
            <span className="text-sm text-muted-foreground font-display">{user.nome}</span>
            <Button variant="ghost" size="icon" onClick={logout} title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/historico" element={<History />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/explorar" element={<Explore />} />
        <Route path="/adicionar" element={<AddBook />} />
        <Route path="/usuarios" element={<UsersPage />} />
        <Route path="/usuario/:id" element={<PublicProfile />} />
        <Route path="/notificacoes" element={<Notifications />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
