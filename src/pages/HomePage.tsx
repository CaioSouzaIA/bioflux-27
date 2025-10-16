
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BackgroundAnimation } from "@/components/BackgroundAnimation";
import { Shield, User } from "lucide-react";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative bg-black overflow-hidden">
      <BackgroundAnimation />
      
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">BioFlux</h1>
          <p className="text-gray-300 text-lg">Sistema de Prescrições e Formulários</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl">
          <Card className="bg-[#161616] border-gray-700 backdrop-blur-sm hover:bg-[#1c1c1c] transition-all cursor-pointer">
            <CardHeader className="text-center">
              <Shield className="w-12 h-12 text-white mx-auto mb-4" />
              <CardTitle className="text-xl text-white">Área Administrativa</CardTitle>
              <CardDescription className="text-gray-300">
                Gerencie formulários, prescrições e usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate('/admin')}
                className="w-full bg-white text-black hover:bg-gray-200"
              >
                Acessar Admin
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#161616] border-gray-700 backdrop-blur-sm hover:bg-[#1c1c1c] transition-all cursor-pointer">
            <CardHeader className="text-center">
              <User className="w-12 h-12 text-white mx-auto mb-4" />
              <CardTitle className="text-xl text-white">Área do Cliente</CardTitle>
              <CardDescription className="text-gray-300">
                Acesse suas prescrições e formulários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate('/client')}
                className="w-full bg-[#1f1f1f] text-white hover:bg-[#292929]"
              >
                Acessar Cliente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
