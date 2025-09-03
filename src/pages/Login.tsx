import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BackgroundAnimation } from "@/components/BackgroundAnimation";
import AuthHeader from "@/components/AuthHeader";
import { useAuthContext } from "@/contexts/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const { user, signIn, signUp, loading, userType } = useAuthContext();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(email, password);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    await signUp(email, password, firstName, lastName, whatsapp);
  };

  // Redirecionamento baseado no tipo de usuário
  if (user && userType) {
    if (userType === 'admin') {
      return <Navigate to="/home" replace />;
    } else if (userType === 'client') {
      return <Navigate to="/client" replace />;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-black overflow-hidden">
      <BackgroundAnimation />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        <AuthHeader />
        
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-gray-900/90 border-gray-700 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white">Área Administrativa</CardTitle>
              <CardDescription className="text-gray-300">
                Acesse sua conta de administrador
              </CardDescription>
              <div className="mt-4">
                <Button
                  onClick={() => window.location.href = '/client'}
                  variant="outline"
                  className="w-full border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                >
                  Sou Cliente - Acessar Área do Cliente
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                  <TabsTrigger value="login" className="text-gray-300 data-[state=active]:text-white">
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="text-gray-300 data-[state=active]:text-white">
                    Cadastrar
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-300">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Digite seu email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-300">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Digite sua senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-white text-black hover:bg-gray-200"
                      disabled={loading}
                    >
                      {loading ? "Entrando..." : "Entrar"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-4">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-gray-300">Nome</Label>
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="Nome"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-gray-300">Sobrenome</Label>
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Sobrenome"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-gray-300">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Digite seu email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp" className="text-gray-300">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        type="text"
                        placeholder="DDD + Número"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-gray-300">Senha</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Digite sua senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-white text-black hover:bg-gray-200"
                      disabled={loading}
                    >
                      {loading ? "Cadastrando..." : "Cadastrar Admin"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
