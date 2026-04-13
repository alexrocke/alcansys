import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roleLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nome: string) => Promise<void>;
  signOut: () => Promise<void>;
  userRole: string | null;
  userStatus: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user role and status after auth state changes
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setUserStatus(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    setRoleLoading(true);
    try {
      const [profileResult, roleResult] = await Promise.all([
        supabase.from('profiles').select('status').eq('id', userId).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle()
      ]);

      setUserStatus(profileResult.data?.status ?? null);
      setUserRole(roleResult.data?.role ?? null);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setRoleLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: 'Erro ao entrar',
        description: translateAuthError(error.message),
        variant: 'destructive',
      });
      throw error;
    }

    toast({
      title: 'Bem-vindo!',
      description: 'Login realizado com sucesso.',
    });
  };

  const signUp = async (email: string, password: string, nome: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          nome,
        },
      },
    });

    if (error) {
      toast({
        title: 'Erro ao criar conta',
        description: translateAuthError(error.message),
        variant: 'destructive',
      });
      throw error;
function translateAuthError(msg: string): string {
  const map: Record<string, string> = {
    'User already registered': 'Este e-mail já possui uma conta. Tente fazer login.',
    'Invalid login credentials': 'E-mail ou senha incorretos.',
    'Email not confirmed': 'Confirme seu e-mail antes de entrar.',
    'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
    'Signup requires a valid password': 'Informe uma senha válida.',
    'Unable to validate email address: invalid format': 'Formato de e-mail inválido.',
  };
  return map[msg] || msg;
}
    }

    toast({
      title: 'Conta criada!',
      description: 'Aguarde a aprovação do administrador para acessar o sistema.',
    });
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        title: 'Erro ao sair',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }

    setUserRole(null);
    setUserStatus(null);
    navigate('/auth');
    
    toast({
      title: 'Até logo!',
      description: 'Você saiu do sistema.',
    });
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, roleLoading, signIn, signUp, signOut, userRole, userStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
