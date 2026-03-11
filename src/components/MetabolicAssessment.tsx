import React, { useEffect, useState } from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem } from '@/components/ui/accordion';
import { Calculator, ArrowLeft, Calendar, ChevronDown, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { BackgroundAnimation } from '@/components/BackgroundAnimation';
import { getMetabolicAssessmentAgeInDays, METABOLIC_ASSESSMENT_MAX_AGE_DAYS, useMetabolicAssessmentHistory } from '@/hooks/useMetabolicAssessment';
import { useQueryClient } from '@tanstack/react-query';

interface MetabolicAssessmentProps {
  onBack: () => void;
}

const formatAssessmentDate = (value: string) =>
  new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const MetabolicAssessment: React.FC<MetabolicAssessmentProps> = ({ onBack }) => {
  const { user, loading: authLoading } = useAuthContext();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [expandedHistoryItem, setExpandedHistoryItem] = useState('');
  const [formData, setFormData] = useState({
    age: '',
    weight: '',
    height: '',
    biologicalSex: '',
    waistCircumference: '',
    activityFactor: ''
  });

  const [results, setResults] = useState<{
    tmb: number;
    get: number;
  } | null>(null);
  const { data: assessmentHistory = [] } = useMetabolicAssessmentHistory(user?.id);
  const latestAssessment = assessmentHistory[0] ?? null;
  const previousAssessments = assessmentHistory.slice(1);

  const activityOptions = [
    { label: 'Sedentário (pouco ou nenhum exercício)', value: '1.2' },
    { label: 'Leve (exercício leve 1-3x/semana)', value: '1.375' },
    { label: 'Moderado (exercício moderado 3-5x/semana)', value: '1.55' },
    { label: 'Intenso (exercício intenso 5-6x/semana)', value: '1.725' },
    { label: 'Muito intenso (nível competitivo/atleta)', value: '1.9' }
  ];

  useEffect(() => {
    console.log('🔍 Estado do usuário no MetabolicAssessment:', {
      user: user?.id,
      authLoading,
      latestAssessment: latestAssessment?.id,
    });

    if (latestAssessment) {
      setFormData({
        age: latestAssessment.age.toString(),
        weight: latestAssessment.weight.toString(),
        height: latestAssessment.height.toString(),
        biologicalSex: latestAssessment.biological_sex,
        waistCircumference: latestAssessment.waist_circumference.toString(),
        activityFactor: latestAssessment.activity_factor.toString(),
      });

      setResults({
        tmb: latestAssessment.tmb,
        get: latestAssessment.get_value,
      });
    }
  }, [authLoading, latestAssessment, user]);

  // Verificar se o usuário está autenticado antes de renderizar
  if (authLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-black flex items-center justify-center">
        <BackgroundAnimation />
        <div className="relative z-10 text-white text-xl">Carregando autenticação...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-black flex items-center justify-center">
        <BackgroundAnimation />
        <div className="relative z-10 text-center">
          <div className="text-white text-xl mb-4">Usuário não autenticado</div>
          <Button onClick={onBack} className="client-back-button">
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateTMB = async () => {
    // Verificação adicional de segurança
    if (!user) {
      console.error('❌ Usuário não autenticado no momento do cálculo');
      toast({
        title: "Erro de Autenticação",
        description: "Sessão expirada. Por favor, faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    // Log dos dados do formulário para debug
    console.log('📊 Dados do formulário:', formData);
    console.log('👤 Usuário autenticado:', user.id);
    
    const age = parseFloat(formData.age);
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    const waistCircumference = parseFloat(formData.waistCircumference);
    const activityFactor = parseFloat(formData.activityFactor);

    // Validação mais detalhada
    console.log('🔍 Validação:', {
      age: age,
      weight: weight,
      height: height,
      biologicalSex: formData.biologicalSex,
      waistCircumference: waistCircumference,
      activityFactor: activityFactor,
      user: user.id
    });

    if (isNaN(age) || age <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, informe uma idade válida.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(weight) || weight <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, informe um peso válido.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(height) || height <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, informe uma altura válida.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.biologicalSex || (formData.biologicalSex !== 'masculino' && formData.biologicalSex !== 'feminino')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione o sexo biológico.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(waistCircumference) || waistCircumference <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, informe uma circunferência abdominal válida.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(activityFactor) || activityFactor <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, selecione o fator de atividade física.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let tmb: number;

      if (formData.biologicalSex === 'masculino') {
        // Fórmula de Mifflin para homens: TMB = 10 × peso + 6.25 × altura - 5 × idade + 5
        tmb = 10 * weight + 6.25 * height - 5 * age + 5;
      } else {
        // Fórmula de Mifflin para mulheres: TMB = 10 × peso + 6.25 × altura - 5 × idade - 161
        tmb = 10 * weight + 6.25 * height - 5 * age - 161;
      }

      const get = tmb * activityFactor;

      const finalResults = {
        tmb: Math.round(tmb),
        get: Math.round(get)
      };

      console.log('💾 Salvando avaliação no banco de dados...');

      // Salvar no banco de dados - sempre inserir nova entrada
      const { error } = await supabase
        .from('metabolic_assessments')
        .insert({
          user_id: user.id,
          age: age,
          weight: weight,
          height: height,
          biological_sex: formData.biologicalSex,
          waist_circumference: waistCircumference,
          activity_factor: activityFactor,
          tmb: finalResults.tmb,
          get_value: finalResults.get
        });

      if (error) {
        console.error('❌ Erro ao salvar avaliação:', error);
        toast({
          title: "Erro",
          description: "Erro ao salvar os dados. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Avaliação salva com sucesso');
      setResults(finalResults);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['metabolic-assessment', user.id] }),
        queryClient.invalidateQueries({ queryKey: ['metabolic-assessment-history', user.id] }),
      ]);
      
      toast({
        title: "Sucesso!",
        description: "Avaliação metabólica calculada e salva com sucesso.",
      });

    } catch (error) {
      console.error('❌ Erro no cálculo:', error);
      toast({
        title: "Erro",
        description: "Erro ao calcular TMB e GET. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Validação melhorada do formulário
  const isFormValid = () => {
    const age = parseFloat(formData.age);
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    const waistCircumference = parseFloat(formData.waistCircumference);
    const activityFactor = parseFloat(formData.activityFactor);

    return !isNaN(age) && age > 0 &&
           !isNaN(weight) && weight > 0 &&
           !isNaN(height) && height > 0 &&
           formData.biologicalSex &&
           !isNaN(waistCircumference) && waistCircumference > 0 &&
           !isNaN(activityFactor) && activityFactor > 0;
  };

  const getWaistCircumferenceStatus = () => {
    if (!formData.waistCircumference || !formData.biologicalSex) return '';
    
    const waist = parseFloat(formData.waistCircumference);
    if (isNaN(waist)) return '';
    
    const threshold = formData.biologicalSex === 'masculino' ? 102 : 88;
    
    if (waist >= threshold) {
      return 'text-red-500';
    }
    return 'text-green-500';
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <BackgroundAnimation />
      <div className="relative z-10">
        <div className="container mx-auto max-w-5xl space-y-8 px-4 py-10">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={onBack}
                className="client-back-button"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <img 
                src="/lovable-uploads/e99759f8-0f30-4356-96b6-5d8b2ef20802.png" 
                alt="BIOFLUX.AI" 
                className="h-10"
              />
            </div>
          </div>

          {/* Título */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Avaliação Metabólica</h1>
            <p className="mt-1 text-sm text-white/60">
              Preencha seus dados para calcular a Taxa Metabólica Basal (TMB) e Gasto Energético Total (GET)
            </p>
          </div>

          <Card className="client-surface-panel rounded-3xl">
            <CardHeader>
              <CardTitle className="text-white">Dados Antropométricos</CardTitle>
              <CardDescription className="text-white/60">
                Informe seus dados corporais para realizar os cálculos metabólicos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-white">Idade (anos)</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Ex: 30"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    className="client-input-surface !text-black"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-white">Peso corporal (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 70.5"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    className="client-input-surface !text-black"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height" className="text-white">Altura (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="Ex: 175"
                    value={formData.height}
                    onChange={(e) => handleInputChange('height', e.target.value)}
                    className="client-input-surface !text-black"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Sexo biológico</Label>
                  <Select value={formData.biologicalSex} onValueChange={(value) => handleInputChange('biologicalSex', value)}>
                    <SelectTrigger className="client-input-surface text-white">
                      <SelectValue placeholder="Selecione o sexo" />
                    </SelectTrigger>
                    <SelectContent className="text-white">
                      <SelectItem value="masculino" className="text-white">Masculino</SelectItem>
                      <SelectItem value="feminino" className="text-white">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="waist" className="text-white">
                    Circunferência abdominal (cm)
                  </Label>
                  <Input
                    id="waist"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 85.0"
                    value={formData.waistCircumference}
                    onChange={(e) => handleInputChange('waistCircumference', e.target.value)}
                    className={`client-input-surface !text-black ${getWaistCircumferenceStatus()}`}
                  />
                  <p className="text-sm text-white/45">
                    Risco: ≥102 cm (homens) / ≥88 cm (mulheres)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Fator de atividade física</Label>
                  <Select value={formData.activityFactor} onValueChange={(value) => handleInputChange('activityFactor', value)}>
                    <SelectTrigger className="client-input-surface text-white">
                      <SelectValue placeholder="Selecione o nível de atividade" />
                    </SelectTrigger>
                    <SelectContent className="text-white">
                      {activityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-white">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={calculateTMB} 
                disabled={!isFormValid() || loading || !user}
                className="client-action-button w-full rounded-xl"
              >
                <Calculator className="w-4 h-4 mr-2" />
                {loading ? 'Calculando...' : results ? 'Recalcular TMB e GET' : 'Calcular TMB e GET'}
              </Button>
            </CardContent>
          </Card>

          {results && (
            <Card className="client-surface-panel rounded-3xl">
              <CardHeader>
                <CardTitle className="text-white">Resultados da Avaliação</CardTitle>
                {latestAssessment && (
                  <CardDescription className="flex items-center gap-2 text-white/60">
                    <Calendar className="h-4 w-4" />
                    Avaliação atual de {formatAssessmentDate(latestAssessment.created_at)}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="client-surface-subtle rounded-2xl p-6 text-center">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Taxa Metabólica Basal (TMB)
                    </h3>
                    <p className="text-3xl font-bold text-white">{results.tmb}</p>
                    <p className="text-sm text-gray-300 mt-1">kcal/dia</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Energia necessária em repouso absoluto
                    </p>
                  </div>

                  <div className="client-surface-subtle rounded-2xl border-green-500/20 bg-green-500/10 p-6 text-center">
                    <h3 className="text-lg font-semibold text-green-300 mb-2">
                      Gasto Energético Total (GET)
                    </h3>
                    <p className="text-3xl font-bold text-green-400">{results.get}</p>
                    <p className="text-sm text-gray-300 mt-1">kcal/dia</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Energia total gasta incluindo atividades
                    </p>
                  </div>
                </div>

                <div className="client-surface-subtle mt-6 rounded-2xl p-4">
                  <h4 className="text-white font-medium mb-2">Interpretação:</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• <strong>TMB:</strong> Representa o mínimo de energia que seu corpo precisa para funções vitais</li>
                    <li>• <strong>GET:</strong> Representa sua necessidade calórica total diária considerando sua atividade física</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2">
                <History className="h-5 w-5 text-white/70" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Registro de avaliações anteriores</h2>
                <p className="mt-1 text-sm text-white/60">
                  Histórico das avaliações metabólicas salvas, com preview e detalhes.
                </p>
              </div>
            </div>

            {!previousAssessments.length ? (
              <Card className="client-surface-panel rounded-3xl">
                <CardContent className="p-6">
                  <p className="text-sm text-white/60">Ainda não existem avaliações metabólicas anteriores registradas.</p>
                </CardContent>
              </Card>
            ) : (
              <Accordion
                type="single"
                collapsible
                value={expandedHistoryItem}
                onValueChange={setExpandedHistoryItem}
                className="space-y-4"
              >
                {previousAssessments.map((assessment) => {
                  const accordionValue = assessment.id;
                  const ageInDays = getMetabolicAssessmentAgeInDays(assessment.created_at);

                  return (
                    <AccordionItem
                      key={assessment.id}
                      value={accordionValue}
                      className="group client-surface-panel overflow-hidden rounded-3xl border border-white/10 px-6"
                    >
                      <div className="flex items-start gap-4 py-6">
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-lg font-semibold text-white">
                              Avaliação de {formatAssessmentDate(assessment.created_at)}
                            </p>
                            <Badge variant="outline" className="border-white/15 bg-white/5 text-white/70">
                              Registro
                            </Badge>
                          </div>

                          {expandedHistoryItem !== accordionValue && (
                            <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
                              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                                TMB: {assessment.tmb} kcal
                              </span>
                              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                                GET: {assessment.get_value} kcal
                              </span>
                              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                                Peso: {assessment.weight} kg
                              </span>
                              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                                Cintura: {assessment.waist_circumference} cm
                              </span>
                              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                                {ageInDays} dias atrás
                              </span>
                            </div>
                          )}
                        </div>

                        <AccordionPrimitive.Header className="flex">
                          <AccordionPrimitive.Trigger className="inline-flex h-10 w-10 items-center justify-center bg-transparent text-white/70 transition-all hover:text-white [&[data-state=open]>svg]:rotate-180">
                            <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                          </AccordionPrimitive.Trigger>
                        </AccordionPrimitive.Header>
                      </div>

                      <AccordionContent className="space-y-6 pb-6">
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="client-surface-subtle rounded-2xl p-6 text-center">
                            <h3 className="mb-2 text-lg font-semibold text-white">Taxa Metabólica Basal (TMB)</h3>
                            <p className="text-3xl font-bold text-white">{assessment.tmb}</p>
                            <p className="mt-1 text-sm text-gray-300">kcal/dia</p>
                          </div>

                          <div className="client-surface-subtle rounded-2xl border-green-500/20 bg-green-500/10 p-6 text-center">
                            <h3 className="mb-2 text-lg font-semibold text-green-300">Gasto Energético Total (GET)</h3>
                            <p className="text-3xl font-bold text-green-400">{assessment.get_value}</p>
                            <p className="mt-1 text-sm text-gray-300">kcal/dia</p>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="client-surface-subtle rounded-2xl p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-white/45">Dados corporais</p>
                            <div className="mt-3 space-y-2 text-sm text-white/80">
                              <p>Idade: {assessment.age} anos</p>
                              <p>Peso: {assessment.weight} kg</p>
                              <p>Altura: {assessment.height} cm</p>
                              <p>Cintura: {assessment.waist_circumference} cm</p>
                            </div>
                          </div>

                          <div className="client-surface-subtle rounded-2xl p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-white/45">Contexto metabólico</p>
                            <div className="mt-3 space-y-2 text-sm text-white/80">
                              <p>Sexo biológico: {assessment.biological_sex}</p>
                              <p>Fator de atividade: {assessment.activity_factor}</p>
                              <p>Registro feito há {ageInDays} dias</p>
                              <p>Validade operacional: {METABOLIC_ASSESSMENT_MAX_AGE_DAYS} dias</p>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetabolicAssessment;
