import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, QrCode, Wifi, WifiOff, RefreshCw, Plus, CheckCircle2 } from 'lucide-react';

interface Props {
  companyId: string;
  automationId: string;
  instanceId?: string | null;
  onConnected: () => void;
}

type Step = 'idle' | 'created' | 'qr';

export function UazapInstanceSetup({ companyId, automationId, instanceId, onConnected }: Props) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('idle');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('disconnected');
  const [uazapName, setUazapName] = useState<string | null>(null);
  const [uazapToken, setUazapToken] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  // Step 1: Create instance only
  const handleCreateInstance = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const instanceName = `auto_${automationId.slice(0, 8)}_${Date.now()}`;
      const result = await callUazap('create-instance', { instance_name: instanceName });

      const name = result.name || result.instance?.name || instanceName;
      const token = result.token || result.instance?.token || null;

      setUazapName(name);
      setUazapToken(token);
      setStep('created');

      toast({ title: 'Instância criada', description: `Instância "${name}" criada com sucesso.` });
    } catch (error: any) {
      setErrorMsg(error.message);
      toast({ title: 'Erro ao criar instância', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Connect + generate QR
  const handleGenerateQr = async () => {
    if (!uazapName) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const connectResult = await callUazap('connect-instance', {
        instance_id: uazapName,
        instance_name: uazapName,
        instance_token: uazapToken,
      });

      const qrData = connectResult.qrcode || connectResult.qr_code || connectResult.base64;
      if (qrData) {
        setQrCode(qrData);
      } else {
        const qrResult = await callUazap('get-qrcode', {
          instance_id: uazapName,
          instance_token: uazapToken,
        });
        setQrCode(qrResult.qrcode || qrResult.qr_code || qrResult.base64 || null);
      }

      setStep('qr');
      setPolling(true);
      toast({ title: 'QR Code gerado', description: 'Escaneie com o WhatsApp para conectar.' });
    } catch (error: any) {
      setErrorMsg(error.message);
      toast({ title: 'Erro ao gerar QR Code', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = useCallback(async () => {
    if (!uazapName) return;
    try {
      const result = await callUazap('get-status', { instance_id: uazapName, instance_token: uazapToken });
      const connected = result.status === 'connected' || result.connected === true;
      setStatus(connected ? 'connected' : 'disconnected');

      if (connected) {
        setPolling(false);
        setQrCode(null);

        const channelResult = await supabase.from('channels').insert([{
          company_id: companyId,
          nome: `WhatsApp - ${uazapName}`,
          tipo: 'whatsapp' as const,
          status: 'connected' as const,
        }]).select().single();

        if (channelResult.data) {
          const instanceResult = await supabase.from('whatsapp_instances').insert([{
            company_id: companyId,
            channel_id: channelResult.data.id,
            instance_name: uazapName,
            uazap_instance_id: uazapName,
            status: 'connected' as const,
            phone_number: result.phone_number || null,
            api_token: uazapToken,
          }]).select().single();

          if (instanceResult.data) {
            await supabase.from('client_automations')
              .update({ whatsapp_instance_id: instanceResult.data.id, status: 'ativa' as const })
              .eq('id', automationId);
          }
        }

        toast({ title: 'WhatsApp conectado com sucesso!' });
        onConnected();
      }
    } catch (error) {
      console.error('Status check error:', error);
    }
  }, [uazapName, uazapToken, companyId, automationId, onConnected]);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [polling, checkStatus]);

  const refreshQr = async () => {
    if (!uazapName) return;
    setLoading(true);
    try {
      const qrResult = await callUazap('get-qrcode', { instance_id: uazapName, instance_token: uazapToken });
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
        {/* Progress Steps */}
        <div className="flex items-center gap-2 text-sm">
          <div className={`flex items-center gap-1.5 ${step !== 'idle' ? 'text-green-600' : 'text-muted-foreground'}`}>
            {step !== 'idle' ? <CheckCircle2 className="h-4 w-4" /> : <span className="h-5 w-5 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold">1</span>}
            <span className="font-medium">Criar Instância</span>
          </div>
          <div className="h-px w-6 bg-border" />
          <div className={`flex items-center gap-1.5 ${step === 'qr' ? 'text-green-600' : 'text-muted-foreground'}`}>
            {step === 'qr' ? <CheckCircle2 className="h-4 w-4" /> : <span className="h-5 w-5 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold">2</span>}
            <span className="font-medium">Gerar QR Code</span>
          </div>
          <div className="h-px w-6 bg-border" />
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-5 w-5 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold">3</span>
            <span className="font-medium">Conectar</span>
          </div>
        </div>

        {/* Error display */}
        {errorMsg && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            {errorMsg}
          </div>
        )}

        {/* Step 1: Create */}
        {step === 'idle' && (
          <Button onClick={handleCreateInstance} disabled={loading} className="gap-2 w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Criar Instância
          </Button>
        )}

        {/* Step 2: Generate QR */}
        {step === 'created' && !qrCode && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Instância <strong>{uazapName}</strong> criada com sucesso.
            </div>
            <Button onClick={handleGenerateQr} disabled={loading} className="gap-2 w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
              Gerar QR Code
            </Button>
          </div>
        )}

        {/* Step 3: QR Code display */}
        {qrCode && (
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
