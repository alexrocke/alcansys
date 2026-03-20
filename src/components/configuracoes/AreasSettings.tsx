import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AreasSettings() {
  const queryClient = useQueryClient();
  const [novaArea, setNovaArea] = useState("");

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings', 'areas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('chave', 'areas')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const areas = (settings?.valor as any as string[]) || [];

  const saveMutation = useMutation({
    mutationFn: async (newAreas: string[]) => {
      if (settings?.id) {
        const { error } = await supabase
          .from('settings')
          .update({ valor: newAreas })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('settings')
          .insert({
            chave: 'areas',
            valor: newAreas,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: 'Áreas atualizadas',
        description: 'As áreas foram atualizadas com sucesso.',
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

  const handleAddArea = () => {
    if (!novaArea.trim()) {
      toast({
        title: 'Campo vazio',
        description: 'Digite o nome do segmento.',
        variant: 'destructive',
      });
      return;
    }

    if (areas.includes(novaArea.trim())) {
      toast({
        title: 'Área já existe',
        description: 'Esta área já está cadastrada.',
        variant: 'destructive',
      });
      return;
    }

    saveMutation.mutate([...areas, novaArea.trim()]);
    setNovaArea("");
  };

  const handleRemoveArea = (area: string) => {
    saveMutation.mutate(areas.filter((a) => a !== area));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Input
          value={novaArea}
          onChange={(e) => setNovaArea(e.target.value)}
          placeholder="Novo segmento (ex: Varejo, Atacado, Material de Construção)"
          onKeyPress={(e) => e.key === 'Enter' && handleAddArea()}
        />
        <Button onClick={handleAddArea} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Segmentos Cadastrados</p>
        {areas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum segmento cadastrado</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {areas.map((area) => (
              <Badge key={area} variant="secondary" className="px-3 py-1">
                {area}
                <button
                  onClick={() => handleRemoveArea(area)}
                  className="ml-2 hover:text-destructive"
                  disabled={saveMutation.isPending}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
