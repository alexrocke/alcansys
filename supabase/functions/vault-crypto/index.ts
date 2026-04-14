const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.2'

const ENCRYPTION_KEY = Deno.env.get('VAULT_ENCRYPTION_KEY')

async function getKey(): Promise<CryptoKey> {
  if (!ENCRYPTION_KEY) throw new Error('VAULT_ENCRYPTION_KEY not set')
  const keyData = new TextEncoder().encode(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32))
  return crypto.subtle.importKey('raw', keyData, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.length)
  return btoa(String.fromCharCode(...combined))
}

async function decrypt(encryptedBase64: string): Promise<string> {
  const key = await getKey()
  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(decrypted)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    const isAdmin = roleData?.role === 'admin'

    const { action, credential_id, password, company_id } = await req.json()

    if (action === 'encrypt') {
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Apenas administradores podem salvar credenciais' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      if (!password || typeof password !== 'string') {
        return new Response(JSON.stringify({ error: 'Senha inválida' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      const encrypted = await encrypt(password)
      return new Response(JSON.stringify({ encrypted }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'decrypt') {
      if (!credential_id || typeof credential_id !== 'string') {
        return new Response(JSON.stringify({ error: 'credential_id inválido' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Use service role to read the encrypted password
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const adminClient = createClient(supabaseUrl, serviceKey)

      const { data: cred, error: credError } = await adminClient
        .from('company_credentials')
        .select('senha_encrypted, company_id')
        .eq('id', credential_id)
        .single()

      if (credError || !cred) {
        return new Response(JSON.stringify({ error: 'Credencial não encontrada' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Verify user has access: admin or has credential_access grant
      if (!isAdmin) {
        const { data: access } = await adminClient
          .from('credential_access')
          .select('id')
          .eq('credential_id', credential_id)
          .eq('user_id', user.id)
          .maybeSingle()

        if (!access) {
          return new Response(JSON.stringify({ error: 'Sem permissão para acessar esta credencial' }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      }

      // Also verify user belongs to the same company
      const { data: membership } = await adminClient
        .from('memberships')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_id', cred.company_id)
        .maybeSingle()

      if (!membership) {
        return new Response(JSON.stringify({ error: 'Sem acesso a esta empresa' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (!cred.senha_encrypted) {
        return new Response(JSON.stringify({ password: '' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      try {
        const decrypted = await decrypt(cred.senha_encrypted)
        return new Response(JSON.stringify({ password: decrypted }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } catch {
        // If decryption fails, it's likely a legacy plain text password
        return new Response(JSON.stringify({ password: cred.senha_encrypted }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    if (action === 'migrate') {
      // Migrate all plain text passwords to encrypted - admin only
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Apenas administradores' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      if (!company_id) {
        return new Response(JSON.stringify({ error: 'company_id obrigatório' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const adminClient = createClient(supabaseUrl, serviceKey)

      const { data: creds } = await adminClient
        .from('company_credentials')
        .select('id, senha_encrypted')
        .eq('company_id', company_id)
        .not('senha_encrypted', 'is', null)

      let migrated = 0
      for (const cred of (creds || [])) {
        if (!cred.senha_encrypted) continue
        // Try to decrypt - if it fails, it's plain text and needs encryption
        try {
          await decrypt(cred.senha_encrypted)
          // Already encrypted, skip
        } catch {
          const encrypted = await encrypt(cred.senha_encrypted)
          await adminClient
            .from('company_credentials')
            .update({ senha_encrypted: encrypted })
            .eq('id', cred.id)
          migrated++
        }
      }

      return new Response(JSON.stringify({ migrated, message: `${migrated} credenciais migradas para criptografia` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
