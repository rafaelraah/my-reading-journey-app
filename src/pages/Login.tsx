import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Library, Loader2, LogIn, UserPlus } from 'lucide-react';

const Login = () => {
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    if (isSignup) {
      if (password !== confirmPassword) {
        return;
      }
      setLoading(true);
      await signup(username.trim(), password, nome.trim() || username.trim());
    } else {
      setLoading(true);
      await login(username.trim(), password);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md parchment-bg border-border shadow-xl">
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-3 mb-8">
            <Library className="h-12 w-12 text-accent" />
            <h1 className="text-2xl font-display font-bold text-foreground tracking-wide">
              My Reading Journey
            </h1>
            <p className="text-muted-foreground text-center">
              {isSignup ? 'Crie sua conta e comece sua jornada' : 'Entre para continuar sua jornada'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="space-y-2">
                <Label className="font-display text-sm">Nome</Label>
                <Input
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Seu nome..."
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="font-display text-sm">Username</Label>
              <Input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="username"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="font-display text-sm">Senha</Label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••"
                required
              />
            </div>

            {isSignup && (
              <div className="space-y-2">
                <Label className="font-display text-sm">Confirmar Senha</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••"
                  required
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-destructive">As senhas não coincidem</p>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || (isSignup && password !== confirmPassword)}
              className="w-full bg-primary hover:bg-wood-light text-primary-foreground font-display"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : isSignup ? (
                <UserPlus className="h-4 w-4 mr-2" />
              ) : (
                <LogIn className="h-4 w-4 mr-2" />
              )}
              {isSignup ? 'Criar Conta' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsSignup(!isSignup); setPassword(''); setConfirmPassword(''); }}
              className="text-sm text-accent hover:underline font-display"
            >
              {isSignup ? 'Já tenho uma conta' : 'Criar conta'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
