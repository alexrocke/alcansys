import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Company {
  id: string;
  nome: string;
  slug: string;
  logo_url: string | null;
  plano: string | null;
  ativo: boolean;
}

interface Membership {
  id: string;
  company_id: string;
  role: string;
  company: Company;
}

interface CompanyContextType {
  companies: Company[];
  currentCompany: Company | null;
  currentMembership: Membership | null;
  setCurrentCompanyId: (id: string) => void;
  loading: boolean;
  refetch: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = useCallback(async () => {
    if (!user) {
      setCompanies([]);
      setMemberships([]);
      setCurrentCompanyId(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('memberships')
        .select('id, company_id, role, companies(id, nome, slug, logo_url, plano, ativo)')
        .eq('user_id', user.id);

      if (error) throw error;

      const mapped = (data || []).map((m: any) => ({
        id: m.id,
        company_id: m.company_id,
        role: m.role,
        company: m.companies,
      }));

      setMemberships(mapped);
      const companyList = mapped.map((m) => m.company).filter(Boolean);
      setCompanies(companyList);

      // Restore saved company or default to first
      const savedId = localStorage.getItem('scalefy_current_company');
      if (savedId && companyList.find((c) => c.id === savedId)) {
        setCurrentCompanyId(savedId);
      } else if (companyList.length > 0) {
        setCurrentCompanyId(companyList[0].id);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleSetCompanyId = (id: string) => {
    setCurrentCompanyId(id);
    localStorage.setItem('scalefy_current_company', id);
  };

  const currentCompany = companies.find((c) => c.id === currentCompanyId) || null;
  const currentMembership = memberships.find((m) => m.company_id === currentCompanyId) || null;

  return (
    <CompanyContext.Provider
      value={{
        companies,
        currentCompany,
        currentMembership,
        setCurrentCompanyId: handleSetCompanyId,
        loading,
        refetch: fetchCompanies,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
