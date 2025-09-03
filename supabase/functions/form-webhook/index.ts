
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar variáveis de ambiente
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('🔍 Verificando variáveis de ambiente:');
    console.log('SUPABASE_URL existe:', !!supabaseUrl);
    console.log('SUPABASE_SERVICE_ROLE_KEY existe:', !!serviceRoleKey);
    console.log('SUPABASE_URL valor:', supabaseUrl);
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Variáveis de ambiente não configuradas corretamente');
      return new Response(JSON.stringify({ 
        error: 'Variáveis de ambiente não configuradas',
        supabaseUrl: !!supabaseUrl,
        serviceRoleKey: !!serviceRoleKey
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Criar cliente Supabase com service role key
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    const requestBody = await req.json();
    console.log('📥 Webhook recebido:', requestBody);

    // Extrair dados do request
    const { responses, formTitle, submittedFrom, aiConfig, userId, formCategory } = requestBody;
    
    console.log('🔧 AI Config recebido do frontend:', aiConfig);
    console.log('📂 Categoria do formulário:', formCategory);
    console.log('👤 User ID do cliente que está respondendo:', userId);

    // Buscar dados metabólicos sempre que houver userId
    let metabolicData = null;
    let tmb = null;
    let get = null;
    
    if (userId) {
      console.log('🔍 Buscando dados metabólicos para usuário:', userId);
      
      // Usar a service role para buscar dados metabólicos sem restrições RLS
      const { data: metabolicAssessment, error: metabolicError } = await supabaseClient
        .from('metabolic_assessments')
        .select('tmb, get_value, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('📊 Resultado da busca metabólica:');
      console.log('- Dados encontrados:', !!metabolicAssessment);
      console.log('- Erro:', metabolicError);

      if (metabolicError) {
        console.error('❌ Erro ao buscar dados metabólicos:', metabolicError);
        console.error('🔍 Detalhes do erro:', JSON.stringify(metabolicError, null, 2));
      } else if (metabolicAssessment) {
        metabolicData = {
          tmb: metabolicAssessment.tmb,
          get: metabolicAssessment.get_value,
          assessmentDate: metabolicAssessment.created_at
        };
        tmb = metabolicAssessment.tmb;
        get = metabolicAssessment.get_value;
        console.log('✅ Dados metabólicos encontrados:', {
          tmb: tmb,
          get: get,
          assessmentDate: metabolicAssessment.created_at
        });
      } else {
        console.log('⚠️ Nenhum dado metabólico encontrado para o usuário:', userId);
      }
    } else {
      console.log('⚠️ Nenhum userId fornecido, não buscando dados metabólicos');
    }

    // Salvar a resposta do formulário
    const { data: formResponse, error: responseError } = await supabaseClient
      .from('form_responses')
      .insert({
        form_id: crypto.randomUUID(), // Gerar um ID único para o formulário
        response_data: responses,
        user_id: userId,
      })
      .select()
      .single();

    if (responseError) {
      console.error('❌ Erro ao salvar resposta:', responseError);
    }

    console.log('💾 Form response salva com ID:', formResponse?.id);

    // Construir webhook data sempre incluindo TMB e GET se disponíveis
    const webhookData = {
      formTitle,
      timestamp: new Date().toISOString(),
      responses,
      submittedFrom,
      aiConfig: aiConfig,
      formResponse: formResponse,
      formResponseId: formResponse?.id,
      userId,
      formCategory,
      // Incluir TMB e GET diretamente no payload principal
      tmb: tmb,
      get: get,
      // Manter também o objeto metabolicData para compatibilidade
      ...(metabolicData && { metabolicData })
    };

    console.log('📤 Webhook data final sendo enviado:');
    console.log('🔢 TMB no payload:', tmb);
    console.log('⚡ GET no payload:', get);
    console.log('📋 Payload completo:', JSON.stringify(webhookData, null, 2));

    return new Response(JSON.stringify(webhookData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('💥 Erro no webhook:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      aiConfig: null,
      formResponseId: null,
      timestamp: new Date().toISOString(),
      tmb: null,
      get: null
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
