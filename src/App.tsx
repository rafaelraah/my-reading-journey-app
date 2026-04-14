import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, NavLink } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Library, ScrollText, User, TrendingUp, Compass, PlusCircle } from "lucide-react";
import Index from "./pages/Index.tsx";
import History from "./pages/History.tsx";
import Profile from "./pages/Profile.tsx";
import Insights from "./pages/Insights.tsx";
import Explore from "./pages/Explore.tsx";
import AddBook from "./pages/AddBook.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const navItems = [
  { to: "/", label: "Kanban", icon: Library, end: true },
  { to: "/historico", label: "Histórico", icon: ScrollText },
  { to: "/insights", label: "Insights", icon: TrendingUp },
  { to: "/explorar", label: "Explorar", icon: Compass },
  { to: "/adicionar", label: "Adicionar", icon: PlusCircle },
  { to: "/perfil", label: "Perfil", icon: User },
];

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <nav className="parchment-bg border-b border-border">
          <div className="container max-w-7xl mx-auto px-4 flex gap-1 pt-2 overflow-x-auto">
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
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/historico" element={<History />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/explorar" element={<Explore />} />
          <Route path="/adicionar" element={<AddBook />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
