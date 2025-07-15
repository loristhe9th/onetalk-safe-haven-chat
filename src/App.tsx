// src/App.tsx

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
// CHANGED: Correctly import Toaster and alias it as Sonner
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Layout from "@/components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import AuthPage from "./components/auth/AuthPage";
import ChatStart from "./pages/ChatStart";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import ChatWaitingRoom from "./pages/ChatWaitingRoom";
import ListenerQueue from "./pages/ListenerQueue";
import ChatSessionPage from "./pages/ChatSessionPage";

const queryClient = new QueryClient();

// This new component will handle the main routing logic
const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={user ? <Layout><Dashboard /></Layout> : <Index />} />

      {/* Protected Routes - only accessible when logged in */}
      <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
      <Route path="/chat/start" element={<Layout><ChatStart /></Layout>} />

      {/* ADDED: The missing route for the chat waiting room */}
      <Route path="/chat/waiting/:sessionId" element={<Layout><ChatWaitingRoom /></Layout>} />
      <Route path="/listener/queue" element={<Layout><ListenerQueue /></Layout>} />
      <Route path="/chat/session/:sessionId" element={<Layout><ChatSessionPage /></Layout>} />

      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// The main App component is now cleaner
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          {/* Put Toaster and Sonner here to be available everywhere */}
          <Toaster />
          <Sonner />
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;