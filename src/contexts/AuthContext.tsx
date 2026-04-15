import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AuthUser {
  id: string;
  username: string;
  nome: string;
  avatar_url: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, password: string, nome: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('mrj_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !data) {
      toast.error('Usuário não encontrado');
      return false;
    }

    if ((data as any).password_hash !== password) {
      toast.error('Senha incorreta');
      return false;
    }

    const authUser: AuthUser = {
      id: data.id,
      username: (data as any).username,
      nome: data.nome,
      avatar_url: data.avatar_url,
    };
    setUser(authUser);
    localStorage.setItem('mrj_user', JSON.stringify(authUser));
    toast.success('Login realizado com sucesso!');
    return true;
  }, []);

  const signup = useCallback(async (username: string, password: string, nome: string) => {
    // Check unique
    const { data: existing } = await supabase
      .from('usuarios')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existing) {
      toast.error('Username já existe');
      return false;
    }

    const { data, error } = await supabase
      .from('usuarios')
      .insert({ username, password_hash: password, nome } as any)
      .select()
      .single();

    if (error) {
      toast.error('Erro ao criar conta');
      return false;
    }

    const authUser: AuthUser = {
      id: data.id,
      username: (data as any).username,
      nome: data.nome,
      avatar_url: data.avatar_url,
    };
    setUser(authUser);
    localStorage.setItem('mrj_user', JSON.stringify(authUser));
    toast.success('Conta criada com sucesso!');
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('mrj_user');
    toast.success('Logout realizado');
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem('mrj_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
