import { useState, useEffect } from 'react';
import { FormConfig } from '@/types/form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';

export const useFormManager = () => {
  const [forms, setForms] = useState<FormConfig[]>([]);
  const [currentFormId, setCurrentFormId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuthContext();

  // Debug logs para useFormManager
  useEffect(() => {
    console.log('📋 useFormManager montado:', new Date().toISOString());
    
    return () => {
      console.log('💀 useFormManager desmontado:', new Date().toISOString());
    };
  }, []);

  // Monitor de mudanças no estado dos formulários
  useEffect(() => {
    console.log('📝 Estado Forms mudou:', {
      formsCount: forms.length,
      currentFormId,
      loading,
      user: user?.id || 'null',
      timestamp: new Date().toISOString()
    });
  }, [forms, currentFormId, loading, user]);

  useEffect(() => {
    loadForms();
  }, [user]);

  const generateUUID = () => {
    return crypto.randomUUID();
  };

  const loadForms = async () => {
    try {
      setLoading(true);
      
      // Só tenta carregar do Supabase se o usuário estiver autenticado
      if (user) {
        console.log('🔄 Carregando formulários do Supabase para usuário:', user.id);
        
        const { data: userFormsData, error } = await supabase
          .from('user_forms')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Erro ao carregar do Supabase:', error);
          await loadFromLocalStorage();
          return;
        }

        if (userFormsData && userFormsData.length > 0) {
          const supabaseForms: FormConfig[] = userFormsData.map(form => {
            console.log('📝 Carregando formulário:', form.id, 'Categoria:', form.category, 'Campos:', (form.form_data as any)?.fields?.length || 0);
            
            let fields = (form.form_data as any)?.fields || [];
            
            
            return {
              id: form.id,
              title: form.title,
              description: form.description || '',
              fields: fields,
              createdAt: form.created_at,
              updatedAt: form.updated_at,
              category: (form.category as 'anamnese-dieta' | 'feedback' | 'livre' | 'anamnese-treino' | 'anamnese-suplementacao') || 'livre',
            };
          });
          
          setForms(supabaseForms);
          console.log('✅ Formulários carregados do Supabase:', supabaseForms.length);
        } else {
          console.log('⚠️ Nenhum formulário encontrado no Supabase, verificando localStorage...');
          await migrateFromLocalStorage();
        }
      } else {
        // Se não está logado, carrega do localStorage
        console.log('👤 Usuário não logado, carregando do localStorage...');
        await loadFromLocalStorage();
      }
    } catch (error) {
      console.error('💥 Erro ao carregar formulários:', error);
      await loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadFromLocalStorage = async () => {
    try {
      const savedForms = localStorage.getItem('forms');
      if (savedForms) {
        const parsedForms = JSON.parse(savedForms);
        setForms(parsedForms);
        console.log('📱 Formulários carregados do localStorage:', parsedForms.length);
      } else {
        console.log('📱 Nenhum formulário encontrado no localStorage');
        setForms([]);
      }
    } catch (error) {
      console.error('💥 Erro ao carregar do localStorage:', error);
      setForms([]);
    }
  };

  const migrateFromLocalStorage = async () => {
    if (!user) return;
    
    const savedForms = localStorage.getItem('forms');
    if (savedForms) {
      try {
        const parsedForms: FormConfig[] = JSON.parse(savedForms);
        console.log('🔄 Migrando formulários do localStorage para Supabase:', parsedForms.length);
        
        for (const form of parsedForms) {
          const formToMigrate = {
            ...form,
            id: form.id.startsWith('form_') ? generateUUID() : form.id,
            category: form.category || 'livre'
          };
          await saveFormToSupabase(formToMigrate);
        }
        
        await loadForms();
        
        toast({
          title: "Migração concluída",
          description: "Seus formulários foram migrados para o banco de dados.",
        });
      } catch (error) {
        console.error('💥 Erro na migração:', error);
      }
    }
  };

  const saveFormToSupabase = async (form: FormConfig) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('📡 Enviando formulário para Supabase:', {
        id: form.id,
        title: form.title,
        category: form.category,
        fieldsCount: form.fields.length,
        timestamp: new Date().toISOString()
      });
      
      const formDataToSave = {
        id: form.id,
        title: form.title,
        description: form.description,
        form_data: JSON.parse(JSON.stringify({ fields: form.fields })) as any,
        user_id: user.id,
        updated_at: new Date().toISOString(), // Sempre atualizar o timestamp
        category: form.category,
      };

      const { error } = await supabase
        .from('user_forms')
        .upsert(formDataToSave, {
          onConflict: 'id'
        });

      if (error) {
        console.error('❌ Erro na requisição Supabase:', error);
        throw error;
      }
      
      console.log('✅ Formulário salvo com sucesso no Supabase:', form.id);
    } catch (error) {
      console.error('💥 Erro ao salvar formulário:', error);
      throw error;
    }
  };

  const updateForm = async (formId: string, updates: Partial<FormConfig>) => {
    const updatedForm = forms.find(form => form.id === formId);
    if (!updatedForm) {
      console.error('❌ Formulário não encontrado para atualização:', formId);
      return;
    }

    const formToUpdate = { 
      ...updatedForm, 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };

    console.log('🔄 Atualizando formulário:', formId, 'Categoria:', formToUpdate.category);
    console.log('🔄 Dados da atualização:', updates);
    console.log('🔄 Formulário completo após atualização:', formToUpdate);

    // Atualizar estado imediatamente para UI responsiva
    setForms(prev => prev.map(form => 
      form.id === formId ? formToUpdate : form
    ));

    // Salvar no localStorage imediatamente
    const updatedForms = forms.map(form => 
      form.id === formId ? formToUpdate : form
    );
    localStorage.setItem('forms', JSON.stringify(updatedForms));
    console.log('💾 Formulário salvo no localStorage');

    // Salvar no Supabase (somente se autenticado)
    if (user) {
      try {
        console.log('💾 Tentando salvar no Supabase...');
        await saveFormToSupabase(formToUpdate);
        console.log('✅ Formulário atualizado com sucesso no Supabase');
        
        toast({
          title: "Salvo automaticamente",
          description: "Suas alterações foram salvas no banco de dados.",
        });
      } catch (error) {
        console.error('❌ Erro ao atualizar formulário no Supabase:', error);
        toast({
          title: "Erro ao salvar",
          description: "Erro ao atualizar no banco de dados. Salvo localmente.",
          variant: "destructive",
        });
      }
    }
  };

  const createForm = async (category: 'anamnese-dieta' | 'feedback' | 'livre' | 'anamnese-treino' | 'anamnese-suplementacao' = 'livre'): Promise<FormConfig> => {
    console.log('🆕 Criando novo formulário com categoria:', category);
    
    // Não adicionar campos base obrigatórios para formulários de anamnese
    const baseFields = [];

    const newForm: FormConfig = {
      id: generateUUID(),
      title: 'Novo Formulário',
      description: 'Descrição do formulário',
      category,
      fields: baseFields,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    console.log('🆕 Novo formulário criado:', newForm);
    
    try {
      if (user) {
        console.log('💾 Criando novo formulário no Supabase:', newForm.id);
        await saveFormToSupabase(newForm);
        toast({
          title: "Formulário criado",
          description: "Seu formulário foi criado sem campos pré-definidos.",
        });
      }
      
      setForms(prev => [...prev, newForm]);
      setCurrentFormId(newForm.id);
      
      // Manter no localStorage como backup
      const updatedForms = [...forms, newForm];
      localStorage.setItem('forms', JSON.stringify(updatedForms));
      
      return newForm;
    } catch (error) {
      console.error('💥 Erro ao criar formulário:', error);
      toast({
        title: "Erro ao salvar",
        description: "Erro ao salvar no banco de dados. Salvo localmente.",
        variant: "destructive",
      });
      
      // Fallback para localStorage
      setForms(prev => [...prev, newForm]);
      localStorage.setItem('forms', JSON.stringify([...forms, newForm]));
      setCurrentFormId(newForm.id);
      return newForm;
    }
  };

  const deleteForm = async (formId: string) => {
    try {
      if (user) {
        console.log('🗑️ Deletando formulário do Supabase:', formId);
        const { error } = await supabase
          .from('user_forms')
          .delete()
          .eq('id', formId)
          .eq('user_id', user.id);

        if (error) {
          console.error('❌ Erro ao deletar do Supabase:', error);
        }
      }

      setForms(prev => prev.filter(form => form.id !== formId));
      const updatedForms = forms.filter(form => form.id !== formId);
      localStorage.setItem('forms', JSON.stringify(updatedForms));
      
      if (currentFormId === formId) {
        setCurrentFormId(null);
      }
    } catch (error) {
      console.error('💥 Erro ao deletar formulário:', error);
      // Fallback para localStorage
      setForms(prev => prev.filter(form => form.id !== formId));
      const updatedForms = forms.filter(form => form.id !== formId);
      localStorage.setItem('forms', JSON.stringify(updatedForms));
      
      if (currentFormId === formId) {
        setCurrentFormId(null);
      }
    }
  };

  const getCurrentForm = (): FormConfig | null => {
    return forms.find(form => form.id === currentFormId) || null;
  };

  const getFormById = (formId: string): FormConfig | null => {
    return forms.find(form => form.id === formId) || null;
  };

  return {
    forms,
    currentFormId,
    setCurrentFormId,
    createForm,
    updateForm,
    deleteForm,
    getCurrentForm,
    getFormById,
    loading,
    refreshForms: loadForms,
  };
};
