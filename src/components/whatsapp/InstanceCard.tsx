import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Smartphone,
  RefreshCw,
  QrCode,
  Wifi,
  WifiOff,
  AlertCircle,
  Clock,
  ArrowUpDown,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Wifi }> = {
  connected: { label: "Conectado", variant: "default", icon: Wifi },
  disconnected: { label: "Desconectado", variant: "secondary", icon: WifiOff },
  connecting: { label: "Conectando...", variant: "outline", icon: RefreshCw },
  error: { label: "Erro", variant: "destructive", icon: AlertCircle },
  pending: { label: "Pendente", variant: "outline", icon: Clock },
};

interface InstanceCardProps {
  instance: {
    id: string;
    instance_name: string;
    phone_number: string | null;
    status: string;
    qr_code: string | null;
    last_sync: string | null;
    messages_sent: number;
    messages_received: number;
    error_message: string | null;
    webhook_url: string | null;
  };
}

export function InstanceCard({ instance }: InstanceCardProps) {
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const config = statusConfig[instance.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  const handleReconnect = async () => {
    setReconnecting(true);
    // Simulate reconnect — in production this would call the external WhatsApp API
    const { error } = await supabase
      .from("whatsapp_instances")
      .update({ status: "connecting" as any })
      .eq("id", instance.id);

    if (!error) {
      toast({ title: "Reconectando...", description: "Aguarde enquanto tentamos reconectar a instância." });
      queryClient.invalidateQueries({ queryKey: ["whatsapp_instances"] });

      // Simulate connection after 3s
      setTimeout(async () => {
        await supabase
          .from("whatsapp_instances")
          .update({ status: "connected" as any, last_sync: new Date().toISOString() })
          .eq("id", instance.id);
        queryClient.invalidateQueries({ queryKey: ["whatsapp_instances"] });
        toast({ title: "Instância conectada!" });
      }, 3000);
    }
    setReconnecting(false);
  };

  return (
    <>
      <Card className="border border-border">
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm text-foreground">{instance.instance_name}</span>
            </div>
            <Badge variant={config.variant}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          </div>

          {instance.phone_number && (
            <p className="text-sm text-muted-foreground">{instance.phone_number}</p>
          )}

          {instance.error_message && (
            <p className="text-xs text-destructive bg-destructive/10 rounded p-2">{instance.error_message}</p>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <ArrowUpDown className="h-3 w-3" />
              <span>{instance.messages_sent + instance.messages_received} msgs</span>
            </div>
            {instance.last_sync && (
              <span>
                Sync: {formatDistanceToNow(new Date(instance.last_sync), { addSuffix: true, locale: ptBR })}
              </span>
            )}
          </div>

          {instance.webhook_url && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">Webhook</Badge>
              <span className="truncate">{instance.webhook_url}</span>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            {instance.qr_code && (
              <Button size="sm" variant="outline" className="flex-1" onClick={() => setQrDialogOpen(true)}>
                <QrCode className="h-3 w-3 mr-1" />
                QR Code
              </Button>
            )}
            <Button
              size="sm"
              variant={instance.status === "error" ? "destructive" : "outline"}
              className="flex-1"
              onClick={handleReconnect}
              disabled={reconnecting || instance.status === "connected"}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${reconnecting ? "animate-spin" : ""}`} />
              Reconectar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code — {instance.instance_name}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-6">
            {instance.qr_code ? (
              <img src={instance.qr_code} alt="QR Code WhatsApp" className="w-64 h-64 rounded-lg border border-border" />
            ) : (
              <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground text-sm">QR Code indisponível</p>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Escaneie o QR Code com o WhatsApp do número associado para conectar.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
