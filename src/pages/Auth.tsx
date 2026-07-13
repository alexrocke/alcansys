import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import logo from '@/assets/logo-scalefy.png';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user, userStatus, userRole, roleLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && userStatus === 'ativo' && !roleLoading) {
      if (userRole === 'vendedor') {
        navigate('/vendedor');
      } else if (!userRole) {
        // No role = client portal
        navigate('/portal/servicos');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, userStatus, userRole, roleLoading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error) {
      console.error('Error signing in:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(email, password, nome);
      setEmail('');
      setPassword('');
      setNome('');
    } catch (error) {
      console.error('Error signing up:', error);
    } finally {
      setLoading(false);
    }
  };

  if (user && userStatus === 'pendente') {
    return (
      <div className="min-h-screen grid md:grid-cols-2 bg-background text-foreground">
        <div className="hidden md:flex relative bg-gradient-noir items-end p-12 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/30 blur-[100px]" />
          <div className="relative space-y-4">
            <div className="text-xs uppercase tracking-[0.25em] text-primary">Scalefy</div>
            <h2 className="font-display text-5xl leading-tight">Aguardando <em className="text-gradient-ember not-italic">aprovação</em>.</h2>
          </div>
        </div>
        <div className="flex items-center justify-center p-8">
          <Card className="w-full max-w-md border-border">
            <CardHeader className="text-center">
              <CardTitle className="font-display text-3xl">Aguardando aprovação</CardTitle>
              <CardDescription>Sua conta foi criada e está sob análise do administrador.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground text-sm">Você receberá um e-mail quando sua conta for aprovada.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background text-foreground">
      {/* Editorial split — left */}
      <div className="hidden md:flex relative bg-gradient-noir flex-col justify-between p-12 overflow-hidden border-r border-border">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/30 blur-[120px]" />
        <div className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full bg-accent/20 blur-[100px]" />
        <div className="relative flex items-center gap-3">
          <img src={logo} alt="Scalefy" className="h-12 w-auto object-contain" />
        </div>
        <div className="relative space-y-6">
          <div className="text-xs uppercase tracking-[0.25em] text-primary">Bem-vindo de volta</div>
          <h1 className="font-display text-6xl leading-[0.95]">
            Software que <em className="text-gradient-ember not-italic">trabalha</em> por você.
          </h1>
          <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
            Entre para acompanhar seus projetos, automações e resultados em tempo real.
          </p>
        </div>
        <div className="relative text-xs uppercase tracking-[0.25em] text-muted-foreground">Scalefy © {new Date().getFullYear()}</div>
      </div>

      {/* Form — right */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <Card className="w-full max-w-md border-border shadow-soft">
          <CardHeader className="text-center space-y-2">
            <img src={logo} alt="Scalefy" className="md:hidden mx-auto h-14 w-auto object-contain mb-2" />
            <CardTitle className="font-display text-3xl">Acesse sua conta</CardTitle>
            <CardDescription>Painel Scalefy</CardDescription>
          </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Cadastro</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-login">E-mail</Label>
                  <Input
                    id="email-login"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-login">Senha</Label>
                  <Input
                    id="password-login"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Seu nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup">E-mail</Label>
                  <Input
                    id="email-signup"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Senha</Label>
                  <Input
                    id="password-signup"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Criando conta...' : 'Criar conta'}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Sua conta será analisada e aprovada por um administrador
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
