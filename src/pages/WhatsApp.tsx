import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChannelForm } from "@/components/whatsapp/ChannelForm";
import { InstanceCard } from "@/components/whatsapp/InstanceCard";
import { InstanceForm } from "@/components/whatsapp/InstanceForm";
import { Plus, Radio, Smartphone, MessageSquare, AlertTriangle } from "lucide-react";

export default function WhatsApp() {
  const { currentCompany } = useCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  const [instanceDialogOpen, setInstanceDialogOpen] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  const { data: channels = [], isLoading: loadingChannels } = useQuery({
    queryKey: ["channels", currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];
      const { data, error } = await supabase
        .from("channels")
        .select("*")
        .eq("company_id", currentCompany.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!currentCompany?.id,
  });

  const { data: instances = [], isLoading: loadingInstances } = useQuery({
    queryKey: ["whatsapp_instances", currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];
      const { data, error } = await supabase
        .from("whatsapp_instances")
        .select("*, channels(nome)")
        .eq("company_id", currentCompany.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!currentCompany?.id,
  });

  const connectedCount = instances.filter((i) => i.status === "connected").length;
  const errorCount = instances.filter((i) => i.status === "error").length;
  const totalMessages = instances.reduce((sum, i) => sum + (i.messages_sent || 0) + (i.messages_received || 0), 0);

  const handleChannelCreated = () => {
    setChannelDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["channels"] });
    toast({ title: "Canal criado com sucesso" });
  };

  const handleInstanceCreated = () => {
    setInstanceDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["whatsapp_instances"] });
    toast({ title: "Instância criada com sucesso" });
  };

  const openInstanceDialog = (channelId: string) => {
    setSelectedChannelId(channelId);
    setInstanceDialogOpen(true);
  };

  if (!currentCompany) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <p className="text-muted-foreground">Selecione uma empresa para gerenciar canais WhatsApp.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">WhatsApp</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gerencie canais, instâncias e conexões</p>
        </div>
        <Dialog open={channelDialogOpen} onOpenChange={setChannelDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Novo Canal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Canal</DialogTitle>
            </DialogHeader>
            <ChannelForm companyId={currentCompany.id} onSuccess={handleChannelCreated} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Radio className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{channels.length}</p>
                <p className="text-sm text-muted-foreground">Canais</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Smartphone className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{connectedCount}</p>
                <p className="text-sm text-muted-foreground">Conectados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <MessageSquare className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalMessages}</p>
                <p className="text-sm text-muted-foreground">Mensagens</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{errorCount}</p>
                <p className="text-sm text-muted-foreground">Com Erro</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channels & Instances */}
      {loadingChannels ? (
        <p className="text-muted-foreground">Carregando canais...</p>
      ) : channels.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Radio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum canal cadastrado</h3>
            <p className="text-muted-foreground mb-4">Crie seu primeiro canal WhatsApp para começar.</p>
            <Button onClick={() => setChannelDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Canal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {channels.map((channel) => {
            const channelInstances = instances.filter((i) => i.channel_id === channel.id);
            return (
              <Card key={channel.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{channel.nome}</CardTitle>
                    <Badge variant={channel.ativo ? "default" : "secondary"}>
                      {channel.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                    <Badge variant="outline">{channel.tipo}</Badge>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => openInstanceDialog(channel.id)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Nova Instância
                  </Button>
                </CardHeader>
                <CardContent>
                  {channel.descricao && (
                    <p className="text-sm text-muted-foreground mb-4">{channel.descricao}</p>
                  )}
                  {channelInstances.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Nenhuma instância neste canal.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {channelInstances.map((instance) => (
                        <InstanceCard key={instance.id} instance={instance} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Instance Dialog */}
      <Dialog open={instanceDialogOpen} onOpenChange={setInstanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Instância WhatsApp</DialogTitle>
          </DialogHeader>
          {selectedChannelId && currentCompany && (
            <InstanceForm
              channelId={selectedChannelId}
              companyId={currentCompany.id}
              onSuccess={handleInstanceCreated}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
