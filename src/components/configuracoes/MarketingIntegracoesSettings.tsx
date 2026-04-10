import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, ExternalLink, Copy, Check } from 'lucide-react';

interface MarketingConfig {
  google: {
    ativo: boolean;
    analytics_id: string;
    ads_id: string;
    tag_manager_id: string;
    conversion_label: string;
  };
  meta: {
    ativo: boolean;
    pixel_id: string;
    access_token: string;
    catalog_id: string;
    conversions_api: boolean;
  };
  utm: {
    ativo: boolean;
    default_source: string;
    default_medium: string;
    default_campaign: string;
    parametros_customizados: string;
  };
}

const defaultConfig: MarketingConfig = {
  google: {
    ativo: true,
    analytics_id: '',
    ads_id: '',
    tag_manager_id: '',
    conversion_label: '',
  },
  meta: {
    ativo: true,
    pixel_id: '',
    access_token: '',
    catalog_id: '',
    conversions_api: true,
  },
  utm: {
    ativo: true,
    default_source: '',
    default_medium: '',
    default_campaign: '',
    parametros_customizados: '',
  },
};

export function MarketingIntegracoesSettings() {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState<string | null>(null);

  const { data: config, isLoading } = useQuery({
    queryKey: ['settings-marketing-integracoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('chave', 'marketing_integracoes')
        .maybeSingle();
      if (error) throw error;
      return (data?.valor as unknown as MarketingConfig) || defaultConfig;
    },
    refetchOnWindowFocus: false,
  });

  const [form, setForm] = useState<MarketingConfig | null>(null);
  const current = form || config || defaultConfig;

  const updateField = (section: keyof MarketingConfig, field: string, value: any) => {
    setForm((prev) => {
      const base = prev || config || defaultConfig;
      return {
        ...base,
        [section]: { ...base[section], [field]: value },
      };
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .eq('chave', 'marketing_integracoes')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('settings')
          .update({ valor: current as any })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('settings')
          .insert({ chave: 'marketing_integracoes', valor: current as any });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-marketing-integracoes'] });
      toast({ title: 'Configurações salvas com sucesso!' });
      setForm(null);
    },
    onError: (e: any) => toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' }),
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: `${label} copiado!` });
  };

  const utmPreview = current.utm.ativo
    ? `?utm_source=${current.utm.default_source || 'fonte'}&utm_medium=${current.utm.default_medium || 'meio'}&utm_campaign=${current.utm.default_campaign || 'campanha'}${current.utm.parametros_customizados ? '&' + current.utm.parametros_customizados : ''}`
    : '';

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Google */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <div>
                <CardTitle className="text-base">Google</CardTitle>
                <CardDescription>Analytics, Ads e Tag Manager</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={current.google.ativo ? 'default' : 'secondary'}>
                {current.google.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
              <Switch
                checked={current.google.ativo}
                onCheckedChange={(v) => updateField('google', 'ativo', v)}
              />
            </div>
          </div>
        </CardHeader>
        {current.google.ativo && (
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Google Analytics ID (GA4)</Label>
                <Input
                  placeholder="G-XXXXXXXXXX"
                  value={current.google.analytics_id}
                  onChange={(e) => updateField('google', 'analytics_id', e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">Measurement ID do GA4</p>
              </div>
              <div>
                <Label>Google Ads ID</Label>
                <Input
                  placeholder="AW-XXXXXXXXXX"
                  value={current.google.ads_id}
                  onChange={(e) => updateField('google', 'ads_id', e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">ID de conversão do Google Ads</p>
              </div>
              <div>
                <Label>Google Tag Manager ID</Label>
                <Input
                  placeholder="GTM-XXXXXXX"
                  value={current.google.tag_manager_id}
                  onChange={(e) => updateField('google', 'tag_manager_id', e.target.value)}
                />
              </div>
              <div>
                <Label>Conversion Label</Label>
                <Input
                  placeholder="AbCdEfGhIjKlMn"
                  value={current.google.conversion_label}
                  onChange={(e) => updateField('google', 'conversion_label', e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">Label de conversão do Google Ads</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ExternalLink className="h-3 w-3" />
              <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="underline">
                Acessar Google Analytics
              </a>
              <span>•</span>
              <a href="https://ads.google.com" target="_blank" rel="noopener noreferrer" className="underline">
                Google Ads
              </a>
              <span>•</span>
              <a href="https://tagmanager.google.com" target="_blank" rel="noopener noreferrer" className="underline">
                Tag Manager
              </a>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Meta */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <div>
                <CardTitle className="text-base">Meta (Facebook / Instagram)</CardTitle>
                <CardDescription>Pixel, Conversions API e Catálogo</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={current.meta.ativo ? 'default' : 'secondary'}>
                {current.meta.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
              <Switch
                checked={current.meta.ativo}
                onCheckedChange={(v) => updateField('meta', 'ativo', v)}
              />
            </div>
          </div>
        </CardHeader>
        {current.meta.ativo && (
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Pixel ID</Label>
                <Input
                  placeholder="1234567890123456"
                  value={current.meta.pixel_id}
                  onChange={(e) => updateField('meta', 'pixel_id', e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">ID do Meta Pixel</p>
              </div>
              <div>
                <Label>Access Token (Conversions API)</Label>
                <Input
                  type="password"
                  placeholder="EAAxxxxxxx..."
                  value={current.meta.access_token}
                  onChange={(e) => updateField('meta', 'access_token', e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">Token de acesso para a API de Conversões</p>
              </div>
              <div>
                <Label>Catalog ID</Label>
                <Input
                  placeholder="ID do catálogo de produtos"
                  value={current.meta.catalog_id}
                  onChange={(e) => updateField('meta', 'catalog_id', e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  checked={current.meta.conversions_api}
                  onCheckedChange={(v) => updateField('meta', 'conversions_api', v)}
                />
                <Label>Conversions API (Server-Side)</Label>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ExternalLink className="h-3 w-3" />
              <a href="https://business.facebook.com/events_manager2" target="_blank" rel="noopener noreferrer" className="underline">
                Events Manager
              </a>
              <span>•</span>
              <a href="https://business.facebook.com/commerce" target="_blank" rel="noopener noreferrer" className="underline">
                Commerce Manager
              </a>
            </div>
          </CardContent>
        )}
      </Card>

      {/* UTM */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold text-sm">
                UTM
              </div>
              <div>
                <CardTitle className="text-base">Rastreamento UTM</CardTitle>
                <CardDescription>Parâmetros padrão para campanhas e links</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={current.utm.ativo ? 'default' : 'secondary'}>
                {current.utm.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
              <Switch
                checked={current.utm.ativo}
                onCheckedChange={(v) => updateField('utm', 'ativo', v)}
              />
            </div>
          </div>
        </CardHeader>
        {current.utm.ativo && (
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>utm_source (padrão)</Label>
                <Input
                  placeholder="google, facebook, instagram"
                  value={current.utm.default_source}
                  onChange={(e) => updateField('utm', 'default_source', e.target.value)}
                />
              </div>
              <div>
                <Label>utm_medium (padrão)</Label>
                <Input
                  placeholder="cpc, social, email"
                  value={current.utm.default_medium}
                  onChange={(e) => updateField('utm', 'default_medium', e.target.value)}
                />
              </div>
              <div>
                <Label>utm_campaign (padrão)</Label>
                <Input
                  placeholder="lancamento, blackfriday"
                  value={current.utm.default_campaign}
                  onChange={(e) => updateField('utm', 'default_campaign', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Parâmetros Customizados</Label>
              <Input
                placeholder="utm_content=banner1&utm_term=produto"
                value={current.utm.parametros_customizados}
                onChange={(e) => updateField('utm', 'parametros_customizados', e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Parâmetros extras no formato chave=valor&chave2=valor2</p>
            </div>

            {utmPreview && (
              <div>
                <Label className="text-xs">Preview da URL</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 text-xs bg-muted px-3 py-2 rounded border break-all">
                    https://seusite.com{utmPreview}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(utmPreview, 'UTM')}
                  >
                    {copied === 'UTM' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
}
