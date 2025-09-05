
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface MetabolicAssessmentProps {
  onBack: () => void;
}

const MetabolicAssessment: React.FC<MetabolicAssessmentProps> = ({ onBack }) => {
  const { user, loading: authLoading } = useAuthContext();
  const [loading, setLoading] = useState(false);
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

  const activityOptions = [
    { label: 'Sedentário (pouco ou nenhum exercício)', value: '1.2' },
    { label: 'Leve (exercício leve 1-3x/semana)', value: '1.375' },
    { label: 'Moderado (exercício moderado 3-5x/semana)', value: '1.55' },
    { label: 'Intenso (exercício intenso 5-6x/semana)', value: '1.725' },
    { label: 'Muito intenso (nível competitivo/atleta)', value: '1.9' }
  ];

  // Carregar dados salvos quando o componente é montado e o usuário estiver disponível
  useEffect(() => {
    console.log('🔍 Estado do usuário no MetabolicAssessment:', { 
      user: user?.id, 
      authLoading 
    });
    
    if (user && !authLoading) {
      loadSavedAssessment();
    }
  }, [user, authLoading]);

  // Verificar se o usuário está autenticado antes de renderizar
  if (authLoading) {
    return (
      <div className="min-h-screen relative bg-black overflow-hidden flex items-center justify-center">
        <div className="relative z-10 text-white text-xl">Carregando autenticação...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen relative bg-black overflow-hidden flex items-center justify-center">
        <div className="relative z-10 text-center">
          <div className="text-white text-xl mb-4">Usuário não autenticado</div>
          <Button onClick={onBack} className="bg-blue-600 hover:bg-blue-700">
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const loadSavedAssessment = async () => {
    if (!user) {
      console.log('❌ Usuário não disponível para carregar avaliação');
      return;
    }

    try {
      console.log('📊 Carregando avaliação para usuário:', user.id);
      
      const { data, error } = await supabase
        .from('metabolic_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar avaliação:', error);
        return;
      }

      if (data) {
        console.log('✅ Avaliação carregada:', data);
        // Preencher formulário com dados salvos
        setFormData({
          age: data.age.toString(),
          weight: data.weight.toString(),
          height: data.height.toString(),
          biologicalSex: data.biological_sex,
          waistCircumference: data.waist_circumference.toString(),
          activityFactor: data.activity_factor.toString()
        });

        // Mostrar resultados salvos
        setResults({
          tmb: data.tmb,
          get: data.get_value
        });
      } else {
        console.log('ℹ️ Nenhuma avaliação anterior encontrada');
      }
    } catch (error) {
      console.error('Erro inesperado ao carregar avaliação:', error);
    }
  };

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

      // Verificar se é a primeira avaliação (para recarregar página depois)
      const isFirstAssessment = !results; // Se não há resultados, é primeira vez
      
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
      
      toast({
        title: "Sucesso!",
        description: "Avaliação metabólica calculada e salva com sucesso.",
      });

      // Recarregar página apenas na primeira vez para atualizar as restrições
      if (isFirstAssessment) {
        console.log('🔄 Primeira avaliação completada - recarregando página para atualizar acesso');
        setTimeout(() => {
          window.location.reload();
        }, 1500); // Delay para mostrar o toast
      }

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
    <div className="min-h-screen relative bg-black overflow-hidden">
      <div className="relative z-10 min-h-screen p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8 pt-8">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={onBack}
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:border-gray-600 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <img 
                src="/lovable-uploads/47b13cc6-5100-44ec-a86b-17a57bac71c6.png" 
                alt="BIOFLUX.AI" 
                className="h-10"
              />
            </div>
          </div>

          {/* Título */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Avaliação Metabólica</h1>
            <p className="text-gray-300">
              Preencha seus dados para calcular a Taxa Metabólica Basal (TMB) e Gasto Energético Total (GET)
            </p>
          </div>

          <Card className="bg-gray-900/90 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Dados Antropométricos</CardTitle>
              <CardDescription className="text-gray-300">
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
                    className="bg-gray-800 border-gray-600 text-white"
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
                    className="bg-gray-800 border-gray-600 text-white"
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
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Sexo biológico</Label>
                  <Select value={formData.biologicalSex} onValueChange={(value) => handleInputChange('biologicalSex', value)}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Selecione o sexo" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="masculino" className="text-white">Masculino</SelectItem>
                      <SelectItem value="feminino" className="text-white">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="waist" className="text-white">
                    Circunferência abdominal (cm)
                    <span className="text-sm text-gray-400 block">
                      Risco: ≥102 cm (homens) / ≥88 cm (mulheres)
                    </span>
                  </Label>
                  <Input
                    id="waist"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 85.0"
                    value={formData.waistCircumference}
                    onChange={(e) => handleInputChange('waistCircumference', e.target.value)}
                    className={`bg-gray-800 border-gray-600 text-white ${getWaistCircumferenceStatus()}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Fator de atividade física</Label>
                  <Select value={formData.activityFactor} onValueChange={(value) => handleInputChange('activityFactor', value)}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Selecione o nível de atividade" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
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
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
              >
                <Calculator className="w-4 h-4 mr-2" />
                {loading ? 'Calculando...' : results ? 'Recalcular TMB e GET' : 'Calcular TMB e GET'}
              </Button>
            </CardContent>
          </Card>

          {results && (
            <Card className="bg-gray-900/90 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Resultados da Avaliação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="text-center p-6 bg-blue-600/20 rounded-lg border border-blue-500/30">
                    <h3 className="text-lg font-semibold text-blue-300 mb-2">
                      Taxa Metabólica Basal (TMB)
                    </h3>
                    <p className="text-3xl font-bold text-blue-400">{results.tmb}</p>
                    <p className="text-sm text-gray-300 mt-1">kcal/dia</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Energia necessária em repouso absoluto
                    </p>
                  </div>

                  <div className="text-center p-6 bg-green-600/20 rounded-lg border border-green-500/30">
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

                <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Interpretação:</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• <strong>TMB:</strong> Representa o mínimo de energia que seu corpo precisa para funções vitais</li>
                    <li>• <strong>GET:</strong> Representa sua necessidade calórica total diária considerando sua atividade física</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetabolicAssessment;
