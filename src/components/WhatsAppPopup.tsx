
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppPopupProps {
  leadWhatsApp: string;
  leadName: string;
}

export const WhatsAppPopup: React.FC<WhatsAppPopupProps> = ({ leadWhatsApp, leadName }) => {
  const [message, setMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite uma mensagem.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('https://webhook.n8n1.agenciaevodigital.com/webhook/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          whatsapp: leadWhatsApp,
          message: message,
          leadName: leadName,
        }),
      });

      if (response.ok) {
        toast({
          title: "Mensagem Enviada!",
          description: `Mensagem enviada para ${leadName} com sucesso.`,
        });
        setMessage('');
        setIsOpen(false);
      } else {
        throw new Error('Erro ao enviar mensagem');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro ao Enviar",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
        >
          <MessageSquare className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">
            Enviar Mensagem WhatsApp - {leadName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="text-cyan-500">
              WhatsApp
            </Label>
            <div className="text-gray-300 bg-gray-800 p-2 rounded">
              {leadWhatsApp}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message" className="text-cyan-500">
              Mensagem
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem aqui..."
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 min-h-[120px]"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="bg-white text-black border-gray-300 hover:bg-red-500 hover:text-white hover:border-red-500"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              {isLoading ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
