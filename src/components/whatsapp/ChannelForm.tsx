import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ChannelFormProps {
  companyId: string;
  onSuccess: () => void;
}

export function ChannelForm({ companyId, onSuccess }: ChannelFormProps) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("channels").insert({
      company_id: companyId,
      nome,
      descricao: descricao || null,
      tipo: "whatsapp" as const,
    });
    setLoading(false);
    if (error) return;
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome do Canal</Label>
        <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Atendimento Principal" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição (opcional)</Label>
        <Textarea id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição do canal" />
      </div>
      <Button type="submit" disabled={loading || !nome} className="w-full">
        {loading ? "Criando..." : "Criar Canal"}
      </Button>
    </form>
  );
}
