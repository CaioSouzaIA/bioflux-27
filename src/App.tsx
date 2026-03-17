import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import AdminLogin from "./pages/AdminLogin";
import ClientArea from "./pages/ClientArea";
import SharedForm from "./pages/SharedForm";
import FormResponses from "./pages/FormResponses";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedClientRoute from "./components/ProtectedClientRoute";
import ClientForms from "./pages/ClientForms";
import ClientPrescriptions from "./pages/ClientPrescriptions";
import ClientTrainingPrescription from "./pages/ClientTrainingPrescription";
import ChangePassword from "./pages/ChangePassword";
import ResetPassword from "./pages/ResetPassword";
import Achievements from "./pages/Achievements";
import WorkoutCheckin from "./pages/WorkoutCheckin";
import DebugMonitor from "./components/DebugMonitor";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 15, // 15 minutos
      gcTime: 1000 * 60 * 30, // 30 minutos
      refetchOnWindowFocus: false, // Não refaz a query quando volta o foco
      refetchOnMount: false, // Não refaz a query ao montar se já tem dados
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

const App = () => {
  // 1. Logs de montagem/desmontagem do App principal
  useEffect(() => {
    console.log('🚀 App montado:', new Date().toISOString());
    
    return () => {
      console.log('💀 App desmontado:', new Date().toISOString());
    };
  }, []);

  // 2. Detectar quando a página perde/ganha foco
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('📱 Página ficou inativa (mudou de aba/app):', new Date().toISOString());
      } else {
        console.log('👀 Página ficou ativa (voltou para aba/app):', new Date().toISOString());
      }
    };

    const handleFocus = () => console.log('🎯 Window ganhou foco:', new Date().toISOString());
    const handleBlur = () => console.log('😴 Window perdeu foco:', new Date().toISOString());

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <DebugMonitor />
          <Toaster />
          <Sonner />
          <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/client" replace />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/client" element={<ClientArea />} />
          <Route path="/client/forms" element={
            <ProtectedClientRoute>
              <ClientForms />
            </ProtectedClientRoute>
          } />
          <Route path="/client/prescriptions" element={
            <ProtectedClientRoute>
              <ClientPrescriptions />
            </ProtectedClientRoute>
          } />
          <Route path="/client/prescriptions/training/:prescriptionId" element={
            <ProtectedClientRoute>
              <ClientTrainingPrescription />
            </ProtectedClientRoute>
          } />
          <Route path="/client/achievements" element={
            <ProtectedClientRoute>
              <Achievements />
            </ProtectedClientRoute>
          } />
          <Route path="/client/workout-checkin" element={
            <ProtectedClientRoute>
              <WorkoutCheckin />
            </ProtectedClientRoute>
          } />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/home" element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } />
          <Route path="/form/:formId" element={<SharedForm />} />
          <Route path="/responses/:formId" element={
            <ProtectedRoute>
              <FormResponses />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
