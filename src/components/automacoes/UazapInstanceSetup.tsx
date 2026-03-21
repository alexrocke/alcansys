import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, QrCode, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface Props {
  companyId: string;
  automationId: string;
  instanceId?: string | null;
  onConnected: () => void;
}

export function UazapInstanceSetup({ companyId, automationId, instanceId, onConnected }: Props) {
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('disconnected');
  const [uazapId, setUazapId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  const callUazap = async (action: string, extra: Record<string, any> = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Não autenticado');

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/uazap-proxy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ action, company_id: companyId, ...extra }),
      }
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro na API UAZAP');
    }
    return res.json();
  };

  const createInstance = async () => {
    setLoading(true);
    try {
      const instanceName = `auto_${automationId.slice(0, 8)}_${Date.now()}`;
      
      // Step 1: Create the instance
      const createResult = await callUazap('create-instance', { instance_name: instanceName });
      const newInstanceName = createResult.instanceName || createResult.instance_name || instanceName;
      const instanceToken = createResult.token || createResult.instance_token || null;
      setUazapId(newInstanceName);

      // Step 2: Connect instance to generate QR code
      const connectResult = await callUazap('connect-instance', { 
        instance_id: newInstanceName,
        instance_name: newInstanceName,
        instance_token: instanceToken,
      });
      
      // Step 3: Get QR code
      const qrData = connectResult.qrcode || connectResult.qr_code || connectResult.base64;
      if (qrData) {
        setQrCode(qrData);
      } else {
        // Try separate QR code endpoint
        const qrResult = await callUazap('get-qrcode', { 
          instance_id: newInstanceName,
          instance_token: instanceToken,
        });
        setQrCode(qrResult.qrcode || qrResult.qr_code || qrResult.base64 || null);
      }
      
      setPolling(true);
      toast({ title: 'Instância criada', description: 'Escaneie o QR code com o WhatsApp.' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = useCallback(async () => {
    if (!uazapId) return;
    try {
      const result = await callUazap('get-status', { instance_id: uazapId });
      const connected = result.status === 'connected' || result.connected === true;
      setStatus(connected ? 'connected' : 'disconnected');

      if (connected) {
        setPolling(false);
        setQrCode(null);

        // Create whatsapp_instance record and link to client_automation
        const channelResult = await supabase.from('channels').insert([{
          company_id: companyId,
          nome: `WhatsApp - ${uazapId}`,
          tipo: 'whatsapp',
          status: 'connected',
        }]).select().single();

        if (channelResult.data) {
          const instanceResult = await supabase.from('whatsapp_instances').insert([{
            company_id: companyId,
            channel_id: channelResult.data.id,
            instance_name: uazapId,
            uazap_instance_id: uazapId,
            status: 'connected',
            phone_number: result.phone_number || null,
          }]).select().single();

          if (instanceResult.data) {
            await supabase.from('client_automations')
              .update({ whatsapp_instance_id: instanceResult.data.id, status: 'ativa' })
              .eq('id', automationId);
          }
        }

        toast({ title: 'WhatsApp conectado com sucesso!' });
        onConnected();
      }
    } catch (error) {
      console.error('Status check error:', error);
    }
  }, [uazapId, companyId, automationId, onConnected]);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [polling, checkStatus]);

  const refreshQr = async () => {
    if (!uazapId) return;
    setLoading(true);
    try {
      const qrResult = await callUazap('get-qrcode', { instance_id: uazapId });
      setQrCode(qrResult.qr_code || qrResult.qrcode || qrResult.base64 || null);
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (status === 'connected') {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CardContent className="flex items-center gap-3 py-4">
          <Wifi className="h-5 w-5 text-green-600" />
          <span className="font-medium text-green-800 dark:text-green-300">WhatsApp conectado</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Conectar WhatsApp via UAZAP
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!qrCode ? (
          <Button onClick={createInstance} disabled={loading} className="gap-2 w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
            Gerar QR Code
          </Button>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-background rounded-xl border">
              <img
                src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                alt="QR Code WhatsApp"
                className="w-64 h-64 object-contain"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Aguardando escaneamento...
            </div>
            <Button variant="outline" size="sm" onClick={refreshQr} disabled={loading} className="gap-2">
              <RefreshCw className="h-3 w-3" /> Atualizar QR Code
            </Button>
          </div>
        )}

        {instanceId && (
          <div className="flex items-center gap-2 pt-2">
            <WifiOff className="h-4 w-4 text-destructive" />
            <Badge variant="outline" className="text-destructive">Desconectado</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
