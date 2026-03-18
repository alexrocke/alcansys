import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InstanceFormProps {
  channelId: string;
  companyId: string;
  onSuccess: () => void;
}

export function InstanceForm({ channelId, companyId, onSuccess }: InstanceFormProps) {
  const [instanceName, setInstanceName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("whatsapp_instances").insert({
      channel_id: channelId,
      company_id: companyId,
      instance_name: instanceName,
      phone_number: phoneNumber || null,
      webhook_url: webhookUrl || null,
      api_token: apiToken || null,
    });
    setLoading(false);
    if (error) return;
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="instance_name">Nome da Instância</Label>
        <Input id="instance_name" value={instanceName} onChange={(e) => setInstanceName(e.target.value)} placeholder="Ex: bot-atendimento-01" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Número (opcional)</Label>
        <Input id="phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+55 11 99999-9999" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="webhook">Webhook URL (opcional)</Label>
        <Input id="webhook" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://..." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="token">API Token (opcional)</Label>
        <Input id="token" type="password" value={apiToken} onChange={(e) => setApiToken(e.target.value)} placeholder="Token da API externa" />
      </div>
      <Button type="submit" disabled={loading || !instanceName} className="w-full">
        {loading ? "Criando..." : "Criar Instância"}
      </Button>
    </form>
  );
}
