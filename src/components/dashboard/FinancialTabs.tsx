
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

interface FinancialTabsProps {
  financialStats: {
    mensalTotal: number;
  };
  subscriptions: any[];
}

export const FinancialTabs: React.FC<FinancialTabsProps> = ({ financialStats, subscriptions }) => {
  return (
    <Card className="bg-[#161616] border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-white" />
          MRR (Monthly Recurring Revenue)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-2">
            R$ {financialStats.mensalTotal.toFixed(2)}
          </div>
          <p className="text-gray-400">
            Receita recorrente mensal de {subscriptions.filter(s => s.status === 'ativo').length} assinaturas ativas
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
