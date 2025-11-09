import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function MetasSettings() {
  const queryClient = useQueryClient();
  const [metaProjetos, setMetaProjetos] = useState("");
  const [metaReceita, setMetaReceita] = useState("");
  const [metaClientes, setMetaClientes] = useState("");

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings', 'metas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('chave', 'metas_mensais')
        .maybeSingle();

      if (error) throw error;
      
      if (data?.valor) {
        const valorObj = data.valor as any;
        setMetaProjetos(valorObj.metaProjetos || "");
        setMetaReceita(valorObj.metaReceita || "");
        setMetaClientes(valorObj.metaClientes || "");
      }
      
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const valor = {
        metaProjetos: parseFloat(metaProjetos) || 0,
        metaReceita: parseFloat(metaReceita) || 0,
        metaClientes: parseFloat(metaClientes) || 0,
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
            chave: 'metas_mensais',
            valor,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: 'Metas salvas',
        description: 'As metas mensais foram atualizadas com sucesso.',
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
        <Label htmlFor="metaProjetos">Meta de Projetos Novos por Mês</Label>
        <Input
          id="metaProjetos"
          type="number"
          min="0"
          value={metaProjetos}
          onChange={(e) => setMetaProjetos(e.target.value)}
          placeholder="10"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="metaReceita">Meta de Receita Mensal (R$)</Label>
        <Input
          id="metaReceita"
          type="number"
          min="0"
          step="0.01"
          value={metaReceita}
          onChange={(e) => setMetaReceita(e.target.value)}
          placeholder="100000.00"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="metaClientes">Meta de Novos Clientes por Mês</Label>
        <Input
          id="metaClientes"
          type="number"
          min="0"
          value={metaClientes}
          onChange={(e) => setMetaClientes(e.target.value)}
          placeholder="5"
        />
      </div>

      <Button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
      >
        {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Salvar Metas
      </Button>
    </div>
  );
}
