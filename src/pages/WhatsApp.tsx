import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  QrCode,
  Wifi,
  WifiOff,
  RefreshCw,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface InstanceData {
  id: string;
  instance_name: string;
  device_name: string;
  server_url: string;
  status: string;
  is_connected: boolean;
  phone_number: string | null;
  last_connection_at: string | null;
  created_at: string;
}

export default function WhatsApp() {
  const { user } = useAuth();
  const [instance, setInstance] = useState<InstanceData | null>(null);
  const [qrCode, setQrCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [qrLoading, setQrLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const lockRef = useRef(false);

  const callManageFunction = useCallback(async (action: string) => {
    const { data, error } = await supabase.functions.invoke("whatsapp-manage", {
      body: { action },
    });
    if (error) throw new Error(error.message || "Erro na comunicação");
    if (data?.error) throw new Error(data.error);
    return data;
  }, []);

  const loadInstance = useCallback(async () => {
    if (lockRef.current) return;
    lockRef.current = true;
    try {
      setError("");
      const data = await callManageFunction("get-or-create");
      setInstance(data.instance);
      if (data.is_new) {
        toast.success("Instância WhatsApp criada!");
      }
      // Auto-fetch QR if not connected
      if (data.instance && !data.instance.is_connected) {
        await fetchQrCode();
      }
    } catch (e: any) {
      setError(e.message);
      console.error("loadInstance error:", e);
    } finally {
      setLoading(false);
      lockRef.current = false;
    }
  }, [callManageFunction]);

  const fetchQrCode = async () => {
    setQrLoading(true);
    try {
      const data = await callManageFunction("qrcode");
      if (data.connected) {
        setInstance((prev) => prev ? { ...prev, status: "connected", is_connected: true } : prev);
        setQrCode("");
        toast.success("WhatsApp Conectado!");
      } else if (data.qrcode) {
        setQrCode(data.qrcode);
      }
    } catch (e: any) {
      console.error("fetchQrCode error:", e);
    } finally {
      setQrLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setActionLoading(true);
    try {
      await callManageFunction("disconnect");
      setInstance((prev) => prev ? { ...prev, status: "disconnected", is_connected: false } : prev);
      setQrCode("");
      toast.info("Instância desconectada");
      // Fetch new QR
      await fetchQrCode();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja remover a instância? Isso é irreversível.")) return;
    setActionLoading(true);
    try {
      await callManageFunction("delete");
      setInstance(null);
      setQrCode("");
      toast.success("Instância removida");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Load on mount
  useEffect(() => {
    if (user) loadInstance();
  }, [user, loadInstance]);

  // Polling every 15s when not connected
  useEffect(() => {
    if (!instance || instance.is_connected) return;
    const interval = setInterval(async () => {
      try {
        const data = await callManageFunction("get-or-create");
        if (data?.instance?.is_connected) {
          setInstance(data.instance);
          setQrCode("");
          toast.success("WhatsApp Conectado!");
        }
      } catch (e) {
        // Silent fail on polling
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [instance, callManageFunction]);

  if (!user) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <p className="text-muted-foreground">Faça login para gerenciar seu WhatsApp.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">WhatsApp</h1>
        <p className="text-sm text-muted-foreground">Gerencie sua conexão WhatsApp</p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando instância...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-destructive font-medium">{error}</p>
            <Button onClick={() => { setLoading(true); setError(""); loadInstance(); }}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : !instance ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-4">
            <Smartphone className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma instância encontrada.</p>
            <Button onClick={() => { setLoading(true); loadInstance(); }}>
              Criar Instância
            </Button>
          </CardContent>
        </Card>
      ) : instance.is_connected ? (
        /* ── CONNECTED STATE ── */
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="py-8 space-y-6">
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 rounded-full bg-green-500/10">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground">WhatsApp Conectado!</h2>
              <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                <Wifi className="h-3 w-3 mr-1" />
                Conectado
              </Badge>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground text-center">
              <p>Instância: <span className="font-mono text-foreground">{instance.instance_name}</span></p>
              {instance.phone_number && (
                <p>Número: <span className="text-foreground">{instance.phone_number}</span></p>
              )}
              {instance.last_connection_at && (
                <p>Última conexão: {new Date(instance.last_connection_at).toLocaleString("pt-BR")}</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={actionLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${actionLoading ? "animate-spin" : ""}`} />
                Reconectar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={actionLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover Instância
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* ── QR CODE STATE ── */
        <Card>
          <CardContent className="py-8 space-y-6">
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <QrCode className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Escaneie o QR Code</h2>
              <Badge variant="secondary">
                <WifiOff className="h-3 w-3 mr-1" />
                Desconectado
              </Badge>
            </div>

            <div className="flex justify-center">
              {qrLoading ? (
                <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : qrCode ? (
                <img
                  src={qrCode}
                  alt="QR Code WhatsApp"
                  className="w-64 h-64 rounded-lg border border-border"
                />
              ) : (
                <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground text-sm text-center px-4">
                    Clique em "Atualizar QR" para gerar o código
                  </p>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Abra o WhatsApp no celular → Dispositivos conectados → Conectar dispositivo → Escaneie o código
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={fetchQrCode} disabled={qrLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${qrLoading ? "animate-spin" : ""}`} />
                Atualizar QR
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={actionLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center italic">
              O status é verificado automaticamente a cada 15 segundos...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
