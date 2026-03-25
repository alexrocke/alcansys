import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, QrCode, Wifi, WifiOff, RefreshCw, Plus, CheckCircle2, Link2 } from 'lucide-react';

interface Props {
  companyId: string;
  automationId: string;
  instanceId?: string | null;
  onConnected: () => void;
}

type Step = 'choose' | 'idle' | 'created' | 'qr';

export function UazapInstanceSetup({ companyId, automationId, instanceId, onConnected }: Props) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('choose');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('disconnected');
  const [uazapName, setUazapName] = useState<string | null>(null);
  const [uazapToken, setUazapToken] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedExistingInstance, setSelectedExistingInstance] = useState('');

  // Fetch existing connected instances for this company
  const { data: existingInstances } = useQuery({
    queryKey: ['company-whatsapp-instances', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('id, instance_name, phone_number, status')
        .eq('company_id', companyId)
        .eq('status', 'connected')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const hasExistingInstances = (existingInstances?.length || 0) > 0;

  const handleLinkExisting = async () => {
    if (!selectedExistingInstance) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('client_automations')
        .update({ whatsapp_instance_id: selectedExistingInstance, status: 'ativa' as const })
        .eq('id', automationId);
      if (error) throw error;
      toast({ title: 'Instância vinculada', description: 'A automação agora usa a instância WhatsApp existente.' });
      onConnected();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

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

  const handleCreateInstance = async () => {
    setLoading(true);
    const { data: company } = await supabase.from('companies').select('nome').eq('id', companyId).single();
    setErrorMsg(null);
    try {
      const companySlug = (company?.nome || 'empresa')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').substring(0, 30).toLowerCase();
      const instanceName = `${companySlug}_${Date.now()}`;
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

        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook`;
          await callUazap('set-webhook', {
            instance_id: uazapName,
            instance_token: uazapToken,
            webhook_url: webhookUrl,
          });
        } catch (whErr: any) {
          console.error('Failed to auto-set webhook:', whErr);
        }

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
            webhook_url: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`,
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
          Conectar WhatsApp
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Choose: use existing or create new */}
        {step === 'choose' && (
          <div className="space-y-4">
            {hasExistingInstances && (
              <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Usar instância existente
                </p>
                <Select value={selectedExistingInstance} onValueChange={setSelectedExistingInstance}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma instância conectada" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingInstances?.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id}>
                        {inst.phone_number || inst.instance_name}
                        {inst.phone_number && inst.instance_name ? ` (${inst.instance_name})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleLinkExisting}
                  disabled={!selectedExistingInstance || loading}
                  className="w-full gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                  Vincular Instância
                </Button>
              </div>
            )}

            {hasExistingInstances && (
              <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">ou</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}

            <Button
              variant={hasExistingInstances ? 'outline' : 'default'}
              onClick={() => setStep('idle')}
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              Criar Nova Instância
            </Button>
          </div>
        )}

        {/* Create new instance flow */}
        {step !== 'choose' && (
          <>
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

            {errorMsg && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {errorMsg}
              </div>
            )}

            {step === 'idle' && (
              <div className="space-y-3">
                <Button onClick={handleCreateInstance} disabled={loading} className="gap-2 w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Criar Instância
                </Button>
                {hasExistingInstances && (
                  <Button variant="ghost" size="sm" onClick={() => setStep('choose')} className="w-full text-muted-foreground">
                    ← Voltar para seleção
                  </Button>
                )}
              </div>
            )}

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
          </>
        )}

        {instanceId && step === 'choose' && (
          <div className="flex items-center gap-2 pt-2">
            <WifiOff className="h-4 w-4 text-destructive" />
            <Badge variant="outline" className="text-destructive">Desconectado</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
