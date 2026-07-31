import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
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

// Keep a single stable context instance across HMR updates. Without this, a hot
// update of this module creates a new context object while the already-mounted
// AuthProvider still feeds the old one, making consumers throw
// "useAuth must be used within an AuthProvider" and blanking the screen.
const globalScope = globalThis as unknown as {
  __scalefyAuthContext?: React.Context<AuthContextType | undefined>;
};
const AuthContext =
  globalScope.__scalefyAuthContext ??
  (globalScope.__scalefyAuthContext = createContext<AuthContextType | undefined>(undefined));

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const navigate = useNavigate();

  // Tracks which user id already had role/status loaded, so returning to the
  // tab (TOKEN_REFRESHED / SIGNED_IN) never re-triggers a blocking reload.
  const loadedUserIdRef = useRef<string | null>(null);

  const clearAuthState = useCallback(() => {
    loadedUserIdRef.current = null;
    setSession(null);
    setUser(null);
    setUserRole(null);
    setUserStatus(null);
    setRoleLoading(false);
  }, []);

  const fetchUserData = useCallback(async (userId: string, silent = false) => {
    if (!silent) setRoleLoading(true);
    try {
      const [profileResult, roleResult] = await Promise.all([
        supabase.from('profiles').select('status').eq('id', userId).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle()
      ]);

      const nextStatus = profileResult.data?.status ?? null;
      const nextRole = roleResult.data?.role ?? null;
      setUserStatus((prev) => (prev === nextStatus ? prev : nextStatus));
      setUserRole((prev) => (prev === nextRole ? prev : nextRole));
      loadedUserIdRef.current = userId;
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      if (!silent) setRoleLoading(false);
    }
  }, []);

  const validateStoredSession = useCallback(async (storedSession: Session | null) => {
    if (!storedSession) {
      clearAuthState();
      return;
    }

    const { data: { user: validatedUser }, error } = await supabase.auth.getUser();

    if (error || !validatedUser) {
      await supabase.auth.signOut({ scope: 'local' });
      clearAuthState();
      return;
    }

    setSession(storedSession);
    setUser(validatedUser);
    await fetchUserData(validatedUser.id);
  }, [clearAuthState, fetchUserData]);

  useEffect(() => {
    let mounted = true;
    let bootstrapped = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        if (!session) {
          clearAuthState();
          setLoading(false);
          return;
        }

        setSession(session);
        // Keep the same user object reference when the id didn't change, so a
        // token refresh (tab focus) doesn't cascade re-renders / remounts.
        setUser((prev) => (prev && prev.id === session.user?.id ? prev : session.user ?? null));

        // Skip duplicate fetch on initial bootstrap (handled by getSession below)
        if (event !== 'SIGNED_OUT' && event !== 'INITIAL_SESSION' && session.user) {
          const alreadyLoaded = loadedUserIdRef.current === session.user.id;
          setTimeout(() => {
            // Same user (token refresh / focus): refresh silently, never blocking the UI.
            if (mounted) fetchUserData(session.user.id, alreadyLoaded);
          }, 0);
        }

        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted || bootstrapped) return;
      bootstrapped = true;

      await validateStoredSession(session);

      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [clearAuthState, fetchUserData, validateStoredSession]);

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
