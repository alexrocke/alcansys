import { useCompany } from '@/hooks/useCompany';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';

export function CompanySelector() {
  const { companies, currentCompany, setCurrentCompanyId, loading } = useCompany();

  if (loading || companies.length === 0) return null;

  // Don't show selector if only one company
  if (companies.length === 1) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span className="truncate">{currentCompany?.nome}</span>
      </div>
    );
  }

  return (
    <Select value={currentCompany?.id || ''} onValueChange={setCurrentCompanyId}>
      <SelectTrigger className="w-full h-9 text-sm">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 shrink-0" />
          <SelectValue placeholder="Selecione a empresa" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {companies.map((company) => (
          <SelectItem key={company.id} value={company.id}>
            {company.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
