import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function GeralSettings() {
  const queryClient = useQueryClient();
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [emailContato, setEmailContato] = useState("");
  const [telefoneContato, setTelefoneContato] = useState("");

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings', 'geral'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('chave', 'configuracoes_gerais')
        .maybeSingle();

      if (error) throw error;
      
      if (data?.valor) {
        const valorObj = data.valor as any;
        setNomeEmpresa(valorObj.nomeEmpresa || "");
        setEmailContato(valorObj.emailContato || "");
        setTelefoneContato(valorObj.telefoneContato || "");
      }
      
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const valor = {
        nomeEmpresa,
        emailContato,
        telefoneContato,
      };

      if (settings?.id) {
        const { error } = await supabase
          .from('settings')
          .update({ valor })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('settings')
          .insert({
            chave: 'configuracoes_gerais',
            valor,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: 'Configurações salvas',
        description: 'As configurações gerais foram atualizadas com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="nomeEmpresa">Nome da Empresa</Label>
        <Input
          id="nomeEmpresa"
          value={nomeEmpresa}
          onChange={(e) => setNomeEmpresa(e.target.value)}
          placeholder="Nome da sua empresa"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="emailContato">Email de Contato</Label>
        <Input
          id="emailContato"
          type="email"
          value={emailContato}
          onChange={(e) => setEmailContato(e.target.value)}
          placeholder="contato@empresa.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="telefoneContato">Telefone de Contato</Label>
        <Input
          id="telefoneContato"
          type="tel"
          value={telefoneContato}
          onChange={(e) => setTelefoneContato(e.target.value)}
          placeholder="(00) 00000-0000"
        />
      </div>

      <Button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
      >
        {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Salvar Configurações
      </Button>
    </div>
  );
}
