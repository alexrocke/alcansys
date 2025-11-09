import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface CustoFixo {
  descricao: string;
  valor: number;
}

export function CustosFixosSettings() {
  const queryClient = useQueryClient();
  const [novoCusto, setNovoCusto] = useState({ descricao: "", valor: "" });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings', 'custos_fixos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('chave', 'custos_fixos')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const custos = Array.isArray(settings?.valor) ? (settings.valor as unknown as CustoFixo[]) : [];

  const saveMutation = useMutation({
    mutationFn: async (newCustos: CustoFixo[]) => {
      if (settings?.id) {
        const { error } = await supabase
          .from('settings')
          .update({ valor: newCustos as any })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('settings')
          .insert({
            chave: 'custos_fixos',
            valor: newCustos as any,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: 'Custos atualizados',
        description: 'Os custos fixos foram atualizados com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAddCusto = () => {
    if (!novoCusto.descricao.trim() || !novoCusto.valor) {
      toast({
        title: 'Campos vazios',
        description: 'Preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    const custo: CustoFixo = {
      descricao: novoCusto.descricao.trim(),
      valor: parseFloat(novoCusto.valor),
    };

    saveMutation.mutate([...custos, custo]);
    setNovoCusto({ descricao: "", valor: "" });
  };

  const handleRemoveCusto = (index: number) => {
    saveMutation.mutate(custos.filter((_, i) => i !== index));
  };

  const total = custos.reduce((acc, custo) => acc + custo.valor, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Input
            id="descricao"
            value={novoCusto.descricao}
            onChange={(e) => setNovoCusto({ ...novoCusto, descricao: e.target.value })}
            placeholder="Ex: Aluguel, Energia, Internet"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="valor">Valor (R$)</Label>
          <div className="flex gap-2">
            <Input
              id="valor"
              type="number"
              min="0"
              step="0.01"
              value={novoCusto.valor}
              onChange={(e) => setNovoCusto({ ...novoCusto, valor: e.target.value })}
              placeholder="0.00"
            />
            <Button onClick={handleAddCusto} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Custos Cadastrados</p>
          <p className="text-sm font-bold">
            Total: {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
        {custos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum custo fixo cadastrado</p>
        ) : (
          <div className="space-y-2">
            {custos.map((custo, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{custo.descricao}</p>
                  <p className="text-sm text-muted-foreground">
                    {custo.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveCusto(index)}
                  disabled={saveMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
