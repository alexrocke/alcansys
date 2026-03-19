import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Send, Phone, Mail, MessageSquare, FileText } from 'lucide-react';

const tipoIcons: Record<string, any> = {
  nota: FileText,
  email: Mail,
  ligacao: Phone,
  reuniao: MessageSquare,
  whatsapp: MessageSquare,
};

interface LeadDetailProps {
  lead: any;
  companyId: string;
  onClose: () => void;
}

export function LeadDetail({ lead, companyId, onClose }: LeadDetailProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newContact, setNewContact] = useState('');
  const [contactType, setContactType] = useState('nota');

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', lead.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*, autor:profiles(id, nome)')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addContact = useMutation({
    mutationFn: async () => {
      if (!newContact.trim()) return;
      const { error } = await supabase.from('contacts').insert([{
        lead_id: lead.id,
        company_id: companyId,
        tipo: contactType,
        descricao: newContact,
        autor_id: user?.id,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', lead.id] });
      setNewContact('');
      toast({ title: 'Interação registrada' });
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Nome</p>
          <p className="font-medium text-foreground">{lead.nome}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Email</p>
          <p className="font-medium text-foreground">{lead.email || '-'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Telefone</p>
          <p className="font-medium text-foreground">{lead.telefone || '-'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Empresa</p>
          <p className="font-medium text-foreground">{lead.empresa || '-'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Valor Estimado</p>
          <p className="font-medium text-foreground">
            {lead.valor_estimado
              ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(lead.valor_estimado))
              : '-'}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Tags</p>
          <div className="flex gap-1 flex-wrap mt-1">
            {lead.tags?.length > 0
              ? lead.tags.map((tag: string) => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)
              : <span className="text-muted-foreground">-</span>}
          </div>
        </div>
      </div>

      {lead.notas && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Notas</p>
          <p className="text-sm text-foreground bg-muted p-3 rounded-lg">{lead.notas}</p>
        </div>
      )}

      <Separator />

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Histórico de Interações</h3>

        <div className="flex gap-2 mb-4">
          <Select value={contactType} onValueChange={setContactType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nota">Nota</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="ligacao">Ligação</SelectItem>
              <SelectItem value="reuniao">Reunião</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            value={newContact}
            onChange={(e) => setNewContact(e.target.value)}
            placeholder="Registrar interação..."
            rows={1}
            className="flex-1"
          />
          <Button
            onClick={() => addContact.mutate()}
            disabled={!newContact.trim() || addContact.isPending}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma interação registrada</p>
          ) : (
            contacts.map((contact: any) => {
              const Icon = tipoIcons[contact.tipo] || FileText;
              return (
                <div key={contact.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="p-2 rounded-full bg-primary/10 h-fit">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-foreground capitalize">{contact.tipo}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(contact.created_at), 'dd/MM/yyyy HH:mm')}
                      </span>
                      {contact.autor && (
                        <span className="text-xs text-muted-foreground">por {contact.autor.nome}</span>
                      )}
                    </div>
                    <p className="text-sm text-foreground">{contact.descricao}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
