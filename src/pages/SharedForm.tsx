import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClientForm } from '@/components/ClientForm';
import { FormConfig } from '@/types/form';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const SharedForm = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    console.log('SharedForm - formId from URL:', formId);
    
    if (!formId) {
      console.log('SharedForm - No formId provided');
      setNotFound(true);
      setLoading(false);
      return;
    }

    loadFormFromSupabase();
  }, [formId]);

  const loadFormFromSupabase = async () => {
    if (!formId) return;

    try {
      console.log('SharedForm - Buscando formulário no Supabase:', formId);
      
      // Buscar no Supabase sem filtrar por user_id (formulário público)
      const { data: supabaseForm, error } = await supabase
        .from('user_forms')
        .select('*')
        .eq('id', formId)
        .maybeSingle();

      if (error) {
        console.error('SharedForm - Erro ao buscar no Supabase:', error);
        await loadFormFromLocalStorage();
        return;
      }

      if (supabaseForm) {
        console.log('SharedForm - Formulário encontrado no Supabase:', supabaseForm);
        const formConfig: FormConfig = {
          id: supabaseForm.id,
          title: supabaseForm.title,
          description: supabaseForm.description || '',
          fields: (supabaseForm.form_data as any)?.fields || [],
          createdAt: supabaseForm.created_at,
          updatedAt: supabaseForm.updated_at,
          category: (supabaseForm.category as 'anamnese-dieta' | 'feedback' | 'livre' | 'anamnese-treino' | 'anamnese-suplementacao') || 'livre',
        };
        setForm(formConfig);
      } else {
        console.log('SharedForm - Formulário não encontrado no Supabase, tentando localStorage...');
        await loadFormFromLocalStorage();
      }
    } catch (error) {
      console.error('SharedForm - Erro geral:', error);
      await loadFormFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadFormFromLocalStorage = async () => {
    if (!formId) return;

    console.log('SharedForm - Buscando no localStorage...');
    const savedForms = localStorage.getItem('forms');
    
    if (savedForms) {
      try {
        const forms: FormConfig[] = JSON.parse(savedForms);
        console.log('SharedForm - Forms no localStorage:', forms.length);
        
        const foundForm = forms.find(f => {
          console.log('SharedForm - Comparando:', f.id, 'com', formId);
          return f.id === formId;
        });
        
        if (foundForm) {
          console.log('SharedForm - Formulário encontrado no localStorage');
          setForm(foundForm);
        } else {
          console.log('SharedForm - Formulário não encontrado');
          console.log('SharedForm - IDs disponíveis:', forms.map(f => f.id));
          setNotFound(true);
        }
      } catch (error) {
        console.error('SharedForm - Erro ao parsear localStorage:', error);
        setNotFound(true);
      }
    } else {
      console.log('SharedForm - Nenhum formulário salvo encontrado');
      setNotFound(true);
    }
  };

  const handleBack = () => {
    // Verifica se há histórico para voltar, senão vai para a página inicial
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/client');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Carregando formulário...</div>
      </div>
    );
  }

  if (notFound || !form) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl text-white mb-4">Formulário não encontrado</h1>
          <p className="text-gray-400 mb-4">O link que você acessou pode estar incorreto ou o formulário pode ter sido removido.</p>
          <p className="text-gray-500 text-sm">ID buscado: {formId}</p>
          <div className="mt-4 p-4 bg-gray-800 rounded-lg text-left">
            <p className="text-gray-300 text-sm mb-2">Debug info:</p>
            <p className="text-gray-400 text-xs">• Tentativa de busca no Supabase realizada</p>
            <p className="text-gray-400 text-xs">• Fallback para localStorage realizado</p>
            <p className="text-gray-400 text-xs">• Certifique-se de estar logado e que o formulário foi salvo</p>
          </div>
          <Button 
            onClick={handleBack}
            className="client-back-button mt-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 relative">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={handleBack}
            className="client-back-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <img 
            src="/lovable-uploads/e99759f8-0f30-4356-96b6-5d8b2ef20802.png" 
            alt="BIOFLUX.AI" 
            className="h-8"
          />
          <div className="w-[80px]"></div>
        </div>
        
        <ClientForm
          formConfig={form}
          onBack={handleBack}
        />
      </div>
    </div>
  );
};

export default SharedForm;