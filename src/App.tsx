import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, NavLink } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Library, ScrollText, User } from "lucide-react";
import Index from "./pages/Index.tsx";
import History from "./pages/History.tsx";
import Profile from "./pages/Profile.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <nav className="parchment-bg border-b border-border">
          <div className="container max-w-7xl mx-auto px-4 flex gap-1 pt-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2.5 font-display text-sm rounded-t-lg transition-colors ${
                  isActive
                    ? 'bg-background text-foreground border border-b-0 border-border -mb-px'
                    : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              <Library className="h-4 w-4" />
              Kanban
            </NavLink>
            <NavLink
              to="/historico"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2.5 font-display text-sm rounded-t-lg transition-colors ${
                  isActive
                    ? 'bg-background text-foreground border border-b-0 border-border -mb-px'
                    : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              <ScrollText className="h-4 w-4" />
              Histórico
            </NavLink>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/historico" element={<History />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
